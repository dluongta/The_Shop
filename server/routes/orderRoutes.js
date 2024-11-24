import express from 'express'
const router = express.Router()
import {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getOrders,
  getMyOrders,
  getMySellOrders
} from '../controllers/orderController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

// Order Routes
router.route('/myorders').get(protect, getMyOrders)
router.route('/sellerorders').get(protect, getMySellOrders)
router.route('/').post(protect, addOrderItems).get(protect, admin, getOrders)
router.route('/:id').get(protect, getOrderById)
router.route('/:id/pay').put(protect, updateOrderToPaid)
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered)



export default router
