const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['connection_request', 'message', 'job', 'mentorship', 'referral', 'event'],
    required: true
  },
  relatedId: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);
