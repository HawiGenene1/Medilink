const Announcement = require('../models/Announcement');

// @desc    Get all announcements
// @route   GET /api/admin/announcements
// @access  Private/Admin
const getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('author', 'firstName lastName email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new announcement
// @route   POST /api/admin/announcements
// @access  Private/Admin
const createAnnouncement = async (req, res) => {
    try {
        const { title, content, targetAudience, priority, status, expiresAt } = req.body;

        const announcement = await Announcement.create({
            title,
            content,
            targetAudience,
            priority,
            status,
            expiresAt,
            author: req.user.id
        });

        res.status(201).json({ success: true, data: announcement });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete announcement
// @route   DELETE /api/admin/announcements/:id
// @access  Private/Admin
const deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.id);
        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }
        res.json({ success: true, message: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getAnnouncements,
    createAnnouncement,
    deleteAnnouncement
};
