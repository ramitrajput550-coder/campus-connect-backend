// Member 4 - Admin Routes
const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'admin-ok' }));

module.exports = router;