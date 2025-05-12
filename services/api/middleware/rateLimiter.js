/**
 * Rate Limiter Middleware
 * Implements rate limiting for API endpoints to prevent abuse
 */

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for login attempts
 * Restricts to 5 failed attempts per IP in 15 minutes
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true // Only count failed attempts
});

/**
 * General API rate limiter
 * Restricts to 100 requests per IP in 10 minutes
 */
const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again later.'
  }
});

module.exports = {
  loginLimiter,
  apiLimiter
};