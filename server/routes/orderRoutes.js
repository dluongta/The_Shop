import express from 'express'
import { 
  addOrderItems, 
  getOrderById, 
  updateOrderToPaid, 
  updateOrderToDelivered, 
  getOrders, 
  getMyOrders, 
  getMySellOrders 
} from '../controllers/orderController.js'
import { protect, admin, isSellerOrAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Route to get orders for the logged-in seller
router.route('/sellerorders').get(protect, getMySellOrders)

// Route to get orders for the logged-in user
router.route('/myorders').get(protect, getMyOrders)

// Admin Routes to get all orders
router.route('/').get(protect, admin, getOrders)

// Route to create a new order
router.route('/').post(protect, addOrderItems)

// Route to update order to paid (after payment)
router.route('/:id/pay').put(protect, isSellerOrAdmin, updateOrderToPaid)

// Route to mark order as delivered (admin/seller)
router.route('/:id/deliver').put(protect, isSellerOrAdmin, updateOrderToDelivered)

// Route to get a specific order by ID
router.route('/:id').get(protect, getOrderById)

export default router
