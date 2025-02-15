import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    role: {
      type: String,
      required: true,
      enum: ['buyer', 'seller'],  // Only buyer or seller can be set
      default: 'buyer',  // Default role is buyer
    },
    // Default discounts for a new user
    discounts: {
      type: [String],  // An array of discount codes
      default: ['DISCOUNT10', 'DISCOUNT20', 'SALE10'], // Default discount codes
    },
    paypalClientId: {
      type: String,  // New field for PayPal Client ID
      required: false,  // Optionally required, depending on your logic
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await (enteredPassword== this.password);
};

/*userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});*/

const User = mongoose.model('User', userSchema);

export default User;
