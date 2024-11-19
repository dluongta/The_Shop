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

// PayPal configuration
app.get('/api/config/paypal', (req, res) =>
  res.send(process.env.PAYPAL_CLIENT_ID)
);

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
    origin: "http://localhost:5000",  // Adjust this if needed
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
