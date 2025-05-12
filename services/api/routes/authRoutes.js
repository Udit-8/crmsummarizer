/**
 * Authentication Routes
 * API endpoints for user authentication, registration, and session management
 */

const express = require('express');
const { loginLimiter } = require('../middleware/rateLimiter');
const { authenticateToken } = require('../middleware/auth');
const authService = require('../services/authService');
const sessionService = require('../services/sessionService');

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get tokens
 * @access Public
 */
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const { user, accessToken, refreshToken, sessionId, securityAlert } = 
      await authService.login(email, password, req);
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Set session ID in cookie (for easier client-side handling)
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Return user info, access token, and any security alerts
    const { password: _, salt: __, ...userInfo } = user;
    return res.json({ 
      user: userInfo, 
      accessToken,
      securityAlert // Will be null if no suspicious activity
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
});

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }
    
    const { user, accessToken, refreshToken, sessionId } = 
      await authService.register({ email, password, role }, req);
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Set session ID in cookie
    res.cookie('sessionId', sessionId, {
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

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh access token
 * @access Public (with refresh token)
 */
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

/**
 * @route POST /api/auth/logout
 * @desc Logout user from current device
 * @access Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Get access token from Authorization header
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader && authHeader.split(' ')[1];
    
    // Get session ID from request (attached by authenticateToken middleware)
    const sessionId = req.user.sessionId || req.cookies.sessionId;
    
    // Logout
    await authService.logout(accessToken, sessionId);
    
    // Clear cookies
    res.clearCookie('refreshToken');
    res.clearCookie('sessionId');
    
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Failed to logout' });
  }
});

/**
 * @route POST /api/auth/logout-all
 * @desc Logout user from all devices
 * @access Private
 */
router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    await authService.logoutAll(req.user.id);
    
    // Clear cookies
    res.clearCookie('refreshToken');
    res.clearCookie('sessionId');
    
    return res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    console.error('Logout all error:', error);
    return res.status(500).json({ error: 'Failed to logout from all devices' });
  }
});

/**
 * @route GET /api/auth/sessions
 * @desc Get user's active sessions
 * @access Private
 */
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await sessionService.getUserSessions(req.user.id);
    return res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    return res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

module.exports = router;