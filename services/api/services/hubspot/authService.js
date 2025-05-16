/**
 * HubSpot Authentication Service
 * Manages OAuth flow and token management for HubSpot API
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const hubspotConfig = require('../../config/hubspot');
const logger = require('../../utils/logger');

const prisma = new PrismaClient();

class HubspotAuthService {
  /**
   * Generate authorization URL for HubSpot OAuth flow
   * @param {number} userId - User ID for state parameter
   * @returns {string} HubSpot authorization URL
   */
  generateAuthUrl(userId) {
    // Create state parameter with user ID (for security)
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
    
    // Build authorization URL
    const url = new URL(hubspotConfig.authUrl);
    url.searchParams.append('client_id', hubspotConfig.clientId);
    url.searchParams.append('redirect_uri', hubspotConfig.redirectUri);
    url.searchParams.append('scope', hubspotConfig.scopes);
    url.searchParams.append('state', state);
    
    return url.toString();
  }
  
  /**
   * Exchange authorization code for access and refresh tokens
   * @param {string} code - Authorization code from HubSpot
   * @param {number} userId - User ID
   * @returns {Object} Token data
   */
  async exchangeCodeForTokens(code, userId) {
    try {
      logger.info(`Exchanging code for tokens for userId: ${userId}`);
      logger.info(`Using redirect URI: ${hubspotConfig.redirectUri}`);
      
      // Build params object for better logging
      const params = {
        grant_type: 'authorization_code',
        client_id: hubspotConfig.clientId,
        client_secret: hubspotConfig.clientSecret,
        redirect_uri: hubspotConfig.redirectUri,
        code
      };
      
      // Log request parameters (omit secret)
      const logParams = { ...params };
      delete logParams.client_secret;
      logger.info(`Token request params: ${JSON.stringify(logParams)}`);
      
      // Exchange code for tokens
      const response = await axios.post(hubspotConfig.tokenUrl, null, {
        params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      // Log response data (omit tokens for security)
      logger.info(`Token response received with status: ${response.status}`);
      
      const { access_token, refresh_token, expires_in, scope } = response.data;
      
      if (!access_token) {
        throw new Error('No access token received from HubSpot');
      }
      
      // Calculate expiration time
      const expiresAt = new Date(Date.now() + (expires_in * 1000));
      
      // Store tokens in database
      await this.storeTokens(userId, access_token, refresh_token, expiresAt, scope || hubspotConfig.scopes);
      
      return {
        userId,
        accessToken: access_token,
        expiresAt
      };
    } catch (error) {
      logger.error('HubSpot token exchange error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : 'No response data',
        request: error.config ? {
          url: error.config.url,
          method: error.config.method,
          params: error.config.params ? {
            ...error.config.params,
            client_secret: '***REDACTED***' // Don't log the actual secret
          } : 'No params'
        } : 'No request config'
      });
      throw new Error(`Failed to exchange authorization code for tokens: ${error.message}`);
    }
  }
  
  /**
   * Store HubSpot tokens in database
   * @param {number} userId - User ID
   * @param {string} accessToken - Access token
   * @param {string} refreshToken - Refresh token
   * @param {Date} expiresAt - Expiration date
   * @param {string} scopes - Token scopes
   * @returns {Object} Stored token data
   */
  async storeTokens(userId, accessToken, refreshToken, expiresAt, scopes) {
    try {
      // Ensure scopes is always a valid string
      const scopesStr = typeof scopes === 'string' && scopes ? 
        scopes : hubspotConfig.scopes;
      
      logger.info(`Storing HubSpot tokens for userId: ${userId} with scopes: ${scopesStr}`);
      
      // Create data object for better debugging
      const tokenData = {
        userId,
        accessToken,
        refreshToken,
        expiresAt,
        scopes: scopesStr // Make sure this is a string
      };
      
      // Check if tokens already exist for this user
      const existingToken = await prisma.hubspotToken.findFirst({
        where: { userId }
      });
      
      if (existingToken) {
        // Update existing tokens
        return await prisma.hubspotToken.update({
          where: { id: existingToken.id },
          data: tokenData
        });
      } else {
        // Create new token record
        return await prisma.hubspotToken.create({
          data: tokenData
        });
      }
    } catch (error) {
      logger.error('HubSpot token storage error:', error);
      throw new Error('Failed to store HubSpot tokens');
    }
  }
  
  /**
   * Refresh access token using stored refresh token
   * @param {number} userId - User ID
   * @returns {Object} Updated token data
   */
  async refreshAccessToken(userId) {
    try {
      // Get current tokens
      const tokenData = await prisma.hubspotToken.findFirst({
        where: { userId }
      });
      
      if (!tokenData || !tokenData.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      // Exchange refresh token for new access token
      const response = await axios.post(hubspotConfig.tokenUrl, null, {
        params: {
          grant_type: 'refresh_token',
          client_id: hubspotConfig.clientId,
          client_secret: hubspotConfig.clientSecret,
          refresh_token: tokenData.refreshToken
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const { access_token, refresh_token, expires_in } = response.data;
      
      // Calculate new expiration time
      const expiresAt = new Date(Date.now() + (expires_in * 1000));
      
      // Update tokens in database
      const updatedTokens = await prisma.hubspotToken.update({
        where: { id: tokenData.id },
        data: {
          accessToken: access_token,
          // Use new refresh token if provided, otherwise keep the existing one
          refreshToken: refresh_token || tokenData.refreshToken,
          expiresAt
        }
      });
      
      return {
        accessToken: updatedTokens.accessToken,
        expiresAt: updatedTokens.expiresAt
      };
    } catch (error) {
      logger.error('HubSpot token refresh error:', error.message);
      throw new Error('Failed to refresh HubSpot access token');
    }
  }
  
  /**
   * Get valid access token, refreshing if necessary
   * @param {number} userId - User ID
   * @returns {string} Valid access token
   */
  async getValidAccessToken(userId) {
    try {
      // Get current token data
      const tokenData = await prisma.hubspotToken.findFirst({
        where: { userId }
      });
      
      if (!tokenData) {
        throw new Error('No HubSpot integration found');
      }
      
      // Check if token is expired or will expire soon
      const now = Date.now();
      const expiresAt = new Date(tokenData.expiresAt).getTime();
      
      // If token expires in less than 5 minutes (configurable), refresh it
      if (expiresAt - now < hubspotConfig.refreshBeforeExpiryMs) {
        const refreshedData = await this.refreshAccessToken(userId);
        return refreshedData.accessToken;
      }
      
      // Return current access token
      return tokenData.accessToken;
    } catch (error) {
      logger.error('Error getting valid access token:', error.message);
      throw error;
    }
  }
  
  /**
   * Check if user has connected to HubSpot
   * @param {number} userId - User ID
   * @returns {boolean} Connection status
   */
  async isConnected(userId) {
    try {
      const tokenData = await prisma.hubspotToken.findFirst({
        where: { userId }
      });
      
      return !!tokenData;
    } catch (error) {
      logger.error('Error checking HubSpot connection:', error.message);
      return false;
    }
  }
  
  /**
   * Disconnect user from HubSpot by removing tokens
   * @param {number} userId - User ID
   * @returns {boolean} Success status
   */
  async disconnect(userId) {
    try {
      await prisma.hubspotToken.deleteMany({
        where: { userId }
      });
      
      return true;
    } catch (error) {
      logger.error('Error disconnecting from HubSpot:', error.message);
      throw new Error('Failed to disconnect from HubSpot');
    }
  }
}

module.exports = new HubspotAuthService();