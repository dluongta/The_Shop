import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import colors from 'colors';
import morgan from 'morgan';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import connectDB from './config/db.js';
import cors from 'cors';
import { Server } from 'socket.io';
import chatRoomRoutes from './routes/chatRoom.js';
import chatMessageRoutes from './routes/chatMessage.js';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import { NlpManager } from 'node-nlp';
import asyncHandler from 'express-async-handler';
import Product from './models/productModel.js'
import User from './models/userModel.js'
import Discount from './models/discountModel.js';

dotenv.config();

// Connect to the database
connectDB();

const app = express();

// Use morgan for logging in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Parse incoming JSON requests
app.use(express.json());

// Enable CORS
app.use(cors());

// API routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/room', chatRoomRoutes);
app.use('/api/message', chatMessageRoutes);
app.use('/api/discounts', discountRoutes);  // Ensure this is correctly configured

// Huấn luyện chatbot với node-nlp (Chỉ dùng Tiếng Việt)
const manager = new NlpManager({ languages: ['vi'] });

// Function to train chatbot
const trainChatbot = async () => {
  // Lấy dữ liệu từ MongoDB để huấn luyện chatbot
  const products = await Product.find();
  const discounts = await Discount.find();
  const users = await User.find();

  // Huấn luyện chatbot với dữ liệu sản phẩm
  products.forEach(product => {
    manager.addDocument('vi', `Sản phẩm ${product.name} là gì?`, 'product.info');
    manager.addAnswer('vi', 'product.info', `${product.name}: ${product.description}, Giá: ${product.price} VNĐ`);
  });

  // Huấn luyện chatbot với dữ liệu mã giảm giá
  discounts.forEach(discount => {
    manager.addDocument('vi', `Hãy cho tôi biết về mã giảm giá ${discount.code}`, 'discount.info');
    manager.addAnswer('vi', 'discount.info', `${discount.code}: ${discount.description}`);
  });

  // Huấn luyện chatbot với dữ liệu người dùng
  users.forEach(user => {
    manager.addDocument('vi', `Ai là ${user.name}?`, 'user.info');
    manager.addAnswer('vi', 'user.info', `${user.name}: ${user.email}`);
  });

  // Huấn luyện mô hình
  console.log('Training chatbot...');
  await manager.train();
  manager.save();
  console.log('Training complete!');
};

// API huấn luyện lại chatbot
app.post('/api/train', asyncHandler(async (req, res) => {
  await trainChatbot();
  res.json({ message: 'Chatbot is trained successfully!' });
}));
// API để trả lời câu hỏi từ chatbot
app.post('/api/chat', asyncHandler(async (req, res) => {
  const { message } = req.body;
  const response = await manager.process('vi', message); // Chỉ sử dụng tiếng Việt
  res.json({ answer: response.answer });
}));

// Static file serving
const __dirname = path.resolve();
app.use('/client/public/images', express.static(path.join(__dirname, '/client/public/images')));
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// For production build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/client/build')));

  // Catch-all route for React SPA
  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('API is running....');
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start the HTTP server and Socket.IO
const PORT = process.env.PORT || 5000;

// Create the HTTP server to pass to Socket.IO
const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

// Set up Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",  // Adjust this if needed
    credentials: true,
  },
});

global.onlineUsers = new Map();

// Function to get the key (userId) based on the socketId
const getKey = (map, val) => {
  for (let [key, value] of map.entries()) {
    if (value === val) return key;
  }
};

// Socket.IO connection event
io.on("connection", (socket) => {
  global.chatSocket = socket;

  // Add a user to the onlineUsers map
  socket.on("addUser", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.emit("getUsers", Array.from(onlineUsers));
  });

  // Send a message to the receiver
  socket.on("sendMessage", ({ senderId, receiverId, message }) => {
    const sendUserSocket = onlineUsers.get(receiverId);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("getMessage", {
        senderId,
        message,
      });
    }
  });

  // Handle disconnect events
  socket.on("disconnect", () => {
    onlineUsers.delete(getKey(onlineUsers, socket.id));
    socket.emit("getUsers", Array.from(onlineUsers));
  });
});
