// Member 2 - Mentorship Session Model
const mongoose = require('mongoose');

const MentorshipSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionType: { type: String },
  description: { type: String },
  scheduledDate: { type: String },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed'], default: 'pending' },
  meetingLink: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Mentorship', MentorshipSchema);