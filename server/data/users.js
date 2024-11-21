import bcrypt from 'bcryptjs'

const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: bcrypt.hashSync('123456', 10),
    role: 'seller',
    isAdmin: true,
  },
  {
    name: 'John Street',
    email: 'john@example.com',
    role: 'buyer',
    password: bcrypt.hashSync('123456', 10),
  },
  {
    name: 'Jane Street',
    email: 'jane@example.com',
    role: 'seller',
    password: bcrypt.hashSync('123456', 10),
  },
]
/*
for (let i = 1; i <= 100; i++) {
  const newUser = {
    name: `User ${i}`,
    email: `user${i}@example.com`,
    password: bcrypt.hashSync('123456', 10),
  };
  users.push(newUser);
}
*/
export default users
