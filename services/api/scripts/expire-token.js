// scripts/expire-token.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function expireToken(userId) {
  // Set token expiration to 10 minutes ago
  const expiredDate = new Date(Date.now() - 10 * 60 * 1000);
  
  await prisma.hubspotToken.updateMany({
    where: { userId: parseInt(userId) },
    data: { expiresAt: expiredDate }
  });
  
  console.log(`Token for user ${userId} has been artificially expired`);
}

const userId = process.argv[2];
if (!userId) {
  console.error('Please provide a user ID');
  process.exit(1);
}

expireToken(userId).catch(console.error);