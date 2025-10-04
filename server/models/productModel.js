import mongoose from 'mongoose'

// Review Schema (structure for individual product reviews)
const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true }, // Reviewer's name
    rating: { type: Number, required: true }, // Rating for the product (1-5 stars)
    comment: { type: String, required: true }, // Comment/review text
    user: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the user model (reviewer's user ID)
      required: true,
      ref: 'User', // Referring to the User collection
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` timestamps
  }
)

// Product Schema (structure for the product data)
const productSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId, // Seller or creator of the product (user ID)
      required: true,
      ref: 'User', // Referring to the User collection (for the seller)
    },
    name: {
      type: String, // Name of the product
      required: true,
    },
    images: [
      {
        type: String,
        required: true,
      }
    ],
    brand: {
      type: String, // Brand of the product
      required: true,
    },
    category: {
      type: String, // Category of the product (e.g., electronics, clothing)
      required: true,
    },
    description: {
      type: String, // Description of the product
      required: true,
    },
    reviews: [reviewSchema], // Array of reviews for the product (each item is a review object)
    rating: {
      type: Number, // Computed average rating for the product
      required: true,
      default: 0, // Default rating value
    },
    numReviews: {
      type: Number, // Number of reviews the product has received
      required: true,
      default: 0, // Default value for the number of reviews
    },
    price: {
      type: Number, // Price of the product
      required: true,
      default: 0, // Default price
    },
    countInStock: {
      type: Number, // Number of items available in stock
      required: true,
      default: 0, // Default value for the stock
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` timestamps
  }
)

// Create the Product model based on the schema
const Product = mongoose.model('Product', productSchema)

export default Product
