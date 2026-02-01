require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./models/User');
const Pharmacy = require('./models/Pharmacy');
const Category = require('./models/Category');
const Medicine = require('./models/Medicine');
const Inventory = require('./models/Inventory');
const Order = require('./models/Order');
const Subscription = require('./models/Subscription');
const PharmacyOwner = require('./models/PharmacyOwner');
const PharmacyStaff = require('./models/PharmacyStaff');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink';

/**
 * Clean Seeding script for Medilink
 * Aligns with latest schemas and includes subscriptions
 */
const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Pharmacy.deleteMany({});
    await Medicine.deleteMany({});
    await Order.deleteMany({});
    await Subscription.deleteMany({});
    await PharmacyOwner.deleteMany({});
    await PharmacyStaff.deleteMany({});
    await Inventory.deleteMany({});
    console.log('Existing data cleared');

    // 1. Create Users
    console.log('Creating users...');
    const adminPassword = await bcrypt.hash('Admin123', 10);
    const userPassword = await bcrypt.hash('Test123', 10);

    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@medilink.com',
      password: adminPassword,
      phone: '+251911111111',
      role: 'admin',
      isActive: true,
      isEmailVerified: true
    });

    const pharmacyId = new mongoose.Types.ObjectId('65a7d5c9f1a2b3c4d5e6f701');

    const pharmacyOwner = await User.create({
      firstName: 'John',
      lastName: 'Pharmacy',
      email: 'pharmacy@medilink.com',
      password: userPassword,
      phone: '+251922222222',
      role: 'PHARMACY_OWNER',
      isActive: true,
      pharmacyId: pharmacyId,
      address: {
        street: '123 Main St',
        city: 'Addis Ababa',
        state: 'Addis Ababa',
        zipCode: '1001',
        country: 'Ethiopia'
      }
    });

    const customer = await User.create({
      firstName: 'Test',
      lastName: 'Customer',
      email: 'customer@medilink.com',
      password: userPassword,
      phone: '+251933333333',
      role: 'customer',
      isActive: true,
      address: {
        street: '456 Market St',
        city: 'Addis Ababa',
        state: 'Addis Ababa',
        zipCode: '1001',
        country: 'Ethiopia'
      }
    });

    const deliveryPerson = await User.create({
      firstName: 'Mike',
      lastName: 'Delivery',
      email: 'delivery@medilink.com',
      password: userPassword,
      phone: '+251944444444',
      role: 'delivery',
      isActive: true,
      vehicleInfo: {
        type: 'motorcycle',
        licensePlate: 'AA-123-456'
      }
    });

    const pharmacyStaff = await User.create({
      firstName: 'Emma',
      lastName: 'Staff',
      email: 'staff@medilink.com',
      password: userPassword,
      phone: '+251955555555',
      role: 'staff',
      isActive: true,
      pharmacyId: pharmacyId
    });

    const cashier = await User.create({
      firstName: 'Carl',
      lastName: 'Cashier',
      email: 'cashier@medilink.com',
      password: userPassword,
      phone: '+251966666666',
      role: 'cashier',
      isActive: true,
      pharmacyId: pharmacyId
    });

    console.log('✅ Created users\n');

    // 2. Create Pharmacy
    console.log('🏥 Creating pharmacies...');

    // Check if it already exists or just create it with the fixed ID
    const pharmacy1 = await Pharmacy.create({
      _id: pharmacyId,
      name: 'MediCare Pharmacy',
      licenseNumber: 'PH-2024-001',
      email: 'contact@medicare.com',
      phone: '+251911234567',
      address: {
        street: '789 Health Street',
        city: 'Addis Ababa',
        state: 'Addis Ababa',
        zipCode: '1002',
        country: 'Ethiopia'
      },
      location: {
        type: 'Point',
        coordinates: [38.7469, 9.0320]
      },
      owner: pharmacyOwner._id,
      description: 'Your trusted neighborhood pharmacy providing quality medicines and healthcare products.',
      isVerified: true,
      isActive: true,
      rating: 4.5,
      reviewCount: 125
    });

    console.log('✅ Created pharmacies\n');

    // Link owner to pharmacy
    await User.findByIdAndUpdate(pharmacyOwner._id, { pharmacyId: pharmacy1._id });

    // 3. Create Subscriptions
    console.log('📜 Creating subscriptions...');
    const now = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(now.getFullYear() + 1);

    await Subscription.create([
      {
        pharmacy: pharmacy1._id,
        mode: 'annually',
        startDate: now,
        endDate: nextYear,
        isActive: true,
        status: 'active'
      }
    ]);
    console.log('✅ Created subscriptions\n');

    // 3.5 Create PharmacyOwner and PharmacyStaff specifics
    console.log('👤 Creating role-specific records...');
    await PharmacyOwner.create({
      _id: pharmacyOwner._id, // Reuse user ID if possible or link correctly
      fullName: 'John Pharmacy',
      email: 'pharmacy@medilink.com',
      password: 'Test123', // Will be hashed by pre-save
      phone: '+251922222222',
      pharmacyId: pharmacy1._id,
      subscriptionPlan: 'PREMIUM',
      subscriptionStatus: 'ACTIVE',
      operationalPermissions: { manageInventory: true, prepareOrders: true }
    });

    await PharmacyStaff.create({
      user: pharmacyStaff._id,
      pharmacy: pharmacy1._id,
      role: 'staff',
      permissions: {
        inventory: { view: true, add: true, edit: true, delete: false },
        orders: { view: true, process: true, cancel: false },
        customers: { view: true, add: true, edit: true }
      }
    });
    console.log('✅ Created role-specific records\n');

    // 4. Create Medicines
    console.log('💊 Creating medicines...');
    const medicines = await Medicine.create([
      {
        name: 'Paracetamol',
        brand: 'Tylenol',
        genericName: 'Acetaminophen',
        category: 'otc',
        description: 'Effective pain reliever and fever reducer',
        price: { basePrice: 50, discount: 0, currency: 'ETB' },
        stockQuantity: 500,
        unit: 'tablet',
        dosage: '500mg',
        manufacturer: 'Johnson & Johnson',
        dosageForm: 'tablet',
        strength: '500mg',
        packSize: '10 tablets',
        expiryDate: new Date('2026-12-31'),
        requiresPrescription: false,
        availableAt: [pharmacy1._id],
        addedBy: admin._id,
        isActive: true
      },
      {
        name: 'Amoxicillin',
        brand: 'Amoxil',
        genericName: 'Amoxicillin',
        category: 'prescription',
        description: 'Broad-spectrum antibiotic for bacterial infections',
        price: { basePrice: 120, discount: 0, currency: 'ETB' },
        stockQuantity: 300,
        unit: 'capsule',
        dosage: '500mg',
        manufacturer: 'GlaxoSmithKline',
        dosageForm: 'capsule',
        strength: '500mg',
        packSize: '20 capsules',
        expiryDate: new Date('2026-06-30'),
        requiresPrescription: true,
        availableAt: [pharmacy1._id],
        addedBy: admin._id,
        isActive: true
      },
      {
        name: 'Cetirizine',
        brand: 'Zyrtec',
        genericName: 'Cetirizine',
        category: 'otc',
        description: 'Antihistamine for allergy relief',
        price: { basePrice: 40, discount: 0, currency: 'ETB' },
        stockQuantity: 100,
        unit: 'tablet',
        dosage: '10mg',
        manufacturer: 'Pfizer',
        dosageForm: 'tablet',
        strength: '10mg',
        packSize: '10 tablets',
        expiryDate: new Date('2026-10-31'),
        requiresPrescription: false,
        availableAt: [pharmacy1._id],
        addedBy: admin._id,
        isActive: true
      }
    ]);
    console.log('✅ Created medicines\n');

    // 4.5 Create Inventory Records
    console.log('📦 Creating inventory stock...');
    await Inventory.create([
      {
        pharmacy: pharmacy1._id,
        medicine: medicines[0]._id,
        quantity: 100,
        reorderLevel: 20,
        costPrice: 40,
        sellingPrice: 50,
        batchNumber: 'B-2024-001',
        expiryDate: new Date('2026-12-31'),
        unitType: 'Piece'
      },
      {
        pharmacy: pharmacy1._id,
        medicine: medicines[1]._id,
        quantity: 50,
        reorderLevel: 10,
        costPrice: 100,
        sellingPrice: 120,
        batchNumber: 'B-2024-002',
        expiryDate: new Date('2026-06-30'),
        unitType: 'Piece'
      },
      {
        pharmacy: pharmacy1._id,
        medicine: medicines[2]._id, // Cetirizine
        quantity: 5,
        reorderLevel: 15,
        costPrice: 30,
        sellingPrice: 45,
        batchNumber: 'ALERT-001',
        expiryDate: new Date('2025-12-31'),
        unitType: 'Strip'
      }
    ]);
    console.log('✅ Created inventory stock\n');

    // 5. Create Sample Orders
    console.log('📦 Creating orders...');
    await Order.create([
      {
        orderNumber: `ORD-${Date.now()}-001`,
        customer: customer._id,
        pharmacy: pharmacy1._id,
        items: [
          {
            medicine: medicines[0]._id,
            name: 'Paracetamol',
            price: 50,
            quantity: 2,
            subtotal: 100
          }
        ],
        totalAmount: 100,
        deliveryFee: 20,
        tax: 5,
        discount: 0,
        finalAmount: 125,
        status: 'delivered',
        paymentStatus: 'paid',
        paymentMethod: 'cash',
        deliveryAddress: {
          street: '456 Customer Ave',
          city: 'Addis Ababa',
          country: 'Ethiopia'
        },
        deliveryPerson: deliveryPerson._id,
        actualDeliveryTime: new Date()
      }
    ]);
    console.log('✅ Created sample orders\n');

    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.error('FULL ERROR:', JSON.stringify(error, null, 2));
    if (error.errors) {
      console.error('Validation Errors:', Object.keys(error.errors).map(key => `${key}: ${error.errors[key].message}`).join(', '));
    }
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
};

seedData();
