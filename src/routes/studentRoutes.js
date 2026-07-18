// Member 1 - Student Routes
const express = require('express');
const router = express.Router();
const { getStudentProfile } = require('../controllers/studentController');

router.get('/profile', getStudentProfile);

module.exports = router;