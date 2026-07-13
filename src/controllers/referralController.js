const Referral = require('../models/Referral');
const Post = require('../models/Post');
const User = require('../models/User');
const dbHelper = require('../config/dbHelper');

const referralController = {
  applyReferral: async (req, res) => {
    const { postId, resumeUrl, coverLetter } = req.body;
    const studentId = req.user.id;

    try {
      const post = await dbHelper.findById(Post, postId);
      if (!post || post.postType !== 'referral') {
        return res.status(400).json({ msg: 'Selected post is not a valid referral opportunity' });
      }

      // Check if already applied
      const existing = await dbHelper.findOne(Referral, {
        post: postId,
        applicant: studentId
      });

      if (existing) {
        return res.status(400).json({ msg: 'You have already applied for this referral' });
      }

      const application = await dbHelper.create(Referral, {
        post: postId,
        applicant: studentId,
        resumeUrl,
        coverLetter,
        status: 'pending'
      });

      res.json(application);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  getApplications: async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
      let applications = [];

      if (userRole === 'student') {
        applications = await dbHelper.find(Referral, { applicant: userId });
      } else if (userRole === 'alumni') {
        // Alumni sees applications for referrals they posted
        const myPosts = await dbHelper.find(Post, { user: userId, postType: 'referral' });
        const postIds = myPosts.map(p => p._id.toString());
        
        // Find referrals matching my posts
        const allApps = await dbHelper.find(Referral);
        applications = allApps.filter(app => postIds.includes(app.post.toString()));
      } else if (userRole === 'admin' || userRole === 'placement') {
        // Admins and Placements see all applications
        applications = await dbHelper.find(Referral);
      }

      // Populate manually for fallback safety
      const populated = [];
      for (let app of applications) {
        const applicantUser = await dbHelper.findById(User, app.applicant);
        const referralPost = await dbHelper.findById(Post, app.post);
        
        populated.push({
          ...app,
          applicant: applicantUser ? { 
            id: applicantUser._id.toString(), 
            profile: applicantUser.profile,
            email: applicantUser.email
          } : null,
          post: referralPost
        });
      }

      res.json(populated);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  updateApplicationStatus: async (req, res) => {
    const { status } = req.body;
    const applicationId = req.params.applicationId;

    try {
      const app = await dbHelper.findById(Referral, applicationId);
      if (!app) {
        return res.status(404).json({ msg: 'Application not found' });
      }

      const updated = await dbHelper.findByIdAndUpdate(Referral, applicationId, { status }, { new: true });
      res.json(updated);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
};

module.exports = referralController;
