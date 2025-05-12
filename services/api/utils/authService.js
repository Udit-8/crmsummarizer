const { PrismaClient } = require('@prisma/client');
const { hashPassword, verifyPassword } = require('../utils/auth');
const tokenService = require('../utils/tokenService');

const prisma = new PrismaClient();

const authService = {
  // User login
  async login(email, password) {
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    
    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = tokenService.generateRefreshToken(user);
    
    return { user, accessToken, refreshToken };
  },
  
  // Register new user
  async register(userData) {
    const { email, password, role } = userData;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Hash password
    const { hash, salt } = await hashPassword(password);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        salt,
        role
      }
    });
    
    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = tokenService.generateRefreshToken(user);
    
    return { user, accessToken, refreshToken };
  },
  
  // Refresh access token
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const payload = tokenService.verifyRefreshToken(refreshToken);
      
      // Get user
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check token version (for revocation)
      if (user.tokenVersion !== payload.tokenVersion) {
        throw new Error('Token has been revoked');
      }
      
      // Generate new access token
      const accessToken = tokenService.generateAccessToken(user);
      
      return { accessToken };
    } catch (error) {
      throw error;
    }
  },
  
  // Logout user
  async logout(accessToken) {
    // Add access token to blacklist
    tokenService.revokeToken(accessToken);
    
    return true;
  },
  
  // Revoke all user tokens (force logout from all devices)
  async revokeUserTokens(userId) {
    // Increment token version to invalidate all refresh tokens
    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } }
    });
    
    return true;
  }
};

module.exports = authService;