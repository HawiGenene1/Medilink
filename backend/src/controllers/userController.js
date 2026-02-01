const User = require('../models/User');

// @desc    Upload profile image
// @route   POST /api/users/profile-image
// @access  Private
exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Construct the file URL (assuming local storage in 'uploads' directory)
        // In production, this would be an S3 URL or similar
        const imageUrl = `/uploads/${req.file.filename}`;

        // Update user avatar
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { avatar: imageUrl },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Profile image uploaded successfully',
            avatar: user.avatar,
            user: user
        });
    } catch (error) {
        console.error('Error uploading profile image:', error);
        res.status(500).json({ message: 'Server error uploading image' });
    }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Use toJSON() to ensure all fields are included (including isTwoFactorEnabled, recoveryEmail, etc.)
        const userJSON = user.toJSON();
        res.json({ success: true, user: userJSON });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        user.phone = req.body.phone || user.phone;

        // Handle Addresses
        if (req.body.addresses) {
            user.addresses = req.body.addresses;
        }

        // Handle Security Updates
        if (req.body.recoveryEmail) user.recoveryEmail = req.body.recoveryEmail;
        if (req.body.recoveryPhone) user.recoveryPhone = req.body.recoveryPhone;
        if (typeof req.body.isTwoFactorEnabled !== 'undefined') {
            user.isTwoFactorEnabled = req.body.isTwoFactorEnabled;
        }

        // Handle Password Change
        if (req.body.password) {
            if (!req.body.currentPassword) {
                return res.status(400).json({ message: 'Current password is required to set a new one' });
            }
            const isMatch = await user.comparePassword(req.body.currentPassword);
            if (!isMatch) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }
            user.password = req.body.password;
            user.passwordChangedAt = Date.now() - 1000;
        }

        const updatedUser = await user.save();

        // Remove sensitive data from response
        updatedUser.password = undefined;
        updatedUser.twoFactorCode = undefined;

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};

// @desc    Delete user account
// @route   DELETE /api/users/profile
// @access  Private
exports.deleteUserProfile = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user.userId);

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Server error deleting account' });
    }
};
