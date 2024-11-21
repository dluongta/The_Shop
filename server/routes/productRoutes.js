import express from 'express'
const router = express.Router()
import {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
} from '../controllers/productController.js'
import { protect, admin, isSeller } from '../middleware/authMiddleware.js'

// Route for getting products and creating products (admin or seller)
router.route('/')
  .get(getProducts)
  .post(protect, (req, res, next) => {
    // Allow either admin or seller to create a product
    if (req.user && (req.user.isAdmin || req.user.role === 'seller')) {
      return next()
    }
    res.status(401)
    throw new Error('Not authorized as admin or seller')
  }, createProduct) // Proceed to createProduct if authorized

// Route for product reviews
router.route('/:id/reviews').post(protect, createProductReview)

// Route for top products
router.get('/top', getTopProducts)

// Route for individual product actions (view, delete, update)
router.route('/:id')
  .get(getProductById)
  .delete(protect, admin, deleteProduct)
  .put(protect, (req, res, next) => {
    // Allow either admin or seller to create a product
    if (req.user && (req.user.isAdmin || req.user.role === 'seller')) {
      return next()
    }
    res.status(401)
    throw new Error('Not authorized as admin or seller')
  }, updateProduct)

export default router
