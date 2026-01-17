import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },

    type: {
      type: String,
      // Thêm 'new_message' vào enum
      enum: ['order_new', 'order_paid', 'order_delivered', 'new_message'], 
      required: true,
    },

    link: { type: String }, 
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;