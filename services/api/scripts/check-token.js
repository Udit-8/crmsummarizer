/**
 * Check HubSpot token status
 * Usage: node scripts/check-token.js <userId>
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkToken(userId) {
  userId = parseInt(userId);
  
  try {
    // Get token information
    const token = await prisma.hubspotToken.findFirst({
      where: { userId }
    });
    
    if (!token) {
      console.error(`No HubSpot token found for user ID: ${userId}`);
      return;
    }
    
    // Calculate expiration status
    const now = new Date();
    const expiresAt = new Date(token.expiresAt);
    const isExpired = expiresAt < now;
    const timeRemaining = Math.round((expiresAt - now) / (60 * 1000)); // in minutes
    
    console.log('------------------------------------------------');
    console.log(`HubSpot Token Info for User ID: ${userId}`);
    console.log('------------------------------------------------');
    console.log(`Token ID: ${token.id}`);
    console.log(`Access Token: ${token.accessToken.substring(0, 10)}...`);
    console.log(`Refresh Token: ${token.refreshToken.substring(0, 10)}...`);
    console.log(`Scopes: ${token.scopes}`);
    console.log(`Created At: ${token.createdAt}`);
    console.log(`Updated At: ${token.updatedAt}`);
    console.log('');
    console.log(`Current Time: ${now}`);
    console.log(`Expires At: ${expiresAt}`);
    console.log(`Status: ${isExpired ? 'EXPIRED' : 'VALID'}`);
    
    if (isExpired) {
      console.log(`Expired ${Math.abs(timeRemaining)} minutes ago`);
    } else {
      console.log(`Time Remaining: ${timeRemaining} minutes`);
    }
    console.log('------------------------------------------------');
  } catch (error) {
    console.error('Error checking token:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get user ID from command line argument
const userId = process.argv[2];
if (!userId) {
  console.error('Please provide a user ID as an argument');
  console.error('Usage: node scripts/check-token.js <userId>');
  process.exit(1);
}

checkToken(userId).catch(console.error); 