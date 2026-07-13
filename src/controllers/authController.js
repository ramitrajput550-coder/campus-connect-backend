const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dbHelper = require('../config/dbHelper');

const authController = {
  register: async (req, res) => {
    const { email, password, role, name, enrollmentNumber, passingYear, universityEmail } = req.body;

    try {
      if (role === 'admin') {
        return res.status(400).json({ msg: 'Admin registration is not allowed. Admin accounts must be created manually or pre-seeded.' });
      }

      // Check if user already exists
      let user = await dbHelper.findOne(User, { email });
      if (user) {
        return res.status(400).json({ msg: 'User already exists with this email' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Setup role-specific verification
      const isAlumni = role === 'alumni';
      const isPlacement = role === 'placement';
      const isVerifiedAlumni = !(isAlumni || isPlacement); // Alumni & Placement start unverified

      const verificationDetails = isAlumni ? {
        enrollmentNumber,
        passingYear,
        universityEmail
      } : (isPlacement ? {
        universityEmail: email // Use registration email as university email reference
      } : {});

      // Create new user object
      const userData = {
        email,
        password: hashedPassword,
        role,
        isVerifiedAlumni,
        isEmailVerified: role !== 'student', // Students must verify email
        verificationDetails,
        profile: {
          name,
          photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150', // default photo
          skills: [],
          projects: [],
          achievements: []
        }
      };

      // Set other default profiles fields
      if (role === 'student') {
        userData.profile.course = req.body.course || 'MCA';
        userData.profile.year = req.body.year || '1st Year';
        userData.profile.department = req.body.department || 'Computer Science';
      } else if (role === 'alumni') {
        userData.profile.currentCompany = req.body.currentCompany || 'Not Specified';
        userData.profile.designation = req.body.designation || 'Alumni';
        userData.profile.location = req.body.location || 'Not Specified';
        userData.profile.experience = req.body.experience || '0 Years';
      } else if (role === 'faculty') {
        userData.profile.designation = req.body.designation || 'Professor';
        userData.profile.department = req.body.department || 'Computer Science';
        userData.profile.researchInterests = req.body.researchInterests || [];
      }

      // Save user
      const newUser = await dbHelper.create(User, userData);

      // Create payload for JWT
      const payload = {
        user: {
          id: newUser._id.toString(),
          role: newUser.role
        }
      };

      // Sign JWT
      jwt.sign(
        payload,
        process.env.JWT_SECRET || 'campusnet_jwt_secret',
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.json({
            token,
            user: {
              id: newUser._id.toString(),
              email: newUser.email,
              role: newUser.role,
              profile: newUser.profile,
              isVerifiedAlumni: newUser.isVerifiedAlumni,
              isEmailVerified: newUser.isEmailVerified
            }
          });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;

    try {
      // Find user
      const user = await dbHelper.findOne(User, { email });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // Payload
      const payload = {
        user: {
          id: user._id.toString(),
          role: user.role
        }
      };

      // Sign JWT
      jwt.sign(
        payload,
        process.env.JWT_SECRET || 'campusnet_jwt_secret',
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.json({
            token,
            user: {
              id: user._id.toString(),
              email: user.email,
              role: user.role,
              profile: user.profile,
              isVerifiedAlumni: user.isVerifiedAlumni,
              isEmailVerified: user.isEmailVerified
            }
          });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  getMe: async (req, res) => {
    try {
      const user = await dbHelper.findById(User, req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.json({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        profile: user.profile,
        isVerifiedAlumni: user.isVerifiedAlumni,
        isEmailVerified: user.isEmailVerified
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  verifyEmail: async (req, res) => {
    try {
      const user = await dbHelper.findById(User, req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const updatedUser = await dbHelper.findByIdAndUpdate(User, req.user.id, {
        isEmailVerified: true
      }, { new: true });

      res.json({ msg: 'Email verified successfully', isEmailVerified: updatedUser.isEmailVerified });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  }
};

module.exports = authController;
