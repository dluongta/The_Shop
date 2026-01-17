import asyncHandler from 'express-async-handler';
import Discount from '../models/discountModel.js';
import User from '../models/userModel.js';

// @desc    Get all active discounts for a user
// @route   GET /api/discounts
// @access  Public
const getDiscounts = asyncHandler(async (req, res) => {
    // Ensure the user is authenticated by checking `req.user._id`
    const userId = req.user._id;
  
    // Fetch discounts that are active and associated with the user
    const discounts = await Discount.find({ 
      isActive: true, 
      userId: req.user._id // Filter discounts for the authenticated user
    });
  
    if (discounts.length > 0) {
      res.json(discounts);
    } else {
      res.status(404).json({ message: 'No active discounts found for this user' });
    }
  });

// @desc    Apply discount code to user
// @route   POST /api/discounts/apply
// @access  Private (for authenticated users)
// Notes: You might want to link discounts with users to prevent abuse.
const applyDiscount = asyncHandler(async (req, res) => {
  const { code } = req.body;

  // Check if discount exists and is active
  const discount = await Discount.findOne({ code, isActive: true });

  if (!discount) {
    res.status(400);
    throw new Error('Invalid or expired discount code');
  }

  // Optionally, you could associate the discount with the user's ID
  const user = await User.findById(req.user._id);  // Assuming `req.user` is populated by authentication middleware
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Optionally, apply the discount to the user (e.g., in the user's profile or cart)
  // Assuming you're applying a discount on the user's next order, you can save the code to their profile.
  user.discount = discount._id;  // Save the discount applied to the user

  await user.save();

  res.json({
    message: 'Discount applied successfully',
    discount: discount.amount,
  });
});

// @desc    Create a new discount (Admin only)
// @route   POST /api/discounts/create
// @access  Private/Admin
const createDiscount = asyncHandler(async (req, res) => {
  const { code, description, amount } = req.body;

  const discountExists = await Discount.findOne({ code });

  if (discountExists) {
    res.status(400);
    throw new Error('Discount code already exists');
  }

  const discount = new Discount({
    code,
    description,
    amount,
  });

  const createdDiscount = await discount.save();
  res.status(201).json(createdDiscount);
});

export { getDiscounts, applyDiscount, createDiscount };
