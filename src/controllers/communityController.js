const Community = require('../models/Community');
const User = require('../models/User');
const dbHelper = require('../config/dbHelper');

const communityController = {
  getCommunities: async (req, res) => {
    try {
      const communities = await dbHelper.find(Community);
      res.json(communities);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  createCommunity: async (req, res) => {
    const { name, description, category } = req.body;
    try {
      const existing = await dbHelper.findOne(Community, { name });
      if (existing) {
        return res.status(400).json({ msg: 'Community already exists with this name' });
      }

      const newCommunity = await dbHelper.create(Community, {
        name,
        description,
        category: category || 'General',
        creator: req.user.id,
        members: [req.user.id],
        discussions: []
      });

      res.json(newCommunity);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  joinCommunity: async (req, res) => {
    const userId = req.user.id;
    const communityId = req.params.communityId;

    try {
      const community = await dbHelper.findById(Community, communityId);
      if (!community) {
        return res.status(404).json({ msg: 'Community not found' });
      }

      const isMember = community.members.some(id => id.toString() === userId);
      let update;

      if (isMember) {
        update = { $pull: { members: userId } };
      } else {
        update = { $push: { members: userId } };
      }

      const updated = await dbHelper.findByIdAndUpdate(Community, communityId, update, { new: true });
      res.json(updated);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  addDiscussion: async (req, res) => {
    const { text } = req.body;
    const communityId = req.params.communityId;
    const userId = req.user.id;

    try {
      const user = await dbHelper.findById(User, userId);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const community = await dbHelper.findById(Community, communityId);
      if (!community) {
        return res.status(404).json({ msg: 'Community not found' });
      }

      const isMember = community.members.some(id => id.toString() === userId);
      if (!isMember) {
        return res.status(403).json({ msg: 'Join community to participate in discussion' });
      }

      const discussionItem = {
        _id: new Date().getTime().toString(),
        user: userId,
        userName: user.profile.name,
        userPhoto: user.profile.photo,
        text,
        createdAt: new Date().toISOString()
      };

      const updated = await dbHelper.findByIdAndUpdate(
        Community,
        communityId,
        { $push: { discussions: discussionItem } },
        { new: true }
      );

      res.json(updated);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
};

module.exports = communityController;
