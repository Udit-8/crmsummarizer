const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info', // Change to 'debug' for more details
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    })
  ),
  transports: [
    new transports.Console(),
    // You can add file transports here if needed
  ],
});

module.exports = logger; 