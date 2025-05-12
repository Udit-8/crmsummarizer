const { PrismaClient } =  require('@prisma/client')
const { hashPassword, verifyPassword } = require('../utils/passwordUtils');
const { hasPermission, hasPermissionWithInheritance, getAllPermissions } = require('../utils/permissions');

const prisma = new PrismaClient();

// User model operations
const UserModel = {
  // Create a new user
  async createUser(userData) {
    const { email, password, role } = userData;
    
    // Hash the password
    const { hash, salt } = await hashPassword(password);
    
    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        salt,
        role
      }
    });
    
    // Don't return the password or salt
    const { password: _, salt: __, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  // Get user by ID
  async getUserById(id) {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) return null;
    
    // Don't return the password or salt
    const { password, salt, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  // Update user
  async updateUser(id, userData) {
    const user = await prisma.user.update({
      where: { id },
      data: userData
    });
    
    // Don't return the password or salt
    const { password, salt, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  // Change user's role
  async changeRole(id, newRole) {
    return await prisma.user.update({
      where: { id },
      data: { role: newRole }
    });
  },
  
  // Check if user has a specific permission
  async hasPermission(userId, permission) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) return false;
    return hasPermission(user.role, permission);
  },
  
  // Check if user has a permission (including inherited permissions)
  async hasPermissionWithInheritance(userId, permission) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) return false;
    return hasPermissionWithInheritance(user.role, permission);
  },
  
  // Get all permissions for a user
  async getUserPermissions(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) return [];
    return getAllPermissions(user.role);
  },
  
  // Authenticate a user
  async authenticate(email, password) {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) return null;
    
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) return null;
    
    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    
    // Don't return the password or salt
    const { password: _, salt: __, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
};

module.exports = UserModel;