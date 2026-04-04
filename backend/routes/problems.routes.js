const express = require('express');
const router = express.Router();
const problemController = require('../controllers/problems.controller');
const { authenticateAdmin } = require('../middleware/auth.middleware');

router.get('/:contestId', problemController.getAllProblemsForContest);
router.get('/:contestId/:id', problemController.getProblemById);
router.get('/:contestId/:id/test-cases', problemController.getAllTestCasesForProblem);

const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // temp folder

router.post('/admin/:contestId', authenticateAdmin, upload.single('file'), problemController.createProblem);

module.exports = router;
