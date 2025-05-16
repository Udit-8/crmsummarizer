/**
 * HubSpot Authentication Routes
 * Handles HubSpot OAuth flow and connection management
 */

const express = require('express');
const { authenticateToken } = require('../../middleware/auth');
const hubspotAuthService = require('../../services/hubspot/authService');
const logger = require('../../utils/logger');

const router = express.Router();

/**
 * @route GET /api/hubspot/auth
 * @desc Start HubSpot OAuth flow
 * @access Private
 */
router.get('/auth', authenticateToken, async (req, res) => {
  try {
    const authUrl = hubspotAuthService.generateAuthUrl(req.user.id);
    res.json({ 
      authUrl,
      message: 'Redirect the user to this URL to authorize HubSpot integration'
    });
  } catch (error) {
    logger.error('Generate auth URL error:', error.message);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

/**
 * @route GET /api/hubspot/callback
 * @desc Handle OAuth callback from HubSpot
 * @access Public
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;
    
    // Log all query parameters for debugging
    logger.info('HubSpot callback received with query params:', {
      hasCode: !!code,
      hasState: !!state,
      error: error || 'none',
      error_description: error_description || 'none'
    });
    
    // Check for error response from HubSpot
    if (error) {
      logger.error(`HubSpot OAuth error: ${error}`, { description: error_description });
      return res.status(400).json({ 
        error: 'HubSpot authorization error', 
        details: error_description || error 
      });
    }
    
    if (!code || !state) {
      logger.error('Missing required parameters:', { code: !!code, state: !!state });
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Decode state parameter to get user ID
    let decodedState;
    try {
      const stateString = Buffer.from(state, 'base64').toString();
      logger.info(`Decoded state string: ${stateString}`);
      decodedState = JSON.parse(stateString);
    } catch (error) {
      logger.error('Failed to decode state parameter:', error.message);
      return res.status(400).json({ error: 'Invalid state parameter format' });
    }
    
    if (!decodedState.userId) {
      logger.error('Invalid state parameter content:', decodedState);
      return res.status(400).json({ error: 'Invalid state parameter - missing userId' });
    }
    
    logger.info(`Processing OAuth callback for userId: ${decodedState.userId}`);
    
    // Exchange authorization code for tokens
    const tokenResult = await hubspotAuthService.exchangeCodeForTokens(code, decodedState.userId);
    
    logger.info('HubSpot connection successful for user:', decodedState.userId);
    
    // Redirect to success page or return success response
    // In production, you might want to redirect to a frontend success page
    res.json({ 
      success: true, 
      message: 'HubSpot successfully connected',
      userId: decodedState.userId
    });
  } catch (error) {
    logger.error('OAuth callback error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to complete HubSpot integration',
      message: error.message
    });
  }
});

/**
 * @route GET /api/hubspot/status
 * @desc Check HubSpot connection status
 * @access Private
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const isConnected = await hubspotAuthService.isConnected(req.user.id);
    
    if (isConnected) {
      res.json({ 
        connected: true,
        message: 'HubSpot account is connected'
      });
    } else {
      const authUrl = hubspotAuthService.generateAuthUrl(req.user.id);
      res.json({ 
        connected: false,
        message: 'HubSpot account is not connected',
        authUrl
      });
    }
  } catch (error) {
    logger.error('Connection status check error:', error.message);
    res.status(500).json({ error: 'Failed to check HubSpot connection status' });
  }
});

/**
 * @route POST /api/hubspot/disconnect
 * @desc Disconnect HubSpot integration
 * @access Private
 */
router.post('/disconnect', authenticateToken, async (req, res) => {
  try {
    await hubspotAuthService.disconnect(req.user.id);
    res.json({ 
      success: true,
      message: 'HubSpot integration disconnected successfully' 
    });
  } catch (error) {
    logger.error('Disconnect error:', error.message);
    res.status(500).json({ error: 'Failed to disconnect HubSpot integration' });
  }
});

module.exports = router;