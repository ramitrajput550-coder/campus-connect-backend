// Member 1 - Student Model
const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rollNumber: { type: String, required: true },
  course: { type: String },
  branch: { type: String },
  yearOfPassing: { type: Number },
  skills: [{ type: String }],
  resumeUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);