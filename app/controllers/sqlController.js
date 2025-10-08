const pool = require('../db');
const axios = require('axios');

// FastAPI endpoint URL
const AI_SERVICE_URL = 'http://127.0.0.1:5001/generate-sql';
const AI_HEALTH_URL = 'http://127.0.0.1:5001/health';

async function runQuery(req, res) {
    const { nl_query } = req.body;

    // Validate input
    if (!nl_query || typeof nl_query !== 'string' || nl_query.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'Invalid input: nl_query is required and must be a non-empty string'
        });
    }

    try {
        console.log(`Processing NL query: "${nl_query}"`);

        // Call FastAPI to get SQL query with proper timeout and error handling
        let aiResponse;
        try {
            aiResponse = await axios.post(
                AI_SERVICE_URL,
                { nl_query: nl_query },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000 // 10 second timeout
                }
            );
        } catch (aiError) {
            console.error('AI Service Error:', aiError.message);

            // Check if it's a connection error
            if (aiError.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    success: false,
                    error: 'AI service is not running. Please start the Python FastAPI server on port 5001.',
                    details: 'Run: uvicorn text_to_sql_service:app --host 127.0.0.1 --port 5001'
                });
            }

            // Check if it's a timeout
            if (aiError.code === 'ECONNABORTED') {
                return res.status(504).json({
                    success: false,
                    error: 'AI service request timed out. Please try again.'
                });
            }

            // Other AI service errors
            return res.status(502).json({
                success: false,
                error: 'Failed to communicate with AI service',
                details: aiError.message
            });
        }

        // Extract SQL from AI response
        const sql_query = aiResponse.data.sql;

        if (!sql_query || typeof sql_query !== 'string') {
            console.error('Invalid SQL received from AI service:', aiResponse.data);
            return res.status(500).json({
                success: false,
                error: 'AI service returned invalid SQL query'
            });
        }

        console.log(`Generated SQL: ${sql_query}`);

        // Execute SQL in PostgreSQL
        let dbResult;
        try {
            dbResult = await pool.query(sql_query);
        } catch (dbError) {
            console.error('Database Error:', dbError.message);
            return res.status(500).json({
                success: false,
                error: 'Database query failed',
                details: dbError.message,
                sql: sql_query
            });
        }

        // Return successful response
        res.json({
            success: true,
            data: dbResult.rows,
            sql: sql_query,
            rowCount: dbResult.rowCount,
            mock_mode: aiResponse.data.mock_mode
        });

    } catch (err) {
        console.error('Unexpected Error:', err);
        res.status(500).json({
            success: false,
            error: 'An unexpected error occurred',
            details: err.message
        });
    }
}

// Health check function to verify AI service is available
async function checkAIServiceHealth(req, res) {
    try {
        const response = await axios.get(AI_HEALTH_URL, { timeout: 5000 });
        res.json({
            success: true,
            ai_service: response.data
        });
    } catch (err) {
        res.status(503).json({
            success: false,
            error: 'AI service is not available',
            details: err.message
        });
    }
}

module.exports = { runQuery, checkAIServiceHealth };
