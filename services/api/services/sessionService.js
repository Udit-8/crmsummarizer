/**
 * Session Service
 * Manages user sessions, activity tracking, and suspicious activity detection
 */

const { PrismaClient } = require('@prisma/client');
const moment = require('moment');
const uaParser = require('ua-parser-js');
const geoip = require('geoip-lite');

const prisma = new PrismaClient();

const sessionService = {
  /**
   * Create a new user session
   * @param {number} userId - User ID
   * @param {Object} req - Express request object
   * @returns {Object} Created session
   */
  async createSession(userId, req) {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Parse user agent
    const ua = uaParser(userAgent);
    
    // Get geo location (if available)
    const geo = geoip.lookup(ip);
    const location = geo ? `${geo.city}, ${geo.country}` : 'unknown';
    
    // Create session in database
    const session = await prisma.session.create({
      data: {
        userId,
        ipAddress: ip,
        userAgent,
        device: ua.device.type || ua.device.vendor || 'unknown',
        browser: ua.browser.name || 'unknown',
        os: ua.os.name || 'unknown',
        location,
        isActive: true,
        lastActivity: new Date()
      }
    });
    
    return session;
  },
  
  /**
   * Update session activity timestamp
   * @param {string} sessionId - Session ID
   * @returns {Object} Updated session
   */
  async updateActivity(sessionId) {
    return await prisma.session.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() }
    });
  },
  
  /**
   * Invalidate a session (logout)
   * @param {string} sessionId - Session ID
   * @returns {Object} Updated session
   */
  async invalidateSession(sessionId) {
    return await prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false }
    });
  },
  
  /**
   * Invalidate all sessions for a user
   * @param {number} userId - User ID
   * @returns {Object} Result with count of updated sessions
   */
  async invalidateAllSessions(userId) {
    return await prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false }
    });
  },
  
  /**
   * Get active sessions for a user
   * @param {number} userId - User ID
   * @returns {Array} List of active sessions
   */
  async getUserSessions(userId) {
    return await prisma.session.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActivity: 'desc' }
    });
  },
  
  /**
   * Cleanup inactive sessions
   * @param {number} timeoutMinutes - Timeout in minutes
   * @returns {Object} Result with count of updated sessions
   */
  async cleanupInactiveSessions(timeoutMinutes = 30) {
    const cutoff = moment().subtract(timeoutMinutes, 'minutes').toDate();
    
    return await prisma.session.updateMany({
      where: {
        isActive: true,
        lastActivity: {
          lt: cutoff
        }
      },
      data: { isActive: false }
    });
  },
  
  /**
   * Detect suspicious activity based on multiple locations
   * @param {number} userId - User ID
   * @returns {Object} Suspicious activity report
   */
  async detectSuspiciousActivity(userId) {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        createdAt: {
          gt: moment().subtract(1, 'hour').toDate()
        }
      }
    });
    
    // Check for multiple locations in a short time
    const locations = new Set(sessions.map(s => s.location).filter(l => l !== 'unknown'));
    
    return {
      suspicious: locations.size > 2,
      locations: Array.from(locations),
      sessions
    };
  }
};

module.exports = sessionService; 