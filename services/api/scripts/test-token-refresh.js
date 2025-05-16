/**
 * Test HubSpot token refresh functionality
 * Usage: node scripts/test-token-refresh.js <userId>
 * 
 * Step 1: Check current token expiration
 * Step 2: Expire the token
 * Step 3: Request a new token and verify it's refreshed
 */

const { PrismaClient } = require('@prisma/client');
const hubspotAuthService = require('../services/hubspot/authService');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

async function testTokenRefresh(userId) {
  userId = parseInt(userId);
  
  try {
    // Step 1: Get current token and log its details
    console.log(`Checking current token for user ID: ${userId}`);
    const currentToken = await prisma.hubspotToken.findFirst({
      where: { userId }
    });
    
    if (!currentToken) {
      console.error(`No HubSpot token found for user ID: ${userId}`);
      return;
    }
    
    console.log('Current token expires at:', currentToken.expiresAt);
    console.log('Current time:', new Date());
    
    // Step 2: Expire the token by setting expiration to 10 minutes ago
    console.log('\nExpiring token...');
    const expiredDate = new Date(Date.now() - 10 * 60 * 1000);
    await prisma.hubspotToken.update({
      where: { id: currentToken.id },
      data: { expiresAt: expiredDate }
    });
    
    console.log('Token expired to:', expiredDate);
    
    // Step 3: Request a valid token through the service (which should refresh it)
    console.log('\nRequesting valid token...');
    try {
      const accessToken = await hubspotAuthService.getValidAccessToken(userId);
      console.log('New access token received:', accessToken.substring(0, 15) + '...');
      
      // Verify the token was refreshed by checking the new expiration
      const refreshedToken = await prisma.hubspotToken.findFirst({
        where: { userId }
      });
      
      console.log('New token expires at:', refreshedToken.expiresAt);
      
      // Calculate time difference
      const oldExpiry = new Date(expiredDate).getTime();
      const newExpiry = new Date(refreshedToken.expiresAt).getTime();
      const diffMinutes = Math.round((newExpiry - oldExpiry) / (60 * 1000));
      
      console.log(`\nToken expiry extended by approximately ${diffMinutes} minutes`);
      console.log('Token refresh test completed successfully!');
    } catch (error) {
      console.error('Error refreshing token:', error.message);
      console.error('Full error:', error);
    }
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get user ID from command line argument
const userId = process.argv[2];
if (!userId) {
  console.error('Please provide a user ID as an argument');
  console.error('Usage: node scripts/test-token-refresh.js <userId>');
  process.exit(1);
}

testTokenRefresh(userId).catch(console.error); 