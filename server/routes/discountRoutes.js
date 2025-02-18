import express from 'express';
import { getDiscounts, applyDiscount, createDiscount } from '../controllers/discountController.js';
import { protect, admin } from '../middleware/authMiddleware.js';  // Assuming protect and admin middlewares are used
import Discount from '../models/discountModel.js';

const router = express.Router();

// Public route to get all active discounts
router.route('/').get(protect, getDiscounts);  // Ensure this is in your discount routes file

// Protected route to apply discount
router.route('/apply').post(protect, applyDiscount);

// Admin route to create a new discount code
router.route('/create').post(protect, admin, createDiscount);

// Route to get all active discount codes in JSON format
router.get('/allDiscounts', async (req, res) => {
    try {
      const discounts = await Discount.find(); // Fetch all discounts from DB
      res.json(discounts); // Return discounts in JSON format
    } catch (error) {
      res.status(500).json({ message: 'Error fetching discounts', error: error.message });
    }
  });
  

export default router;
