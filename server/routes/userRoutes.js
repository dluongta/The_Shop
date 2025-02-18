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
  getPayPalClientId,
  getUserPassword,
} from '../controllers/userController.js'
import { protect, admin} from '../middleware/authMiddleware.js'
import User from '../models/userModel.js'

router.route('/allUsers').get(getUsers);

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

// Check if user exists by email
router.get('/exists/:email', async (req, res) => {
  const  email  = req.params.email; // Ensure 'email' is extracted from the URL params
  try {
    const user = await User.findOne({ email }); // Check if user exists by email
  
    if (user) {
      return res.json({ exists: true }); // If email exists, return exists: true
    } else {
      return res.json({ exists: false }); // If email does not exist, return exists: false
    }
  } catch (error) {
    console.error('Error checking email existence:', error);  // Log the error for debugging
    return res.status(500).json({ message: 'Error checking email existence', error: error.message });
  }
});

  

// Route to get the hashed password for the user by email
router.get('/password/:email', getUserPassword);  // This route will allow us to retrieve the password for login validation


export default router
