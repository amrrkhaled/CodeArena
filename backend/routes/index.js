const authRoutes = require('./auth.routes');
const contestRoutes = require('./contest.routes');
const leaderboardRoutes = require('./leaderboard.routes');
const problemRoutes = require('./problems.routes');
const submissionRoutes = require('./submission.routes');
const languageRoutes = require('./language.routes');

function registerRoutes(app) {
  app.use('/api/auth', authRoutes);
  app.use('/api/contests', contestRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/problems', problemRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/languages', languageRoutes);
}

module.exports = {
  registerRoutes,
};
