/**
 * Test script for user login
 * Run with: node scripts/test-login.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testLogin() {
  try {
    console.log('Attempting to login...');
    
    const loginData = {
      email: 'test@example.com',
      password: 'Password123!'
    };
    
    const response = await axios.post(`${API_URL}/auth/login`, loginData, {
      validateStatus: null // Return the response regardless of status code
    });
    
    console.log('Status:', response.status);
    console.log('Response:', response.data);

    // If there's an error, log the full response
    if (response.status !== 200) {
      console.log('Full response:', response);
    }
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
      console.error('Request details:', error.request._header);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request error:', error.message);
    }
  }
}

testLogin().catch(console.error); 