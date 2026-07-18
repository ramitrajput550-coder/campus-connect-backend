// Member 3 - Faculty Model
const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: String, required: true },
  designation: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Faculty', FacultySchema);