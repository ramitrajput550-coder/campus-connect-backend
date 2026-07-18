// Member 4 - Resource Model
const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String },
  description: { type: String },
  url: { type: String },
  size: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Resource', ResourceSchema);