const { createClient } = require('redis');
const { promisify } = require('util');
const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const Inventory = require('../models/Inventory');
const Category = require('../models/Category');
const Pharmacy = require('../models/Pharmacy');
const Subscription = require('../models/Subscription');
const FilterService = require('../services/filterService');

// Initialize Redis client with error handling and reconnection
let redisClient;
const useRedis = !!process.env.REDIS_URL;
let redisDisabledMessageShown = false;

// Initialize Redis client only when URL is provided; otherwise stay silent
if (useRedis) {
  try {
    // Redis initialization logic (from hawi)
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            if (!redisDisabledMessageShown) {
              console.warn('Max retries reached. Could not connect to Redis - running without cache');
              redisDisabledMessageShown = true;
            }
            return false;
          }
          return Math.min(retries * 100, 5000);
        }
      }
    });

    redisClient.on('error', (err) => {
      if (!redisDisabledMessageShown) {
        console.warn('Redis client error - running without cache:', err.message);
        redisDisabledMessageShown = true;
      }
    });

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

// Fallback no-op client
if (!redisClient) {
  redisClient = {
    get: () => Promise.resolve(null),
    set: () => Promise.resolve('OK'),
    on: () => { },
    connect: () => Promise.resolve(),
    isReady: false
  };
}

// Improved cache middleware
const cacheMiddleware = async (req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }

  const cacheKey = `medicines:${JSON.stringify({
    ...req.query,
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

    res.sendResponse = res.json;
    res.json = (data) => {
      if (res.statusCode === 200) {
        const ttl = req.query.search ? 60 : 300;
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
        { name: { $in: termRegex } },
        { 'activeIngredients.name': { $in: termRegex } },
        { manufacturer: { $in: termRegex } },
        { searchText: { $in: termRegex } }
      ]
    };
  }

  // For medium length terms (3-4 characters), use fuzzy search
  if (searchTerms.some(term => term.length <= 4)) {
    return {
      $or: [
        { name: { $regex: searchTerms.join('|'), $options: 'i' } },
        { 'activeIngredients.name': { $in: searchTerms.map(term => new RegExp(term, 'i')) } },
        { manufacturer: { $in: searchTerms.map(term => new RegExp(term, 'i')) } },
        { searchText: { $regex: searchTerms.join('|'), $options: 'i' } }
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
    pharmacy // Changed from pharmacyId to match common query param
  } = filters;

  const query = {};

  // Category filter with validation
  if (categories) {
    const categoryList = Array.isArray(categories) ? categories : [categories];
    if (categoryList.length > 0) {
      query.category = { $in: categoryList };
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
    query.quantity = { $gt: 0 };
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
  if (pharmacy) {
    try {
      query.pharmacy = new mongoose.Types.ObjectId(pharmacy);
    } catch (e) {
      // If not a valid ObjectId, ignore or handle accordingly
    }
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
      page: pageParam = 1,
      limit: limitParam = 20
    } = req.query;

    const page = Math.max(1, parseInt(pageParam));
    const limit = Math.min(100, Math.max(1, parseInt(limitParam)));
    const skip = (page - 1) * limit;

    // 1. Get valid pharmacy IDs (approved + active subscription)
    const activeSubs = await Subscription.find({
      status: 'active',
      endDate: { $gt: new Date() }
    }).select('pharmacy');

    const validPharmIds = activeSubs.map(s => s.pharmacy);

    const approvedPharms = await Pharmacy.find({
      _id: { $in: validPharmIds },
      status: 'approved',
      isActive: true
    }).select('_id name');

    const finalPharmIds = approvedPharms.map(p => p._id);

    // 1.5 Handle Search across Medicine and Pharmacy
    let medIdsFromPharmSearch = [];
    if (search?.trim()) {
      // Find pharmacies matching the search term
      const matchingPharmIds = approvedPharms
        .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
        .map(p => p._id);

      if (matchingPharmIds.length > 0) {
        // Find medicines in these pharmacies
        medIdsFromPharmSearch = await Inventory.distinct('medicine', {
          pharmacy: { $in: matchingPharmIds },
          isActive: true
        });
      }
    }

    // Resolve category names to IDs if filtering by category
    let categoryIds = [];
    if (categories) {
      const categoryList = Array.isArray(categories) ? categories : [categories];
      const validCategoryList = categoryList.filter(Boolean);

      if (validCategoryList.length > 0) {
        // Find categories by name or slug
        const categoryDocs = await Category.find({
          $or: [
            { name: { $in: validCategoryList.map(c => new RegExp(`^${c}$`, 'i')) } },
            { slug: { $in: validCategoryList.map(c => c.toLowerCase()) } }
          ]
        }).select('_id');

        categoryIds = categoryDocs.map(doc => doc._id);

        // If categories were requested but none found, we should return empty results
        if (categoryIds.length === 0) {
          categoryIds = [new mongoose.Types.ObjectId()]; // Dummy ID that won't match anything
        }
      }
    }
    const pipeline = [];

    // Search Step (Enhanced to support Pharmacy search)
    if (search?.trim()) {
      pipeline.push({
        $match: {
          $or: [
            { $text: { $search: search } },
            { _id: { $in: medIdsFromPharmSearch } }
          ]
        }
      });
      pipeline.push({
        $addFields: {
          score: { $meta: 'textScore' }
        }
      });
    }

    // Filter Step for Medicine details
    const medicineFilters = {};
    if (categoryIds.length > 0) {
      medicineFilters.category = { $in: categoryIds };
    }
    if (requiresPrescription === 'true' || requiresPrescription === 'false') {
      medicineFilters.prescriptionRequired = requiresPrescription === 'true';
    }
    if (type) medicineFilters.type = type;
    if (brand) medicineFilters.manufacturer = new RegExp(brand, 'i');

    if (Object.keys(medicineFilters).length > 0) {
      pipeline.push({ $match: medicineFilters });
    }

    // 3. Lookup Inventory (Real source of Stock and Price)
    pipeline.push({
      $lookup: {
        from: 'inventories',
        localField: '_id',
        foreignField: 'medicine',
        as: 'inventoryItems'
      }
    });

    pipeline.push({ $unwind: '$inventoryItems' });

    // 4. Filter Inventory & Valid Pharmacies
    const inventoryMatch = {
      'inventoryItems.isActive': true,
      'inventoryItems.pharmacy': { $in: finalPharmIds }
    };

    if (inStock === 'true') {
      inventoryMatch['inventoryItems.quantity'] = { $gt: 0 };
    }

    // Filter by specific pharmacy if requested
    if (req.query.pharmacyId) {
      try {
        inventoryMatch['inventoryItems.pharmacy'] = new mongoose.Types.ObjectId(req.query.pharmacyId);
      } catch (e) { }
    }

    // Price filters (applied to inventory sellingPrice)
    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
      inventoryMatch['inventoryItems.sellingPrice'] = priceFilter;
    }

    pipeline.push({ $match: inventoryMatch });

    // 5. Lookup Pharmacy Details
    pipeline.push({
      $lookup: {
        from: 'pharmacies',
        localField: 'inventoryItems.pharmacy',
        foreignField: '_id',
        as: 'pharmacyDetails'
      }
    });

    pipeline.push({ $unwind: '$pharmacyDetails' });

    // 6. Final Project & Format to match frontend expectations
    pipeline.push({
      $project: {
        _id: 1,
        inventoryId: '$inventoryItems._id',
        name: 1,
        brand: 1,
        manufacturer: 1,
        dosageForm: 1,
        strength: 1,
        unit: 1,
        prescriptionRequired: 1,
        images: 1,
        imageUrl: 1,
        category: 1,
        // Override with inventory specific values
        price: '$inventoryItems.sellingPrice',
        quantity: '$inventoryItems.quantity',
        pharmacy: {
          _id: '$pharmacyDetails._id',
          name: '$pharmacyDetails.name',
          location: '$pharmacyDetails.location',
          address: '$pharmacyDetails.address',
          phone: '$pharmacyDetails.phone'
        },
        score: { $ifNull: ['$score', 0] }
      }
    });

    // 7. Sort
    const sortObj = {};
    if (sort === 'priceAsc') sortObj.price = 1;
    else if (sort === 'priceDesc') sortObj.price = -1;
    else if (sort === 'relevance' && search?.trim()) sortObj.score = -1;
    else sortObj.name = 1;

    if (Object.keys(sortObj).length > 0) {
      pipeline.push({ $sort: sortObj });
    }

    // 8. Execute with Count
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'total' });

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const [items, countResult] = await Promise.all([
      Medicine.aggregate(pipeline),
      Medicine.aggregate(countPipeline)
    ]);

    const total = countResult[0]?.total || 0;
    const executionTime = Date.now() - startTime;

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
    .populate('category', 'name')
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
    quantity: 1,
    category: 1,
    requiresPrescription: 1,
    rating: 1,
    manufacturer: 1,
    images: 1,
    imageUrl: 1,
    type: 1,
    pharmacy: 1,
    ...(req.query.search && { score: { $meta: 'textScore' } })
  };

  const [items, total] = await Promise.all([
    Medicine.find(query, projection)
      .populate('pharmacy', 'name location address phone')
      .populate('category', 'name')
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

// Get single medicine by ID
const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id)
      .populate('category', 'name')
      .populate('pharmacy', 'name address phone location');

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Fetch all pharmacies carrying this medicine
    const activeSubs = await Subscription.find({
      status: 'active',
      endDate: { $gt: new Date() }
    }).select('pharmacy');
    const validPharmIds = activeSubs.map(s => s.pharmacy);

    const inventory = await Inventory.find({
      medicine: medicine._id,
      isActive: true,
      pharmacy: { $in: validPharmIds }
    }).populate('pharmacy', 'name address phone location rating').lean();

    res.json({
      success: true,
      data: {
        ...medicine.toObject(),
        availableAt: inventory.map(item => ({
          ...item.pharmacy,
          price: item.sellingPrice,
          quantity: item.quantity,
          inventoryId: item._id
        }))
      }
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }
    console.error('getMedicineById error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @route   POST /api/medicines
 * @desc    Add a new medicine
 * @access  Private (Pharmacy Staff/Admin)
 */
const addMedicine = async (req, res) => {
  try {
    // Block system_admin from operational tasks
    if (req.user.role === 'system_admin') {
      return res.status(403).json({
        success: false,
        message: 'System Admins cannot perform pharmacy operations.'
      });
    }

    const {
      name,
      brand, // From frontend
      manufacturer, // From frontend or backend
      category,
      dosageForm,
      strength,
      packSize,
      price,
      quantity, // From frontend
      stockQuantity, // From backend/model
      description,
      requiresPrescription,
      expiryDate,
      minStockLevel
    } = req.body;

    // Map brand to manufacturer if manufacturer is missing
    const finalManufacturer = manufacturer || brand;

    // Basic validation
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!finalManufacturer) missingFields.push('manufacturer/brand');
    if (!category) missingFields.push('category');
    if (!dosageForm) missingFields.push('dosageForm');
    if (!strength) missingFields.push('strength');
    if (!packSize) missingFields.push('packSize');
    if (price === undefined || price === null) missingFields.push('price');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Create new medicine
    const medicine = new Medicine({
      name,
      brand: brand || name,
      manufacturer: finalManufacturer,
      category,
      dosageForm,
      strength,
      packSize,
      price: Number(price) || 0,
      quantity: stockQuantity !== undefined ? stockQuantity : (quantity || 0),
      minStockLevel: minStockLevel || 10,
      description,
      requiresPrescription: requiresPrescription === 'true' || requiresPrescription === true,
      addedBy: req.user?.userId || req.owner?._id,
      availableAt: [req.user?.pharmacyId || req.owner?.pharmacyId],
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      imageUrl: imageUrl
    });

    await medicine.save();

    res.status(201).json({
      success: true,
      data: medicine
    });
  } catch (error) {
    console.error('addMedicine error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error adding medicine'
    });
  }
};

/**
 * @route   PUT /api/medicines/:id
 * @desc    Update a medicine
 * @access  Private (Pharmacy Staff/Admin)
 */
const updateMedicine = async (req, res) => {
  try {
    // Block system_admin from operational tasks
    if (req.user.role === 'system_admin') {
      return res.status(403).json({
        success: false,
        message: 'System Admins cannot perform pharmacy operations.'
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const medicine = await Medicine.findById(id);

    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    // Check authorization: Ensure the medicine belongs to the user's pharmacy
    const userPharmacyId = req.user?.pharmacyId || req.owner?.pharmacyId;
    if (!medicine.availableAt.includes(userPharmacyId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this medicine' });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'manufacturer', 'category', 'dosageForm', 'strength', 'packSize', 'stockQuantity', 'description', 'requiresPrescription', 'expiryDate', 'isActive'];

    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        medicine[field] = updateData[field];
      }
    });

    // Handle price update specially
    if (updateData.price !== undefined) {
      if (typeof updateData.price === 'number') {
        medicine.price = updateData.price;
      } else if (typeof updateData.price === 'object' && updateData.price.basePrice !== undefined) {
        medicine.price = Number(updateData.price.basePrice);
      }
    }

    await medicine.save();

    return res.json({
      success: true,
      message: 'Medicine updated successfully',
      data: medicine
    });

  } catch (error) {
    console.error('updateMedicine error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating medicine',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/medicines/:id
 * @desc    Delete a medicine
 * @access  Private (Pharmacy Staff/Admin)
 */
const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;

    const medicine = await Medicine.findById(id);

    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    // Check authorization
    const userPharmacyId = req.user?.pharmacyId || req.owner?.pharmacyId;
    if (!medicine.availableAt.includes(userPharmacyId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this medicine' });
    }

    await Medicine.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Medicine deleted successfully'
    });

  } catch (error) {
    console.error('deleteMedicine error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting medicine',
      error: error.message
    });
  }
};

/**
 * @route   PATCH /api/medicines/:id/stock
 * @desc    Update medicine stock quantity (restock or consume)
 * @access  Private (Pharmacy Staff)
 */
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustment } = req.body; // Expecting a number (positive to add, negative to reduce)

    if (typeof adjustment !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid numeric adjustment value'
      });
    }

    const medicine = await Medicine.findById(id);

    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    // Authorization check
    const userPharmacyId = req.user?.pharmacyId || req.owner?.pharmacyId;
    if (!medicine.availableAt.includes(userPharmacyId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update stock for this medicine' });
    }

    const newStock = medicine.stockQuantity + adjustment;

    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock. Cannot reduce below zero.'
      });
    }

    medicine.stockQuantity = newStock;
    await medicine.save();

    return res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        _id: medicine._id,
        stockQuantity: medicine.stockQuantity,
        name: medicine.name
      }
    });

  } catch (error) {
    console.error('updateStock error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating stock',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/medicines/alerts
 * @desc    Get inventory alerts (low stock, near expiry) for the user's pharmacy
 * @access  Private (Pharmacy Staff/Admin)
 */
const getInventoryAlerts = async (req, res) => {
  try {
    const pharmacyId = req.user?.pharmacyId || req.owner?.pharmacyId;
    if (!pharmacyId) {
      return res.status(400).json({ success: false, message: 'Pharmacy ID not found for user' });
    }

    const { days = 90 } = req.query; // Default to 90 days for expiry
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + parseInt(days));

    // Find medicines available at this pharmacy that are either low on stock or near expiry
    const alerts = await Medicine.find({
      availableAt: pharmacyId,
      $or: [
        { $expr: { $lte: ['$stockQuantity', '$minStockLevel'] } },
        { expiryDate: { $lte: expiryThreshold, $gt: new Date() } }
      ]
    }).lean();

    return res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    console.error('getInventoryAlerts error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching inventory alerts' });
  }
};

module.exports = {
  getMedicines,
  getMedicineById,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  updateStock,
  getInventoryAlerts,
  getFilterOptions,
  cacheMiddleware
};
