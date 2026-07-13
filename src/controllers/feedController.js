const Post = require('../models/Post');
const User = require('../models/User');
const dbHelper = require('../config/dbHelper');

const feedController = {
  createPost: async (req, res) => {
    const { content, postType, mediaUrl, jobDetails, announcementDetails } = req.body;

    try {
      const user = await dbHelper.findById(User, req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Check role authorizations
      if (postType === 'announcement' && !['admin', 'faculty', 'placement'].includes(user.role)) {
        return res.status(403).json({ msg: 'Only admins, faculty, and placement cells can post announcements' });
      }
      
      if (postType === 'referral' && !['alumni', 'placement'].includes(user.role)) {
        return res.status(403).json({ msg: 'Only alumni and placement cells can post referrals' });
      }

      const postData = {
        user: req.user.id,
        userName: user.profile.name,
        userPhoto: user.profile.photo,
        userRole: user.role,
        content,
        postType: postType || 'text',
        mediaUrl,
        likes: [],
        comments: []
      };

      if (postType === 'job' || postType === 'referral') {
        postData.jobDetails = jobDetails;
      }

      if (postType === 'announcement') {
        postData.announcementDetails = announcementDetails;
      }

      const newPost = await dbHelper.create(Post, postData);
      res.json(newPost);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  getPosts: async (req, res) => {
    try {
      const { type } = req.query;
      const query = {};
      
      if (type) {
        query.postType = type;
      }

      const posts = await dbHelper.find(Post, query, { sort: { createdAt: -1 } });
      
      // Dynamically populate author career headlines
      const populatedPosts = await Promise.all(posts.map(async (post) => {
        const author = await dbHelper.findById(User, post.user);
        let userHeadline = '';
        if (author) {
          if (author.role === 'student') {
            userHeadline = `${author.profile.course} • ${author.profile.year}`;
          } else if (author.role === 'alumni') {
            userHeadline = `${author.profile.designation} at ${author.profile.currentCompany || 'Campus Connect'}`;
          } else if (author.role === 'faculty') {
            userHeadline = `${author.profile.designation} • ${author.profile.department}`;
          } else {
            userHeadline = 'Platform Administrator';
          }
        }
        return {
          ...post,
          userHeadline
        };
      }));

      res.json(populatedPosts);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  toggleLike: async (req, res) => {
    try {
      const post = await dbHelper.findById(Post, req.params.postId);
      if (!post) {
        return res.status(404).json({ msg: 'Post not found' });
      }

      const userId = req.user.id;
      const alreadyLiked = post.likes.some(like => like.toString() === userId);

      let update;
      if (alreadyLiked) {
        // Unlike post
        update = { $pull: { likes: userId } };
      } else {
        // Like post
        update = { $push: { likes: userId } };
      }

      const updatedPost = await dbHelper.findByIdAndUpdate(Post, req.params.postId, update, { new: true });
      res.json(updatedPost);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  addComment: async (req, res) => {
    const { text } = req.body;

    try {
      const user = await dbHelper.findById(User, req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const post = await dbHelper.findById(Post, req.params.postId);
      if (!post) {
        return res.status(404).json({ msg: 'Post not found' });
      }

      const newComment = {
        user: req.user.id,
        userName: user.profile.name,
        userPhoto: user.profile.photo,
        text,
        createdAt: new Date().toISOString()
      };

      const updatedPost = await dbHelper.findByIdAndUpdate(
        Post,
        req.params.postId,
        { $push: { comments: newComment } },
        { new: true }
      );

      res.json(updatedPost);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  deletePost: async (req, res) => {
    try {
      const post = await dbHelper.findById(Post, req.params.postId);
      if (!post) {
        return res.status(404).json({ msg: 'Post not found' });
      }

      // Check authorization: creator or admin
      if (post.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Unauthorized to delete this post' });
      }

      await dbHelper.findByIdAndDelete(Post, req.params.postId);
      res.json({ msg: 'Post deleted successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
};

module.exports = feedController;
