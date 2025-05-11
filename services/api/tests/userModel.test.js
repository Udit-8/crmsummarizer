const { PrismaClient } = require('@prisma/client');
const UserModel = require('../models/userModel');

// Mock the PrismaClient for testing
jest.mock('@prisma/client', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    salt: 'salt',
    role: 'MANAGER',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        create: jest.fn().mockResolvedValue(mockUser),
        findUnique: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockResolvedValue(mockUser)
      }
    }))
  };
});

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a user successfully', async () => {
    const user = await UserModel.createUser({
      email: 'test@example.com',
      password: 'password123',
      role: 'MANAGER'
    });

    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('MANAGER');
    expect(user.password).toBeUndefined(); // Should not include password
  });

  test('gets user by id', async () => {
    const user = await UserModel.getUserById(1);
    expect(user).toBeDefined();
    expect(user.id).toBe(1);
    expect(user.password).toBeUndefined(); // Should not include password
  });

  test('manager has assign_leads permission', async () => {
    const hasPermission = await UserModel.hasPermission(1, 'assign_leads');
    expect(hasPermission).toBe(true);
  });

  test('manager does not have system_configuration permission', async () => {
    const hasPermission = await UserModel.hasPermission(1, 'system_configuration');
    expect(hasPermission).toBe(false);
  });
});