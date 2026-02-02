require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User'); // Adjust path as needed

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'cashier@medilink.com';
        const newPassword = 'Cashier123';

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            console.log(`Found user: ${user.email}`);
            // ASSIGN PLAIN TEXT PASSWORD - Let the model's pre-save hook handle hashing!
            user.password = newPassword;
            await user.save();
            console.log(`Password for ${email} has been reset correctly (plain text assignment + pre-save hook).`);
        } else {
            console.log(`User ${email} not found. Creating new cashier...`);
            // For new user, we also assign plain text if we use .save()
            user = new User({
                firstName: 'Demo',
                lastName: 'Cashier',
                email: email,
                password: newPassword, // Plain text
                role: 'cashier',
                phoneNumber: '0911223344',
                isVerified: true,
                status: 'active' // Ensure active status
            });
            await user.save();
            console.log(`Created new cashier: ${email}`);
        }

    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
};

resetPassword();
