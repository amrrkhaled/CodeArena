const express = require('express');
const router = express.Router();
const {
  submit,
  getMySubmissions,
  getSubmissionById,
  getSolvedCount,
  getAllSubmissions,
  getSubmissionByIdPublic
} = require('../controllers/submission.controller');
const { authenticateTeam, authenticateAdmin } = require('../middleware/auth.middleware');

router.post('/', authenticateTeam, submit);
router.get('/mine', authenticateTeam, getMySubmissions);
router.get('/solved-count', authenticateTeam, getSolvedCount);
router.get('/:id', authenticateTeam, getSubmissionById);
router.get('/', authenticateAdmin, getAllSubmissions);
router.get('/public/:id', getSubmissionByIdPublic); // Public route to get submission by ID


module.exports = router;
