/**
 * Session Cleanup Job
 * Periodically cleans up inactive sessions to manage database size
 */

const sessionService = require('../services/sessionService');
const logger = require('../utils/logger');

/**
 * Clean up inactive sessions
 * @param {number} timeoutMinutes - Session timeout in minutes
 * @returns {Object} Result with count of cleaned up sessions
 */
const cleanupInactiveSessions = async (timeoutMinutes = 30) => {
  try {
    const result = await sessionService.cleanupInactiveSessions(timeoutMinutes);
    logger.info(`Cleaned up ${result.count} inactive sessions`);
    return result;
  } catch (error) {
    logger.error('Session cleanup failed:', error);
    throw error;
  }
};

// Schedule cleanup job if this is the main module
if (require.main === module) {
  cleanupInactiveSessions()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  // Export for use in other modules
  module.exports = { cleanupInactiveSessions };
}