import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/authMiddleware';
import { isMongoConnected } from '../config/db';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
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
  phone: user.phone,
  status: user.status,
  avatarUrl: user.avatarUrl,
  bio: user.bio,
  createdAt: user.createdAt,
  ...(user.isDemo ? { isDemo: true } : {})
});

const writeAuditLog = async (data: {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  details: string;
}) => {
  try {
    if (isMongoConnected) {
      await AuditLog.create({ ...data, timestamp: new Date() });
    }
  } catch {
    // Audit log failure must not break the main operation
  }
};

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

// Register a Citizen account (self-service)
export const registerCitizen = async (req: Request, res: Response) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ success: false, message: 'Enter a name and a valid email address.' });
  }
  if (password.length < 12 || password.length > 128) {
    return res.status(400).json({ success: false, message: 'Use a password between 12 and 128 characters.' });
  }
  if (!isMongoConnected) return authUnavailable(res);

  try {
    authSecret();
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'Citizen',
      organization: '',
      status: 'Active' // Citizens are immediately active
    });

    await writeAuditLog({
      userId: String(user._id),
      userName: name,
      userRole: 'Citizen',
      action: 'USER_REGISTER',
      resource: 'Auth',
      resourceId: String(user._id),
      ipAddress: req.ip || 'unknown',
      details: 'Citizen account registered.'
    });

    return res.status(201).json({
      success: true,
      user: publicUser(user),
      message: 'Account created. You can now sign in.'
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }
    if (error?.message?.includes('Authentication is not configured')) {
      return res.status(503).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Could not create the account.' });
  }
};

// Register an Investigator access request (requires admin approval)
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

    await writeAuditLog({
      userId: String(user._id),
      userName: name,
      userRole: 'Investigator',
      action: 'ACCESS_REQUEST',
      resource: 'Auth',
      resourceId: String(user._id),
      ipAddress: req.ip || 'unknown',
      details: 'An investigator access request was submitted for review.'
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
    if (user && user.passwordHash.startsWith('$2')) {
      try { passwordMatches = await bcrypt.compare(password, user.passwordHash); } catch { passwordMatches = false; }
    }
    if (!user || !passwordMatches || user.status !== 'Active') {
      return res.status(401).json({
        success: false,
        message: user && user.status === 'Pending'
          ? 'Your account is pending administrator approval.'
          : 'Email or password is incorrect, or access is not active.'
      });
    }

    const sessionVersion = (user as any).sessionVersion || 0;
    const token = jwt.sign(
      { sub: String(user._id), sessionVersion, role: user.role },
      secret,
      {
        expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
        issuer: 'returnhome',
        audience: 'returnhome-web'
      }
    );
    res.cookie(SESSION_COOKIE, token, cookieOptions());

    await writeAuditLog({
      userId: String(user._id),
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      resource: 'Auth',
      ipAddress: req.ip || 'unknown',
      details: 'User signed in.'
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
      if (claims.sub) {
        const user = await User.findByIdAndUpdate(claims.sub, { $inc: { sessionVersion: 1 } });
        if (user) {
          await writeAuditLog({
            userId: claims.sub,
            userName: user.name,
            userRole: user.role,
            action: 'USER_LOGOUT',
            resource: 'Auth',
            ipAddress: req.ip || 'unknown',
            details: 'User signed out.'
          });
        }
      }
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

// Admin: list all users with optional filtering
export const listUsers = async (req: AuthRequest, res: Response) => {
  if (!isMongoConnected) return authUnavailable(res);
  try {
    const { status, role, page = 1, limit = 20 } = req.query;
    const filter: Record<string, any> = {};
    if (status && status !== 'All') filter.status = status;
    if (role && role !== 'All') filter.role = role;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    return res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      users: users.map(u => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        organization: u.organization,
        status: u.status,
        approvedByName: u.approvedByName,
        approvedAt: u.approvedAt,
        createdAt: u.createdAt
      }))
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: approve an investigator account
export const approveUser = async (req: AuthRequest, res: Response) => {
  if (!isMongoConnected) return authUnavailable(res);
  const { id } = req.params;
  const { role } = req.body;

  try {
    const targetRole = role && ['Admin', 'Investigator', 'Analyst', 'Viewer', 'Citizen'].includes(role)
      ? role : 'Investigator';

    const user = await User.findByIdAndUpdate(
      id,
      {
        status: 'Active',
        role: targetRole,
        approvedBy: req.user?.id,
        approvedByName: req.user?.name,
        approvedAt: new Date()
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await writeAuditLog({
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'Admin',
      userRole: req.user?.role || 'Admin',
      action: 'USER_APPROVE',
      resource: 'Users',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
      details: `User ${user.email} approved with role ${targetRole}.`
    });

    return res.json({
      success: true,
      user: publicUser(user),
      message: `Account activated with role ${targetRole}.`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: deactivate a user
export const deactivateUser = async (req: AuthRequest, res: Response) => {
  if (!isMongoConnected) return authUnavailable(res);
  const { id } = req.params;

  if (id === req.user?.id) {
    return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { status: 'Inactive', $inc: { sessionVersion: 1 } },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await writeAuditLog({
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'Admin',
      userRole: req.user?.role || 'Admin',
      action: 'USER_DEACTIVATE',
      resource: 'Users',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
      details: `User ${user.email} deactivated.`
    });

    return res.json({ success: true, message: 'Account deactivated.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update own profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  if (!isMongoConnected) return authUnavailable(res);
  const allowedFields = ['name', 'organization', 'phone', 'bio'];
  const updates: Record<string, any> = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      const val = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
      updates[field] = val;
    }
  }

  if (updates.name !== undefined && (!updates.name || updates.name.length > 100)) {
    return res.status(400).json({ success: false, message: 'Name must be 1–100 characters.' });
  }

  try {
    const user = await User.findByIdAndUpdate(req.user?.id, updates, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user: publicUser(user) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Change own password
export const changePassword = async (req: AuthRequest, res: Response) => {
  if (!isMongoConnected) return authUnavailable(res);
  const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Enter your current and new passwords.' });
  }
  if (newPassword.length < 12 || newPassword.length > 128) {
    return res.status(400).json({ success: false, message: 'New password must be 12–128 characters.' });
  }

  try {
    const user = await User.findById(req.user?.id).select('+passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(req.user?.id, {
      passwordHash: hash,
      $inc: { sessionVersion: 1 }
    });

    await writeAuditLog({
      userId: req.user?.id || 'unknown',
      userName: req.user?.name || 'Unknown',
      userRole: req.user?.role || 'Unknown',
      action: 'PASSWORD_CHANGE',
      resource: 'Auth',
      ipAddress: req.ip || 'unknown',
      details: 'User changed their password. All sessions invalidated.'
    });

    res.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    return res.json({ success: true, message: 'Password changed. Please sign in again.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
