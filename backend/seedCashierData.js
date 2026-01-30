/**
 * Seed Test Data for Cashier Dashboard
 * Run this script to create sample orders, payments, and transactions for testing
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Import models
const Order = require('./src/models/Order');
const Payment = require('./src/models/Payment');
const User = require('./src/models/User');
const Pharmacy = require('./src/models/Pharmacy');

async function seedCashierTestData() {
    try {
        console.log('🌱 Starting to seed cashier test data...\n');

        // Clear existing test data
        await User.deleteMany({ email: { $in: ['owner@test.com', 'customer@test.com', 'cashier@test.com'] } });
        await Pharmacy.deleteMany({ name: 'Test Pharmacy' });
        await Order.deleteMany({ orderNumber: { $regex: /^TEST-/ } });
        await Payment.deleteMany({ transactionId: { $regex: /^TEST-/ } });
        console.log('🗑️  Cleared old test data\n');

        // Create test owner if not exists
        let owner = await User.findOne({ email: 'owner@test.com' });
        if (!owner) {
            owner = await User.create({
                firstName: 'Pharmacy',
                lastName: 'Owner',
                email: 'owner@test.com',
                password: 'password123',
                phone: '0911000000',
                role: 'pharmacy_admin',
                isActive: true,
                status: 'active'
            });
            console.log('✅ Created test owner');
        }

        // Create test pharmacy
        let pharmacy = await Pharmacy.findOne({ name: 'Test Pharmacy' });
        if (!pharmacy) {
            pharmacy = await Pharmacy.create({
                name: 'Test Pharmacy',
                ownerName: 'Pharmacy Owner',
                licenseNumber: 'PH-2026-001',
                email: 'pharmacy@test.com',
                phone: '0911223344',
                address: {
                    street: 'Bole Road',
                    city: 'Addis Ababa',
                    state: 'Addis Ababa',
                    zipCode: '1000',
                    country: 'Ethiopia'
                },
                location: {
                    type: 'Point',
                    coordinates: [38.7578, 8.9806] // Addis Ababa [long, lat]
                },
                owner: owner._id,
                status: 'approved',
                isActive: true,
                isVerified: true
            });
            console.log('✅ Created test pharmacy');
        } else {
            console.log('✓ Test pharmacy already exists');
        }

        // Create test customer
        let customer = await User.findOne({ email: 'customer@test.com' });
        if (!customer) {
            customer = await User.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'customer@test.com',
                password: 'password123',
                phone: '0912345678',
                role: 'customer',
                isActive: true,
                status: 'active',
                isEmailVerified: true
            });
            console.log('✅ Created test customer');
        } else {
            console.log('✓ Test customer already exists');
        }

        // Create test cashier
        let cashier = await User.findOne({ email: 'cashier@test.com' });
        if (!cashier) {
            cashier = await User.create({
                firstName: 'Test',
                lastName: 'Cashier',
                email: 'cashier@test.com',
                password: 'password123',
                phone: '0923456789',
                role: 'cashier',
                pharmacyId: pharmacy._id,
                isActive: true,
                status: 'active',
                isEmailVerified: true
            });
            console.log('✅ Created test cashier');
        } else {
            console.log('✓ Test cashier already exists');
        }


        // Create test orders with different statuses
        const testOrders = [
            {
                orderNumber: 'TEST-ORD-001',
                customer: customer._id,
                pharmacy: pharmacy._id,
                items: [
                    {
                        medicine: new mongoose.Types.ObjectId().toString(),
                        name: 'Paracetamol 500mg',
                        quantity: 2,
                        price: 50,
                        subtotal: 100
                    },
                    {
                        medicine: new mongoose.Types.ObjectId().toString(),
                        name: 'Ibuprofen 400mg',
                        quantity: 1,
                        price: 80,
                        subtotal: 80
                    }
                ],
                totalAmount: 180,
                finalAmount: 180,
                status: 'confirmed',
                paymentStatus: 'pending',
                paymentMethod: 'card',
                deliveryAddress: {
                    street: 'Bole, Addis Ababa',
                    city: 'Addis Ababa'
                },
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
            },
            {
                orderNumber: 'TEST-ORD-002',
                customer: customer._id,
                pharmacy: pharmacy._id,
                items: [
                    {
                        medicine: new mongoose.Types.ObjectId().toString(),
                        name: 'Amoxicillin 500mg',
                        quantity: 3,
                        price: 150,
                        subtotal: 450
                    }
                ],
                totalAmount: 450,
                finalAmount: 450,
                status: 'confirmed',
                paymentStatus: 'pending',
                paymentMethod: 'cash',
                deliveryAddress: {
                    street: 'Kazanchis, Addis Ababa',
                    city: 'Addis Ababa'
                },
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
            },
            {
                orderNumber: 'TEST-ORD-003',
                customer: customer._id,
                pharmacy: pharmacy._id,
                items: [
                    {
                        medicine: new mongoose.Types.ObjectId().toString(),
                        name: 'Vitamin C 1000mg',
                        quantity: 1,
                        price: 200,
                        subtotal: 200
                    }
                ],
                totalAmount: 200,
                finalAmount: 200,
                status: 'confirmed',
                paymentStatus: 'pending',
                paymentMethod: 'mobile_money',
                deliveryAddress: {
                    street: 'Merkato, Addis Ababa',
                    city: 'Addis Ababa'
                },
                createdAt: new Date()
            }
        ];

        const createdOrders = await Order.insertMany(testOrders);
        console.log(`✅ Created ${createdOrders.length} test orders (approved, awaiting payment)\n`);

        // Create some completed payment records for dashboard stats
        const completedPayments = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 5; i++) {
            const order = await Order.create({
                orderNumber: `TEST-PAID-${String(i + 1).padStart(3, '0')}`,
                customer: customer._id,
                pharmacy: pharmacy._id,
                items: [{
                    medicine: new mongoose.Types.ObjectId().toString(),
                    name: `Medicine ${i + 1}`,
                    quantity: 1,
                    price: 100 + (i * 50),
                    subtotal: 100 + (i * 50)
                }],
                totalAmount: 100 + (i * 50),
                finalAmount: 100 + (i * 50),
                status: 'preparing',
                paymentStatus: 'paid',
                paymentMethod: 'card',
                deliveryAddress: {
                    street: `Street ${i + 1}`,
                    city: 'Addis Ababa'
                }
            });

            const payment = await Payment.create({
                order: order._id,
                transactionId: `TEST-TXN-${Date.now()}-${i}`,
                amount: order.finalAmount,
                paymentMethod: i % 2 === 0 ? 'card' : 'cash',
                paymentStatus: 'completed',
                customer: customer._id,
                pharmacy: pharmacy._id,
                paidAt: new Date(today.getTime() + (i * 60 * 60 * 1000)), // Spread throughout today
                confirmedBy: cashier._id,
                confirmedAt: new Date(today.getTime() + (i * 60 * 60 * 1000)),
                paymentHistory: [{
                    status: 'pending',
                    timestamp: new Date(today.getTime() + (i * 60 * 60 * 1000) - 10000),
                    notes: 'Payment initialized'
                }, {
                    status: 'completed',
                    timestamp: new Date(today.getTime() + (i * 60 * 60 * 1000)),
                    notes: 'Payment completed',
                    updatedBy: cashier._id
                }]
            });

            order.payment = payment._id;
            await order.save();

            completedPayments.push(payment);
        }

        console.log(`✅ Created ${completedPayments.length} completed payments for dashboard stats\n`);

        // Create some failed payments
        const failedPayment = await Payment.create({
            order: createdOrders[0]._id,
            transactionId: `TEST-FAILED-${Date.now()}`,
            amount: createdOrders[0].finalAmount,
            paymentMethod: 'card',
            paymentStatus: 'failed',
            customer: customer._id,
            pharmacy: pharmacy._id,
            failureReason: 'Insufficient funds',
            createdAt: new Date(today.getTime() - 60 * 60 * 1000),
            paymentHistory: [{
                status: 'failed',
                timestamp: new Date(today.getTime() - 60 * 60 * 1000),
                notes: 'Payment failed: Insufficient funds'
            }]
        });

        console.log('✅ Created 1 failed payment\n');

        // Summary
        console.log('📊 Summary of Test Data Created:');
        console.log('================================');
        console.log(`✓ Pharmacy: ${pharmacy.name}`);
        console.log(`✓ Customer: ${customer.email}`);
        console.log(`✓ Cashier: ${cashier.email}`);
        console.log(`✓ Approved Orders (awaiting payment): ${createdOrders.length}`);
        console.log(`✓ Completed Payments (today): ${completedPayments.length}`);
        console.log(`✓ Failed Payments: 1`);
        console.log('\n🎉 Test data seeded successfully!\n');

        console.log('📝 You can now:');
        console.log('1. Login as cashier at http://localhost:3000/auth/login');
        console.log('   Email: cashier@test.com');
        console.log('   Password: password123');
        console.log('2. View approved orders awaiting payment');
        console.log('3. See dashboard statistics');
        console.log('4. Test payment verification');
        console.log('\nOr access directly: http://localhost:3000/cashier\n');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
    } finally {
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);
    }
}

// Run the seeder
seedCashierTestData();
