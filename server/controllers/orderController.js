import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import Notification from '../models/notificationModel.js';
import Discount from '../models/discountModel.js'; // Nhớ phải có dòng này

// ================= CREATE ORDER =================
// @route   POST /api/orders
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    discountCode,
    discountAmount,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  const updatedOrderItems = [];
  const sellerIds = new Set();

  for (let item of orderItems) {
    const product = await Product.findById(item.product);

    if (!product) {
      res.status(404);
      throw new Error(`Product not found`);
    }

    if (product.countInStock < item.qty) {
      res.status(400);
      throw new Error(`Not enough stock for ${product.name}`);
    }

    product.countInStock -= item.qty;
    await product.save();

    item.seller = product.user;
    sellerIds.add(product.user.toString());
    updatedOrderItems.push(item);
  }

  const order = new Order({
    orderItems: updatedOrderItems,
    user: req.user._id,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    discountCode: discountCode || '',
    discountAmount: discountAmount || 0.0,
  });

  const createdOrder = await order.save();

  // ============ LƯU LỊCH SỬ DÙNG MÃ THAY VÌ XÓA ============
  if (discountCode) {
    const exactCode = discountCode.trim().toUpperCase();
    const discount = await Discount.findOne({ code: exactCode });
    
    if (discount) {
      // Đẩy ID người dùng vào danh sách đã sử dụng
      if (!discount.usedBy.includes(req.user._id)) {
        discount.usedBy.push(req.user._id);
      }

      // TÙY CHỌN: Nếu mã này là mã tặng riêng cho 1 người (cá nhân), dùng xong ta vô hiệu hóa luôn
      // Nếu là mã chung cho tất cả mọi người, nó vẫn sống để người khác dùng
      if (discount.userId) {
        discount.isActive = false;
      }

      await discount.save();
    }
  }

  res.status(201).json(createdOrder);

  // ============ NOTIFY SELLERS ============
  for (let sellerId of sellerIds) {
    const notification = await Notification.create({
      user: sellerId,
      title: 'Đơn hàng mới',
      message: `Bạn có đơn hàng mới #${createdOrder._id}`,
      type: 'order_new',
      link: `/order/${createdOrder._id}`,
    });

    const sellerSocket = global.onlineUsers.get(sellerId.toString());
    if (sellerSocket) {
      global.io.to(sellerSocket).emit('newNotification', notification);
    }
  }
});

// ================= GET ORDER =================
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', '_id name email')
    .populate({
      path: 'orderItems.seller',
      select: 'name',
    });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  res.json(order);
});

// ================= PAID =================
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (
    !(
      req.user.isAdmin ||
      order.orderItems.some(
        (item) => item.seller.toString() === req.user._id.toString()
      )
    )
  ) {
    res.status(403);
    throw new Error('Not authorized');
  }

  order.isPaid = true;
  order.paidAt = Date.now();

  const updatedOrder = await order.save();
  res.json(updatedOrder);

  // ============ NOTIFY BUYER ============
  const notification = await Notification.create({
    user: order.user,
    title: 'Đơn hàng đã thanh toán',
    message: `Đơn hàng #${order._id} đã được thanh toán`,
    type: 'order_paid',
    link: `/order/${order._id}`,
  });
  const buyerSocket = global.onlineUsers.get(order.user.toString());
  if (buyerSocket) {
    global.io.to(buyerSocket).emit('newNotification', notification);
  }
});

// ================= DELIVERED =================
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (
    !(
      req.user.isAdmin ||
      order.orderItems.some(
        (item) => item.seller.toString() === req.user._id.toString()
      )
    )
  ) {
    res.status(403);
    throw new Error('Not authorized');
  }

  order.isDelivered = true;
  order.deliveredAt = Date.now();

  const updatedOrder = await order.save();
  res.json(updatedOrder);

  // ============ NOTIFY BUYER ============
  const notification = await Notification.create({
    user: order.user,
    title: 'Đơn hàng đã giao',
    message: `Đơn hàng #${order._id} đã được giao thành công`,
    type: 'order_delivered',
    link: `/order/${order._id}`,
  });

  const buyerSocket = global.onlineUsers.get(order.user.toString());
  if (buyerSocket) {
    global.io.to(buyerSocket).emit('newNotification', notification);
  }
});

// ================= GET ALL =================
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate('user', '_id name')
    .populate({
      path: 'orderItems.seller',
      select: '_id name',
    });

  res.json(orders);
});

// ================= MY ORDERS =================
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});

// ================= SELLER ORDERS =================
const getMySellOrders = asyncHandler(async (req, res) => {
  if (req.user.role !== 'seller') {
    res.status(403);
    throw new Error('Access denied');
  }

  const orders = await Order.find().populate({
    path: 'orderItems.seller',
    select: '_id name',
  });

  const filteredOrders = orders.filter((order) =>
    order.orderItems.some(
      (item) =>
        item.seller &&
        item.seller._id.toString() === req.user._id.toString()
    )
  );

  res.json(filteredOrders);
});

export {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getOrders,
  getMyOrders,
  getMySellOrders,
};