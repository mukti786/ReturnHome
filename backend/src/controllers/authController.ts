import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { memoryStore } from '../store/memoryStore';
import { AuthRequest } from '../middleware/authMiddleware';
import { isMongoConnected } from '../config/db';
import { User } from '../models/User';
import { getDevAuthSecret, isDevAuthEnabled } from '../config/devAuth';

const SESSION_COOKIE = 'returnhome_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const authSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret.includes('replace-with')) {
    throw new Error('Authentication is not configured. Set a strong JWT_SECRET.');
  }
  return secret;
};

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: SESSION_DURATION_MS
});

const publicUser = (user: any) => ({
  id: String(user._id || user.id),
  name: user.name,
  email: user.email,
  role: user.role,
  organization: user.organization,
  status: user.status,
  createdAt: user.createdAt,
  ...(user.isDemo ? { isDemo: true } : {})
});

export const devLogin = (req: Request, res: Response) => {
  if (!isDevAuthEnabled()) {
    return res.status(404).json({ success: false, message: 'Local demo access is not enabled.' });
  }
  const token = jwt.sign(
    { sub: 'local-demo-investigator', isDemo: true },
    getDevAuthSecret(),
    { expiresIn: '8h', issuer: 'returnhome-dev', audience: 'returnhome-web' }
  );
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: 8 * 60 * 60 * 1000 });
  return res.json({
    success: true,
    user: {
      id: 'local-demo-investigator',
      name: 'Local demo investigator (NOT VERIFIED)',
      email: 'local-demo@invalid.example',
      role: 'Investigator',
      organization: 'Local development only',
      status: 'Active',
      createdAt: new Date().toISOString(),
      isDemo: true
    }
  });
};

const authUnavailable = (res: Response) =>
  res.status(503).json({ success: false, message: 'Authentication requires a configured MongoDB connection.' });

export const register = async (req: Request, res: Response) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const organization = typeof req.body.organization === 'string' ? req.body.organization.trim() : '';

  if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ success: false, message: 'Enter a name and a valid email address.' });
  }
  if (password.length < 12 || password.length > 128) {
    return res.status(400).json({ success: false, message: 'Use a password between 12 and 128 characters.' });
  }
  if (organization.length > 160) {
    return res.status(400).json({ success: false, message: 'Organization name is too long.' });
  }
  if (!isMongoConnected) return authUnavailable(res);

  try {
    authSecret();
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'Investigator',
      organization: organization || 'Organization access request',
      status: 'Pending'
    });

    memoryStore.auditLogs.unshift({
      id: `log-${Date.now()}`, userId: String(user._id), userName: name,
      userRole: user.role, action: 'ACCESS_REQUEST', resource: 'Auth',
      resourceId: String(user._id), ipAddress: req.ip || 'unknown',
      details: 'An investigator access request was submitted for review.',
      timestamp: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      user: publicUser(user),
      message: 'Access request received. An administrator must activate the account before sign-in.'
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }
    if (error?.message?.includes('Authentication is not configured')) {
      return res.status(503).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Could not create the access request.' });
  }
};

export const login = async (req: Request, res: Response) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || !password || email.length > 254 || password.length > 128) {
    return res.status(400).json({ success: false, message: 'Enter your email and password.' });
  }
  if (!isMongoConnected) return authUnavailable(res);

  try {
    const secret = authSecret();
    const user = await User.findOne({ email }).select('+passwordHash');
    let passwordMatches = false;
    if (user && user.passwordHash.startsWith("$2")) {
      try { passwordMatches = await bcrypt.compare(password, user.passwordHash); } catch { passwordMatches = false; }
    }
    if (!user || !passwordMatches || user.status !== 'Active') {
      return res.status(401).json({ success: false, message: 'Email or password is incorrect, or access is not active.' });
    }

    const sessionVersion = (user as any).sessionVersion || 0;
    const token = jwt.sign(
      { sub: String(user._id), sessionVersion },
      secret,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'], issuer: 'returnhome', audience: 'returnhome-web' }
    );
    res.cookie(SESSION_COOKIE, token, cookieOptions());
    memoryStore.auditLogs.unshift({
      id: `log-${Date.now()}`, userId: String(user._id), userName: user.name,
      userRole: user.role, action: 'USER_LOGIN', resource: 'Auth',
      ipAddress: req.ip || 'unknown', details: 'User signed in.',
      timestamp: new Date().toISOString()
    });
    return res.json({ success: true, user: publicUser(user) });
  } catch (error: any) {
    const configured = error?.message?.includes('Authentication is not configured');
    return res.status(configured ? 503 : 500).json({
      success: false,
      message: configured ? error.message : 'Could not sign in.'
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  return res.json({ success: true, user: req.user });
};

export const logout = async (req: Request, res: Response) => {
  const rawCookie = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  const token = rawCookie ? decodeURIComponent(rawCookie.slice(SESSION_COOKIE.length + 1)) : undefined;
  const secret = process.env.JWT_SECRET;
  if (token && secret && secret.length >= 32 && isMongoConnected) {
    try {
      const claims = jwt.verify(token, secret, { issuer: 'returnhome', audience: 'returnhome-web' }) as jwt.JwtPayload;
      if (claims.sub) await User.findByIdAndUpdate(claims.sub, { $inc: { sessionVersion: 1 } });
    } catch {
      // Expired or invalid cookies are still cleared below.
    }
  }
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  return res.json({ success: true, message: 'Signed out.' });
};

export const requestPasswordReset = async (_req: Request, res: Response) => {
  // Intentionally does not reveal account existence. Delivery requires a configured mail provider.
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return res.status(503).json({
      success: false,
      message: 'Password recovery is unavailable until an email delivery provider is configured. Contact your organization administrator.'
    });
  }
  return res.status(501).json({
    success: false,
    message: 'Password recovery delivery is not implemented yet. Contact your organization administrator.'
  });
};







