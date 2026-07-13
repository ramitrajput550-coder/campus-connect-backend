const Connection = require('../models/Connection');
const User = require('../models/User');
const dbHelper = require('../config/dbHelper');
const mongoose = require('mongoose');

const toObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
};

const networkController = {
  sendRequest: async (req, res) => {
    const { recipientId } = req.body;
    const requesterId = req.user.id;

    if (requesterId === recipientId) {
      return res.status(400).json({ msg: 'You cannot connect with yourself' });
    }

    try {
      const requesterIdObj = toObjectId(requesterId);
      const recipientIdObj = toObjectId(recipientId);
      // Check if already connected or pending
      const existing = await dbHelper.findOne(Connection, {
        $or: [
          { requester: requesterIdObj, recipient: recipientIdObj },
          { requester: recipientIdObj, recipient: requesterIdObj }
        ]
      });

      if (existing) {
        return res.status(400).json({ msg: 'Request already exists or connected' });
      }

      const connection = await dbHelper.create(Connection, {
        requester: requesterId,
        recipient: recipientId,
        status: 'pending'
      });

      res.json(connection);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  acceptRequest: async (req, res) => {
    const requesterId = req.params.requesterId;
    const recipientId = req.user.id;

    try {
      const connection = await dbHelper.findOne(Connection, {
        requester: requesterId,
        recipient: recipientId,
        status: 'pending'
      });

      if (!connection) {
        return res.status(404).json({ msg: 'Connection request not found' });
      }

      const updated = await dbHelper.findByIdAndUpdate(
        Connection,
        connection._id,
        { status: 'accepted' },
        { new: true }
      );

      res.json(updated);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  getConnections: async (req, res) => {
    const userId = req.user.id;
    try {
      const userIdObj = toObjectId(userId);
      const connections = await dbHelper.find(Connection, {
        status: 'accepted',
        $or: [
          { requester: userIdObj },
          { recipient: userIdObj }
        ]
      });

      // Find the counterparty user profile
      const connectedUserIds = connections.map(conn => {
        return conn.requester.toString() === userId ? conn.recipient : conn.requester;
      });

      const users = await dbHelper.find(User, {
        _id: { $in: connectedUserIds }
      });

      const formatted = users.map(u => ({
        id: u._id.toString(),
        email: u.email,
        role: u.role,
        profile: u.profile,
        isVerifiedAlumni: u.isVerifiedAlumni
      }));

      res.json(formatted);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  getPendingRequests: async (req, res) => {
    const userId = req.user.id;
    try {
      const requests = await dbHelper.find(Connection, {
        recipient: userId,
        status: 'pending'
      });

      const requesterIds = requests.map(r => r.requester);
      const users = await dbHelper.find(User, {
        _id: { $in: requesterIds }
      });

      const formatted = users.map(u => ({
        id: u._id.toString(),
        email: u.email,
        role: u.role,
        profile: u.profile
      }));

      res.json(formatted);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  getSuggestedConnections: async (req, res) => {
    const userId = req.user.id;
    try {
      // Find connections of user
      const userIdObj = toObjectId(userId);
      const connections = await dbHelper.find(Connection, {
        $or: [
          { requester: userIdObj },
          { recipient: userIdObj }
        ]
      });

      const excludedUserIds = connections.map(c => {
        return c.requester.toString() === userId ? c.recipient.toString() : c.requester.toString();
      });
      excludedUserIds.push(userId); // exclude self

      // Find users not in excluded list
      const users = await dbHelper.find(User, {
        _id: { $ne: userId } // simplified for fallback support
      }, { limit: 10 });

      // Filter out manually for fallback compatibility
      const suggested = users
        .filter(u => !excludedUserIds.includes(u._id.toString()))
        .map(u => ({
          id: u._id.toString(),
          email: u.email,
          role: u.role,
          profile: u.profile
        }));

      res.json(suggested);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  searchAlumni: async (req, res) => {
    const { company, location, passingYear, department, skills, role } = req.query;

    try {
      // Find matching users (excluding logged-in user)
      const query = {};
      if (role && role !== 'all') {
        query.role = role;
      }
      const users = await dbHelper.find(User, query);

      let results = users.filter(u => u._id.toString() !== req.user.id);

      // Filter verification states:
      // Alumni must be verified by admin, Students must verify email.
      results = results.filter(u => {
        if (u.role === 'alumni') return u.isVerifiedAlumni;
        if (u.role === 'student') return u.isEmailVerified;
        return true;
      });

      // Filter in JS to support local mock db easily
      if (company) {
        results = results.filter(u => 
          u.profile.currentCompany?.toLowerCase().includes(company.toLowerCase())
        );
      }
      if (location) {
        results = results.filter(u => 
          u.profile.location?.toLowerCase().includes(location.toLowerCase())
        );
      }
      if (passingYear) {
        results = results.filter(u => {
          const year = u.verificationDetails?.passingYear || u.profile.passingYear;
          return year === parseInt(passingYear);
        });
      }
      if (department) {
        results = results.filter(u => 
          u.profile.department?.toLowerCase().includes(department.toLowerCase())
        );
      }
      if (skills) {
        results = results.filter(u => 
          u.profile.skills?.some(s => s.toLowerCase().includes(skills.toLowerCase()))
        );
      }

      const currentUserIdObj = toObjectId(req.user.id);
      const userConnections = await dbHelper.find(Connection, {
        $or: [
          { requester: currentUserIdObj },
          { recipient: currentUserIdObj }
        ]
      });

      const formatted = results.map(u => {
        const conn = userConnections.find(c => 
          (c.requester.toString() === req.user.id && c.recipient.toString() === u._id.toString()) ||
          (c.requester.toString() === u._id.toString() && c.recipient.toString() === req.user.id)
        );
        return {
          id: u._id.toString(),
          email: u.email,
          role: u.role,
          profile: u.profile,
          isVerifiedAlumni: u.isVerifiedAlumni,
          passingYear: u.verificationDetails?.passingYear,
          connectionStatus: conn ? conn.status : 'none',
          connectionRequester: conn ? conn.requester.toString() : null
        };
      });

      res.json(formatted);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
};

module.exports = networkController;
