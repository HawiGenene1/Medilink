require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Role = require('./src/models/Role');

const createSingleUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink');
        console.log('Connected to DB');

        // Create Customer Role if not exists
        let role = await Role.findOne({ name: 'customer' });
        if (!role) {
            console.log('Creating customer role...');
            role = await Role.create({ name: 'customer', permissions: ['view_medicines', 'create_orders'] });
        }

        // Create User
        console.log('Creating user...');
        const user = await User.create({
            firstName: 'Jane',
            lastName: 'Customer',
            email: 'customer@medilink.com',
            password: 'Test123',
            username: 'customer',
            phone: '+251933333333',
            role: role._id,
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

        console.log('User created:', user.email);

    } catch (e) {
        console.error('ERROR CREATING USER:', e);
        const fs = require('fs');
        fs.writeFileSync('user_creation_error.log', e.toString() + '\\n' + e.stack);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

createSingleUser();
