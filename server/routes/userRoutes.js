import express from 'express'
const router = express.Router()
import {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  getPayPalClientId
} from '../controllers/userController.js'
import { protect, admin} from '../middleware/authMiddleware.js'

router.route('/').post(registerUser).get(protect, getUsers);
router.post('/login', authUser);

// Route to get user profile (including PayPal Client ID)
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.route('/paypal-client-id').get(protect, getPayPalClientId);

router
  .route('/:id')
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)

export default router
