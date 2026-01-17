import dotenv from 'dotenv';
import colors from 'colors';
import bcrypt from 'bcryptjs';
import users from './data/users.js';
import products from './data/products.js';
import discounts from './data/discounts.js'; // Import discount data
import User from './models/userModel.js';
import Product from './models/productModel.js';
import Order from './models/orderModel.js';
import Discount from './models/discountModel.js'; // Import the Discount model
import connectDB from './config/db.js';

dotenv.config();

connectDB();

const importData = async () => {
  try {
    // Delete existing data
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Discount.deleteMany(); // Delete existing discounts

    // Insert discounts into the database
    const createdDiscounts = await Discount.insertMany(discounts);

    // Get the ObjectIds of the created discounts
    const discountIds = createdDiscounts.map(discount => discount._id);

    // Assign discounts to users
    users[0].discounts = discountIds;  // Admin User gets all discounts
    users[1].discounts = [discountIds[0], discountIds[1]];  // John gets DISCOUNT10 and DISCOUNT20
    users[2].discounts = [discountIds[1], discountIds[2]];  // Jane gets DISCOUNT20 and SALE10

    // Insert users with discounts
    const createdUsers = await User.insertMany(users);

    // Update the discounts with userId references
    await Discount.updateMany(
      { _id: { $in: discountIds } },
      { $set: { userId: createdUsers[0]._id } } // For example, all discounts can be associated with the admin user, or specific ones
    );

    // Link products to users (admin user for example)
    const adminUser = createdUsers[0]._id;

    // Map sample products to the admin user
    const sampleProducts = products.map((product) => {
      return { ...product, user: adminUser };
    });

    await Product.insertMany(sampleProducts);

    console.log('Data Imported!'.green.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Discount.deleteMany(); // Delete discounts too

    console.log('Data Destroyed!'.red.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

// Check for command line args to destroy data
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
