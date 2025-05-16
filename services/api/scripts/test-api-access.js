/**
 * Test HubSpot API access
 * Usage: node scripts/test-api-access.js <userId>
 * 
 * This script tests if we can access the HubSpot API with the current token
 * and demonstrates automatic token refresh if needed
 */

const axios = require('axios');
const hubspotAuthService = require('../services/hubspot/authService');
const hubspotConfig = require('../config/hubspot');

async function testApiAccess(userId) {
  try {
    userId = parseInt(userId);
    console.log(`Testing HubSpot API access for User ID: ${userId}`);
    
    // Get valid access token (will refresh if needed)
    console.log('Getting valid access token...');
    const accessToken = await hubspotAuthService.getValidAccessToken(userId);
    console.log(`Got access token: ${accessToken.substring(0, 15)}...`);
    
    // Use token to make a simple API call (get contacts)
    console.log('\nMaking API request to HubSpot...');
    const response = await axios.get(`${hubspotConfig.apiBaseUrl}/crm/v3/objects/contacts`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 5 // Just get a few contacts
      }
    });
    
    // Display response
    console.log(`API Response Status: ${response.status}`);
    console.log(`Total Contacts: ${response.data.total || 'Unknown'}`);
    
    if (response.data.results) {
      console.log('\nContacts Sample:');
      response.data.results.forEach((contact, index) => {
        console.log(`\nContact #${index + 1}:`);
        console.log(`ID: ${contact.id}`);
        console.log(`Created: ${contact.createdAt}`);
        console.log(`Updated: ${contact.updatedAt}`);
        console.log('Properties:', JSON.stringify(contact.properties, null, 2));
      });
    }
    
    console.log('\nAPI access test completed successfully!');
    
  } catch (error) {
    console.error('API access test failed:');
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from HubSpot API');
    } else {
      // Something happened in setting up the request
      console.error('Error:', error.message);
    }
  }
}

// Get user ID from command line argument
const userId = process.argv[2];
if (!userId) {
  console.error('Please provide a user ID as an argument');
  console.error('Usage: node scripts/test-api-access.js <userId>');
  process.exit(1);
}

testApiAccess(userId).catch(console.error); 