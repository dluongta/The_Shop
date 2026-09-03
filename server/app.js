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
import sendEmail from './utils/sendEmail.js';
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

app.post("/api/forgot-password", asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ status: "Email là bắt buộc" });

  const cleanEmail = email.trim().toLowerCase();
  const oldUser = await User.findOne({ email: cleanEmail });

  if (!oldUser) {
    return res.status(404).json({ status: "User Not Exists!!" });
  }

  const secret = process.env.JWT_SECRET + oldUser.password;
  const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, { expiresIn: "10m" });
  const link = `https://the-digital-shop.onrender.com/api/reset-password/${oldUser._id}/${token}`;

  try {
    await sendEmail({
      to: cleanEmail,
      subject: "Khôi phục mật khẩu - The Digital Shop",
      html: `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Khôi phục mật khẩu</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f7fb; font-family:Arial, Helvetica, sans-serif; color:#333333;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f7fb; padding:35px 15px;">
    <tr>
      <td align="center">
        <!-- MAIN CONTAINER -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.08);">
          
          <!-- HEADER -->
          <tr>
            <td align="center" style="background-color:#0d6efd; padding:28px 20px;">
              <div style="color:#ffffff; font-size:25px; font-weight:bold; line-height:1.4;">
                The Digital Shop
              </div>
              <div style="color:#ffffff; font-size:17px; margin-top:7px; line-height:1.5;">
                Khôi phục mật khẩu
              </div>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding:35px 35px 30px 35px;">
              <div style="font-size:22px; font-weight:bold; color:#222222; margin-bottom:20px; line-height:1.4;">
                Yêu cầu đặt lại mật khẩu
              </div>
              
              <div style="font-size:16px; line-height:1.7; color:#444444; margin-bottom:25px;">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong style="color:#0d6efd;">The Digital Shop</strong>. Vui lòng nhấn vào nút bên dưới để thiết lập mật khẩu mới (Liên kết này chỉ có hiệu lực trong vòng <strong>10 phút</strong>).
              </div>

              <!-- BUTTON -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:25px;">
                <tr>
                  <td align="center">
                    <a href="${link}" style="display:inline-block; background-color:#0d6efd; color:#ffffff; font-size:16px; font-weight:bold; text-decoration:none; padding:15px 30px; border-radius:8px; box-shadow:0 4px 6px rgba(13, 110, 253, 0.25);">
                      ĐẶT LẠI MẬT KHẨU
                    </a>
                  </td>
                </tr>
              </table>

              <!-- FALLBACK LINK -->
              <div style="font-size:14px; line-height:1.6; color:#777777; margin-bottom:20px;">
                Nếu nút bấm không hoạt động, bạn có thể sao chép và dán đường dẫn sau vào trình duyệt:<br>
                <a href="${link}" style="color:#0d6efd; word-break:break-all; text-decoration:underline;">${link}</a>
              </div>

              <!-- DIVIDER -->
              <div style="border-top:1px solid #e5e5e5; margin:28px 0 20px 0;"></div>

              <div style="font-size:14px; line-height:1.6; color:#777777;">
                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và đảm bảo mật khẩu của bạn được bảo mật.
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="background-color:#f8f9fa; padding:20px; border-top:1px solid #eeeeee;">
              <div style="font-size:15px; color:#777777; line-height:1.6;">
                © ${new Date().getFullYear()} The Digital Shop
              </div>
              <div style="font-size:14px; color:#999999; margin-top:5px;">
                Email tự động, vui lòng không trả lời email này.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`,
    });
    res.json({ status: "Reset Link Sent" });
  } catch (error) {
    console.error("LỖI GỬI MAIL CHI TIẾT:", error.message);
    res.status(500).json({ status: "Lỗi hệ thống gửi mail", detail: error.message });
  }
}));

app.get("/api/reset-password/:id/:token", asyncHandler(async (req, res) => {
  const { id, token } = req.params;

  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.status(404).send("Người dùng không tồn tại.");
  }

  const secret = process.env.JWT_SECRET + oldUser.password;
  try {
    jwt.verify(token, secret);
    res.redirect(`/reset-password/${id}/${token}`);
  } catch (error) {
    res.status(403).send("Liên kết đã hết hạn hoặc không hợp lệ.");
  }
}));

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

    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(password, salt);

    await User.updateOne(
      { _id: id },
      { $set: { password: encryptedPassword } }
    );

    res.json({ status: "Password Updated Succeeded" });
  } catch (error) {
    res.status(500).json({ status: "Đã có lỗi xảy ra hoặc link hết hạn." });
  }
}));

// ================= CHATBOT =================
const manager = new NlpManager({ languages: ['vi'], forceNER: true });

const trainChatbot = async () => {
  try {
    const [products, discounts, users, orders] = await Promise.all([
      Product.find(),
      Discount.find(),
      User.find(),
      Order.find()
    ]);

    products.forEach((p) => {
      manager.addDocument('vi', `Sản phẩm ${p.name} là gì`, 'product.info');
      manager.addDocument('vi', `Thông tin ${p.name}`, 'product.info');
      manager.addAnswer('vi', 'product.info', `${p.name}: ${p.description}, Giá: ${p.price.toLocaleString()} VNĐ`);
    });

    discounts.forEach((d) => {
      manager.addDocument('vi', `Mã giảm giá ${d.code}`, 'discount.info');
      manager.addAnswer('vi', 'discount.info', `Mã ${d.code}: ${d.description}`);
    });

    manager.addDocument('vi', 'bạn là ai', 'bot.identity');
    manager.addDocument('vi', 'tên bạn là gì', 'bot.identity');
    manager.addAnswer('vi', 'bot.identity', 'Mình là The Shop Chatbot, trợ lý thông minh của cửa hàng!');

    manager.addDocument('vi', 'ai làm ra bạn', 'bot.creator');
    manager.addDocument('vi', 'ai tạo ra bạn', 'bot.creator');
    manager.addAnswer('vi', 'bot.creator', 'Mình được phát triển và xây dựng bởi DLUONGTA.');

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

app.post('/api/train', asyncHandler(async (req, res) => {
  await trainChatbot();
  res.json({ message: 'Chatbot trained successfully' });
}));

app.post('/api/chat', asyncHandler(async (req, res) => {
  const { message, userId } = req.body;
  const response = await manager.process('vi', message);

  let finalAnswer = response.answer;

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

  // ===== LEAVE ROOM =====
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
  socket.on('sendMessageInRoom', (data) => {
    if (data.chatRoomId) {
      io.to(data.chatRoomId).emit('getMessage', data);
    }
  });

  // ===== THU HỒI TIN NHẮN =====
  socket.on('revokeMessageInRoom', ({ chatRoomId, messageId }) => {
    if (chatRoomId) {
      socket.to(chatRoomId).emit('messageRevoked', { chatRoomId, messageId });
    }
  });

  // ==========================================
  // ===== THÊM 2 SỰ KIỆN TYPING Ở ĐÂY =====
  // ==========================================
  socket.on('typing', ({ chatRoomId, senderId, senderName }) => {
    if (chatRoomId) {
      // Gửi cho tất cả mọi người trong phòng TRỪ người đang gõ
      socket.to(chatRoomId).emit('userTyping', { senderId, senderName });
    }
  });

  socket.on('stopTyping', ({ chatRoomId, senderId }) => {
    if (chatRoomId) {
      socket.to(chatRoomId).emit('userStopTyping', { senderId });
    }
  });
  // ==========================================

  // ===== THU HỒI TIN NHẮN =====
  socket.on('revokeMessageInRoom', ({ chatRoomId, messageId }) => {
    if (chatRoomId) {
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
  socket.on('disconnect', async () => {
    let disconnectedUserId = null;

    // Tìm và xóa user khỏi danh sách online, đồng thời lấy userId
    for (let [userId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) {
        disconnectedUserId = userId;
        onlineUsers.delete(userId);
        break;
      }
    }

    if (disconnectedUserId) {
      const lastSeenTime = new Date();

      try {
        await User.findByIdAndUpdate(disconnectedUserId, { lastSeen: lastSeenTime });
      } catch (error) {
        console.error("Lỗi cập nhật lastSeen:", error);
      }

      io.emit('getUsers', Array.from(onlineUsers.keys()));
      io.emit('userOffline', { userId: disconnectedUserId, lastSeen: lastSeenTime });
    }

    console.log('Socket disconnected:', socket.id);
  });

});