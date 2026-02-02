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
const DeliveryProfile = require('./models/DeliveryProfile');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink';

/**
 * Clean Seeding script for Medilink
 * Aligns with latest schemas
 */
const seedData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Pharmacy.deleteMany({});
    await Medicine.deleteMany({});
    await Order.deleteMany({});
    await Inventory.deleteMany({});
    await Category.deleteMany({});
    await DeliveryProfile.deleteMany({});
    console.log('Existing data cleared');

    // Create Users
    console.log('👥 Creating users...');
    const adminPassword = 'Admin123';
    const userPassword = 'Test123';

    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@medilink.com',
      password: adminPassword,
      phone: '+251911111111',
      role: 'admin',
      isActive: true,
      status: 'active',
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
      status: 'active',
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
      recoveryEmail: 'thick.rodent.jssq@protectsmail.net',
      recoveryPhone: '+251962151292',
      role: 'customer',
      isActive: true,
      status: 'active',
      address: {
        street: '456 Market St',
        city: 'Addis Ababa',
        state: 'Addis Ababa',
        zipCode: '1001',
        country: 'Ethiopia'
      }
    });

    const driver = await User.create({
      firstName: 'David',
      lastName: 'Driver',
      email: 'driver@medilink.com',
      password: userPassword,
      phone: '+251944444444',
      role: 'delivery',
      isActive: true,
      status: 'active',
      isEmailVerified: true,
      address: {
        street: '123 Driver Lane',
        city: 'Addis Ababa',
        state: 'Addis Ababa',
        zipCode: '1004',
        country: 'Ethiopia'
      }
    });

    await DeliveryProfile.create({
      userId: driver._id,
      onboardingStatus: 'approved',
      isAvailable: true,
      vehicleDetails: {
        type: 'motorcycle',
        make: 'Yamaha',
        model: 'R15',
        licensePlate: 'AA-01-12345'
      },
      currentLocation: {
        type: 'Point',
        coordinates: [38.74, 9.03]
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
      ownerName: 'John Pharmacy',
      description: 'Your trusted neighborhood pharmacy providing quality medicines and healthcare products.',
      isVerified: true,
      isActive: true,
      rating: 4.5,
      reviewCount: 125
    });

    const pharmacy2 = await Pharmacy.create({
      name: 'HealthPlus Pharmacy',
      licenseNumber: 'PH-2024-002',
      email: 'info@healthplus.com',
      phone: '+251917654321',
      address: {
        street: '321 Wellness Road',
        city: 'Addis Ababa',
        state: 'Addis Ababa',
        zipCode: '1003',
        country: 'Ethiopia'
      },
      location: {
        type: 'Point',
        coordinates: [38.7577, 9.0354]
      },
      owner: pharmacyOwner._id,
      ownerName: 'John Pharmacy',
      description: 'Modern pharmacy with a wide range of medicines and healthcare services.',
      openingHours: {
        monday: { open: '07:00', close: '22:00', isClosed: false },
        tuesday: { open: '07:00', close: '22:00', isClosed: false },
        wednesday: { open: '07:00', close: '22:00', isClosed: false },
        thursday: { open: '07:00', close: '22:00', isClosed: false },
        friday: { open: '07:00', close: '22:00', isClosed: false },
        saturday: { open: '08:00', close: '22:00', isClosed: false },
        sunday: { open: '09:00', close: '20:00', isClosed: false }
      },
      isVerified: true,
      isActive: true,
      rating: 4.7,
      reviewCount: 89
    });

    // Link owner to pharmacy
    await User.findByIdAndUpdate(pharmacyOwner._id, {
      pharmacyId: pharmacy1._id
    });

    console.log('✅ Created pharmacies\n');

    // Create Categories
    console.log('📁 Creating categories...');
    const painRelief = await Category.create({
      name: 'Pain Relief',
      slug: 'pain-relief',
      description: 'Medications for pain management and relief',
      isActive: true,
      displayOrder: 1
    });

    const coldFlu = await Category.create({
      name: 'Cold & Flu',
      slug: 'cold-flu',
      description: 'Medications for cold and flu symptoms',
      isActive: true,
      displayOrder: 2
    });

    const vitamins = await Category.create({
      name: 'Vitamins & Supplements',
      slug: 'vitamins-supplements',
      description: 'Essential vitamins and dietary supplements',
      isActive: true,
      displayOrder: 3
    });

    console.log('✅ Created categories\n');

    // 4. Create Medicines
    console.log('💊 Creating medicines...');
    const medicines = await Medicine.create([
      {
        name: 'Paracetamol',
        brand: 'Tylenol',
        category: painRelief._id,
        description: 'Effective pain reliever and fever reducer',
        price: 50,
        quantity: 500,
        type: 'tablet',
        strength: '500',
        unit: 'mg',
        manufacturer: 'Johnson & Johnson',
        dosageForm: 'tablet',
        expiryDate: new Date('2026-12-31'),
        requiresPrescription: false,
        pharmacy: pharmacy1._id,
        usageInstructions: 'Take 1-2 tablets every 4-6 hours as needed. Do not exceed 8 tablets in 24 hours.',
        warnings: ['Do not use with other acetaminophen-containing products', 'Consult doctor if symptoms persist'],
        storageConditions: { temperature: 'Room Temperature' },
        isActive: true,
        rating: { average: 4.6, count: 234 },
        salesData: { totalSold: 1250 }
      },
      {
        name: 'Amoxicillin',
        brand: 'Amoxil',
        category: painRelief._id,
        description: 'Broad-spectrum antibiotic for bacterial infections',
        price: 120,
        quantity: 300,
        type: 'capsule',
        strength: '500',
        unit: 'mg',
        manufacturer: 'GlaxoSmithKline',
        dosageForm: 'capsule',
        expiryDate: new Date('2026-06-30'),
        requiresPrescription: true,
        pharmacy: pharmacy1._id,
        usageInstructions: 'Take as prescribed by your doctor. Complete the full course even if you feel better.',
        warnings: ['May cause allergic reactions', 'Inform doctor if you have penicillin allergy'],
        sideEffects: ['Nausea', 'Diarrhea', 'Skin rash'],
        storageConditions: { temperature: 'Room Temperature' },
        isActive: true,
        rating: { average: 4.5, count: 156 },
        salesData: { totalSold: 890 }
      },
      {
        name: 'Vitamin C',
        brand: 'Nature Made',
        category: vitamins._id,
        description: 'Essential vitamin for immune system support',
        price: 80,
        quantity: 600,
        type: 'tablet',
        strength: '1000',
        unit: 'mg',
        manufacturer: 'Nature Made',
        expiryDate: new Date('2027-03-31'),
        batchNumber: 'BATCH-2024-003',
        requiresPrescription: false,
        pharmacy: pharmacy2._id,
        usageInstructions: 'Take 1 tablet daily with food',
        warnings: ['High doses may cause stomach upset'],
        storageConditions: { temperature: 'Cool, dry place' },
        isActive: true,
        rating: { average: 4.8, count: 421 },
        salesData: { totalSold: 2100 }
      },
      {
        name: 'Ibuprofen',
        brand: 'Advil',
        category: painRelief._id,
        description: 'Anti-inflammatory pain reliever',
        price: 65,
        quantity: 450,
        type: 'tablet',
        strength: '200',
        unit: 'mg',
        manufacturer: 'Pfizer',
        dosageForm: 'tablet',
        expiryDate: new Date('2026-10-31'),
        requiresPrescription: false,
        pharmacy: pharmacy2._id,
        usageInstructions: 'Take 1-2 tablets every 4-6 hours as needed with food or milk',
        warnings: ['May increase risk of heart attack or stroke', 'Not for children under 12'],
        sideEffects: ['Stomach upset', 'Heartburn', 'Dizziness'],
        storageConditions: { temperature: 'Room Temperature' },
        isActive: true,
        rating: { average: 4.7, count: 312 },
        salesData: { totalSold: 1680 }
      },
      {
        name: 'Cough Syrup',
        brand: 'Robitussin',
        category: coldFlu._id,
        description: 'Cough suppressant for dry cough',
        price: 95,
        quantity: 200,
        type: 'liquid',
        strength: '10mg/5ml',
        unit: 'ml',
        manufacturer: 'Pfizer',
        expiryDate: new Date('2026-08-31'),
        batchNumber: 'BATCH-2024-005',
        requiresPrescription: false,
        pharmacy: pharmacy1._id,
        usageInstructions: 'Take 10ml every 4 hours as needed. Do not exceed 6 doses in 24 hours.',
        warnings: ['Do not use with other cough medicines', 'Not for children under 4'],
        storageConditions: { temperature: 'Room Temperature' },
        isActive: true,
        rating: { average: 4.4, count: 178 },
        salesData: { totalSold: 567 }
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
      }
    ]);
    console.log('✅ Created inventory stock\n');

    // 5. Create Sample Orders
    console.log('📦 Creating orders...');
    await Order.create({
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
        },
        {
          medicine: medicines[4]._id,
          name: 'Cough Syrup',
          price: 95,
          quantity: 1,
          subtotal: 95
        }
      ],
      totalAmount: 195,
      serviceFee: 20,
      tax: 9.75,
      discount: 0,
      finalAmount: 224.75,
      status: 'delivered',
      paymentStatus: 'paid',
      paymentMethod: 'card',
      paymentDetails: {
        transactionId: 'TXN-2024-001',
        paidAt: new Date('2024-11-10')
      },
      address: {
        street: '456 Customer Ave',
        city: 'Addis Ababa',
        state: 'Addis Ababa',
        zipCode: '1001',
        country: 'Ethiopia'
      },
      statusHistory: [
        { status: 'pending', timestamp: new Date('2024-11-10T08:00:00'), note: 'Order placed' },
        { status: 'confirmed', timestamp: new Date('2024-11-10T08:15:00'), note: 'Order confirmed by pharmacy' },
        { status: 'preparing', timestamp: new Date('2024-11-10T08:30:00'), note: 'Preparing order' },
        { status: 'in_transit', timestamp: new Date('2024-11-10T10:00:00'), note: 'In transit' },
        { status: 'delivered', timestamp: new Date('2024-11-10T11:30:00'), note: 'Delivered successfully' }
      ],
      estimatedArrivalTime: new Date('2024-11-10T12:00:00'),
      actualArrivalTime: new Date('2024-11-10T11:30:00'),
      rating: 5,
      review: 'Great service, fast delivery!'
    });

    console.log(`✅ Created orders\n`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: 6 (1 admin, 1 pharmacy owner, 1 customer, 1 driver, 1 staff, 1 cashier)`);
    console.log(`   - Pharmacies: 2`);
    console.log(`   - Categories: 3`);
    console.log(`   - Medicines: 5`);
    console.log(`   - Orders: 1`);
    console.log('\n✅ You can now view the schema in MongoDB Compass!');
    console.log(`   Database: medilink`);
    console.log(`   Connection: ${MONGO_URI}\n`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    if (error.name === 'MongooseServerSelectionError') {
      console.error('🔴 Could not connect to MongoDB. Please ensure the MongoDB service is running.');
      console.error('   On Windows, you can try starting it via Services panel or running "net start MongoDB" in Admin CMD.');
    }
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
};

seedData();
