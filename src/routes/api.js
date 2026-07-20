const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');

// Controllers
const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const feedController = require('../controllers/feedController');
const networkController = require('../controllers/networkController');
const mentorshipController = require('../controllers/mentorshipController');
const referralController = require('../controllers/referralController');
const eventController = require('../controllers/eventController');
const chatController = require('../controllers/chatController');
const adminController = require('../controllers/adminController');
const communityController = require('../controllers/communityController');
const aiController = require('../controllers/aiController');

// --- Public Seeding Route ---
router.get('/seed-db', async (req, res) => {
  try {
    const seedData = require('../config/seed');
    await seedData();
    res.json({ message: 'Database seeded successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Auth Routes ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', auth, authController.getMe);
router.put('/auth/verify-email', auth, authController.verifyEmail);

// --- Profile Routes ---
router.get('/profile/:userId', auth, profileController.getProfile);
router.put('/profile', auth, profileController.updateProfile);

// --- Feed Routes ---
router.post('/posts', auth, feedController.createPost);
router.get('/posts', auth, feedController.getPosts);
router.put('/posts/:postId/like', auth, feedController.toggleLike);
router.post('/posts/:postId/comment', auth, feedController.addComment);
router.delete('/posts/:postId', auth, feedController.deletePost);

// --- Connection / Networking Routes ---
router.post('/network/connect', auth, networkController.sendRequest);
router.put('/network/accept/:requesterId', auth, networkController.acceptRequest);
router.get('/network/connections', auth, networkController.getConnections);
router.get('/network/requests', auth, networkController.getPendingRequests);
router.get('/network/suggested', auth, networkController.getSuggestedConnections);
router.get('/network/alumni', auth, networkController.searchAlumni);

// --- Mentorship Routes ---
router.post('/mentorship/request', auth, mentorshipController.requestSession);
router.get('/mentorship/sessions', auth, mentorshipController.getSessions);
router.put('/mentorship/sessions/:sessionId', auth, mentorshipController.updateSessionStatus);

// --- Referral Routes ---
router.post('/referrals/apply', auth, referralController.applyReferral);
router.get('/referrals/applications', auth, referralController.getApplications);
router.put('/referrals/applications/:applicationId', auth, referralController.updateApplicationStatus);

// --- Events Routes ---
router.post('/events', auth, eventController.createEvent);
router.get('/events', auth, eventController.getEvents);
router.put('/events/:eventId/rsvp', auth, eventController.rsvpEvent);

// --- Community Routes ---
router.get('/communities', auth, communityController.getCommunities);
router.post('/communities', auth, communityController.createCommunity);
router.put('/communities/:communityId/join', auth, communityController.joinCommunity);
router.post('/communities/:communityId/discussions', auth, communityController.addDiscussion);

// --- Chat Routes ---
router.post('/chat/message', auth, chatController.sendMessage);
router.get('/chat/messages', auth, chatController.getMessages);

// --- Admin Routes ---
router.get('/admin/unverified-alumni', auth, authorize('admin'), adminController.getUnverifiedAlumni);
router.put('/admin/verify-alumni/:userId', auth, authorize('admin'), adminController.verifyAlumni);
router.get('/admin/analytics', auth, authorize(['admin', 'placement']), adminController.getAnalytics);
router.post('/admin/create-user', auth, authorize('admin'), adminController.createUser);
router.get('/admin/users', auth, authorize('admin'), adminController.getAllUsers);
router.put('/admin/users/:userId', auth, authorize('admin'), adminController.editUser);
router.delete('/admin/users/:userId', auth, authorize('admin'), adminController.deleteUser);
router.put('/admin/posts/:postId', auth, authorize('admin'), adminController.editPost);

// --- Upload Route ---
router.post('/upload', auth, (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ msg: 'No image data provided' });

  try {
    // Return the base64 image data directly so it is saved in MongoDB persistently
    res.json({ url: image });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'File upload failed' });
  }
});

// --- AI Routes ---
router.post('/ai/chat', auth, aiController.chat);
router.post('/ai/resume-review', auth, aiController.resumeReview);
router.get('/ai/recommendations', auth, aiController.getRecommendations);

// --- Member Role Divisions (New Routes) ---
router.use('/student', auth, require('./studentRoutes'));
router.use('/alumni', auth, require('./alumniRoutes'));
router.use('/faculty', auth, require('./facultyRoutes'));
router.use('/admin-role', auth, require('./adminRoutes'));

module.exports = router;
