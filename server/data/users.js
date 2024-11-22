import bcrypt from 'bcryptjs';

const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: bcrypt.hashSync('123456', 10),
    role: 'seller',
    isAdmin: true,
    // Add default discount codes
    discounts: ['DISCOUNT10', 'DISCOUNT20', 'SALE10'],
  },
  {
    name: 'John Street',
    email: 'john@example.com',
    role: 'buyer',
    password: bcrypt.hashSync('123456', 10),
    // Add default discount codes
    discounts: ['DISCOUNT10', 'DISCOUNT20', 'SALE10'],
  },
  {
    name: 'Jane Street',
    email: 'jane@example.com',
    role: 'seller',
    password: bcrypt.hashSync('123456', 10),
    // Add default discount codes
    discounts: ['DISCOUNT10', 'DISCOUNT20', 'SALE10'],
  },
];

// Optional: Seed more users if needed
/*
for (let i = 1; i <= 100; i++) {
  const newUser = {
    name: `User ${i}`,
    email: `user${i}@example.com`,
    password: bcrypt.hashSync('123456', 10),
    discounts: ['DISCOUNT10', 'DISCOUNT20', 'SALE10'],  // Add default discounts
  };
  users.push(newUser);
}
*/

export default users;
