/**
 * Utility functions for filtering and validation
 */

/**
 * Validate filter parameters
 * @param {Object} queryParams - Query parameters to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} - Validated and sanitized parameters
 */
const validateFilters = (queryParams, schema = {}) => {
  const validated = {};
  const errors = [];

  // Common validation patterns
  const validators = {
    string: (value) => typeof value === 'string' ? value.trim() : null,
    number: (value) => {
      const num = Number(value);
      return isNaN(num) ? null : num;
    },
    boolean: (value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return null;
    },
    array: (value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return value.split(',').map(v => v.trim());
      return null;
    },
    date: (value) => {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
  };

  // Validate each parameter according to schema
  Object.keys(schema).forEach(key => {
    const config = schema[key];
    const value = queryParams[key];
    
    if (value === undefined || value === null || value === '') {
      if (config.required) {
        errors.push(`${key} is required`);
      }
      return;
    }

    const validator = validators[config.type];
    if (validator) {
      const validatedValue = validator(value);
      if (validatedValue === null && config.required) {
        errors.push(`Invalid ${key} format`);
      } else if (validatedValue !== null) {
        validated[key] = validatedValue;
      }
    }
  });

  return { validated, errors };
};

/**
 * Build MongoDB aggregation pipeline for advanced filtering
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Aggregation options
 * @returns {Array} - MongoDB aggregation pipeline
 */
const buildAggregationPipeline = (filters, options = {}) => {
  const {
    search,
    categories,
    manufacturers,
    priceRange,
    rating,
    dateRange,
    inStock,
    requiresPrescription
  } = filters;

  const pipeline = [];

  // Match stage for basic filtering
  const matchStage = {};
  
  if (search && options.searchFields) {
    matchStage.$or = options.searchFields.map(field => ({
      [field]: { $regex: search, $options: 'i' }
    }));
  }

  if (categories && categories.length > 0) {
    matchStage.category = { $in: categories };
  }

  if (manufacturers && manufacturers.length > 0) {
    matchStage.manufacturer = { $in: manufacturers };
  }

  if (priceRange) {
    matchStage.price = {};
    if (priceRange.min !== undefined) matchStage.price.$gte = priceRange.min;
    if (priceRange.max !== undefined) matchStage.price.$lte = priceRange.max;
  }

  if (rating) {
    matchStage.rating = { $gte: rating };
  }

  if (dateRange) {
    matchStage.createdAt = {};
    if (dateRange.from) matchStage.createdAt.$gte = new Date(dateRange.from);
    if (dateRange.to) matchStage.createdAt.$lte = new Date(dateRange.to);
  }

  if (inStock !== undefined) {
    matchStage.stock = inStock ? { $gt: 0 } : { $lte: 0 };
  }

  if (requiresPrescription !== undefined) {
    matchStage.requiresPrescription = requiresPrescription;
  }

  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  // Add lookup stages if specified
  if (options.lookups) {
    options.lookups.forEach(lookup => {
      pipeline.push({ $lookup: lookup });
    });
  }

  // Add facet for counts and data
  if (options.includeFacets) {
    pipeline.push({
      $facet: {
        data: [
          { $sort: options.sort || { createdAt: -1 } },
          { $skip: options.skip || 0 },
          { $limit: options.limit || 10 }
        ],
        count: [{ $count: "total" }],
        facets: options.facetStages || []
      }
    });
  }

  return pipeline;
};

/**
 * Sanitize search term to prevent injection
 * @param {string} searchTerm - Search term to sanitize
 * @returns {string} - Sanitized search term
 */
const sanitizeSearchTerm = (searchTerm) => {
  if (!searchTerm || typeof searchTerm !== 'string') return '';
  
  // Remove potentially dangerous characters
  return searchTerm
    .replace(/[\{\}\[\]\\]/g, '')
    .replace(/\$/g, '')
    .trim()
    .substring(0, 100); // Limit length
};

/**
 * Generate filter summary for display
 * @param {Object} filters - Applied filters
 * @returns {Object} - Human-readable filter summary
 */
const generateFilterSummary = (filters) => {
  const summary = [];
  
  if (filters.search) {
    summary.push(`Search: "${filters.search}"`);
  }
  
  if (filters.category) {
    summary.push(`Category: ${filters.category}`);
  }
  
  if (filters.categories && filters.categories.length > 0) {
    summary.push(`Categories: ${filters.categories.join(', ')}`);
  }
  
  if (filters.brand) {
    summary.push(`Brand: ${filters.brand}`);
  }
  
  if (filters.brands && filters.brands.length > 0) {
    summary.push(`Brands: ${filters.brands.join(', ')}`);
  }
  
  if (filters.minPrice || filters.maxPrice) {
    const priceRange = [];
    if (filters.minPrice) priceRange.push(`$${filters.minPrice}`);
    if (filters.maxPrice) priceRange.push(`$${filters.maxPrice}`);
    summary.push(`Price: ${priceRange.join(' - ')}`);
  }
  
  if (filters.status) {
    summary.push(`Status: ${filters.status}`);
  }
  
  if (filters.dateFrom || filters.dateTo) {
    const dateRange = [];
    if (filters.dateFrom) dateRange.push(new Date(filters.dateFrom).toLocaleDateString());
    if (filters.dateTo) dateRange.push(new Date(filters.dateTo).toLocaleDateString());
    summary.push(`Date: ${dateRange.join(' - ')}`);
  }
  
  if (filters.inStock === true) {
    summary.push('In Stock Only');
  }
  
  if (filters.requiresPrescription === true) {
    summary.push('Prescription Required');
  }
  
  return {
    activeFilters: summary,
    hasFilters: summary.length > 0,
    filterCount: summary.length
  };
};

/**
 * Convert filter object to URL query string
 * @param {Object} filters - Filter object
 * @returns {string} - URL query string
 */
const filtersToQueryString = (filters) => {
  const params = new URLSearchParams();
  
  Object.keys(filters).forEach(key => {
    const value = filters[key];
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, value);
      }
    }
  });
  
  return params.toString();
};

/**
 * Parse URL query string to filter object
 * @param {string} queryString - URL query string
 * @returns {Object} - Filter object
 */
const queryStringToFilters = (queryString) => {
  const params = new URLSearchParams(queryString);
  const filters = {};
  
  for (const [key, value] of params) {
    // Handle comma-separated values as arrays
    if (value.includes(',')) {
      filters[key] = value.split(',').map(v => v.trim());
    } else {
      filters[key] = value;
    }
  }
  
  return filters;
};

module.exports = {
  validateFilters,
  buildAggregationPipeline,
  sanitizeSearchTerm,
  generateFilterSummary,
  filtersToQueryString,
  queryStringToFilters
};
