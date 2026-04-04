const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboard.controller');
const { authenticateAdmin } = require('../middleware/auth.middleware');

// GET /api/leaderboard/:contestId
router.get('/:contestId', leaderboardController.getLeaderboard);

// GET /api/leaderboard/admin/:contestId
router.get('/admin/:contestId', authenticateAdmin, leaderboardController.adminLeaderboard);

// GET /api/leaderboard/admin/:contestId/:teamId
router.get('/admin/:contestId/:teamId', authenticateAdmin, leaderboardController.adminLeaderboardTeamByID);

module.exports = router;
