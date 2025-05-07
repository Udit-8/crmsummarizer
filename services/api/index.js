const logger = require('./logger');
const express = require('express');
const app = express();

logger.info('CRM Summarizer API starting up...');

app.get('/', (req, res) => {
  logger.info('Received request on /');
  res.send('Hello from CRM Summarizer!');
});

app.listen(3000, () => {
  logger.info('Server running on port 3000');
});
