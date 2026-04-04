const env = require('./config/env');
const { createApp } = require('./app');

const app = createApp();

app.listen(env.port, env.host, () => {
  console.log(`Server running on http://${env.host}:${env.port}`);
});
