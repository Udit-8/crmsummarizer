/**
 * HubSpot Configuration
 * Contains settings for HubSpot API integration and OAuth
 */

module.exports = {
  // OAuth settings
  clientId: process.env.HUBSPOT_CLIENT_ID,
  clientSecret: process.env.HUBSPOT_CLIENT_SECRET,
  redirectUri: process.env.HUBSPOT_REDIRECT_URI || 'http://localhost:3000/api/hubspot/callback',
  scopes: process.env.HUBSPOT_SCOPES || 'contacts content timeline',
  
  // API URLs
  authUrl: 'https://app.hubspot.com/oauth/authorize',
  tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
  apiBaseUrl: 'https://api.hubapi.com',
  
  // Rate limiting (requests per second)
  rateLimit: parseInt(process.env.HUBSPOT_RATE_LIMIT) || 10,
  
  // Refresh token settings
  refreshBeforeExpiryMs: 5 * 60 * 1000, // Refresh 5 minutes before expiry
};