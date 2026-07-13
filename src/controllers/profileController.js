const User = require('../models/User');
const dbHelper = require('../config/dbHelper');
const mongoose = require('mongoose');

const toObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
};

const profileController = {
  getProfile: async (req, res) => {
    try {
      const user = await dbHelper.findById(User, req.params.userId);
      if (!user) {
        return res.status(404).json({ msg: 'Profile not found' });
      }

      const activeUserId = toObjectId(req.params.userId);
      const currentUserId = toObjectId(req.user.id);

      // Increment profile view if viewing someone else's profile
      let updatedViews = user.profileViews || 0;
      if (req.params.userId !== req.user.id) {
        updatedViews += 1;
        await dbHelper.findByIdAndUpdate(User, req.params.userId, {
          profileViews: updatedViews
        });
      }

      // Calculate connections count
      const Connection = require('../models/Connection');
      const connections = await dbHelper.find(Connection, {
        status: 'accepted',
        $or: [
          { requester: activeUserId },
          { recipient: activeUserId }
        ]
      });

      // Relationship status with req.user.id (logged-in user)
      const userConn = await dbHelper.findOne(Connection, {
        $or: [
          { requester: currentUserId, recipient: activeUserId },
          { requester: activeUserId, recipient: currentUserId }
        ]
      });

      res.json({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        profile: user.profile,
        isVerifiedAlumni: user.isVerifiedAlumni,
        connectionsCount: connections.length,
        connectionStatus: userConn ? userConn.status : 'none',
        connectionRequester: userConn ? userConn.requester.toString() : null,
        profileViews: updatedViews
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  updateProfile: async (req, res) => {
    try {
      const user = await dbHelper.findById(User, req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Update nested profile fields
      const updatedProfile = {
        ...user.profile,
        ...req.body
      };

      const updatedUser = await dbHelper.findByIdAndUpdate(
        User,
        req.user.id,
        { profile: updatedProfile },
        { new: true }
      );

      res.json({
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        role: updatedUser.role,
        profile: updatedUser.profile,
        isVerifiedAlumni: updatedUser.isVerifiedAlumni
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
};

module.exports = profileController;
