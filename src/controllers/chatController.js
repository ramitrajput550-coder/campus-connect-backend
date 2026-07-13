const Message = require('../models/Message');
const User = require('../models/User');
const dbHelper = require('../config/dbHelper');

const chatController = {
  sendMessage: async (req, res) => {
    const { receiverId, text, isGroupChat } = req.body;
    const senderId = req.user.id;

    try {
      const message = await dbHelper.create(Message, {
        sender: senderId,
        receiver: receiverId,
        text,
        isGroupChat: isGroupChat || false
      });

      // Find sender profile to return for real-time display
      const sender = await dbHelper.findById(User, senderId);
      const formattedMessage = {
        ...message,
        sender: {
          id: sender._id.toString(),
          profile: sender.profile
        }
      };

      res.json(formattedMessage);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  getMessages: async (req, res) => {
    const userId = req.user.id;
    const { partnerId, isGroup } = req.query;

    try {
      let messages = [];

      if (isGroup === 'true') {
        // Fetch all group messages for group (partnerId represents communityId)
        messages = await dbHelper.find(Message, {
          receiver: partnerId,
          isGroupChat: true
        }, { sort: { createdAt: 1 } });
      } else {
        // Fetch 1-to-1 conversation messages between user and partner
        // Note: For simple database support, query both combinations
        const allMessages = await dbHelper.find(Message, {
          isGroupChat: false
        }, { sort: { createdAt: 1 } });

        messages = allMessages.filter(msg => 
          (msg.sender.toString() === userId && msg.receiver.toString() === partnerId) ||
          (msg.sender.toString() === partnerId && msg.receiver.toString() === userId)
        );
      }

      // Populate sender profiles manually
      const populated = [];
      for (let msg of messages) {
        const senderUser = await dbHelper.findById(User, msg.sender);
        populated.push({
          ...msg,
          sender: senderUser ? {
            id: senderUser._id.toString(),
            profile: senderUser.profile
          } : null
        });
      }

      res.json(populated);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
};

module.exports = chatController;
