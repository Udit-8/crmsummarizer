const express = require('express');
const authService = require('../utils/authService');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const { user, accessToken, refreshToken } = await authService.login(email, password);
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Return user info and access token
    const { password: _, salt: __, ...userInfo } = user;
    return res.json({ user: userInfo, accessToken });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
});

// User registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }
    
    const { user, accessToken, refreshToken } = await authService.register({ email, password, role });
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Return user info and access token
    const { password: _, salt: __, ...userInfo } = user;
    return res.status(201).json({ user: userInfo, accessToken });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message === 'User already exists') {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    return res.status(500).json({ error: 'Failed to register user' });
  }
});

// Refresh access token
router.post('/refresh-token', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is required' });
    }
    
    const { accessToken } = await authService.refreshToken(refreshToken);
    
    return res.json({ accessToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(403).json({ error: 'Invalid refresh token' });
  }
});

// User logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Get access token from Authorization header
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader && authHeader.split(' ')[1];
    
    // Revoke access token
    await authService.logout(accessToken);
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Failed to logout' });
  }
});

module.exports = router;