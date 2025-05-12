/**
 * Token Service
 * Manages JWT token generation, validation, and revocation
 */

const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

// In-memory token blacklist (use Redis for production)
const tokenBlacklist = new Set();

const tokenService = {
  /**
   * Generate access token for user
   * @param {Object} user - User object
   * @param {string} sessionId - Optional session ID
   * @returns {string} JWT access token
   */
  generateAccessToken(user, sessionId) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId: sessionId || null
    };
    
    return jwt.sign(payload, jwtConfig.accessTokenSecret, {
      expiresIn: jwtConfig.accessTokenExpiry,
    });
  },
  
  /**
   * Generate refresh token for user
   * @param {Object} user - User object
   * @param {string} sessionId - Optional session ID
   * @returns {string} JWT refresh token
   */
  generateRefreshToken(user, sessionId) {
    const payload = {
      id: user.id,
      tokenVersion: user.tokenVersion || 0, // For token revocation
      sessionId: sessionId || null
    };
    
    return jwt.sign(payload, jwtConfig.refreshTokenSecret, {
      expiresIn: jwtConfig.refreshTokenExpiry,
    });
  },
  
  /**
   * Verify access token
   * @param {string} token - JWT access token
   * @returns {Object} Decoded token payload
   */
  verifyAccessToken(token) {
    try {
      if (tokenBlacklist.has(token)) {
        throw new Error('Token has been blacklisted');
      }
      
      return jwt.verify(token, jwtConfig.accessTokenSecret);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Verify refresh token
   * @param {string} token - JWT refresh token
   * @returns {Object} Decoded token payload
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, jwtConfig.refreshTokenSecret);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Revoke token (add to blacklist)
   * @param {string} token - JWT token to revoke
   * @returns {boolean} Success status
   */
  revokeToken(token) {
    tokenBlacklist.add(token);
    return true;
  },
  
  /**
   * Clear expired tokens from blacklist
   * @returns {boolean} Success status
   */
  clearExpiredTokens() {
    // In production, use Redis with TTL (time-to-live)
    // This is a simplified version for development
    return true;
  }
};

module.exports = tokenService;