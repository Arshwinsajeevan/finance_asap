import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import config from '../config';
import { success, error } from '../utils/response';

/**
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
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
      { expiresIn: config.jwtExpiresIn as any }
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
 * Only ADMINs can assign elevated roles (FINANCE_OFFICER, ADMIN).
 * FINANCE_OFFICERs can only create VERTICAL_USER or STUDENT accounts.
 */
export const register = async (req: Request | any, res: Response) => {
  try {
    const { name, email, password, role, vertical, phone } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return error(res, 'User with this email already exists', 409);
    }

    // ── Role enforcement: prevent privilege escalation ──
    let assignedRole = 'VERTICAL_USER'; // Safe default

    if (req.user && req.user.role === 'ADMIN') {
      // ADMINs can assign any role
      assignedRole = role || 'VERTICAL_USER';
    } else if (req.user && req.user.role === 'FINANCE_OFFICER') {
      // Finance officers can only create VERTICAL_USER or STUDENT
      if (role === 'VERTICAL_USER' || role === 'STUDENT') {
        assignedRole = role;
      }
      // Silently ignore attempts to create ADMIN or FINANCE_OFFICER
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: assignedRole,
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
export const getMe = async (req: Request | any, res: Response) => {
  try {
    return success(res, req.user, 'User profile retrieved');
  } catch (err) {
    return error(res, 'Failed to get profile');
  }
};
