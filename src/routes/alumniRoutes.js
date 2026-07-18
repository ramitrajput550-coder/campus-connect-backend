// Member 2 - Alumni Routes
const express = require('express');
const router = express.Router();
const { getAlumniDashboard } = require('../controllers/alumniController');

router.get('/dashboard', getAlumniDashboard);

module.exports = router;