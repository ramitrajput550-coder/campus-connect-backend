// Member 3 - Faculty Routes
const express = require('express');
const router = express.Router();
const { getAnnouncements } = require('../controllers/facultyController');

router.get('/announcements', getAnnouncements);

module.exports = router;