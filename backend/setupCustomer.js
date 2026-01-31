require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

const createCustomer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink');
        console.log('✅ Connected to MongoDB');

        const email = 'customer@medilink.com';
        let user = await User.findOne({ email });

        // Hash the password
        const hashedPassword = await bcrypt.hash('Password123', 10);

        if (user) {
            console.log('⚠️  User already exists. Updating password...');
            user.password = hashedPassword;
            user.role = 'customer';
            user.isActive = true;
            user.isEmailVerified = true;
            await user.save();
            console.log('✅ Password updated successfully!');
        } else {
            console.log('Creating new customer user...');
            user = await User.create({
                firstName: 'Jane',
                lastName: 'Customer',
                email: email,
                password: hashedPassword,
                phone: '+251933333333',
                role: 'customer',
                isActive: true,
                isEmailVerified: true,
                address: {
                    street: '456 Customer Ave',
                    city: 'Addis Ababa',
                    state: 'Addis Ababa',
                    zipCode: '1001',
                    country: 'Ethiopia'
                }
            });
            console.log('✅ Customer account created successfully!');
        }

        console.log('\n📋 Login Credentials:');
        console.log('   Email: customer@medilink.com');
        console.log('   Password: Password123');
        console.log('   Role: customer');

        // Verify the password works
        const isMatch = await bcrypt.compare('Password123', user.password);
        console.log('\n🔐 Password verification test:', isMatch ? '✅ PASSED' : '❌ FAILED');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

createCustomer();
