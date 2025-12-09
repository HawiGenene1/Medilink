const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { createClient } = require('redis');
const { promisify } = require('util');
const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');





// Initialize Redis client with error handling and reconnection
let redisClient;
const useRedis = !!process.env.REDIS_URL;
let redisDisabledMessageShown = false;

// Initialize Redis client only when URL is provided; otherwise stay silent
if (useRedis) {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            if (!redisDisabledMessageShown) {
              console.warn('Max retries reached. Could not connect to Redis - running without cache');
              redisDisabledMessageShown = true;
            }
            return false; // Stop retrying after 5 attempts
          }
          return Math.min(retries * 100, 5000); // Exponential backoff up to 5s
        }
      }
    });

    redisClient.on('error', (err) => {
      if (!redisDisabledMessageShown) {
        console.warn('Redis client error - running without cache:', err.message);
        redisDisabledMessageShown = true;
      }
    });

    // Connect to Redis, but don't block the server start if it fails
    redisClient.connect().catch(err => {
      if (!redisDisabledMessageShown) {
        console.warn('Failed to connect to Redis - running without cache:', err.message);
        redisDisabledMessageShown = true;
      }
    });
  } catch (err) {
    if (!redisDisabledMessageShown) {
      console.warn('Redis initialization failed - running without cache:', err.message);
      redisDisabledMessageShown = true;
    }
  }
}

// Fallback no-op client when Redis is disabled or failed
if (!redisClient) {
  redisClient = {
    get: () => Promise.resolve(null),
    set: () => Promise.resolve('OK'),
    on: () => {},
    connect: () => Promise.resolve(),
    isReady: false
  };
}

// Improved cache middleware with better key generation and invalidation
const cacheMiddleware = async (req, res, next) => {
  // Skip cache for POST/PUT/DELETE requests
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }

  const cacheKey = `medicines:${JSON.stringify({
    ...req.query,
    // Remove pagination from cache key as it's handled separately
    page: undefined,
    limit: undefined,
    _: undefined
  })}:${req.query.page || 1}:${req.query.limit || 20}`;

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      const data = JSON.parse(cachedData);
      res.set('X-Cache', 'HIT');
      return res.json(data);
    }

    // Cache miss - proceed to controller
    res.sendResponse = res.json;
    res.json = (data) => {
      // Only cache successful responses
      if (res.statusCode === 200) {
        // Cache for 5 minutes, but less for search results
        const ttl = req.query.search ? 60 : 300; // 1 min for searches, 5 min for others
        redisClient.set(cacheKey, JSON.stringify(data), 'EX', ttl).catch(console.error);
      }
      res.sendResponse(data);
    };
    res.set('X-Cache', 'MISS');
    next();
  } catch (error) {
    console.error('Cache error:', error);
    next();
  }
};

// Enhanced search query builder with typo tolerance and relevance
const buildSearchQuery = (searchTerm) => {
  if (!searchTerm?.trim()) return {};

  const searchTerms = searchTerm
    .trim()
    .split(/\s+/)
    .filter(term => term.length > 0);

  if (searchTerms.length === 0) return {};

  // For very short terms (1-2 characters), use prefix search
  if (searchTerms.some(term => term.length <= 2)) {
    const termRegex = searchTerms.map(term => 
      new RegExp(term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i')
    );
    
    return {
      $or: [
        { name: { $in: termRegex }},
        { 'activeIngredients.name': { $in: termRegex }},
        { manufacturer: { $in: termRegex }},
        { searchText: { $in: termRegex }}
      ]
    };
  }

  // For medium length terms (3-4 characters), use fuzzy search
  if (searchTerms.some(term => term.length <= 4)) {
    return {
      $or: [
        { name: { $regex: searchTerms.join('|'), $options: 'i' }},
        { 'activeIngredients.name': { $in: searchTerms.map(term => new RegExp(term, 'i')) }},
        { manufacturer: { $in: searchTerms.map(term => new RegExp(term, 'i')) }},
        { searchText: { $regex: searchTerms.join('|'), $options: 'i' }}
      ]
    };
  }

  // For longer terms, use text search with better relevance
  return {
    $text: { 
      $search: searchTerms.map(term => `"${term}"`).join(' '),
      $caseSensitive: false,
      $diacriticSensitive: false,
      $language: 'english'
    }
  };
};

// Enhanced filter query builder with validation and location support
const buildFilterQuery = (filters = {}) => {
  const {
    categories,
    minPrice,
    maxPrice,
    inStock,
    requiresPrescription,
    minRating,
    type,
    brand,
    location,
    radius = 10000, // Default 10km radius in meters
    pharmacyId
  } = filters;

  const query = {};

  // Category filter with validation
  if (categories) {
    const categoryList = Array.isArray(categories) ? categories : [categories];
    if (categoryList.length > 0) {
      query.category = { $in: categoryList.map(cat => new RegExp(`^${cat}`, 'i')) };
    }
  }

  // Price range with validation
  const priceFilter = {};
  if (minPrice && !isNaN(minPrice) && parseFloat(minPrice) >= 0) {
    priceFilter.$gte = parseFloat(minPrice);
  }
  if (maxPrice && !isNaN(maxPrice) && parseFloat(maxPrice) >= 0) {
    priceFilter.$lte = parseFloat(maxPrice);
  }
  if (Object.keys(priceFilter).length > 0) {
    query.price = priceFilter;
  }

  // In-stock filter
  if (inStock === 'true' || inStock === true) {
    query.stock = { $gt: 0 };
  }

  // Prescription filter
  if (requiresPrescription === 'true' || requiresPrescription === 'false') {
    query.requiresPrescription = requiresPrescription === 'true';
  }

  // Rating filter with validation
  if (minRating && !isNaN(minRating) && minRating >= 0 && minRating <= 5) {
    query.rating = { $gte: parseFloat(minRating) };
  }

  // Type filter
  if (type) {
    const typeList = Array.isArray(type) ? type : [type];
    if (typeList.length > 0) {
      query.type = { $in: typeList };
    }
  }

  // Brand filter with case-insensitive search
  if (brand) {
    const brandList = Array.isArray(brand) ? brand : [brand];
    if (brandList.length > 0) {
      query.manufacturer = { 
        $in: brandList.map(b => new RegExp(b, 'i'))
      };
    }
  }

  // Location-based filtering
  if (location) {
    const [lng, lat] = location.split(',').map(Number);
    if (!isNaN(lng) && !isNaN(lat)) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: parseInt(radius, 10) || 10000 // Default to 10km
        }
      };
    }
  }

  // Filter by pharmacy
  if (pharmacyId) {
    query.pharmacyId = mongoose.Types.ObjectId(pharmacyId);
  }

  return query;
};

// Helper function to build sort options
const buildSortOptions = (sort, hasSearch = false) => {
  switch (sort) {
    case 'priceAsc':
      return { price: 1 };
    case 'priceDesc':
      return { price: -1 };
    case 'nameAsc':
      return { name: 1 };
    case 'nameDesc':
      return { name: -1 };
    case 'newest':
      return { createdAt: -1 };
    case 'popular':
      return { 'metrics.views': -1 };
    case 'relevance':
    default:
      return hasSearch ? { score: { $meta: 'textScore' } } : { createdAt: -1 };
  }
};

// Get medicines with enhanced search, filtering, and pagination
const getMedicines = async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Parse and validate query parameters
    const { 
      search, 
      categories,
      minPrice, 
      maxPrice, 
      inStock,
      requiresPrescription,
      minRating,
      type,
      brand,
      location,
      radius,
      sort = 'relevance',
      page: pageParam,
      limit: limitParam,
      cursor,
      prevCursor
    } = req.query;

    // Build search query
    const searchQuery = buildSearchQuery(search);
    
    // Build filter query
    const filterQuery = buildFilterQuery({
      categories,
      minPrice,
      maxPrice,
      inStock,
      requiresPrescription,
      minRating,
      type,
      brand,
      location,
      radius,
      pharmacyId: req.query.pharmacyId
    });
    
    // Combine queries
    const query = { 
      ...searchQuery, 
      ...filterQuery,
      deletedAt: { $exists: false }
    };

    // Build sort options
    const sortOptions = buildSortOptions(sort, !!search);
    
    // Handle cursor-based pagination
    if (cursor) {
      return handleCursorPagination(req, res, query, sortOptions, cursor, prevCursor);
    }

    // Handle offset-based pagination
    return handleOffsetPagination(req, res, query, sortOptions, pageParam, limitParam, startTime);
  } catch (error) {
    console.error('getMedicines error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error fetching medicines',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Handle cursor-based pagination
const handleCursorPagination = async (req, res, query, sortOptions, cursor, prevCursor) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  let findQuery = Medicine.find(query)
    .sort(sortOptions)
    .limit(limit + 1); // Fetch one extra to determine if there are more items

  // Apply cursor
  if (cursor) {
    const cursorValue = JSON.parse(Buffer.from(cursor, 'base64').toString());
    if (prevCursor) {
      // For previous page
      findQuery = findQuery.lt('_id', cursorValue);
    } else {
      // For next page
      findQuery = findQuery.gt('_id', cursorValue);
    }
  }

  const items = await findQuery.lean().exec();
  const hasMore = items.length > limit;
  if (hasMore) {
    items.pop(); // Remove the extra item
  }

  // Generate next and previous cursors
  const nextCursor = items.length > 0 ? 
    Buffer.from(JSON.stringify(items[items.length - 1]._id)).toString('base64') : null;
  const prevCursorValue = items.length > 0 ? 
    Buffer.from(JSON.stringify(items[0]._id)).toString('base64') : null;

  return res.json({
    success: true,
    data: items,
    pagination: {
      next: hasMore ? nextCursor : null,
      previous: cursor ? prevCursorValue : null,
      hasMore,
      count: items.length
    }
  });
};

// Handle offset-based pagination
const handleOffsetPagination = async (req, res, query, sortOptions, pageParam, limitParam, startTime) => {
  const page = Math.max(1, parseInt(pageParam) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(limitParam) || 20));
  const skip = (page - 1) * limit;
  
  // Optimized projection
  const projection = {
    name: 1,
    price: 1,
    stock: 1,
    category: 1,
    requiresPrescription: 1,
    rating: 1,
    manufacturer: 1,
    imageUrl: 1,
    type: 1,
    ...(req.query.search && { score: { $meta: 'textScore' } })
  };

  // Execute queries in parallel
  const [items, total] = await Promise.all([
    Medicine.find(query, projection)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean()
      .maxTimeMS(5000), // 5 second timeout
    Medicine.countDocuments(query)
  ]);
  
  // Calculate execution time
  const executionTime = Date.now() - startTime;
  
  // Set cache and performance headers
  res.set({
    'Cache-Control': 'public, max-age=300',
    'X-Query-Time': `${executionTime}ms`,
    'X-Total-Count': total
  });
  
  return res.json({
    success: true,
    data: items,
    pagination: {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
      hasMore: (page * limit) < total
    },
    meta: {
      executionTime: `${executionTime}ms`,
      resultCount: items.length
    }
  });
};

// Get filter options with caching
const getFilterOptions = async (req, res) => {
  try {
    const cacheKey = 'medicine:filters';
    
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
    } catch (cacheError) {
      console.error('Cache read error:', cacheError);
    }

    // Get all distinct categories
    const categories = await Medicine.distinct('category');
    
    // Get price range
    const priceRange = await Medicine.aggregate([
      {
        $group: {
          _id: null,
          min: { $min: '$price' },
          max: { $max: '$price' }
        }
      }
    ]);

    // Get all distinct manufacturers
    const manufacturers = await Medicine.distinct('manufacturer');
    
    // Get all distinct types
    const types = await Medicine.distinct('type');
    
    const result = {
      success: true,
      data: {
        categories: categories.filter(Boolean).sort(),
        priceRange: priceRange[0] || { min: 0, max: 1000 },
        manufacturers: manufacturers.filter(Boolean).sort(),
        types: types.filter(Boolean).sort()
      }
    };

    // Cache the result for 1 hour
    try {
      await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600);
    } catch (cacheError) {
      console.error('Cache write error:', cacheError);
    }

    res.json(result);
  } catch (error) {
    console.error('getFilterOptions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching filter options',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// module.exports = {
//   getMedicines: [cacheMiddleware, getMedicines],
//   getFilterOptions: [cacheMiddleware, getFilterOptions]
  
// };
// At the bottom of medicineController.js
module.exports = {
  getMedicines,
  getFilterOptions,
  cacheMiddleware
};