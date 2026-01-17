import {
  CART_ADD_ITEM,
  CART_REMOVE_ITEM,
  CART_SAVE_SHIPPING_ADDRESS,
  CART_SAVE_PAYMENT_METHOD,
  CART_CLEAR_ITEMS,

} from '../constants/cartConstants'
import {
  CART_UPDATE_TOTAL,
  DISCOUNT_APPLY,
  DISCOUNT_REMOVE,
} from '../constants/discountConstants'
export const cartReducer = (
  state = { cartItems: [], shippingAddress: {}, totalPrice: 0, discount: 0 },
  action
) => {
  switch (action.type) {
    case CART_ADD_ITEM:
      const item = action.payload

      const existItem = state.cartItems.find((x) => x.product === item.product)

      if (existItem) {
        return {
          ...state,
          cartItems: state.cartItems.map((x) =>
            x.product === existItem.product ? item : x
          ),
        }
      } else {
        return {
          ...state,
          cartItems: [...state.cartItems, item],
        }
      }

    case CART_REMOVE_ITEM:
      return {
        ...state,
        cartItems: state.cartItems.filter((x) => x.product !== action.payload),
      }

    case CART_SAVE_SHIPPING_ADDRESS:
      return {
        ...state,
        shippingAddress: action.payload,
      }

    case CART_SAVE_PAYMENT_METHOD:
      return {
        ...state,
        paymentMethod: action.payload,
      }

    case CART_CLEAR_ITEMS:
      return {
        ...state,
        cartItems: [],
      }

    case DISCOUNT_APPLY:
      const discountAmount = action.payload
      // Recalculate the totalPrice after applying the discount
      const updatedTotalPrice = (
        Number(state.totalPrice) - discountAmount
      ).toFixed(2)
      return {
        ...state,
        discount: discountAmount,
        totalPrice: updatedTotalPrice,
      }

    case DISCOUNT_REMOVE:
      // Recalculate the totalPrice without the discount
      const priceWithoutDiscount = (
        Number(state.totalPrice) + Number(state.discount)
      ).toFixed(2)
      return {
        ...state,
        discount: 0,
        totalPrice: priceWithoutDiscount,
      }

    case CART_UPDATE_TOTAL:
      return {
        ...state,
        totalPrice: action.payload,
      }

    default:
      // Calculate the totalPrice from cart items if no discount applied
      const itemsPrice = state.cartItems.reduce(
        (acc, item) => acc + item.price * item.qty,
        0
      )
      const shippingPrice = itemsPrice > 100 ? 0 : 100
      const taxPrice = (itemsPrice * 0.15).toFixed(2)

      const totalPrice = (
        itemsPrice + shippingPrice + Number(taxPrice) - state.discount
      ).toFixed(2)

      return {
        ...state,
        itemsPrice: itemsPrice.toFixed(2),
        shippingPrice: shippingPrice.toFixed(2),
        taxPrice: taxPrice,
        totalPrice: totalPrice,
      }
  }
}
