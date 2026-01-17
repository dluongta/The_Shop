import { DISCOUNT_LIST_REQUEST, DISCOUNT_LIST_SUCCESS, DISCOUNT_LIST_FAIL, DISCOUNT_APPLY, DISCOUNT_REMOVE, DISCOUNT_LIST_ALL_REQUEST,DISCOUNT_LIST_ALL_SUCCESS,DISCOUNT_LIST_ALL_FAIL } from '../constants/discountConstants';
import axios from 'axios';

// Action to get the list of discount codes
// Action to get the list of discount codes
export const getDiscounts = () => async (dispatch, getState) => {
    try {
    dispatch({ type: DISCOUNT_LIST_REQUEST});

      // Extract userInfo from the Redux store
      const {
        userLogin: { userInfo },
      } = getState()  

      // Check if user is authenticated
      if (!userInfo || !userInfo.token) {
        throw new Error('User is not authenticated');
      }
  

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      }
  
      // Make the API call to fetch the list of discounts
      const { data } = await axios.get('/api/discounts', config);
  
      // Dispatch success action
      dispatch({ type: DISCOUNT_LIST_SUCCESS, payload: data });
    } catch (error) {
      // Dispatch fail action in case of an error
      dispatch({
        type: DISCOUNT_LIST_FAIL,
        payload: error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
      });
    }
  };
  

// Action to apply a discount
export const applyDiscount = (discountCode) => async (dispatch, getState) => {
  try {
    // Get the token from the Redux store (userLogin state)
    const {
      userLogin: { userInfo },
    } = getState();

    // Check if userInfo exists and includes the token
    if (!userInfo || !userInfo.token) {
      throw new Error('User is not authenticated');
    }

    // Set up the headers with the token
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    // Make the API call to apply the discount
    const { data } = await axios.post('/api/discounts/apply', { code: discountCode }, config);

    // Dispatch success action with the applied discount
    dispatch({ type: DISCOUNT_APPLY, payload: data.discount });
  } catch (error) {
    console.error(error);
  }
};

// Action to remove a discount
export const removeDiscount = () => (dispatch) => {
  dispatch({ type: DISCOUNT_REMOVE });
};

export const getAllDiscounts = () => async (dispatch, getState) => {
  try {
    dispatch({ type: DISCOUNT_LIST_ALL_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.get('/api/discounts/allDiscounts', config);

    dispatch({
      type: DISCOUNT_LIST_ALL_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: DISCOUNT_LIST_ALL_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};