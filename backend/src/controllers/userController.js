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
            req.user.id,
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
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
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
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        user.phone = req.body.phone || user.phone;
        // user.email = req.body.email || user.email; // Usually separate flow for email change

        if (req.body.address) {
            user.address = { ...user.address, ...req.body.address };
        }

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        // Remove password from response
        updatedUser.password = undefined;

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};

// @desc    Update user settings (preferences)
// @route   PATCH /api/users/settings
// @access  Private
exports.updateUserSettings = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.body.notificationPreferences) {
            user.notificationPreferences = {
                ...user.notificationPreferences.toObject(),
                ...req.body.notificationPreferences
            };
        }

        if (req.body.privacySettings) {
            user.privacySettings = {
                ...user.privacySettings.toObject(),
                ...req.body.privacySettings
            };
        }

        if (req.body.appPreferences) {
            user.appPreferences = {
                ...user.appPreferences.toObject(),
                ...req.body.appPreferences
            };
        }

        const updatedUser = await user.save();
        updatedUser.password = undefined;

        res.json({
            message: 'Settings updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Server error updating settings' });
    }
};

// @desc    Delete user account
// @route   DELETE /api/users/profile
// @access  Private
exports.deleteUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Potential addition: delete associated favorites, orders, etc.
        await User.findByIdAndDelete(req.user.id);

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Server error deleting account' });
    }
};
