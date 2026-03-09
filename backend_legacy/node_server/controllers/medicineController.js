const MedicineInventory = require('../models/MedicineInventory');

/**
 * @route   GET /api/medicines
 * @desc    Get all medicines from inventory with search/filter
 * @access  Public
 */
const getMedicines = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    const medicines = await MedicineInventory.find(query).sort({ name: 1 });
    res.json({ success: true, medicines });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch medicines' });
  }
};

/**
 * @route   GET /api/medicines/categories
 * @desc    Get all unique medicine categories
 * @access  Public
 */
const getMedicineCategories = async (req, res, next) => {
  try {
    const categories = await MedicineInventory.distinct('category');
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

/**
 * @route   POST /api/medicines
 * @desc    Add a new medicine to the inventory (Admin/Protected)
 * @access  Private
 */
const addMedicine = async (req, res, next) => {
  try {
    const { name, category } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Name and category required' });
    }

    const medicine = new MedicineInventory(req.body);
    await medicine.save();
    res.status(201).json({ success: true, medicine });
  } catch (error) {
    console.error('Error adding medicine:', error);
    res.status(500).json({ success: false, message: 'Failed to add medicine' });
  }
};

module.exports = {
  getMedicines,
  getMedicineCategories,
  addMedicine
};