const Medicine = require('../models/Medicine');
const Category = require('../models/Category');
const Pharmacy = require('../models/Pharmacy');
const Subscription = require('../models/Subscription');

// Helper to get pharmacies that are both approved and have active subscriptions
const getValidPharmacyIds = async () => {
  const activeSubs = await Subscription.find({
    status: 'active',
    endDate: { $gt: new Date() }
  }).select('pharmacy');

  const validSubPharmIds = activeSubs.map(s => s.pharmacy);

  const approvedPharms = await Pharmacy.find({
    _id: { $in: validSubPharmIds },
    status: 'approved',
    isActive: true
  }).select('_id');

  return approvedPharms.map(p => p._id);
};

// @desc    Get medicines with advanced filtering
// @route   GET /api/customer/medicines
// @access   Private (customer)
exports.getMedicines = async (req, res) => {
  try {
    const {
      search,
      category,
      type,
      brand,
      manufacturer,
      minPrice,
      maxPrice,
      prescriptionRequired,
      inStock,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 20,
      location,
      maxDistance = 10 // in km
    } = req.query;

    // Build query
    const validPharmacyIds = await getValidPharmacyIds();
    let query = {
      isActive: true,
      isDiscontinued: false,
      quantity: { $gt: 0 },
      pharmacy: { $in: validPharmacyIds }
    };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Category filter
    if (category) {
      if (category.includes(',')) {
        query.category = { $in: category.split(',').map(c => c.trim()) };
      } else {
        query.category = category;
      }
    }

    // Type filter
    if (type) {
      if (type.includes(',')) {
        query.type = { $in: type.split(',').map(t => t.trim()) };
      } else {
        query.type = type;
      }
    }

    // Brand filter
    if (brand) {
      if (brand.includes(',')) {
        query.brand = { $in: brand.split(',').map(b => b.trim()) };
      } else {
        query.brand = brand;
      }
    }

    // Manufacturer filter
    if (manufacturer) {
      if (manufacturer.includes(',')) {
        query.manufacturer = { $in: manufacturer.split(',').map(m => m.trim()) };
      } else {
        query.manufacturer = manufacturer;
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Prescription requirement filter
    if (prescriptionRequired !== undefined) {
      query.prescriptionRequired = prescriptionRequired === 'true';
    }

    // Stock filter
    if (inStock === 'true') {
      query.quantity = { $gt: 0 };
    }

    // Location-based filter (geospatial)
    if (location && location.includes(',')) {
      const [lng, lat] = location.split(',').map(coord => parseFloat(coord.trim()));
      if (!isNaN(lng) && !isNaN(lat)) {
        query.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: maxDistance * 1000 // Convert km to meters
          }
        };
      }
    }

    // Sorting options
    const sortOptions = {};
    const validSortFields = ['name', 'price', 'createdAt', 'salesData.totalSold', 'rating.average'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    sortOptions[sortField] = sortDirection;

    // If using text search, add score to sorting
    if (search) {
      sortOptions.score = { $meta: 'textScore' };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const medicines = await Medicine.find(query)
      .populate('category', 'name slug icon')
      .populate('pharmacy', 'name address phone')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalCount = await Medicine.countDocuments(query);

    // Get available filters
    const [categories, types, brands, manufacturers] = await Promise.all([
      Category.distinct('name', { isActive: true }),
      Medicine.distinct('type', { isActive: true, isDiscontinued: false }),
      Medicine.distinct('brand', { isActive: true, isDiscontinued: false }),
      Medicine.distinct('manufacturer', { isActive: true, isDiscontinued: false })
    ]);

    // Price range for current filters
    const priceRange = await Medicine.aggregate([
      { $match: query },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        medicines,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalMedicines: totalCount,
          hasNext: parseInt(page) < Math.ceil(totalCount / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        },
        filters: {
          categories: categories.sort(),
          types: types.sort(),
          brands: brands.sort(),
          manufacturers: manufacturers.sort(),
          priceRange: priceRange[0] || { min: 0, max: 1000 }
        }
      }
    });

  } catch (error) {
    console.error('Error in getMedicines:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching medicines',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get medicine details
// @route   GET /api/customer/medicines/:id
// @access   Private (customer)
exports.getMedicineDetails = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id)
      .populate('category', 'name slug description')
      .populate('pharmacy', 'name address phone email')
      .lean();

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Check if medicine is active and not discontinued
    if (!medicine.isActive || medicine.isDiscontinued) {
      return res.status(404).json({
        success: false,
        message: 'Medicine is not available'
      });
    }

    // Check if pharmacy is approved and active
    const validPharmacyIds = await getValidPharmacyIds();
    const isPharmacyValid = validPharmacyIds.some(id => id.toString() === medicine.pharmacy._id.toString());

    if (!isPharmacyValid) {
      return res.status(404).json({
        success: false,
        message: 'Medicine is not available from this provider'
      });
    }

    // Get related medicines (same category, different brand)
    const relatedMedicines = await Medicine.find({
      _id: { $ne: medicine._id },
      category: medicine.category,
      isActive: true,
      isDiscontinued: false,
      quantity: { $gt: 0 },
      pharmacy: { $in: validPharmacyIds }
    })
      .populate('category', 'name')
      .limit(8)
      .select('name brand price images quantity prescriptionRequired')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        medicine,
        relatedMedicines
      }
    });

  } catch (error) {
    console.error('Error in getMedicineDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching medicine details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get categories with medicine counts
// @route   GET /api/customer/categories
// @access   Private (customer)
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'medicines',
          let: { categoryId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$category', '$$categoryId'] },
                isActive: true,
                isDiscontinued: false,
                quantity: { $gt: 0 }
              }
            }
          ],
          as: 'medicines'
        }
      },
      {
        $project: {
          name: 1,
          slug: 1,
          description: 1,
          icon: 1,
          image: 1,
          medicineCount: { $size: '$medicines' },
          displayOrder: 1
        }
      },
      { $sort: { displayOrder: 1, name: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error in getCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get featured/popular medicines
// @route   GET /api/customer/medicines/featured
// @access   Private (customer)
exports.getFeaturedMedicines = async (req, res) => {
  try {
    const { limit = 10, category } = req.query;

    const validPharmacyIds = await getValidPharmacyIds();
    let query = {
      isActive: true,
      isDiscontinued: false,
      quantity: { $gt: 0 },
      pharmacy: { $in: validPharmacyIds }
    };

    if (category) {
      query.category = category;
    }

    const medicines = await Medicine.find(query)
      .populate('category', 'name slug')
      .populate('pharmacy', 'name')
      .sort({ 'salesData.totalSold': -1, 'rating.average': -1 })
      .limit(parseInt(limit))
      .select('name brand price images quantity prescriptionRequired rating salesData')
      .lean();

    res.status(200).json({
      success: true,
      data: medicines
    });

  } catch (error) {
    console.error('Error in getFeaturedMedicines:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured medicines',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Search medicines (autocomplete/suggestions)
// @route   GET /api/customer/medicines/search
// @access   Private (customer)
exports.searchMedicines = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const validPharmacyIds = await getValidPharmacyIds();
    const medicines = await Medicine.find({
      $and: [
        { isActive: true, isDiscontinued: false, pharmacy: { $in: validPharmacyIds } },
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { brand: { $regex: q, $options: 'i' } },
            { manufacturer: { $regex: q, $options: 'i' } },
            { 'activeIngredients.name': { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
      .populate('category', 'name')
      .limit(parseInt(limit))
      .select('name brand manufacturer price images')
      .lean();

    res.status(200).json({
      success: true,
      data: medicines
    });

  } catch (error) {
    console.error('Error in searchMedicines:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching medicines',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};