const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  icon: { type: String, default: 'bi-award' },
  threshold: { type: Number, default: 0 },
});

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notificationType: { type: String, enum: ['answer', 'upvote', 'faq_approved', 'comment', 'moderation'], required: true },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = {
  Badge: mongoose.model('Badge', badgeSchema),
  Notification: mongoose.model('Notification', notificationSchema)
};
