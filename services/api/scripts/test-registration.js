/**
 * Test script for user registration
 * Run with: node scripts/test-registration.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testRegistration() {
  try {
    console.log('Attempting to register a user...');
    
    const userData = {
      email: 'test@example.com',
      password: 'Password123!',
      role: 'ADMIN' // Make sure this matches your Role enum
    };
    
    const response = await axios.post(`${API_URL}/auth/register`, userData, {
      validateStatus: null // Return the response regardless of status code
    });
    
    console.log('Status:', response.status);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error object:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Is the server running?');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request error:', error.message);
    }
  }
}

testRegistration().catch(console.error);
