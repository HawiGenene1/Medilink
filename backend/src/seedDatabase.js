require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./models/User');
const Pharmacy = require('./models/Pharmacy');
const Category = require('./models/Category');
const Medicine = require('./models/Medicine');
const Order = require('./models/Order');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink';

// Sample data
const seedData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Pharmacy.deleteMany({});
    await Category.deleteMany({});
    await Medicine.deleteMany({});
    await Order.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Create Users
    console.log('👥 Creating users...');
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

    // Create pharmacy owner as customer first (will update role after pharmacy is created)
    const pharmacyOwner = await User.create({
      firstName: 'John',
      lastName: 'Pharmacy',
      email: 'pharmacy@medilink.com',
      password: userPassword,
      phone: '+251922222222',
      role: 'customer', // Temporary role, will update after pharmacy is created
      isActive: true,
      address: {
        street: '123 Main St',
        city: 'Addis Ababa',
        state: 'Addis Ababa',
        zipCode: '1000',
        country: 'Ethiopia'
      }
    });

    const customer = await User.create({
      firstName: 'Jane',
      lastName: 'Customer',
      email: 'customer@medilink.com',
      password: userPassword,
      phone: '+251933333333',
      role: 'customer',
      isActive: true,
      address: {
        street: '456 Customer Ave',
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

    console.log(`✅ Created ${4} users\n`);

    // Create Pharmacy
    console.log('🏥 Creating pharmacies...');
    const pharmacy1 = await Pharmacy.create({
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
        coordinates: [38.7469, 9.0320] // [longitude, latitude] for Addis Ababa
      },
      owner: pharmacyOwner._id,
      description: 'Your trusted neighborhood pharmacy providing quality medicines and healthcare products.',
      openingHours: {
        monday: { open: '08:00', close: '20:00', isClosed: false },
        tuesday: { open: '08:00', close: '20:00', isClosed: false },
        wednesday: { open: '08:00', close: '20:00', isClosed: false },
        thursday: { open: '08:00', close: '20:00', isClosed: false },
        friday: { open: '08:00', close: '20:00', isClosed: false },
        saturday: { open: '09:00', close: '18:00', isClosed: false },
        sunday: { open: '10:00', close: '16:00', isClosed: false }
      },
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

    console.log(`✅ Created ${2} pharmacies\n`);

    // Update pharmacy owner with pharmacyId and role
    await User.findByIdAndUpdate(pharmacyOwner._id, { 
      pharmacyId: pharmacy1._id,
      role: 'pharmacy_admin'
    });

    // Create Categories
    console.log('📁 Creating categories...');
    const painRelief = await Category.create({
      name: 'Pain Relief',
      slug: 'pain-relief',
      description: 'Medications for pain management and relief',
      isActive: true,
      displayOrder: 1
    });

    const antibiotics = await Category.create({
      name: 'Antibiotics',
      slug: 'antibiotics',
      description: 'Antibiotic medications for bacterial infections',
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

    const coldFlu = await Category.create({
      name: 'Cold & Flu',
      slug: 'cold-flu',
      description: 'Medications for cold and flu symptoms',
      isActive: true,
      displayOrder: 4
    });

    console.log(`✅ Created ${4} categories\n`);

    // Create Medicines
    console.log('💊 Creating medicines...');
    const medicines = await Medicine.create([
      {
        name: 'Paracetamol',
        brand: 'Tylenol',
        genericName: 'Acetaminophen',
        category: painRelief._id,
        description: 'Effective pain reliever and fever reducer',
        price: 50,
        quantity: 500,
        unit: 'tablet',
        dosage: '500mg',
        manufacturer: 'Johnson & Johnson',
        expiryDate: new Date('2026-12-31'),
        manufactureDate: new Date('2024-01-15'),
        batchNumber: 'BATCH-2024-001',
        requiresPrescription: false,
        pharmacyId: pharmacy1._id,
        usageInstructions: 'Take 1-2 tablets every 4-6 hours as needed. Do not exceed 8 tablets in 24 hours.',
        warnings: ['Do not use with other acetaminophen-containing products', 'Consult doctor if symptoms persist'],
        storage: 'Store at room temperature away from moisture and heat',
        isActive: true,
        rating: 4.6,
        reviewCount: 234,
        soldCount: 1250
      },
      {
        name: 'Amoxicillin',
        brand: 'Amoxil',
        genericName: 'Amoxicillin',
        category: antibiotics._id,
        description: 'Broad-spectrum antibiotic for bacterial infections',
        price: 120,
        quantity: 300,
        unit: 'capsule',
        dosage: '500mg',
        manufacturer: 'GlaxoSmithKline',
        expiryDate: new Date('2026-06-30'),
        manufactureDate: new Date('2024-02-01'),
        batchNumber: 'BATCH-2024-002',
        requiresPrescription: true,
        pharmacyId: pharmacy1._id,
        usageInstructions: 'Take as prescribed by your doctor. Complete the full course even if you feel better.',
        warnings: ['May cause allergic reactions', 'Inform doctor if you have penicillin allergy'],
        sideEffects: ['Nausea', 'Diarrhea', 'Skin rash'],
        storage: 'Store at room temperature, away from light and moisture',
        isActive: true,
        rating: 4.5,
        reviewCount: 156,
        soldCount: 890
      },
      {
        name: 'Vitamin C',
        brand: 'Nature Made',
        genericName: 'Ascorbic Acid',
        category: vitamins._id,
        description: 'Essential vitamin for immune system support',
        price: 80,
        quantity: 600,
        unit: 'tablet',
        dosage: '1000mg',
        manufacturer: 'Nature Made',
        expiryDate: new Date('2027-03-31'),
        manufactureDate: new Date('2024-03-15'),
        batchNumber: 'BATCH-2024-003',
        requiresPrescription: false,
        pharmacyId: pharmacy2._id,
        usageInstructions: 'Take 1 tablet daily with food',
        warnings: ['High doses may cause stomach upset'],
        storage: 'Store in a cool, dry place',
        isActive: true,
        rating: 4.8,
        reviewCount: 421,
        soldCount: 2100
      },
      {
        name: 'Ibuprofen',
        brand: 'Advil',
        genericName: 'Ibuprofen',
        category: painRelief._id,
        description: 'Anti-inflammatory pain reliever',
        price: 65,
        quantity: 450,
        unit: 'tablet',
        dosage: '200mg',
        manufacturer: 'Pfizer',
        expiryDate: new Date('2026-09-30'),
        manufactureDate: new Date('2024-01-20'),
        batchNumber: 'BATCH-2024-004',
        requiresPrescription: false,
        pharmacyId: pharmacy2._id,
        usageInstructions: 'Take 1-2 tablets every 4-6 hours as needed with food or milk',
        warnings: ['May increase risk of heart attack or stroke', 'Not for children under 12'],
        sideEffects: ['Stomach upset', 'Heartburn', 'Dizziness'],
        storage: 'Store at room temperature',
        isActive: true,
        rating: 4.7,
        reviewCount: 312,
        soldCount: 1680
      },
      {
        name: 'Cough Syrup',
        brand: 'Robitussin',
        genericName: 'Dextromethorphan',
        category: coldFlu._id,
        description: 'Cough suppressant for dry cough',
        price: 95,
        quantity: 200,
        unit: 'bottle',
        dosage: '10mg/5ml',
        manufacturer: 'Pfizer',
        expiryDate: new Date('2026-08-31'),
        manufactureDate: new Date('2024-02-10'),
        batchNumber: 'BATCH-2024-005',
        requiresPrescription: false,
        pharmacyId: pharmacy1._id,
        usageInstructions: 'Take 10ml every 4 hours as needed. Do not exceed 6 doses in 24 hours.',
        warnings: ['Do not use with other cough medicines', 'Not for children under 4'],
        storage: 'Store at room temperature, do not refrigerate',
        isActive: true,
        rating: 4.4,
        reviewCount: 178,
        soldCount: 567
      }
    ]);

    console.log(`✅ Created ${medicines.length} medicines\n`);

    // Create Sample Orders
    console.log('📦 Creating orders...');
    const order1 = await Order.create({
      orderNumber: `ORD-${Date.now()}-00001`,
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
      deliveryFee: 20,
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
      deliveryAddress: {
        street: '456 Customer Ave',
        city: 'Addis Ababa',
        state: 'Addis Ababa',
        zipCode: '1001',
        country: 'Ethiopia'
      },
      deliveryPerson: deliveryPerson._id,
      statusHistory: [
        { status: 'pending', timestamp: new Date('2024-11-10T08:00:00'), note: 'Order placed' },
        { status: 'confirmed', timestamp: new Date('2024-11-10T08:15:00'), note: 'Order confirmed by pharmacy' },
        { status: 'preparing', timestamp: new Date('2024-11-10T08:30:00'), note: 'Preparing order' },
        { status: 'out_for_delivery', timestamp: new Date('2024-11-10T10:00:00'), note: 'Out for delivery' },
        { status: 'delivered', timestamp: new Date('2024-11-10T11:30:00'), note: 'Delivered successfully' }
      ],
      estimatedDeliveryTime: new Date('2024-11-10T12:00:00'),
      actualDeliveryTime: new Date('2024-11-10T11:30:00'),
      rating: 5,
      review: 'Great service, fast delivery!'
    });

    const order2 = await Order.create({
      orderNumber: `ORD-${Date.now()}-00002`,
      customer: customer._id,
      pharmacy: pharmacy2._id,
      items: [
        {
          medicine: medicines[2]._id,
          name: 'Vitamin C',
          price: 80,
          quantity: 3,
          subtotal: 240
        }
      ],
      totalAmount: 240,
      deliveryFee: 20,
      tax: 12,
      discount: 25,
      finalAmount: 247,
      status: 'out_for_delivery',
      paymentStatus: 'paid',
      paymentMethod: 'mobile_money',
      paymentDetails: {
        transactionId: 'TXN-2024-002',
        paidAt: new Date()
      },
      deliveryAddress: {
        street: '456 Customer Ave',
        city: 'Addis Ababa',
        state: 'Addis Ababa',
        zipCode: '1001',
        country: 'Ethiopia'
      },
      deliveryPerson: deliveryPerson._id,
      statusHistory: [
        { status: 'pending', timestamp: new Date(), note: 'Order placed' },
        { status: 'confirmed', timestamp: new Date(), note: 'Order confirmed' },
        { status: 'out_for_delivery', timestamp: new Date(), note: 'Out for delivery' }
      ],
      estimatedDeliveryTime: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
    });

    console.log(`✅ Created ${2} orders\n`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: 4 (1 admin, 1 pharmacy owner, 1 customer, 1 delivery)`);
    console.log(`   - Pharmacies: 2`);
    console.log(`   - Categories: 4`);
    console.log(`   - Medicines: 5`);
    console.log(`   - Orders: 2`);
    console.log('\n✅ You can now view the schema in MongoDB Compass!');
    console.log(`   Database: medilink`);
    console.log(`   Connection: ${MONGO_URI}\n`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
};

// Run the seed function
seedData();
