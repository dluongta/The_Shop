import express from 'express'
import asyncHandler from 'express-async-handler'
import Product from '../models/productModel.js'

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

const router = express.Router()

// ================= PUBLIC =================
router.route('/').get(getProducts).post(protect, createProduct)
router.route('/top').get(getTopProducts)

// ================= ADMIN =================
router.get(
  '/admin/productlist',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const products = await Product.find({})
    res.json(products)
  })
)

// ================= PRODUCT =================
router
  .route('/:id')
  .get(getProductById)
  .delete(protect, deleteProduct)
  .put(protect, updateProduct)

// ================= REVIEWS =================
router.route('/:id/reviews').post(protect, createProductReview)

export default router
