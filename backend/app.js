require('./config/env');
require('./jobs/contestScheduler');

const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { registerRoutes } = require('./routes');

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.frontendCors,
      credentials: true,
    })
  );
  app.use(express.json());

  registerRoutes(app);

  app.get('/', (_req, res) => {
    res.send('Contest System API is running!');
  });

  return app;
}

module.exports = {
  createApp,
};
