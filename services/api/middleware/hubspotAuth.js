/**
 * HubSpot Authentication Middleware
 * Provides middleware functions for HubSpot API authentication
 */

const hubspotAuthService = require('../services/hubspot/authService');
const logger = require('../utils/logger');

/**
 * Middleware to ensure user has connected HubSpot
 * Responds with error and auth URL if not connected
 */
const requireHubspotAuth = async (req, res, next) => {
  try {
    // First check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if user has connected to HubSpot
    const isConnected = await hubspotAuthService.isConnected(req.user.id);
    
    if (!isConnected) {
      // Generate auth URL for connection
      const authUrl = hubspotAuthService.generateAuthUrl(req.user.id);
      
      return res.status(403).json({
        error: 'HubSpot integration not connected',
        message: 'Please connect your HubSpot account',
        authUrl
      });
    }
    
    // User is connected, proceed to next middleware
    next();
  } catch (error) {
    logger.error('HubSpot auth middleware error:', error.message);
    return res.status(500).json({ error: 'Error verifying HubSpot connection' });
  }
};

/**
 * Middleware to attach valid HubSpot access token to request
 * Must be used after requireHubspotAuth
 */
const withHubspotToken = async (req, res, next) => {
  try {
    // Get a valid token (refreshes if needed)
    const accessToken = await hubspotAuthService.getValidAccessToken(req.user.id);
    
    // Attach token to request for use in API client
    req.hubspotToken = accessToken;
    
    next();
  } catch (error) {
    logger.error('HubSpot token middleware error:', error.message);
    
    // If token refresh failed, may need to reconnect
    if (error.message.includes('refresh')) {
      const authUrl = hubspotAuthService.generateAuthUrl(req.user.id);
      return res.status(401).json({
        error: 'HubSpot authentication expired',
        message: 'Please reconnect your HubSpot account',
        authUrl
      });
    }
    
    return res.status(500).json({ error: 'Error retrieving HubSpot access token' });
  }
};

module.exports = {
  requireHubspotAuth,
  withHubspotToken
};