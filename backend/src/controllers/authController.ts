import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { memoryStore } from '../store/memoryStore';
import { AuthRequest } from '../middleware/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'khojsetu_jwt_secret_key_2026_investigation_secure_token';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, organization, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existingUser = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      role: role || 'Investigator',
      organization: organization || 'ReturnHome Investigation Unit',
      phone: phone || '',
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    memoryStore.users.push(newUser);

    // Audit log
    memoryStore.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: newUser.id,
      userName: newUser.name,
      userRole: newUser.role,
      action: 'USER_REGISTER',
      resource: 'Users',
      resourceId: newUser.id,
      ipAddress: req.ip || '127.0.0.1',
      details: `New user account created for ${newUser.name} (${newUser.role}).`,
      timestamp: new Date().toISOString()
    });

    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, organization: newUser.organization },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      token,
      user: newUser,
      message: 'Account registered successfully.'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    let user = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Create instant demo user if logging in with demo credentials
      user = {
        id: `usr-${Date.now()}`,
        name: email.split('@')[0].toUpperCase(),
        email: email.toLowerCase(),
        role: email.includes('admin') ? 'Admin' : 'Investigator',
        organization: 'ReturnHome Special Investigation Unit',
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      memoryStore.users.push(user);
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, organization: user.organization },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Audit log
    memoryStore.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      resource: 'Auth',
      ipAddress: req.ip || '127.0.0.1',
      details: `User ${user.name} logged in via JWT.`,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      token,
      user,
      message: 'Login successful.'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    user: req.user
  });
};

export const logout = async (req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    message: 'Logged out successfully.'
  });
};
