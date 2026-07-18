// Member 2 - Job Model
const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String },
  jobType: { type: String, enum: ['Full-time', 'Part-time', 'Internship', 'Contract'] },
  salary: { type: String },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);