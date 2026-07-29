import bcrypt from 'bcryptjs';

const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: '123456',
    role: 'seller',
    isAdmin: true,
    discounts: ['DISCOUNT10', 'DISCOUNT20', 'SALE10'],
    paypalClientId: 'AfW47Nj0c4k_bHHB5Kn1a0EYKCoe5nBDxG_fcraZiuEoSyxC9IRvBn7kIj6Qkcy7o3lU18TVYZzt9Nid'
  },
  {
    name: 'Jane Street',
    email: 'jane@example.com',
    role: 'buyer',
    password: '123456',
    discounts: ['DISCOUNT10', 'DISCOUNT20', 'SALE10'],
    paypalClientId: 'AfW47Nj0c4k_bHHB5Kn1a0EYKCoe5nBDxG_fcraZiuEoSyxC9IRvBn7kIj6Qkcy7o3lU18TVYZzt9Nid'
  },
];

/*
for (let i = 1; i <= 100; i++) {
  const newUser = {
    name: `User ${i}`,
    email: `user${i}@example.com`,
    password: bcrypt.hashSync('123456', 10),
    discounts: ['DISCOUNT10', 'DISCOUNT20', 'SALE10'],
  users.push(newUser);
}
*/

export default users;
