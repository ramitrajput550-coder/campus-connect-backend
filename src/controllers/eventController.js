const Event = require('../models/Event');
const User = require('../models/User');
const dbHelper = require('../config/dbHelper');

const eventController = {
  createEvent: async (req, res) => {
    const { title, description, category, date, location } = req.body;

    try {
      const user = await dbHelper.findById(User, req.user.id);
      if (!user || !['admin', 'faculty', 'placement'].includes(user.role)) {
        return res.status(403).json({ msg: 'Unauthorized: Only faculty, placement cell, or admins can create events' });
      }

      const eventData = {
        title,
        description,
        category,
        date,
        location,
        organizer: req.user.id,
        rsvps: []
      };

      const newEvent = await dbHelper.create(Event, eventData);
      res.json(newEvent);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  getEvents: async (req, res) => {
    try {
      const events = await dbHelper.find(Event, {}, { sort: { date: 1 } });
      
      const populated = [];
      for (let ev of events) {
        const organizerUser = await dbHelper.findById(User, ev.organizer);
        populated.push({
          ...ev,
          organizer: organizerUser ? { id: organizerUser._id.toString(), profile: organizerUser.profile } : null
        });
      }
      
      res.json(populated);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  rsvpEvent: async (req, res) => {
    const userId = req.user.id;
    const eventId = req.params.eventId;

    try {
      const event = await dbHelper.findById(Event, eventId);
      if (!event) {
        return res.status(404).json({ msg: 'Event not found' });
      }

      const alreadyRsvp = event.rsvps.some(id => id.toString() === userId);
      let update;

      if (alreadyRsvp) {
        update = { $pull: { rsvps: userId } };
      } else {
        update = { $push: { rsvps: userId } };
      }

      const updatedEvent = await dbHelper.findByIdAndUpdate(Event, eventId, update, { new: true });
      res.json(updatedEvent);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
};

module.exports = eventController;
