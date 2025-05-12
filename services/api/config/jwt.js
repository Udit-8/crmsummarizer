/**
 * JWT Configuration
 * Contains settings for JWT token generation and validation
 */

module.exports = {
    // For development; in production use environment variables
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'your-access-token-secret',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',  // 15 minutes
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',  // 7 days
  };