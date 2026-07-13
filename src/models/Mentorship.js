const mongoose = require('mongoose');

const MentorshipSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionType: {
    type: String,
    enum: ['Career Guidance', 'Resume Review', 'Mock Interview', 'Technical Mentoring'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  meetingLink: {
    type: String,
    default: 'https://meet.google.com/abc-defg-hij'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Mentorship', MentorshipSchema);
