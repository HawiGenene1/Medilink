const Medicine = require('../models/Medicine');

/**
 * GET /api/medicines
 * Query params: search, category, minPrice, maxPrice, sort
 */
const getMedicines = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sort } = req.query;
    const filter = {};

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

    let query = Medicine.find(filter);

    if (sort) {
      const sortField = sort === 'price' ? 'price' : 'name';
      query = query.sort(sortField);
    }

    const medicines = await query.exec();
    return res.json(medicines);
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
    return res.json(medicine);
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
      manufacturer,
      category,
      dosageForm,
      strength,
      packSize,
      price,
      stockQuantity,
      description,
      requiresPrescription,
      expiryDate
    } = req.body;

    // Basic validation
    if (!name || !manufacturer || !category || !dosageForm || !strength || !packSize || !price || stockQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create new medicine
    const medicine = new Medicine({
      name,
      manufacturer,
      category,
      dosageForm,
      strength,
      packSize,
      price: {
        basePrice: price,
        currency: 'ETB'
      },
      stockQuantity,
      description,
      requiresPrescription: requiresPrescription === 'true' || requiresPrescription === true,
      addedBy: req.user.userId,
      availableAt: [req.user.pharmacyId], // Link to the staff's pharmacy
      isActive: true
      // Note: In a real app we might handle Inventory model separately depending on architecture
    });

    await medicine.save();

    return res.status(201).json({
      success: true,
      message: 'Medicine added successfully',
      data: medicine
    });

  } catch (error) {
    console.error('addMedicine error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error adding medicine',
      error: error.message
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

module.exports = {
  getMedicines,
  getMedicineById,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  updateStock
};
