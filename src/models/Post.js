const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  userPhoto: String,
  text: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  userPhoto: String,
  userRole: String,
  content: {
    type: String,
    required: true
  },
  postType: {
    type: String,
    enum: ['text', 'image', 'video', 'job', 'referral', 'announcement'],
    default: 'text'
  },
  mediaUrl: String,
  attachments: [{
    name: String,
    url: String
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [CommentSchema],
  
  // Job and Referral Details
  jobDetails: {
    title: String,
    company: String,
    location: String,
    salary: String,
    experienceRequired: String,
    skillsRequired: [String],
    jobType: {
      type: String,
      enum: ['Internship', 'Full-Time', 'Freelance', 'Research Opportunities']
    },
    externalLink: String
  },
  
  // Announcement details (Faculty, Placement, Admin only)
  announcementDetails: {
    title: String,
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    targetAudience: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Post', PostSchema);
