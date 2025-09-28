import asyncHandler from 'express-async-handler'
import generateToken from '../utils/generateToken.js'
import User from '../models/userModel.js'
import Discount from '../models/discountModel.js'  // Assuming Discount model exists

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email })
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      paypalClientId: user.paypalClientId,  // Include PayPal Client ID in the response
      token: generateToken(user._id),
    })
  } else {
    res.status(401)
    throw new Error('Invalid email or password')
  }
})

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, paypalClientId } = req.body;

  // Check if the user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create the new user
  const user = await User.create({
    name,
    email,
    password,
    role,
    discounts: [],  // Initialize an empty array to hold references to discount documents
    paypalClientId,  // Store the PayPal Client ID
  });

  // Default discount codes to add
  const defaultDiscounts = [
    { code: 'DISCOUNT10', description: '10% off your order', amount: 10 },
    { code: 'DISCOUNT20', description: '20% off your order', amount: 20 },
    { code: 'SALE10', description: '10% off sale items', amount: 10 },
  ];

  // Check if discounts already exist in the database
  const existingDiscounts = await Discount.find({
    code: { $in: defaultDiscounts.map(d => d.code) }  // Check if any of the discount codes already exist
  });

  // Filter out existing discounts from the new discounts list
  const newDiscounts = defaultDiscounts.filter(discount => 
    !existingDiscounts.some(existing => existing.code === discount.code)
  );

  // Create discount documents for the new discounts and add to the database
  const createdDiscounts = await Promise.all(
    newDiscounts.map((discountData) => {
      const discount = new Discount({
        ...discountData,
        userId: user._id,  // Associate discount with the user
      });
      return discount.save();  // Save each discount to the database
    })
  );

  // Assign the created discount documents to the user's discount field
  user.discounts = createdDiscounts.map((discount) => discount._id);  // Store the references to discount documents

  // Save the user with the associated discount references
  await user.save();

  // Return the user data along with the token
  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      discounts: user.discounts,  // Send the discount IDs back in the response
      paypalClientId: user.paypalClientId,  // Return PayPal Client ID
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Get user profile (including PayPal Client ID)
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      paypalClientId: user.paypalClientId,  // Include PayPal Client ID
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile (including PayPal Client ID for admin users)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, password, paypalClientId } = req.body;

  const user = await User.findById(req.user._id);

  if (user) {
    user.name = name || user.name;
    user.email = email || user.email;
    user.paypalClientId = paypalClientId || user.paypalClientId;  // Update PayPal client ID

    if (password) {
      user.password = password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      paypalClientId: updatedUser.paypalClientId,  // Return updated PayPal client ID
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get PayPal Client ID for the authenticated user
// @route   GET /api/users/paypal-client-id
// @access  Private (auth middleware required)
const getPayPalClientId = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (!user.paypalClientId) {
    res.status(404).json({ message: 'PayPal Client ID not set for this user' });
    return;
  }

  res.json({ clientId: user.paypalClientId });
});


const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
  res.json(users)
})

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (user) {
    await user.remove()
    res.json({ message: 'User removed' })
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password')

  if (user) {
    res.json(user)
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (user) {
    user.name = req.body.name || user.name
    user.email = req.body.email || user.email
    user.isAdmin = req.body.isAdmin

    const updatedUser = await user.save()

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    })
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})

// @desc    Get user's hashed password by email (for login validation)
// @route   GET /api/users/password/:email
// @access  Public
// @desc    Get user's hashed password by email (for login validation)
// @route   GET /api/users/password/:email
// @access  Public
const getUserPassword = asyncHandler(async (req, res) => {
  const email  = req.params.email;
  const user = await User.findOne({ email });
  if (user) {
    res.json({ password: user.password }); // Return the hashed password (for validation only)
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});



export {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getPayPalClientId,
  updateUser,
  getUserById,
  deleteUser,
  getUsers,
  getUserPassword
};
