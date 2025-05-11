const logger = require('./logger');
const express = require('express');
const userRoutes = require('./routes/userRoutes');
const app = express();

app.use(express.json());

// Set up routes
app.use('/api/users', userRoutes);
logger.info('CRM Summarizer API starting up...');

app.get('/', (req, res) => {
  logger.info('Received request on /');
  res.send('Hello from CRM Summarizer!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;
