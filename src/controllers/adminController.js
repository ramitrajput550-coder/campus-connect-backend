const User = require('../models/User');
const Post = require('../models/Post');
const Referral = require('../models/Referral');
const Event = require('../models/Event');
const Mentorship = require('../models/Mentorship');
const dbHelper = require('../config/dbHelper');

const adminController = {
  getUnverifiedAlumni: async (req, res) => {
    try {
      const allUsers = await dbHelper.find(User);
      const unverified = allUsers.filter(u => 
        (u.role === 'alumni' || u.role === 'placement') && u.isVerifiedAlumni === false
      );
      res.json(unverified);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  verifyAlumni: async (req, res) => {
    const userId = req.params.userId;
    try {
      const user = await dbHelper.findById(User, userId);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const updated = await dbHelper.findByIdAndUpdate(User, userId, {
        isVerifiedAlumni: true,
        'verificationDetails.approvedAt': new Date().toISOString(),
        'verificationDetails.approvedBy': req.user.id
      }, { new: true });

      res.json(updated);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  getAnalytics: async (req, res) => {
    try {
      // Aggregate stats from DB/JSON
      const users = await dbHelper.find(User);
      const posts = await dbHelper.find(Post);
      const referrals = await dbHelper.find(Referral);
      const events = await dbHelper.find(Event);
      const mentorships = await dbHelper.find(Mentorship);

      const totalStudents = users.filter(u => u.role === 'student').length;
      const totalAlumni = users.filter(u => u.role === 'alumni').length;
      const verifiedAlumni = users.filter(u => u.role === 'alumni' && u.isVerifiedAlumni).length;
      const totalFaculty = users.filter(u => u.role === 'faculty').length;

      const jobsCount = posts.filter(p => p.postType === 'job').length;
      const referralsCount = posts.filter(p => p.postType === 'referral').length;

      res.json({
        totalStudents,
        totalAlumni,
        verifiedAlumni,
        totalFaculty,
        totalUsers: users.length,
        jobsPosted: jobsCount,
        referralsShared: referralsCount,
        referralApplications: referrals.length,
        eventsConducted: events.length,
        mentorshipSessions: mentorships.length
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  createUser: async (req, res) => {
    const { email, password, role, name, department, designation } = req.body;
    const bcrypt = require('bcryptjs');

    try {
      // Check if user already exists
      const existing = await dbHelper.findOne(User, { email });
      if (existing) {
        return res.status(400).json({ msg: 'User already exists with this email' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user (automatically verified since created by Admin)
      const userData = {
        email,
        password: hashedPassword,
        role,
        isVerifiedAlumni: true, // Auto approved
        profile: {
          name,
          photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
          department: department || '',
          designation: designation || '',
          skills: [],
          projects: [],
          achievements: []
        }
      };

      const newUser = await dbHelper.create(User, userData);
      res.json({ msg: 'User created successfully', userId: newUser._id });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const users = await dbHelper.find(User);
      const sanitized = users.map(u => {
        const copy = { ...u };
        delete copy.password;
        return copy;
      });
      res.json(sanitized);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  },

  editUser: async (req, res) => {
    const userId = req.params.userId;
    const { name, role, email, department, designation, course, year, passingYear, currentCompany, location } = req.body;

    try {
      const user = await dbHelper.findById(User, userId);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const updatedFields = {
        email: email || user.email,
        role: role || user.role,
        'profile.name': name || user.profile?.name,
        'profile.department': department !== undefined ? department : user.profile?.department,
        'profile.designation': designation !== undefined ? designation : user.profile?.designation,
        'profile.course': course !== undefined ? course : user.profile?.course,
        'profile.year': year !== undefined ? year : user.profile?.year,
        'profile.currentCompany': currentCompany !== undefined ? currentCompany : user.profile?.currentCompany,
        'profile.location': location !== undefined ? location : user.profile?.location,
      };

      if (passingYear !== undefined) {
        updatedFields.passingYear = parseInt(passingYear);
        updatedFields['verificationDetails.passingYear'] = parseInt(passingYear);
      }

      const updated = await dbHelper.findByIdAndUpdate(User, userId, updatedFields, { new: true });
      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  },

  deleteUser: async (req, res) => {
    const userId = req.params.userId;
    try {
      const user = await dbHelper.findById(User, userId);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      await dbHelper.deleteMany(User, { _id: userId });
      res.json({ msg: 'User deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  },

  editPost: async (req, res) => {
    const postId = req.params.postId;
    const { content, title, company, location, salary } = req.body;

    try {
      const post = await dbHelper.findById(Post, postId);
      if (!post) {
        return res.status(404).json({ msg: 'Post not found' });
      }

      const updatedFields = {
        content: content || post.content
      };

      if (post.postType === 'job' || post.postType === 'referral') {
        updatedFields['jobDetails.title'] = title || post.jobDetails?.title;
        updatedFields['jobDetails.company'] = company || post.jobDetails?.company;
        updatedFields['jobDetails.location'] = location || post.jobDetails?.location;
        updatedFields['jobDetails.salary'] = salary || post.jobDetails?.salary;
      }

      const updated = await dbHelper.findByIdAndUpdate(Post, postId, updatedFields, { new: true });
      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  }
};

module.exports = adminController;
