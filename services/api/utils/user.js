const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createUser(email, password, role) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      email,
      password: hash,
      salt,
      role,
    },
  });
  return user;
}

module.exports = { createUser };