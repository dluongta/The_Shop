import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import Product from '../models/productModel.js'

// @desc    Fetch all products (filter + sort + paginate)
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 10
  const page = Number(req.query.pageNumber) || 1

  // Search by name
  const keyword = req.query.keyword
    ? { name: { $regex: req.query.keyword, $options: 'i' } }
    : {}

  // Filter by user (only if ObjectId valid)
  const userFilter =
    req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)
      ? { user: req.query.userId }
      : {}

  // Price filter (safe NaN handling)
  const minPrice = Number(req.query.minPrice)
  const maxPrice = Number(req.query.maxPrice)

  const priceFilter = {}
  if (!isNaN(minPrice)) priceFilter.$gte = minPrice
  if (!isNaN(maxPrice)) priceFilter.$lte = maxPrice

  // Sort
  let sortBy = { updatedAt: -1 }
  if (req.query.sort === 'price_asc') sortBy = { price: 1 }
  if (req.query.sort === 'price_desc') sortBy = { price: -1 }
  if (req.query.sort === 'name_asc') sortBy = { name: 1 }
  if (req.query.sort === 'name_desc') sortBy = { name: -1 }

  // Final filters
  const filters = {
    ...keyword,
    ...userFilter,
    ...(Object.keys(priceFilter).length && { price: priceFilter }),
  }

  const count = await Product.countDocuments(filters)

  const products = await Product.find(filters)
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort(sortBy)

  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
  })
})

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('user', 'name')

  if (!product) {
    res.status(404)
    throw new Error('Product not found')
  }

  res.json(product)
})

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)

  if (!product) {
    res.status(404)
    throw new Error('Product not found')
  }

  await product.deleteOne()
  res.json({ message: 'Product removed' })
})

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const product = new Product({
    name: 'Sample name',
    price: 0,
    user: req.user._id,
    images: [],
    brand: 'Sample brand',
    category: 'Sample category',
    countInStock: 0,
    numReviews: 0,
    description: 'Sample description',
  })

  const createdProduct = await product.save()
  res.status(201).json(createdProduct)
})

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    description,
    images,
    brand,
    category,
    countInStock,
  } = req.body

  const product = await Product.findById(req.params.id)

  if (!product) {
    res.status(404)
    throw new Error('Product not found')
  }

  product.name = name
  product.price = price
  product.description = description
  product.images = images || product.images
  product.brand = brand
  product.category = category
  product.countInStock = countInStock

  const updatedProduct = await product.save()
  res.json(updatedProduct)
})

// @desc    Create review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body

  const product = await Product.findById(req.params.id)

  if (!product) {
    res.status(404)
    throw new Error('Product not found')
  }

  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  )

  if (alreadyReviewed) {
    res.status(400)
    throw new Error('Product already reviewed')
  }

  product.reviews.push({
    name: req.user.name,
    rating: Number(rating),
    comment,
    user: req.user._id,
  })

  product.numReviews = product.reviews.length
  product.rating =
    product.reviews.reduce((acc, item) => acc + item.rating, 0) /
    product.reviews.length

  await product.save()
  res.status(201).json({ message: 'Review added' })
})

// @desc    Top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({})
    .sort({ rating: -1 })
    .limit(3)

  res.json(products)
})

export {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
}
