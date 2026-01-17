// import asyncHandler from 'express-async-handler';
// import Notification from '../models/notificationModel.js';

// // GET notifications
// export const getNotifications = asyncHandler(async (req, res) => {
//   const notifications = await Notification.find({ user: req.user._id })
//     .sort({ createdAt: -1 });

//   res.json(notifications);
// });

// // Mark one as read
// export const markAsRead = asyncHandler(async (req, res) => {
//   const notification = await Notification.findById(req.params.id);

//   if (notification) {
//     notification.isRead = true;
//     await notification.save();
//     res.json(notification);
//   } else {
//     res.status(404);
//     throw new Error('Notification not found');
//   }
// });

// // Mark all as read
// export const markAllAsRead = asyncHandler(async (req, res) => {
//   await Notification.updateMany(
//     { user: req.user._id, isRead: false },
//     { isRead: true }
//   );

//   res.json({ message: 'All notifications marked as read' });
// });

// export const markAllNotificationsRead = asyncHandler(async (req, res) => {
//   await Notification.updateMany(
//     { user: req.user._id, isRead: false },
//     { $set: { isRead: true } }
//   );

//   res.json({ message: 'All notifications marked as read' });
// });
import asyncHandler from 'express-async-handler';
import Notification from '../models/notificationModel.js';

// GET notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  res.json(notifications);
});

// ✅ MARK ONE (BẠN ĐANG THIẾU CÁI NÀY)
export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  // optional: check owner
  if (notification.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  notification.isRead = true;
  await notification.save();

  res.json({ message: 'Notification marked as read' });
});

// MARK ALL
export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  res.json({ message: 'All notifications marked as read' });
});
