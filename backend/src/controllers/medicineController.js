const Medicine = require('../models/Medicine');

/**
 * GET /api/medicines
 * Query params: search, category, minPrice, maxPrice, sort
 */
const getMedicines = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sort, pharmacyId } = req.query;
    const filter = {};

    if (pharmacyId) {
      filter.availableAt = pharmacyId;
    }

    if (search) {
      // simple text search on name and description
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) filter.category = category;
    if (minPrice) filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = Medicine.find(filter)
      .sort(sort === 'price' ? { 'price.basePrice': 1 } : { createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const [medicines, total] = await Promise.all([
      query.exec(),
      Medicine.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data: {
        medicines,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      },
      // For compatibility with inconsistent frontend components
      medicines
    });
  } catch (error) {
    console.error('getMedicines error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching medicines' });
  }
};

const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findById(id).exec();
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });
    return res.json({
      success: true,
      data: medicine
    });
  } catch (error) {
    console.error('getMedicineById error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching medicine' });
  }
};

/**
 * @route   POST /api/medicines
 * @desc    Add a new medicine
 * @access  Private (Pharmacy Staff/Admin)
 */
const addMedicine = async (req, res) => {
  try {
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
      price: {
        basePrice: price,
        currency: 'ETB'
      },
      stockQuantity: stockQuantity !== undefined ? stockQuantity : (quantity || 0),
      minStockLevel: minStockLevel || 10,
      description,
      requiresPrescription: requiresPrescription === 'true' || requiresPrescription === true,
      addedBy: req.user.userId,
      availableAt: [req.user.pharmacyId],
      expiryDate: expiryDate ? new Date(expiryDate) : null
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
    const { id } = req.params;
    const updateData = req.body;

    const medicine = await Medicine.findById(id);

    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    // Check authorization: Ensure the medicine belongs to the user's pharmacy
    if (!medicine.availableAt.includes(req.user.pharmacyId)) {
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
        medicine.price = { ...medicine.price, basePrice: updateData.price };
      } else if (typeof updateData.price === 'object') {
        medicine.price = { ...medicine.price, ...updateData.price };
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
    if (!medicine.availableAt.includes(req.user.pharmacyId)) {
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
    if (!medicine.availableAt.includes(req.user.pharmacyId)) {
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
    const pharmacyId = req.user.pharmacyId;
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
  getInventoryAlerts
};
