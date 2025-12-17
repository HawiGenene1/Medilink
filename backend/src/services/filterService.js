const Medicine = require('../models/Medicine');
const Order = require('../models/Order');
const Category = require('../models/Category');

class FilterService {
  /**
   * Build filter object from query parameters
   * @param {Object} queryParams - Request query parameters
   * @param {Object} options - Filtering options
   * @returns {Object} - MongoDB filter object
   */
  static buildFilter(queryParams, options = {}) {
    const filter = {};
    const {
      category,
      categories,
      type,
      types,
      brand,
      brands,
      manufacturer,
      manufacturers,
      minPrice,
      maxPrice,
      inStock,
      requiresPrescription,
      search,
      status,
      statuses,
      paymentStatus,
      paymentMethod,
      dateFrom,
      dateTo,
      rating,
      minRating,
      maxRating
    } = queryParams;

    // Category filtering (single or multiple)
    if (category) {
      filter.category = category;
    } else if (categories) {
      const categoryArray = Array.isArray(categories) ? categories : categories.split(',');
      filter.category = { $in: categoryArray };
    }

    // Type filtering (single or multiple)
    if (type) {
      filter.type = type;
    } else if (types) {
      const typeArray = Array.isArray(types) ? types : types.split(',');
      filter.type = { $in: typeArray };
    }

    // Brand/Manufacturer filtering (single or multiple)
    if (brand) {
      filter.brand = brand;
    } else if (brands) {
      const brandArray = Array.isArray(brands) ? brands : brands.split(',');
      filter.brand = { $in: brandArray };
    }

    if (manufacturer) {
      filter.manufacturer = manufacturer;
    } else if (manufacturers) {
      const manufacturerArray = Array.isArray(manufacturers) ? manufacturers : manufacturers.split(',');
      filter.manufacturer = { $in: manufacturerArray };
    }

    // Price range filtering
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Stock filtering
    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    } else if (inStock === 'false') {
      filter.stock = { $lte: 0 };
    }

    // Prescription requirement filtering
    if (requiresPrescription !== undefined) {
      filter.requiresPrescription = requiresPrescription === 'true';
    }

    // Status filtering (for orders)
    if (status) {
      filter.status = status;
    } else if (statuses) {
      const statusArray = Array.isArray(statuses) ? statuses : statuses.split(',');
      filter.status = { $in: statusArray };
    }

    // Payment status filtering
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    // Payment method filtering
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    // Rating filtering
    if (rating) {
      filter.rating = Number(rating);
    }
    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) filter.rating.$gte = Number(minRating);
      if (maxRating) filter.rating.$lte = Number(maxRating);
    }

    // Date range filtering
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Text search filtering
    if (search && options.searchFields) {
      const searchConditions = options.searchFields.map(field => ({
        [field]: { $regex: search, $options: 'i' }
      }));
      filter.$or = searchConditions;
    }

    return filter;
  }

  /**
   * Build sort object from query parameters
   * @param {Object} queryParams - Request query parameters
   * @param {Object} defaultSort - Default sort configuration
   * @returns {Object} - MongoDB sort object
   */
  static buildSort(queryParams, defaultSort = { createdAt: -1 }) {
    const { sortBy, sortOrder } = queryParams;
    
    if (!sortBy) return defaultSort;

    const order = sortOrder === 'asc' ? 1 : -1;
    return { [sortBy]: order };
  }

  /**
   * Build pagination object from query parameters
   * @param {Object} queryParams - Request query parameters
   * @returns {Object} - Pagination configuration
   */
  static buildPagination(queryParams) {
    const page = Math.max(1, Number(queryParams.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(queryParams.limit) || 10));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  /**
   * Filter medicines with advanced options
   * @param {Object} queryParams - Request query parameters
   * @returns {Object} - Filtered medicines with pagination info
   */
  static async filterMedicines(queryParams) {
    try {
      const filter = this.buildFilter(queryParams, {
        searchFields: ['name', 'description', 'manufacturer', 'brand']
      });
      
      const sort = this.buildSort(queryParams, { name: 1 });
      const { page, limit, skip } = this.buildPagination(queryParams);

      const [medicines, totalCount] = await Promise.all([
        Medicine.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        Medicine.countDocuments(filter)
      ]);

      return {
        medicines,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Error filtering medicines: ${error.message}`);
    }
  }

  /**
   * Filter orders with advanced options
   * @param {Object} queryParams - Request query parameters
   * @param {Object} additionalFilters - Additional filters (e.g., user-specific)
   * @returns {Object} - Filtered orders with pagination info
   */
  static async filterOrders(queryParams, additionalFilters = {}) {
    try {
      const filter = {
        ...this.buildFilter(queryParams, {
          searchFields: ['orderNumber', 'notes']
        }),
        ...additionalFilters
      };
      
      const sort = this.buildSort(queryParams, { createdAt: -1 });
      const { page, limit, skip } = this.buildPagination(queryParams);

      const [orders, totalCount] = await Promise.all([
        Order.find(filter)
          .populate('customer', 'name email')
          .populate('pharmacy', 'name')
          .populate('items.medicine', 'name price')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Order.countDocuments(filter)
      ]);

      return {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Error filtering orders: ${error.message}`);
    }
  }

  /**
   * Get available filter options for medicines
   * @returns {Object} - Available filter options
   */
  static async getMedicineFilterOptions() {
    try {
      const [categories, manufacturers, priceRange] = await Promise.all([
        Medicine.distinct('category'),
        Medicine.distinct('manufacturer'),
        Medicine.aggregate([
          {
            $group: {
              _id: null,
              minPrice: { $min: '$price' },
              maxPrice: { $max: '$price' }
            }
          }
        ])
      ]);

      return {
        categories: categories.filter(Boolean).sort(),
        manufacturers: manufacturers.filter(Boolean).sort(),
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 1000 },
        types: ['prescription', 'otc', 'supplement', 'equipment'],
        inStockOptions: [
          { value: 'true', label: 'In Stock' },
          { value: 'false', label: 'Out of Stock' }
        ],
        prescriptionOptions: [
          { value: 'true', label: 'Requires Prescription' },
          { value: 'false', label: 'No Prescription Required' }
        ]
      };
    } catch (error) {
      throw new Error(`Error getting medicine filter options: ${error.message}`);
    }
  }

  /**
   * Get available filter options for orders
   * @returns {Object} - Available filter options
   */
  static async getOrderFilterOptions() {
    try {
      const [paymentMethods, dateRange] = await Promise.all([
        Order.distinct('paymentMethod'),
        Order.aggregate([
          {
            $group: {
              _id: null,
              earliestDate: { $min: '$createdAt' },
              latestDate: { $max: '$createdAt' }
            }
          }
        ])
      ]);

      return {
        statuses: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
        paymentStatuses: ['pending', 'paid', 'failed', 'refunded'],
        paymentMethods: paymentMethods.filter(Boolean).sort(),
        dateRange: dateRange[0] || {
          earliestDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
          latestDate: new Date()
        }
      };
    } catch (error) {
      throw new Error(`Error getting order filter options: ${error.message}`);
    }
  }

  /**
   * Apply filters to any model dynamically
   * @param {Model} model - Mongoose model
   * @param {Object} queryParams - Request query parameters
   * @param {Object} options - Additional options
   * @returns {Object} - Filtered results with pagination
   */
  static async filterModel(model, queryParams, options = {}) {
    try {
      const {
        searchFields = [],
        populate = [],
        defaultSort = { createdAt: -1 },
        additionalFilters = {}
      } = options;

      const filter = {
        ...this.buildFilter(queryParams, { searchFields }),
        ...additionalFilters
      };
      
      const sort = this.buildSort(queryParams, defaultSort);
      const { page, limit, skip } = this.buildPagination(queryParams);

      let query = model.find(filter).sort(sort).skip(skip).limit(limit);
      
      // Apply population if specified
      populate.forEach(pop => {
        query = query.populate(pop);
      });

      const [results, totalCount] = await Promise.all([
        query.exec(),
        model.countDocuments(filter)
      ]);

      return {
        results,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Error filtering model: ${error.message}`);
    }
  }
}

module.exports = FilterService;
