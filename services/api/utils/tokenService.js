const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const jwtConfig = require('../config/jwt');

const prisma = new PrismaClient();
const tokenBlacklist = new Set(); // For development; use Redis in production

const tokenService = {
  // Generate access token
  generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    
    return jwt.sign(payload, jwtConfig.accessTokenSecret, {
      expiresIn: jwtConfig.accessTokenExpiry,
    });
  },
  
  // Generate refresh token
  generateRefreshToken(user) {
    const payload = {
      id: user.id,
      tokenVersion: user.tokenVersion || 0, // For token revocation
    };
    
    return jwt.sign(payload, jwtConfig.refreshTokenSecret, {
      expiresIn: jwtConfig.refreshTokenExpiry,
    });
  },
  
  // Verify access token
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
  
  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, jwtConfig.refreshTokenSecret);
    } catch (error) {
      throw error;
    }
  },
  
  // Revoke token (add to blacklist)
  revokeToken(token) {
    tokenBlacklist.add(token);
    return true;
  },
  
  // Clear expired tokens from blacklist (called periodically)
  clearExpiredTokens() {
    // In production, use Redis with TTL (time-to-live)
    // This is a simplified version for development
    return true;
  }
};

module.exports = tokenService;