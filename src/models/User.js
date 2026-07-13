const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'alumni', 'faculty', 'placement', 'admin'],
    default: 'student'
  },
  isVerifiedAlumni: {
    type: Boolean,
    default: false // Set to true after Admin approval for alumni
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  profileViews: {
    type: Number,
    default: 0
  },
  verificationDetails: {
    enrollmentNumber: String,
    passingYear: Number,
    universityEmail: String,
    approvedAt: Date,
    approvedBy: String
  },
  profile: {
    name: { type: String, required: true },
    photo: { type: String, default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150' }, // default avatar
    department: String,
    designation: String, // For alumni/faculty
    currentCompany: String, // For alumni
    experience: String, // For alumni
    location: String, // For alumni
    course: String, // For students
    year: String, // For students
    skills: [String], // For students/alumni
    projects: [{
      title: String,
      description: String,
      link: String
    }],
    achievements: [String],
    researchInterests: [String], // For faculty
    mentorshipAvailability: { type: Boolean, default: false },
    socialLinks: {
      linkedin: String,
      github: String,
      twitter: String,
      website: String
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
