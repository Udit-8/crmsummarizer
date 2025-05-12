/**
 * Authentication Service
 * Manages user authentication, registration, and token management
 */

const { PrismaClient } = require('@prisma/client');
const { hashPassword, verifyPassword } = require('../utils/passwordUtils');
const tokenService = require('../services/tokenService');
const sessionService = require('./sessionService');

const prisma = new PrismaClient();

const authService = {
  /**
   * User login
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} req - Express request object
   * @returns {Object} User, tokens, and session info
   */
  async login(email, password, req) {
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    
    // Create session
    const session = await sessionService.createSession(user.id, req);
    
    // Generate tokens with session info
    const accessToken = tokenService.generateAccessToken(user, session.id);
    const refreshToken = tokenService.generateRefreshToken(user, session.id);
    
    // Check for suspicious activity
    const securityCheck = await sessionService.detectSuspiciousActivity(user.id);
    
    return { 
      user, 
      accessToken, 
      refreshToken, 
      sessionId: session.id,
      securityAlert: securityCheck.suspicious ? {
        type: 'MULTIPLE_LOCATIONS',
        locations: securityCheck.locations
      } : null
    };
  },
  
  /**
   * Register new user
   * @param {Object} userData - User data (email, password, role)
   * @param {Object} req - Express request object
   * @returns {Object} User, tokens, and session info
   */
  async register(userData, req) {
    const { email, password, role } = userData;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Hash password
    const { hash, salt } = await hashPassword(password);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        salt,
        role
      }
    });
    
    // Create session
    const session = await sessionService.createSession(user.id, req);
    
    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user, session.id);
    const refreshToken = tokenService.generateRefreshToken(user, session.id);
    
    return { 
      user, 
      accessToken, 
      refreshToken,
      sessionId: session.id
    };
  },
  
  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} New access token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const payload = tokenService.verifyRefreshToken(refreshToken);
      
      // Get user
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check token version (for revocation)
      if (user.tokenVersion !== payload.tokenVersion) {
        throw new Error('Token has been revoked');
      }
      
      // Generate new access token
      const accessToken = tokenService.generateAccessToken(user, payload.sessionId);
      
      return { accessToken };
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Logout user
   * @param {string} accessToken - Access token
   * @param {string} sessionId - Session ID
   * @returns {boolean} Success status
   */
  async logout(accessToken, sessionId) {
    // Revoke token
    tokenService.revokeToken(accessToken);
    
    // Invalidate session
    if (sessionId) {
      await sessionService.invalidateSession(sessionId);
    }
    
    return true;
  },
  
  /**
   * Logout user from all devices
   * @param {number} userId - User ID
   * @returns {boolean} Success status
   */
  async logoutAll(userId) {
    // Revoke all user tokens
    await this.revokeUserTokens(userId);
    
    // Invalidate all sessions
    await sessionService.invalidateAllSessions(userId);
    
    return true;
  },
  
  /**
   * Revoke all tokens for a user
   * @param {number} userId - User ID
   * @returns {Object} Updated user
   */
  async revokeUserTokens(userId) {
    // Increment token version to invalidate all refresh tokens
    return await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } }
    });
  }
};

module.exports = authService; 