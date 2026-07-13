const Mentorship = require('../models/Mentorship');
const User = require('../models/User');
const dbHelper = require('../config/dbHelper');

const mentorshipController = {
  requestSession: async (req, res) => {
    const { mentorId, sessionType, description, scheduledDate } = req.body;
    const studentId = req.user.id;

    try {
      const mentor = await dbHelper.findById(User, mentorId);
      if (!mentor || mentor.role !== 'alumni') {
        return res.status(400).json({ msg: 'Selected mentor is not valid' });
      }

      const session = await dbHelper.create(Mentorship, {
        student: studentId,
        mentor: mentorId,
        sessionType,
        description,
        scheduledDate,
        status: 'pending'
      });

      res.json(session);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  getSessions: async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
      let query = {};
      if (userRole === 'student') {
        query.student = userId;
      } else if (userRole === 'alumni') {
        query.mentor = userId;
      }

      const sessions = await dbHelper.find(Mentorship, query, {
        sort: { scheduledDate: 1 }
      });

      // Populate manually for fallback safety, or using standard populates
      const populated = [];
      for (let s of sessions) {
        const studentUser = await dbHelper.findById(User, s.student);
        const mentorUser = await dbHelper.findById(User, s.mentor);
        
        populated.push({
          ...s,
          student: studentUser ? { id: studentUser._id.toString(), profile: studentUser.profile } : null,
          mentor: mentorUser ? { id: mentorUser._id.toString(), profile: mentorUser.profile } : null
        });
      }

      res.json(populated);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  updateSessionStatus: async (req, res) => {
    const { status, meetingLink } = req.body;
    const sessionId = req.params.sessionId;

    try {
      const session = await dbHelper.findById(Mentorship, sessionId);
      if (!session) {
        return res.status(404).json({ msg: 'Session request not found' });
      }

      const updateData = { status };
      if (meetingLink) {
        updateData.meetingLink = meetingLink;
      }

      const updated = await dbHelper.findByIdAndUpdate(Mentorship, sessionId, updateData, { new: true });
      res.json(updated);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
};

module.exports = mentorshipController;
