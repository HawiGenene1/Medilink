const Medicine = require('../models/Medicine');

/**
 * GET /api/medicines
 * Query params: search, category, minPrice, maxPrice, sort
 */
const getMedicines = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sort } = req.query;
    const filter = {};

    if (search) {
      // simple text search on name and description
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) filter.category = category;
    if (minPrice) filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };

    let query = Medicine.find(filter);

    if (sort) {
      const sortField = sort === 'price' ? 'price' : 'name';
      query = query.sort(sortField);
    }

    const medicines = await query.exec();
    return res.json(medicines);
  } catch (error) {
    console.error('getMedicines error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching medicines' });
  }
};

const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findById(id).exec();
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });
    return res.json(medicine);
  } catch (error) {
    console.error('getMedicineById error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching medicine' });
  }
};

module.exports = {
  getMedicines,
  getMedicineById,
};
