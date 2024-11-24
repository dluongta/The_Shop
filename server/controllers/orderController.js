import asyncHandler from 'express-async-handler'
import Order from '../models/orderModel.js'
import Product from '../models/productModel.js'

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body

  if (orderItems && orderItems.length === 0) {
    res.status(400)
    throw new Error('No order items')
    return
  }

  // Add seller info to order items
  const updatedOrderItems = []

  for (let item of orderItems) {
    // Check if the product exists and fetch it
    const product = await Product.findById(item.product)

    if (product) {
      // Add the seller information from the product to the order item
      item.seller = product.user // Assuming `product.user` is the seller reference
    } else {
      res.status(400)
      throw new Error(`Product with ID ${item.product} not found`)
    }

    updatedOrderItems.push(item)
  }

  // Create the order with the updated orderItems
  const order = new Order({
    orderItems: updatedOrderItems,
    user: req.user._id, // The logged-in user's ID (customer)
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  })

  // Save the order
  const createdOrder = await order.save()

  res.status(201).json(createdOrder)
})

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', '_id name email') // Populate user details (customer)
    .populate({
      path: 'orderItems.seller', // Populate seller for each order item
      select: 'name', // Only select the seller's name
    })

  if (order) {
    res.json(order)
  } else {
    res.status(404)
    throw new Error('Order not found')
  }
})

// @desc    Update order to paid
// @route   GET /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)

  if (order) {
    order.isPaid = true
    order.paidAt = Date.now()
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    }

    const updatedOrder = await order.save()

    res.json(updatedOrder)
  } else {
    res.status(404)
    throw new Error('Order not found')
  }
})

// @desc    Update order to delivered
// @route   GET /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)

  if (order) {
    order.isDelivered = true
    order.deliveredAt = Date.now()

    const updatedOrder = await order.save()

    res.json(updatedOrder)
  } else {
    res.status(404)
    throw new Error('Order not found')
  }
})


// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate('user', '_id name') // Populate user details (customer)
    .populate({
      path: 'orderItems.seller', // Populate seller for each order item
      select: '_id', // Only select the seller's name
    })

  res.json(orders)
})

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
  res.json(orders);
});


const getMySellOrders = asyncHandler(async (req, res) => {
  try {
    // Ensure the user is a seller
    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Access Denied. You must be a seller to view these orders.' })
    }

    // Lấy tất cả đơn hàng có chứa item bán
    const orders = await Order.find();

    // Sử dụng filter để lọc các đơn hàng bán cho seller hiện tại
    const filteredOrders = orders.filter(order => 
      order.orderItems.some(item => item.seller._id.toString() === req.user._id.toString())
    );

    if (filteredOrders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this seller.' });
    }

    // Trả về danh sách đơn hàng đã lọc
    res.json(filteredOrders);

  } catch (err) {
    res.status(500).json({ message: 'Error fetching seller orders', error: err });
  }
});



export {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getOrders,
  getMyOrders,
  getMySellOrders,
}
