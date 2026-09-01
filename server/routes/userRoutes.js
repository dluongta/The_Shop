import express from 'express';
const router = express.Router();
import {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  getPayPalClientId,
  getUserPassword,
  googleLoginBypass,
  verifyOTP,
  resendOTP,
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import User from '../models/userModel.js';
import asyncHandler from 'express-async-handler';

router.route('/allUsers').get(getUsers);

router.route('/').post(registerUser).get(getUsers);
router.post('/login', authUser);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.route('/paypal-client-id').get(protect, getPayPalClientId);

router
  .route('/:id')
  .delete(protect, deleteUser)
  .get(protect, getUserById)
  .put(protect, updateUser);

router.get('/exists/:email', async (req, res) => {
  const email = req.params.email;
  try {
    const user = await User.findOne({ email });
    if (user) return res.json({ exists: true });
    else return res.json({ exists: false });
  } catch (error) {
    return res.status(500).json({ message: 'Error checking email existence', error: error.message });
  }
});

router.get('/password/:email', getUserPassword);  

router.get('/', asyncHandler(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
  res.json(users);
}));

router.post('/google-login', googleLoginBypass);

// THÊM ROUTES CHO OTP
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

export default router;