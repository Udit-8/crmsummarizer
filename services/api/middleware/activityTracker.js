const sessionService = require('../services/sessionService');

// Middleware to track user activity and update session
const activityTracker = async (req, res, next) => {
  try {
    // Check if user and session information is available
    if (req.user && req.user.sessionId) {
      // Update session activity timestamp
      await sessionService.updateActivity(req.user.sessionId);
    }
    
    next();
  } catch (error) {
    console.error('Activity tracking error:', error);
    next(); // Continue even if activity tracking fails
  }
};

module.exports = activityTracker;