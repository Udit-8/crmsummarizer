const express = require('express');
const UserModel = require('../models/userModel');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // Validate inputs
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const user = await UserModel.createUser({ email, password, role });
    return res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// Check user permissions (example route)
router.get('/permissions/:userId/:permission', async (req, res) => {
  try {
    const { userId, permission } = req.params;
    const hasDirectPermission = await UserModel.hasPermission(parseInt(userId), permission);
    const hasInheritedPermission = await UserModel.hasPermissionWithInheritance(parseInt(userId), permission);
    
    return res.status(200).json({
      hasDirectPermission,
      hasInheritedPermission
    });
  } catch (error) {
    console.error('Error checking permissions:', error);
    return res.status(500).json({ error: 'Failed to check permissions' });
  }
});

// Get all user permissions
router.get('/permissions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const permissions = await UserModel.getUserPermissions(parseInt(userId));
    
    return res.status(200).json({ permissions });
  } catch (error) {
    console.error('Error getting permissions:', error);
    return res.status(500).json({ error: 'Failed to get permissions' });
  }
});

module.exports = router;