import axios from 'axios'
import {
  CART_ADD_ITEM,
  CART_REMOVE_ITEM,
  CART_SAVE_SHIPPING_ADDRESS,
  CART_SAVE_PAYMENT_METHOD,
} from '../constants/cartConstants'

export const addToCart = (id, qty) => async (dispatch, getState) => {
  // Fetch product details including seller info
  const { data } = await axios.get(`/api/products/${id}`)
  console.log('Product data fetched for cart:', data)

  // Dispatch action to add item to cart with seller information
  dispatch({
    type: CART_ADD_ITEM,
    payload: {
      product: data._id,
      name: data.name,
      image: Array.isArray(data.images) ? data.images[0] : data.image,
      price: data.price,
      countInStock: data.countInStock,
      seller: data.seller, // Assuming the product object contains seller information
      qty,
    },
  })

  // Save cart items to localStorage
  localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems))
}

export const removeFromCart = (id) => (dispatch, getState) => {
  dispatch({
    type: CART_REMOVE_ITEM,
    payload: id,
  })

  // Update localStorage after removal
  localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems))
}

export const saveShippingAddress = (data) => (dispatch) => {
  dispatch({
    type: CART_SAVE_SHIPPING_ADDRESS,
    payload: data,
  })

  // Save shipping address to localStorage
  localStorage.setItem('shippingAddress', JSON.stringify(data))
}

export const savePaymentMethod = (data) => (dispatch) => {
  dispatch({
    type: CART_SAVE_PAYMENT_METHOD,
    payload: data,
  })

  // Save payment method to localStorage
  localStorage.setItem('paymentMethod', JSON.stringify(data))
}
