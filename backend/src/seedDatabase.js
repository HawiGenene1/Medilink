require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./models/User');
const Pharmacy = require('./models/Pharmacy');
const Category = require('./models/Category');
const Medicine = require('./models/Medicine');
const Order = require('./models/Order');
const Role = require('./models/Role');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink';

// Sample data
const seedData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Pharmacy.deleteMany({});
    await Category.deleteMany({});
    await Medicine.deleteMany({});
    await Order.deleteMany({});
    await Role.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Create Roles
    console.log('🏷️ Creating roles...');
    await Role.create({ name: 'admin', permissions: ['all'] });
    await Role.create({ name: 'customer', permissions: ['view_medicines', 'create_orders'] });
    await Role.create({ name: 'pharmacy_staff', permissions: ['manage_medicines', 'view_orders'] });
    await Role.create({ name: 'pharmacy_admin', permissions: ['manage_pharmacy', 'view_orders', 'manage_staff'] });
    await Role.create({ name: 'delivery', permissions: ['view_deliveries', 'update_delivery_status'] });
    await Role.create({ name: 'cashier', permissions: ['view_orders', 'verify_payments', 'process_refunds', 'generate_invoices'] });
    console.log('✅ Roles created\n');

    // Create Users
    console.log('👥 Creating users...');

    // Create pharmacy owner first
    const pharmacyOwner = await User.create({
      firstName: 'John',
      lastName: 'Pharmacy',
      email: 'pharmacy@medilink.com',
      password: 'Test123',
      username: 'pharmacy_owner',
      phone: '+251922222222',
      role: 'customer',
      isActive: true,
      status: 'active',
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
      password: 'Test123',
      username: 'customer',
      phone: '+251933333333',
      role: 'customer',
      isActive: true,
      status: 'active',
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
      password: 'Test123',
      username: 'delivery',
      phone: '+251944444444',
      role: 'delivery',
      isActive: true,
      status: 'active',
      vehicleInfo: {
        type: 'motorcycle',
        licensePlate: 'AA-123-456'
      }
    });

    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@medilink.com',
      password: 'Admin123',
      username: 'admin',
      role: 'admin',
      phone: '+251911111111',
      isActive: true,
      status: 'active',
      isEmailVerified: true
    });

    console.log(`✅ Created Base Users\n`);

    // Create Pharmacy
    console.log('🏥 Creating pharmacies...');
    const pharmacy1 = await Pharmacy.create({
      name: 'MediCare Pharmacy',
      ownerName: 'John Pharmacy',
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
      description: 'Your trusted neighborhood pharmacy.',
      isVerified: true,
      isActive: true,
      rating: 4.5
    });

    const pharmacy2 = await Pharmacy.create({
      name: 'HealthPlus Pharmacy',
      ownerName: 'John Pharmacy',
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
      description: 'Modern pharmacy.',
      isVerified: true,
      isActive: true,
      rating: 4.7
    });

    console.log(`✅ Created Pharmacies\n`);

    // Create Cashier
    const cashier = await User.create({
      firstName: 'Cashier',
      lastName: 'User',
      email: 'cashier@medilink.com',
      password: 'Cashier123',
      username: 'cashier',
      phone: '+251955555555',
      role: 'cashier',
      pharmacyId: pharmacy1._id,
      isActive: true,
      status: 'active',
      isEmailVerified: true
    });
    console.log('✅ Created Cashier\n');

    await User.findByIdAndUpdate(pharmacyOwner._id, {
      pharmacyId: pharmacy1._id,
      role: 'pharmacy_admin'
    });

    // Create Categories
    console.log('📁 Creating categories...');
    const painRelief = await Category.create({
      name: 'Pain Relief',
      slug: 'pain-relief',
      description: 'Pain management',
      isActive: true,
      displayOrder: 1
    });

    const antibiotics = await Category.create({
      name: 'Antibiotics',
      slug: 'antibiotics',
      description: 'Antibiotics',
      isActive: true,
      displayOrder: 2
    });

    await Category.create({ name: 'Vitamins', slug: 'vitamins', isActive: true });
    await Category.create({ name: 'Cold and Flu', slug: 'cold-flu', isActive: true });

    console.log(`✅ Created Categories\n`);

    // Create Medicines
    console.log('💊 Creating medicines...');
    let medicines;
    try {
      medicines = await Medicine.create([
        {
          name: 'Paracetamol',
          brand: 'Tylenol',
          genericName: 'Acetaminophen',
          category: 'otc',
          therapeuticClass: 'Pain Relief',
          description: 'Effective pain reliever',
          price: {
            basePrice: 50,
            currency: 'ETB'
          },
          stockQuantity: 500,
          unit: 'tablet',
          dosageForm: 'tablet',
          strength: '500mg',
          packSize: '10x10',
          manufacturer: 'Johnson & Johnson',
          expiryDate: new Date('2026-12-31'),
          requiresPrescription: false,
          availableAt: [pharmacy1._id],
          addedBy: pharmacyOwner._id,
          usageInstructions: 'Take 1-2 tablets every 4-6 hours.',
          isActive: true,
          location: {
            type: 'Point',
            coordinates: [38.74, 9.03]
          }
        },
        {
          name: 'Amoxicillin',
          brand: 'Amoxil',
          genericName: 'Amoxicillin',
          category: 'prescription',
          therapeuticClass: 'Antibiotics',
          description: 'Broad-spectrum antibiotic',
          price: { basePrice: 120, currency: 'ETB' },
          stockQuantity: 300,
          unit: 'capsule',
          dosageForm: 'capsule',
          strength: '500mg',
          packSize: '10x10',
          manufacturer: 'GlaxoSmithKline',
          expiryDate: new Date('2026-06-30'),
          requiresPrescription: true,
          availableAt: [pharmacy1._id],
          addedBy: pharmacyOwner._id,
          isActive: true,
          location: { type: 'Point', coordinates: [38.74, 9.03] }
        }
      ]);
    } catch (err) {
      console.error('MEDICINE ERROR:', err.message);
      if (err.errors) {
        Object.keys(err.errors).forEach(key => {
          console.error(`Field [${key}]: ${err.errors[key].message}`);
        });
      }
      throw err;
    }

    console.log(`✅ Created ${medicines.length} medicines\n`);
    // Create Sample Orders
    console.log('📦 Creating orders...');
    await Order.create({
      orderNumber: `ORD-${Date.now()}-0001`,
      customer: customer._id,
      pharmacy: pharmacy1._id,
      items: [
        {
          medicine: medicines[0]._id,
          name: medicines[0].name,
          price: medicines[0].price.basePrice,
          quantity: 2,
          subtotal: medicines[0].price.basePrice * 2
        }
      ],
      totalAmount: medicines[0].price.basePrice * 2,
      deliveryFee: 20,
      tax: 5,
      finalAmount: (medicines[0].price.basePrice * 2) + 25,
      status: 'delivered',
      paymentStatus: 'paid',
      paymentMethod: 'cash',
      deliveryAddress: customer.address
    });

    await Order.create({
      orderNumber: `ORD-${Date.now()}-0002`,
      customer: customer._id,
      pharmacy: pharmacy1._id,
      items: [
        {
          medicine: medicines[1]._id,
          name: medicines[1].name,
          price: medicines[1].price.basePrice,
          quantity: 1,
          subtotal: medicines[1].price.basePrice
        }
      ],
      totalAmount: medicines[1].price.basePrice,
      deliveryFee: 20,
      tax: 10,
      finalAmount: medicines[1].price.basePrice + 30,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'card',
      deliveryAddress: customer.address
    });
    console.log('✅ Created 2 sample orders\n');
    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

seedData();
