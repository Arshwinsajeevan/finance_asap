const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const config = require('../config');
const { success, error } = require('../utils/response');

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`Login attempt for: ${normalizedEmail}`);

    if (!email || !password) {
      return error(res, 'Email and password are required', 400);
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || !user.active) {
      return error(res, 'Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return error(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return success(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        vertical: user.vertical,
      },
    }, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    return error(res, 'Login failed');
  }
};

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role, vertical, phone } = req.body;

    if (!name || !email || !password) {
      return error(res, 'Name, email, and password are required', 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return error(res, 'User with this email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'VERTICAL_USER',
        vertical: vertical || null,
        phone: phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        vertical: true,
        createdAt: true,
      },
    });

    return success(res, user, 'User registered successfully', 201);
  } catch (err) {
    console.error('Register error:', err);
    return error(res, 'Registration failed');
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    return success(res, req.user, 'User profile retrieved');
  } catch (err) {
    return error(res, 'Failed to get profile');
  }
};

module.exports = { login, register, getMe };
