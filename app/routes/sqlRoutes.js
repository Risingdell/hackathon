const express = require('express');
const router = express.Router();
const { runQuery, checkAIServiceHealth, connectDatabase } = require('../controllers/sqlController');

// Main query endpoint
router.post('/query', runQuery);

// Health check endpoint
router.get('/health', checkAIServiceHealth);

// Database connection endpoint
router.post('/connect', connectDatabase);

module.exports = router;
