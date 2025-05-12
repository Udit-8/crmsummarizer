/**
 * Authentication Middleware
 * Provides middleware functions for validating JWT tokens and checking roles
 */

const tokenService = require('../services/tokenService');

const authMiddleware = {
  /**
   * Verify JWT access token
   * Attaches user object to request if token is valid
   */
  authenticateToken(req, res, next) {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ error: 'Access token is required' });
    }
    
    try {
      // Verify token
      const payload = tokenService.verifyAccessToken(token);
      
      // Attach user to request
      req.user = payload;
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      
      return res.status(403).json({ error: 'Invalid token' });
    }
  },
  
  /**
   * Check if user has required role
   * @param {string} role - Required role
   * @returns {Function} Middleware function
   */
  requireRole(role) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      if (req.user.role !== role) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      next();
    };
  }
};

module.exports = authMiddleware; 