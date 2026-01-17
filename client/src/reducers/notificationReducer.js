import {
  NOTIFICATION_LIST_REQUEST,
  NOTIFICATION_LIST_SUCCESS,
  NOTIFICATION_LIST_FAIL,
} from '../constants/notificationConstants';

export const notificationListReducer = (
  state = { notifications: [] },
  action
) => {
  switch (action.type) {
    case NOTIFICATION_LIST_REQUEST:
      return {
        ...state,
        loading: true,
      };

    case NOTIFICATION_LIST_SUCCESS:
      return {
        loading: false,
        notifications: action.payload,
      };

    case 'NOTIFICATION_ADD':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };

    case NOTIFICATION_LIST_FAIL:
      return {
        loading: false,
        error: action.payload,
        notifications: state.notifications,
      };

    default:
      return state;
  }
};
