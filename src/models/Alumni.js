// Member 2 - Alumni Model
const mongoose = require('mongoose');

const AlumniSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String },
  designation: { type: String },
  mentorshipAvailability: { type: Boolean, default: true },
  skills: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Alumni', AlumniSchema);