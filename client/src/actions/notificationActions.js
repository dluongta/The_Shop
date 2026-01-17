// import axios from 'axios';
// import {
//   NOTIFICATION_LIST_REQUEST,
//   NOTIFICATION_LIST_SUCCESS,
//   NOTIFICATION_LIST_FAIL,
//   NOTIFICATION_MARK_READ_REQUEST,
//   NOTIFICATION_MARK_READ_SUCCESS,
//   NOTIFICATION_MARK_READ_FAIL,
// } from '../constants/notificationConstants';

// export const listNotifications = () => async (dispatch, getState) => {
//   try {
//     dispatch({ type: NOTIFICATION_LIST_REQUEST });

//     const {
//       userLogin: { userInfo },
//     } = getState();

//     const config = {
//       headers: {
//         Authorization: `Bearer ${userInfo.token}`,
//       },
//     };

//     const { data } = await axios.get('/api/notifications', config);

//     dispatch({
//       type: NOTIFICATION_LIST_SUCCESS,
//       payload: data,
//     });
//   } catch (error) {
//     dispatch({
//       type: NOTIFICATION_LIST_FAIL,
//       payload:
//         error.response?.data?.message || error.message,
//     });
//   }
// };

// export const markNotificationRead = (id) => async (dispatch, getState) => {
//   try {
//     dispatch({ type: NOTIFICATION_MARK_READ_REQUEST });

//     const {
//       userLogin: { userInfo },
//     } = getState();

//     const config = {
//       headers: {
//         Authorization: `Bearer ${userInfo.token}`,
//       },
//     };

//     await axios.put(`/api/notifications/${id}/read`, {}, config);

//     dispatch({ type: NOTIFICATION_MARK_READ_SUCCESS });
//     dispatch(listNotifications());
//   } catch (error) {
//     dispatch({
//       type: NOTIFICATION_MARK_READ_FAIL,
//       payload:
//         error.response?.data?.message || error.message,
//     });
//   }
// };
// export const addNotification = (notification) => ({
//   type: 'NOTIFICATION_ADD',
//   payload: notification,
// });

// export const markAllNotificationsRead = asyncHandler(async (req, res) => {
//   await Notification.updateMany(
//     { user: req.user._id, isRead: false },
//     { $set: { isRead: true } }
//   );

//   res.json({ message: 'All notifications marked as read' });
// });

import axios from 'axios';
import {
  NOTIFICATION_LIST_REQUEST,
  NOTIFICATION_LIST_SUCCESS,
  NOTIFICATION_LIST_FAIL,
  NOTIFICATION_MARK_READ_REQUEST,
  NOTIFICATION_MARK_READ_SUCCESS,
  NOTIFICATION_MARK_READ_FAIL,
  NOTIFICATION_MARK_ALL_READ_REQUEST,
  NOTIFICATION_MARK_ALL_READ_SUCCESS,
  NOTIFICATION_MARK_ALL_READ_FAIL,
} from '../constants/notificationConstants';

export const listNotifications = () => async (dispatch, getState) => {
  try {
    dispatch({ type: NOTIFICATION_LIST_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.get('/api/notifications', config);

    dispatch({
      type: NOTIFICATION_LIST_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: NOTIFICATION_LIST_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const markNotificationRead = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: NOTIFICATION_MARK_READ_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    await axios.put(`/api/notifications/${id}/read`, {}, config);

    dispatch({ type: NOTIFICATION_MARK_READ_SUCCESS });
    dispatch(listNotifications());
  } catch (error) {
    dispatch({
      type: NOTIFICATION_MARK_READ_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const markAllNotificationsRead = () => async (dispatch, getState) => {
  try {
    dispatch({ type: NOTIFICATION_MARK_ALL_READ_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    await axios.put('/api/notifications/read-all', {}, config);

    dispatch({ type: NOTIFICATION_MARK_ALL_READ_SUCCESS });
    dispatch(listNotifications());
  } catch (error) {
    dispatch({
      type: NOTIFICATION_MARK_ALL_READ_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};
export const addNotification = (notification) => ({
  type: 'NOTIFICATION_ADD',
  payload: notification,
});
