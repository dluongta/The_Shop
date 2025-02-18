import { DISCOUNT_APPLY, DISCOUNT_REMOVE, DISCOUNT_LIST_REQUEST, DISCOUNT_LIST_SUCCESS, DISCOUNT_LIST_FAIL, DISCOUNT_LIST_ALL_REQUEST, DISCOUNT_LIST_ALL_SUCCESS, DISCOUNT_LIST_ALL_FAIL} from '../constants/discountConstants';

// discountReducer.js
export const discountReducer = (state = { discount: 0 }, action) => {
  switch (action.type) {
    case DISCOUNT_APPLY:
      return { ...state, discount: action.payload }
    case DISCOUNT_REMOVE:
      return { ...state, discount: 0 }
    default:
      return state
  }
}


export const discountListReducer = (state = { discounts: [] }, action) => {
  switch (action.type) {
    case DISCOUNT_LIST_REQUEST:
      return { loading: true, discounts: [] };
    case DISCOUNT_LIST_SUCCESS:
      return { loading: false, discounts: action.payload };
    case DISCOUNT_LIST_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export default discountListReducer;

export const discountListAllReducer = (state = { discounts: [] }, action) => {
  switch (action.type) {
    case DISCOUNT_LIST_ALL_REQUEST:
      return { loading: true };
    case DISCOUNT_LIST_ALL_SUCCESS:
      return { loading: false, discounts: action.payload };
    case DISCOUNT_LIST_ALL_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};
