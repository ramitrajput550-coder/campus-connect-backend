// Member 4 - Application Model
const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: String, required: true },
  resumeUrl: { type: String },
  status: { type: String, default: 'applied' }
}, { timestamps: true });

module.exports = mongoose.model('Application', ApplicationSchema);