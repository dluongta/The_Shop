import express from 'express';
import { getDiscounts, applyDiscount, createDiscount } from '../controllers/discountController.js';
import { protect, admin } from '../middleware/authMiddleware.js';  // Assuming protect and admin middlewares are used

const router = express.Router();

// Public route to get all active discounts
router.route('/').get(protect, getDiscounts);  // Ensure this is in your discount routes file

// Protected route to apply discount
router.route('/apply').post(protect, applyDiscount);

// Admin route to create a new discount code
router.route('/create').post(protect, admin, createDiscount);

export default router;
