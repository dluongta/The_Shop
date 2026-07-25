import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import colors from 'colors';
import morgan from 'morgan';
import cors from 'cors';
import { Server } from 'socket.io';
import asyncHandler from 'express-async-handler';
import { NlpManager } from 'node-nlp';

import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import chatRoomRoutes from './routes/chatRoom.js';
import chatMessageRoutes from './routes/chatMessage.js';
import notificationRoutes from './routes/notificationRoutes.js';
import Product from './models/productModel.js';
import User from './models/userModel.js';
import Discount from './models/discountModel.js';
import Order from './models/orderModel.js';

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import sendEmail from './utils/sendEmail.js'; // Đảm bảo file này tồn tại
dotenv.config();
connectDB();

const app = express();

// ================= MIDDLEWARE =================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(cors());

// ================= ROUTES =================
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/room', chatRoomRoutes);
app.use('/api/message', chatMessageRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/notifications', notificationRoutes);
// ================= RESET PASSWORD SYSTEM =================

// 1. API: Gửi email yêu cầu reset mật khẩu
app.post("/api/forgot-password", asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ status: "Email là bắt buộc" });

  const cleanEmail = email.trim().toLowerCase();
  const oldUser = await User.findOne({ email: cleanEmail });

  if (!oldUser) {
    // Trả về 404 để frontend hiển thị đúng thông báo
    return res.status(404).json({ status: "User Not Exists!!" });
  }

  const secret = process.env.JWT_SECRET + oldUser.password;
  const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, { expiresIn: "10m" });
  const link = `https://the-digital-shop.onrender.com/api/reset-password/${oldUser._id}/${token}`;

  // BẮT BUỘC dùng try-catch ở đây để bắt lỗi từ sendEmail
  try {
    await sendEmail({
      to: cleanEmail,
      subject: "Khôi phục mật khẩu - The Digital Shop",
      html: `<h3>Link reset: <a href="${link}">${link}</a></h3>`,
    });
    res.json({ status: "Reset Link Sent" });
  } catch (error) {
    // In lỗi ra Render Console để bạn xem được "thủ phạm" thật sự
    console.error("LỖI GỬI MAIL CHI TIẾT:", error.message);
    res.status(500).json({ status: "Lỗi hệ thống gửi mail", detail: error.message });
  }
}));

// 2. API: Xác thực link từ Email và Redirect về Frontend
app.get("/api/reset-password/:id/:token", asyncHandler(async (req, res) => {
  const { id, token } = req.params;

  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.status(404).send("Người dùng không tồn tại.");
  }

  const secret = process.env.JWT_SECRET + oldUser.password;
  try {
    jwt.verify(token, secret);
    // Điều hướng người dùng về trang đổi mật khẩu ở Frontend
    res.redirect(`/reset-password/${id}/${token}`);
  } catch (error) {
    res.status(403).send("Liên kết đã hết hạn hoặc không hợp lệ.");
  }
}));

// 3. API: Thực hiện cập nhật mật khẩu mới vào Database
app.post("/api/reset-password/:id/:token", asyncHandler(async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.status(404).json({ status: "Người dùng không tồn tại." });
  }

  const secret = process.env.JWT_SECRET + oldUser.password;
  try {
    jwt.verify(token, secret);
    
    // Mã hóa mật khẩu mới (Nếu bạn muốn lưu mật khẩu thô như yêu cầu trước, bỏ bước hash này)
    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(password, salt);

    await User.updateOne(
      { _id: id },
      { $set: { password: password } } // Dùng password nếu muốn lưu thô
    );

    res.json({ status: "Password Updated Succeeded" });
  } catch (error) {
    res.status(500).json({ status: "Đã có lỗi xảy ra hoặc link hết hạn." });
  }
}));
// ================= CHATBOT =================
// Khởi tạo NLP Manager
const manager = new NlpManager({ languages: ['vi'], forceNER: true });

const trainChatbot = async () => {
  try {
    const [products, discounts, users, orders] = await Promise.all([
      Product.find(),
      Discount.find(),
      User.find(),
      Order.find()
    ]);

    // 1. Huấn luyện thông tin sản phẩm (Dữ liệu từ DB)
    products.forEach((p) => {
      manager.addDocument('vi', `Sản phẩm ${p.name} là gì`, 'product.info');
      manager.addDocument('vi', `Thông tin ${p.name}`, 'product.info');
      manager.addAnswer('vi', 'product.info', `${p.name}: ${p.description}, Giá: ${p.price.toLocaleString()} VNĐ`);
    });

    // 2. Huấn luyện mã giảm giá
    discounts.forEach((d) => {
      manager.addDocument('vi', `Mã giảm giá ${d.code}`, 'discount.info');
      manager.addAnswer('vi', 'discount.info', `Mã ${d.code}: ${d.description}`);
    });

    // 3. Huấn luyện danh tính & Người tạo
    manager.addDocument('vi', 'bạn là ai', 'bot.identity');
    manager.addDocument('vi', 'tên bạn là gì', 'bot.identity');
    manager.addAnswer('vi', 'bot.identity', 'Mình là The Shop Chatbot, trợ lý thông minh của cửa hàng!');

    manager.addDocument('vi', 'ai làm ra bạn', 'bot.creator');
    manager.addDocument('vi', 'ai tạo ra bạn', 'bot.creator');
    manager.addAnswer('vi', 'bot.creator', 'Mình được phát triển và xây dựng bởi DLUONGTA.');

    // 4. Huấn luyện các Ý định (Intents) để xử lý động (Không gán câu trả lời tĩnh ở đây)
    manager.addDocument('vi', 'có bao nhiêu sản phẩm', 'shop.stats.products');
    manager.addDocument('vi', 'có bao nhiêu đơn hàng', 'shop.stats.orders');
    manager.addDocument('vi', 'có bao nhiêu mã giảm giá', 'shop.stats.discounts');
    
    manager.addDocument('vi', 'sản phẩm nào rẻ nhất', 'product.min_price');
    manager.addDocument('vi', 'giá thấp nhất', 'product.min_price');
    
    manager.addDocument('vi', 'sản phẩm nào đắt nhất', 'product.max_price');
    manager.addDocument('vi', 'giá cao nhất', 'product.max_price');

    manager.addDocument('vi', 'trạng thái đơn hàng của tôi', 'order.status');
    manager.addDocument('vi', 'kiểm tra đơn hàng', 'order.status');

    await manager.train();
    manager.save();
    console.log('Chatbot trained successfully'.green.bold);
  } catch (error) {
    console.error('Chatbot training error:'.red, error);
  }
};

// Route Train Chatbot
app.post('/api/train', asyncHandler(async (req, res) => {
  await trainChatbot();
  res.json({ message: 'Chatbot trained successfully' });
}));

// Route Xử lý Chat chính (Logic Động)
app.post('/api/chat', asyncHandler(async (req, res) => {
  const { message, userId } = req.body; // Frontend nên gửi kèm userId nếu đã login
  const response = await manager.process('vi', message);
  
  let finalAnswer = response.answer;

  // Xử lý động dựa trên Intent đã nhận diện
  switch (response.intent) {
    case 'shop.stats.products':
      const pCount = await Product.countDocuments();
      finalAnswer = `Hiện tại The Shop đang có tổng cộng ${pCount} sản phẩm đa dạng cho bạn lựa chọn!`;
      break;

    case 'shop.stats.orders':
      const oCount = await Order.countDocuments();
      finalAnswer = `Hệ thống hiện đang xử lý tổng cộng ${oCount} đơn hàng.`;
      break;

    case 'shop.stats.discounts':
      const dCount = await Discount.countDocuments();
      finalAnswer = `Hiện đang có ${dCount} mã giảm giá khả dụng. Bạn có thể hỏi chi tiết từng mã bằng cách gõ: "Mã [tên mã]" nhé.`;
      break;

    case 'product.min_price':
      const minP = await Product.findOne().sort({ price: 1 });
      finalAnswer = minP 
        ? `Sản phẩm rẻ nhất là ${minP.name} với giá chỉ ${minP.price.toLocaleString()} VNĐ.`
        : "Hiện tại không có sản phẩm nào.";
      break;

    case 'product.max_price':
      const maxP = await Product.findOne().sort({ price: -1 });
      finalAnswer = maxP 
        ? `Sản phẩm đắt nhất là ${maxP.name} với giá ${maxP.price.toLocaleString()} VNĐ.`
        : "Hiện tại không có sản phẩm nào.";
      break;

    case 'order.status':
      if (!userId) {
        finalAnswer = "Bạn vui lòng đăng nhập để mình có thể kiểm tra trạng thái đơn hàng giúp bạn nhé!";
      } else {
        const lastOrder = await Order.findOne({ user: userId }).sort({ createdAt: -1 });
        finalAnswer = lastOrder 
          ? `Đơn hàng mới nhất của bạn (#${lastOrder._id.toString().slice(-6)}) đang ở trạng thái: ${lastOrder.status}.`
          : "Bạn chưa có đơn hàng nào tại hệ thống.";
      }
      break;
  }

  res.json({ 
    answer: finalAnswer || "Bạn có thể hỏi về sản phẩm, giá cả hoặc đơn hàng của mình!" 
  });
}));

// ================= STATIC =================
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/client/build')));
  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

// ================= ERROR HANDLER =================
app.use(notFound);
app.use(errorHandler);

// ================= SERVER =================
const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

// // ================= SOCKET.IO =================
// const io = new Server(server, {
//   cors: {
//     origin: 'http://localhost:3000',
//     credentials: true,
//   },
// });
// global.io = io;

// global.onlineUsers = new Map();

// const removeUserBySocketId = (socketId) => {
//   for (let [userId, sId] of onlineUsers.entries()) {
//     if (sId === socketId) {
//       onlineUsers.delete(userId);
//       break;
//     }
//   }
// };

// io.on('connection', (socket) => {
//   console.log('Socket connected:', socket.id);

//   socket.on('addUser', (userId) => {
//     if (!userId) return;
//     onlineUsers.set(userId.toString(), socket.id);
//     io.emit('getUsers', Array.from(onlineUsers.keys()));
//   });

//   socket.on('joinRoom', (roomId) => {
//     if (roomId) socket.join(roomId);
//   });

//   socket.on('sendMessage', ({ senderId, receiverId, message }) => {
//     const receiverSocketId = onlineUsers.get(receiverId?.toString());
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit('getMessage', { senderId, message });
//     }
//   });

//   socket.on('sendMessageInRoom', ({ chatRoomId, senderId, message }) => {
//     if (chatRoomId) {
//       io.to(chatRoomId).emit('getMessage', {
//         senderId,
//         message,
//         chatRoomId,
//       });
//     }
//   });

//   socket.on('sendNotification', ({ userId, notification }) => {
//     const socketId = onlineUsers.get(userId?.toString());
//     if (socketId) {
//       io.to(socketId).emit('newNotification', notification);
//     }
//   });

//   socket.on('disconnect', () => {
//     removeUserBySocketId(socket.id);
//     io.emit('getUsers', Array.from(onlineUsers.keys()));
//     console.log('Socket disconnected:', socket.id);
//   });
// });
// ================= SOCKET.IO =================
const io = new Server(server, {
  cors: {
    origin: [
      "https://the-digital-shop.onrender.com", 
      "http://localhost:3000", 
      "http://localhost:5000",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5000"
    ],
    credentials: true,
  },
});

global.io = io;
global.onlineUsers = new Map();
const removeUserBySocketId = (socketId) => {
  for (let [userId, sId] of onlineUsers.entries()) {
    if (sId === socketId) {
      onlineUsers.delete(userId);
      break;
    }
  }
};

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  global.chatSocket = socket;

  socket.on("addUser", (userId) => {
    if (!userId) return;
    onlineUsers.set(userId.toString(), socket.id);
    io.emit("getUsers", Array.from(onlineUsers.keys()));
    console.log("ONLINE USERS:", Array.from(onlineUsers.keys()));
  });

  // ===== JOIN ROOM =====
  socket.on('joinRoom', (roomId) => {
    if (roomId) socket.join(roomId);
  });

  // ===== LEAVE ROOM (Thêm mới để giải phóng socket) =====
  socket.on('leaveRoom', (roomId) => {
    if (roomId) socket.leave(roomId);
  });

  // ===== PRIVATE MESSAGE =====
  socket.on('sendMessage', ({ senderId, receiverId, chatRoomId, message }) => {
    const receiverSocketId = onlineUsers.get(receiverId?.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('getMessage', { 
        senderId, 
        message, 
        chatRoomId 
      });
    }
  });

  // ===== ROOM MESSAGE =====
  // Đã SỬA: Nhận thêm biến `_id` từ client và phát lại để các máy đồng bộ ID với Database
  socket.on('sendMessageInRoom', ({ _id, chatRoomId, senderId, message }) => {
    if (chatRoomId) {
      io.to(chatRoomId).emit('getMessage', {
        _id,
        senderId,
        message,
        chatRoomId,
      });
    }
  });

  // ===== THU HỒI TIN NHẮN (THÊM MỚI) =====
  socket.on('revokeMessageInRoom', ({ chatRoomId, messageId }) => {
    if (chatRoomId) {
      // .to() sẽ gửi cho mọi người trong room ngoại trừ người gửi (socket.emit)
      socket.to(chatRoomId).emit('messageRevoked', {
        chatRoomId,
        messageId,
      });
    }
  });

  // ===== NOTIFICATION REALTIME =====
  socket.on('sendNotification', ({ userId, notification }) => {
    if (!userId || !notification) return;
    const socketId = onlineUsers.get(userId.toString());
    if (socketId) {
      io.to(socketId).emit('newNotification', notification);
    }
  });

  // ===== DISCONNECT =====
  socket.on('disconnect', () => {
    removeUserBySocketId(socket.id);
    io.emit('getUsers', Array.from(onlineUsers.keys()));
    console.log('Socket disconnected:', socket.id);
  });
});