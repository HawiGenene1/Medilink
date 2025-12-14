const Medicine = require('../models/Medicine');
const FilterService = require('../services/filterService');

/**
 * GET /api/medicines
 * Query params: search, category, categories, type, types, brand, brands, manufacturer, manufacturers,
 *                minPrice, maxPrice, inStock, requiresPrescription, sortBy, sortOrder, page, limit
 */
const getMedicines = async (req, res) => {
  try {
    const result = await FilterService.filterMedicines(req.query);
    return res.json({
      success: true,
      data: result.medicines,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('getMedicines error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching medicines' });
  }
};

/**
 * GET /api/medicines/filter-options
 * Returns available filter options for medicines
 */
const getMedicineFilterOptions = async (req, res) => {
  try {
    const options = await FilterService.getMedicineFilterOptions();
    return res.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('getMedicineFilterOptions error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching filter options' });
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
  getMedicineFilterOptions,
};
