const express = require('express');
const router = express.Router();
const { runQuery, checkAIServiceHealth } = require('../controllers/sqlController');

// Main query endpoint
router.post('/query', runQuery);

// Health check endpoint
router.get('/health', checkAIServiceHealth);

module.exports = router;
