/**
 * Logger Utility
 * Provides consistent logging throughout the application
 */

const { createLogger, format, transports } = require('winston');

// Create logger instance
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'api' },
  transports: [
    // Console transport
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(
          ({ timestamp, level, message, ...rest }) => 
            `${timestamp} ${level}: ${message} ${Object.keys(rest).length ? JSON.stringify(rest, null, 2) : ''}`
        )
      )
    })
    
    // Add file transport for production
    // new transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new transports.File({ filename: 'logs/combined.log' }),
  ]
});

// Add stream for Morgan (HTTP logger)
logger.stream = {
  write: (message) => logger.http(message.trim())
};

module.exports = logger; 