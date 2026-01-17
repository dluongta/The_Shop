import bcrypt from 'bcryptjs';

const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: '123456',
    role: 'seller',
    isAdmin: true,
    // Add default discount codes
    discounts: ['DISCOUNT10', 'DISCOUNT20', 'SALE10'],
    paypalClientId: 'AfW47Nj0c4k_bHHB5Kn1a0EYKCoe5nBDxG_fcraZiuEoSyxC9IRvBn7kIj6Qkcy7o3lU18TVYZzt9Nid'
  },
  {
    name: 'John Street',
    email: 'john@example.com',
    role: 'buyer',
    password: '123456',
    // Add default discount codes
    discounts: ['DISCOUNT10', 'DISCOUNT20', 'SALE10'],
    paypalClientId: 'AfW47Nj0c4k_bHHB5Kn1a0EYKCoe5nBDxG_fcraZiuEoSyxC9IRvBn7kIj6Qkcy7o3lU18TVYZzt9Nid'

  },
  {
    name: 'Jane Street',
    email: 'jane@example.com',
    role: 'seller',
    password: '123456',
    // Add default discount codes
    discounts: ['DISCOUNT10', 'DISCOUNT20', 'SALE10'],
    paypalClientId: 'AfW47Nj0c4k_bHHB5Kn1a0EYKCoe5nBDxG_fcraZiuEoSyxC9IRvBn7kIj6Qkcy7o3lU18TVYZzt9Nid'
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
