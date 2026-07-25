import asyncHandler from 'express-async-handler';
import Discount from '../models/discountModel.js';
import User from '../models/userModel.js';

// @desc    Lấy danh sách mã giảm giá cho User hiện tại
// @route   GET /api/discounts
// @access  Private
const getDiscounts = asyncHandler(async (req, res) => {
  const discounts = await Discount.find({
    isActive: true,
    $or: [{ userId: null }, { userId: req.user._id }],
    // Không lấy những mã mà user này đã sử dụng
    usedBy: { $ne: req.user._id } 
  });

  res.json(discounts);
});

// @desc    Áp dụng mã giảm giá
// @route   POST /api/discounts/apply
// @access  Private
const applyDiscount = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const discount = await Discount.findOne({ code: code.trim().toUpperCase(), isActive: true });

  if (!discount) {
    res.status(404);
    throw new Error('Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa');
  }

  // Kiểm tra quyền (nếu là mã cá nhân)
  if (discount.userId && discount.userId.toString() !== req.user._id.toString()) {
    res.status(400);
    throw new Error('Bạn không có quyền sử dụng mã giảm giá này');
  }

  // KIỂM TRA XEM USER ĐÃ DÙNG MÃ NÀY CHƯA
  if (discount.usedBy && discount.usedBy.includes(req.user._id)) {
    res.status(400);
    throw new Error('Bạn đã sử dụng mã giảm giá này trước đây rồi!');
  }

  // TRẢ VỀ CẢ DISCOUNT TYPE
  res.json({ amount: discount.amount, code: discount.code, discountType: discount.discountType });
});

// @desc    Admin tạo mã giảm giá mới
// @route   POST /api/discounts/create
// @access  Private/Admin
const createDiscount = asyncHandler(async (req, res) => {
  // Nhận thêm discountType
  const { code, description, amount, discountType, email } = req.body;

  const discountExists = await Discount.findOne({ code: code.trim().toUpperCase() });
  if (discountExists) {
    res.status(400);
    throw new Error('Mã giảm giá này đã tồn tại');
  }

  let assignedUserId = null;

  // Nếu áp dụng cho 1 user cụ thể bằng email
  if (email) {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error('Không tìm thấy người dùng với email này');
    }
    assignedUserId = user._id; // Lấy ID của user để lưu vào discount
  }

  const discount = new Discount({
    code: code.trim().toUpperCase(),
    description,
    amount,
    discountType: discountType || 'percent', // Lưu loại giảm giá
    userId: assignedUserId, 
    usedBy: [],
  });

  const createdDiscount = await discount.save();
  res.status(201).json(createdDiscount);
});

export { getDiscounts, applyDiscount, createDiscount };