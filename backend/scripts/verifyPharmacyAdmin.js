const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');
const fs = require('fs');
require('dotenv').config();

async function verifyUser() {
    const output = [];
    const log = (msg) => {
        console.log(msg);
        output.push(msg);
    };

    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/medilink';
        log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        log('Connected to MongoDB\n');

        const email = 'pharmacyadmin@medilink.com';
        const testPassword = 'Admin@123456';

        // Find the user with password field
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            log('ERROR: User not found with email: ' + email);
            await mongoose.connection.close();
            fs.writeFileSync('verification-result.txt', output.join('\n'));
            process.exit(1);
        }

        log('USER DATABASE RECORD:');
        log('ID: ' + user._id);
        log('Name: ' + user.firstName + ' ' + user.lastName);
        log('Email: ' + user.email);
        log('Role: ' + user.role);
        log('Status: ' + user.status);
        log('Email Verified: ' + user.isEmailVerified);
        log('Is Active: ' + user.isActive);
        log('PharmacyId: ' + (user.pharmacyId || 'null'));
        log('');

        // Test password validation
        log('Testing password "Admin@123456"...');
        const isMatch = await bcrypt.compare(testPassword, user.password);
        log('Password match result: ' + (isMatch ? 'MATCH' : 'NO MATCH'));

        if (!isMatch) {
            log('');
            log('WARNING: Password does not match!');
            log('The password in database is different from "Admin@123456"');
        } else {
            log('');
            log('SUCCESS: Password is correct!');

            // Check if user can log in based on status
            if (user.status !== 'active' && !(user.status === 'pending' && user.role === 'pharmacy_admin')) {
                log('');
                log('ERROR: LOGIN BLOCKED - User status is not active');
                log('Status: ' + user.status);
            } else {
                log('');
                log('SUCCESS: User should be able to log in!');
            }
        }

        await mongoose.connection.close();
        log('');
        log('Database connection closed');

        // Write to file
        fs.writeFileSync('./verification-result.txt', output.join('\n'));
        log('Results written to verification-result.txt');

        process.exit(0);
    } catch (error) {
        log('');
        log('ERROR: ' + error.message);
        fs.writeFileSync('./verification-result.txt', output.join('\n'));
        await mongoose.connection.close();
        process.exit(1);
    }
}

verifyUser();
