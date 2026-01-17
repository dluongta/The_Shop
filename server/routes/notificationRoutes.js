// import express from 'express';
// import {
//   getNotifications,
//   markAsRead,
//   markAllAsRead,
// } from '../controllers/notificationController.js';
// import { protect } from '../middleware/authMiddleware.js';

// const router = express.Router();

// router.route('/')
//   .get(protect, getNotifications);

// router.put('/:id/read', protect, markAsRead);
// router.put('/read-all', protect, markAllAsRead);

// export default router;
import express from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllNotificationsRead);
router.put('/:id/read', protect, markNotificationRead);

export default router;
