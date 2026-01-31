const Inventory = require('../models/Inventory');
const Medicine = require('../models/Medicine');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Get inventory for the current pharmacy
 * @route   GET /api/inventory
 * @access  Private (Pharmacy Staff/Owner)
 */
exports.getInventory = asyncHandler(async (req, res, next) => {
    const pharmacyId = req.user.pharmacyId;

    if (!pharmacyId) {
        return next(new ErrorResponse('User is not associated with any pharmacy', 400));
    }

    const inventory = await Inventory.find({ pharmacy: pharmacyId })
        .populate('medicine', 'name genericName brand manufacturer dosageForm strength packSize category requiresPrescription')
        .sort('-createdAt');

    res.status(200).json({
        success: true,
        count: inventory.length,
        data: inventory
    });
});

/**
 * @desc    Add a medicine to pharmacy inventory
 * @route   POST /api/inventory
 * @access  Private (Pharmacy Staff/Owner)
 */
exports.addInventoryItem = asyncHandler(async (req, res, next) => {
    const pharmacyId = req.user.pharmacyId;
    const {
        medicineId,
        quantity,
        reorderLevel,
        costPrice,
        sellingPrice,
        batchNumber,
        expiryDate,
        notes
    } = req.body;

    if (!pharmacyId) {
        return next(new ErrorResponse('User is not associated with any pharmacy', 400));
    }

    // 1. Get or Create medicine in catalog
    let medicine;
    if (medicineId) {
        medicine = await Medicine.findById(medicineId);
        if (!medicine) {
            return next(new ErrorResponse('Medicine not found in catalog', 404));
        }
    } else {
        // Create new global medicine if details are provided
        const { name, brand, manufacturer, category, dosageForm, strength, packSize } = req.body;
        if (!name || !manufacturer || !category) {
            return next(new ErrorResponse('Please provide medicine name, manufacturer and category for new entry', 400));
        }

        medicine = await Medicine.create({
            name, brand, manufacturer, category, dosageForm, strength, packSize,
            addedBy: req.user._id,
            price: { basePrice: sellingPrice || 0 },
            stockQuantity: 0, // Stock is managed in Inventory model now
            availableAt: [pharmacyId]
        });
    }

    // 2. Check if item already exists in this pharmacy's inventory
    let inventoryItem = await Inventory.findOne({
        pharmacy: pharmacyId,
        medicine: medicine._id
    });

    if (inventoryItem) {
        // If it exists, maybe update quantity? Or error?
        // Usually, adding means increasing stock if it exists, or adding a new batch.
        // For simplicity, we'll just update the existing record or tell user to use PUT.
        return next(new ErrorResponse('Medicine already exists in your inventory. Please update it instead.', 400));
    }

    // 3. Create inventory entry
    inventoryItem = await Inventory.create({
        pharmacy: pharmacyId,
        medicine: medicineId,
        quantity: quantity || 0,
        reorderLevel: reorderLevel || 10,
        costPrice,
        sellingPrice: sellingPrice || medicine.price?.basePrice || 0,
        batchNumber,
        expiryDate,
        notes,
        lastRestocked: quantity > 0 ? new Date() : null
    });

    // 4. Update Medicine's availableAt if not already there
    if (!medicine.availableAt.includes(pharmacyId)) {
        medicine.availableAt.push(pharmacyId);
        await medicine.save();
    }

    res.status(201).json({
        success: true,
        data: inventoryItem
    });
});

/**
 * @desc    Update inventory item (quantity, price, expiry, etc.)
 * @route   PUT /api/inventory/:id
 * @access  Private (Pharmacy Staff/Owner)
 */
exports.updateInventoryItem = asyncHandler(async (req, res, next) => {
    const pharmacyId = req.user.pharmacyId;
    const { id } = req.params;
    const { quantity, reorderLevel, costPrice, sellingPrice, batchNumber, expiryDate, notes, isActive } = req.body;

    let inventoryItem = await Inventory.findById(id);

    if (!inventoryItem) {
        return next(new ErrorResponse(`Inventory item not found with id of ${id}`, 404));
    }

    // Validate ownership
    if (inventoryItem.pharmacy.toString() !== pharmacyId.toString()) {
        return next(new ErrorResponse('Not authorized to update this inventory item', 403));
    }

    // Update fields
    if (quantity !== undefined) {
        // Handle last restocked
        if (quantity > inventoryItem.quantity) {
            inventoryItem.lastRestocked = new Date();
        }
        inventoryItem.quantity = quantity;
    }

    if (reorderLevel !== undefined) inventoryItem.reorderLevel = reorderLevel;
    if (costPrice !== undefined) inventoryItem.costPrice = costPrice;
    if (sellingPrice !== undefined) inventoryItem.sellingPrice = sellingPrice;
    if (batchNumber !== undefined) inventoryItem.batchNumber = batchNumber;
    if (expiryDate !== undefined) inventoryItem.expiryDate = expiryDate;
    if (notes !== undefined) inventoryItem.notes = notes;
    if (isActive !== undefined) inventoryItem.isActive = isActive;

    await inventoryItem.save();

    res.status(200).json({
        success: true,
        data: inventoryItem
    });
});

/**
 * @desc    Remove medicine from pharmacy inventory
 * @route   DELETE /api/inventory/:id
 * @access  Private (Pharmacy Staff/Owner)
 */
exports.deleteInventoryItem = asyncHandler(async (req, res, next) => {
    const pharmacyId = req.user.pharmacyId;
    const { id } = req.params;

    const inventoryItem = await Inventory.findById(id);

    if (!inventoryItem) {
        return next(new ErrorResponse(`Inventory item not found with id of ${id}`, 404));
    }

    // Validate ownership
    if (inventoryItem.pharmacy.toString() !== pharmacyId.toString()) {
        return next(new ErrorResponse('Not authorized to delete this inventory item', 403));
    }

    // Also remove pharmacy from medicine's availableAt list
    const medicine = await Medicine.findById(inventoryItem.medicine);
    if (medicine) {
        medicine.availableAt = medicine.availableAt.filter(
            pId => pId.toString() !== pharmacyId.toString()
        );
        await medicine.save();
    }

    await inventoryItem.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Medicine removed from inventory'
    });
});
