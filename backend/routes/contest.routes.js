const express = require('express');
const router = express.Router();
const contestController = require('../controllers/contest.controller');
const { authenticateAdmin } = require('../middleware/auth.middleware');

router.get('/',     contestController.getAllContests);
router.get('/:id',  contestController.getContestById);
router.post('/',    authenticateAdmin, contestController.createContest);
router.put('/:id',  authenticateAdmin, contestController.updateContest);

// Status transitions (admin only)
router.post('/:id/publish',   authenticateAdmin, contestController.publishContest);
router.post('/:id/unpublish', authenticateAdmin, contestController.unpublishContest);
router.post('/:id/freeze',    authenticateAdmin, contestController.freezeContest);
router.post('/:id/finish',    authenticateAdmin, contestController.finishContest);

module.exports = router;