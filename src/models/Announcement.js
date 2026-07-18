// Member 3 - Announcement Model
const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  audience: { type: String, enum: ['All', 'Students', 'Alumni', 'Faculty'], default: 'All' }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', AnnouncementSchema);