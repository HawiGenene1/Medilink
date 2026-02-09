const Inventory = require('../models/Inventory');
const Medicine = require('../models/Medicine');
const Notification = require('../models/Notification');
const inventoryAlertService = require('../services/inventoryAlertService');
const mongoose = require('mongoose');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Category = require('../models/Category');

/**
 * @desc    Get inventory for the current pharmacy
 * @route   GET /api/inventory
 * @access  Private (Pharmacy Staff/Owner)
 */
exports.getInventory = asyncHandler(async (req, res, next) => {
    let pharmacyId = req.user?.pharmacyId || req.owner?.pharmacyId;

    // Normalize to string then back to ObjectId to ensure it's clean
    const pharmacyIdStr = pharmacyId ? pharmacyId.toString() : null;


    if (!pharmacyIdStr) {
        return next(new ErrorResponse('User is not associated with any pharmacy', 400));
    }

    const query = { pharmacy: new mongoose.Types.ObjectId(pharmacyIdStr) };
    const inventory = await Inventory.find(query)
        .populate({
            path: 'medicine',
            populate: {
                path: 'category',
                model: 'Category',
                select: 'name'
            }
        })
        .sort('-createdAt');

    // Fallback manual population if deep populate failed for some reason
    for (let item of inventory) {
        if (item.medicine && item.medicine.category && typeof item.medicine.category !== 'object') {
            try {
                const cat = await Category.findById(item.medicine.category).select('name');
                if (cat) {
                    item.medicine.category = cat;
                }
            } catch (err) {
                console.error('Manual category population error:', err);
            }
        }
    }
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
    let pharmacyId = req.user?.pharmacyId || req.owner?.pharmacyId;
    const pharmacyIdStr = pharmacyId ? pharmacyId.toString() : null;

    if (!pharmacyIdStr) {
        return next(new ErrorResponse('User is not associated with any pharmacy', 400));
    }

    const normalizedPharmacyId = new mongoose.Types.ObjectId(pharmacyIdStr);

    const {
        medicineId,
        quantity,
        reorderLevel,
        costPrice,
        sellingPrice,
        batchNumber,
        expiryDate,
        manufacturer,
        notes
    } = req.body;

    // 1. Get or Create medicine in catalog
    let medicine;
    if (medicineId) {
        medicine = await Medicine.findById(medicineId);
        if (!medicine) {
            return next(new ErrorResponse('Medicine not found in catalog', 404));
        }
    } else {
        // Create new global medicine if details are provided
        const {
            name, brand, category, dosageForm, strength, packSize,
            imageUrl, sku, barcode, description, requiresPrescription,
            genericName, therapeuticClass, storageCondition, unit
        } = req.body;

        if (!name || !manufacturer || !category) {
            return next(new ErrorResponse('Please provide medicine name, manufacturer and category for new entry', 400));
        }

        // Resolve Category ObjectId
        let categoryDoc = await Category.findOne({
            $or: [
                { name: new RegExp('^' + category + '$', 'i') },
                { slug: category.toLowerCase() }
            ]
        });

        if (!categoryDoc) {
            // Create a temporary category if not found
            categoryDoc = await Category.create({
                name: category.charAt(0).toUpperCase() + category.slice(1),
                isActive: true
            });
        }

        // Map dosageForm to type for schema compatibility
        const validTypes = ['tablet', 'capsule', 'liquid', 'injection', 'cream', 'ointment', 'inhaler', 'drops', 'spray', 'other'];
        const medicineType = validTypes.includes(dosageForm?.toLowerCase()) ? dosageForm.toLowerCase() : 'other';

        // Map unit for schema compatibility
        const validUnits = ['mg', 'g', 'ml', 'mcg', 'iu', 'units'];
        const dosageUnit = validUnits.includes(unit?.toLowerCase()) ? unit.toLowerCase() : 'units';

        medicine = await Medicine.create({
            name,
            brand,
            manufacturer,
            category: categoryDoc._id,
            type: medicineType,
            dosageForm,
            strength: strength || 'N/A',
            unit: dosageUnit,
            packSize,
            imageUrl,
            sku,
            barcode,
            description,
            prescriptionRequired: requiresPrescription === 'true' || requiresPrescription === true,
            genericName,
            therapeuticClass,
            storageCondition,
            addedBy: req.user?._id || req.owner?._id,
            price: Number(sellingPrice) || 0,
            expiryDate: expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year if not provided
            pharmacy: normalizedPharmacyId,
            quantity: quantity || 0,
            availableAt: [normalizedPharmacyId]
        });
    }

    // 2. Check if item already exists in this pharmacy's inventory
    let inventoryItem = await Inventory.findOne({
        pharmacy: normalizedPharmacyId,
        medicine: medicine._id
    });

    if (inventoryItem) {
        return next(new ErrorResponse('Medicine already exists in your inventory. Please update it instead.', 400));
    }

    // 3. Create inventory entry
    const {
        unitType, manufactureDate, expiryAlertThreshold, tax,
        supplierName, supplierContact, invoiceNumber, dateReceived, location
    } = req.body;

    inventoryItem = await Inventory.create({
        pharmacy: normalizedPharmacyId,
        medicine: medicine._id,
        quantity: quantity || 0,
        reorderLevel: reorderLevel || 10,
        costPrice: costPrice || 0,
        sellingPrice: sellingPrice || medicine.price || 0,
        batchNumber,
        expiryDate,
        manufactureDate,
        expiryAlertThreshold,
        unitType,
        tax,
        supplier: {
            name: supplierName,
            contact: supplierContact,
            invoiceNumber,
            dateReceived: dateReceived || new Date()
        },
        manufacturer: manufacturer || medicine.manufacturer,
        location,
        notes,
        lastRestocked: quantity > 0 ? new Date() : null
    });

    // 4. Update Medicine's availableAt if not already there
    if (!medicine.availableAt.some(id => id.toString() === pharmacyIdStr)) {
        medicine.availableAt.push(normalizedPharmacyId);
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
    const pharmacyIdStr = (req.user?.pharmacyId || req.owner?.pharmacyId)?.toString();
    const { id } = req.params;
    const { quantity, reorderLevel, costPrice, sellingPrice, batchNumber, expiryDate, notes, isActive } = req.body;

    let inventoryItem = await Inventory.findById(id);

    if (!inventoryItem) {
        return next(new ErrorResponse(`Inventory item not found with id of ${id}`, 404));
    }

    // Validate ownership (normalize both sides to strings)
    if (inventoryItem.pharmacy.toString() !== pharmacyIdStr) {
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

    // Check if stock is low and create notification
    if (inventoryItem.quantity <= inventoryItem.reorderLevel) {
        try {
            // Check if a similar notification already exists (within last 24 hours)
            const recentNotification = await Notification.findOne({
                pharmacyId: inventoryItem.pharmacy,
                type: 'low_stock',
                'metadata.inventoryId': inventoryItem._id,
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            });

            if (!recentNotification) {
                const medicineName = inventoryItem.medicine?.name || 'Unknown Medicine';
                await Notification.create([
                    {
                        title: 'Low Stock Alert',
                        message: `${medicineName} stock is low (${inventoryItem.quantity} units remaining, reorder level: ${inventoryItem.reorderLevel})`,
                        pharmacyId: inventoryItem.pharmacy,
                        roleTarget: 'OWNER',
                        type: 'low_stock',
                        metadata: {
                            inventoryId: inventoryItem._id,
                            medicineId: inventoryItem.medicine,
                            currentQuantity: inventoryItem.quantity,
                            reorderLevel: inventoryItem.reorderLevel
                        }
                    },
                    {
                        title: 'Low Stock Alert',
                        message: `${medicineName} stock is low (${inventoryItem.quantity} units remaining, reorder level: ${inventoryItem.reorderLevel})`,
                        pharmacyId: inventoryItem.pharmacy,
                        roleTarget: 'STAFF',
                        type: 'low_stock',
                        metadata: {
                            inventoryId: inventoryItem._id,
                            medicineId: inventoryItem.medicine,
                            currentQuantity: inventoryItem.quantity,
                            reorderLevel: inventoryItem.reorderLevel
                        }
                    }
                ]);
            }
        } catch (notifError) {
            console.error('Failed to create low stock notification:', notifError);
        }
    }

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
    const pharmacyIdStr = (req.user?.pharmacyId || req.owner?.pharmacyId)?.toString();
    const { id } = req.params;

    const inventoryItem = await Inventory.findById(id);

    if (!inventoryItem) {
        return next(new ErrorResponse(`Inventory item not found with id of ${id}`, 404));
    }

    // Validate ownership (normalize both sides to strings)
    if (inventoryItem.pharmacy.toString() !== pharmacyIdStr) {
        return next(new ErrorResponse('Not authorized to delete this inventory item', 403));
    }

    // Also remove pharmacy from medicine's availableAt list
    const medicine = await Medicine.findById(inventoryItem.medicine);
    if (medicine) {
        medicine.availableAt = medicine.availableAt.filter(
            pId => pId.toString() !== pharmacyIdStr.toString()
        );
        await medicine.save();
    }

    await inventoryItem.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Medicine removed from inventory'
    });
});

/**
 * @desc    Get inventory alerts (low stock, expired, near expiry)
 * @route   GET /api/inventory/alerts
 * @access  Private (Pharmacy Staff/Owner)
 */
exports.getInventoryAlerts = asyncHandler(async (req, res, next) => {
    const pharmacyIdStr = (req.user?.pharmacyId || req.owner?.pharmacyId)?.toString();

    if (!pharmacyIdStr) {
        return next(new ErrorResponse('User is not associated with any pharmacy', 400));
    }

    const result = await inventoryAlertService.getInventoryAlerts(pharmacyIdStr);

    res.status(200).json(result);
});

/**
 * @desc    Check and generate notifications for inventory alerts
 * @route   POST /api/inventory/check-alerts
 * @access  Private (Pharmacy Owner)
 */
exports.checkInventoryAlerts = asyncHandler(async (req, res, next) => {
    const pharmacyIdStr = (req.user?.pharmacyId || req.owner?.pharmacyId)?.toString();

    if (!pharmacyIdStr) {
        return next(new ErrorResponse('User is not associated with any pharmacy', 400));
    }

    const result = await inventoryAlertService.checkAndNotifyAlerts(pharmacyIdStr);

    res.status(200).json(result);
});
