const express = require('express');
const router = express.Router();
const contestController = require('../controllers/contest.controller');
const { authenticateAdmin } = require('../middleware/auth.middleware');

router.get('/', contestController.getAllContests);
router.get('/:id', contestController.getContestById);
router.post('/', authenticateAdmin, contestController.createContest);
router.put('/:id', authenticateAdmin, contestController.updateContest);

module.exports = router;
