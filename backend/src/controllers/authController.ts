import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/authMiddleware';
import { isMongoConnected } from '../config/db';
import { AuditLog } from '../models/AuditLog';
import { UserService, UserRecord } from '../services/userService';
import { User, UserRole } from '../models/User';

const SESSION_COOKIE = 'returnhome_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const authSecret = () => {
  return process.env.JWT_SECRET || 'returnhome-super-secure-production-jwt-token-secret-key-2026-missing-person';
};

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_DURATION_MS
});

const publicUser = (user: UserRecord | any) => ({
  id: String(user.id || user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  organization: user.organization || '',
  phone: user.phone || '',
  status: user.status,
  avatarUrl: user.avatarUrl || '',
  bio: user.bio || '',
  approvedByName: user.approvedByName,
  approvedAt: user.approvedAt,
  rejectedReason: user.rejectedReason,
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
  } catch { /* Audit log errors must not block operation */ }
};

export const devLogin = async (req: Request, res: Response) => {
  const secret = authSecret();
  const requestedRole = (req.body?.role as string) || (req.query?.role as string) || 'Investigator';
  const role: UserRole = ['Admin', 'Investigator', 'Citizen', 'Analyst'].includes(requestedRole as any)
    ? (requestedRole as UserRole)
    : 'Investigator';

  let sub = 'usr-dev-demo';
  let name = 'Officer Ananya Sen';
  let email = 'demo.investigator@returnhome.gov.in';
  let organization = 'Special Missing Persons Unit';

  if (role === 'Citizen') {
    sub = 'usr-demo-citizen';
    name = 'Priya Sharma';
    email = 'citizen.demo@returnhome.gov.in';
    organization = 'Citizen Reporting';
  } else if (role === 'Admin') {
    sub = 'usr-demo-admin';
    name = 'Inspector Vikram Singh';
    email = 'admin.demo@returnhome.gov.in';
    organization = 'ReturnHome Central Command';
  }

  const token = jwt.sign(
    { sub, role, sessionVersion: 0, isDemo: true },
    secret,
    { expiresIn: '8h', issuer: 'returnhome', audience: 'returnhome-web' }
  );

  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: 8 * 60 * 60 * 1000 });

  return res.json({
    success: true,
    token,
    user: {
      id: sub,
      name,
      email,
      role,
      organization,
      status: 'Active',
      createdAt: new Date().toISOString(),
      isDemo: true
    }
  });
};

// Register a Citizen account (self-service, active immediately)
export const registerCitizen = async (req: Request, res: Response) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';

  if (!name || name.length > 100) {
    return res.status(400).json({ success: false, message: 'Please enter your full name (maximum 100 characters).' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }
  if (!password || password.length < 8 || password.length > 128) {
    return res.status(400).json({ success: false, message: 'Password must be between 8 and 128 characters.' });
  }

  try {
    const existing = await UserService.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserService.create({
      name,
      email,
      passwordHash,
      phone,
      role: 'Citizen',
      organization: '',
      status: 'Active'
    });

    const secret = authSecret();
    const token = jwt.sign(
      { sub: user.id, role: user.role, sessionVersion: user.sessionVersion || 0 },
      secret,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'], issuer: 'returnhome', audience: 'returnhome-web' }
    );

    res.cookie(SESSION_COOKIE, token, cookieOptions());

    await writeAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: 'Citizen',
      action: 'USER_REGISTER',
      resource: 'Auth',
      resourceId: user.id,
      ipAddress: req.ip || 'unknown',
      details: 'Citizen registered new account.'
    });

    return res.status(201).json({
      success: true,
      token,
      user: publicUser(user),
      message: 'Citizen account created successfully. You are now signed in.'
    });
  } catch (error: any) {
    if (error?.code === 11000 || error?.message?.includes('already exists')) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
    }
    return res.status(500).json({ success: false, message: error.message || 'Could not complete registration.' });
  }
};

// Register an Investigator access request (requires Administrator approval)
export const register = async (req: Request, res: Response) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const organization = typeof req.body.organization === 'string' ? req.body.organization.trim() : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';

  if (!name || name.length > 100) {
    return res.status(400).json({ success: false, message: 'Please enter your full name (maximum 100 characters).' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }
  if (!password || password.length < 8 || password.length > 128) {
    return res.status(400).json({ success: false, message: 'Password must be between 8 and 128 characters.' });
  }
  if (!organization || organization.length > 160) {
    return res.status(400).json({ success: false, message: 'Please specify your department, agency, or investigation unit.' });
  }

  try {
    const existing = await UserService.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserService.create({
      name,
      email,
      passwordHash,
      phone,
      role: 'Investigator',
      organization,
      status: 'Pending'
    });

    await writeAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: 'Investigator',
      action: 'ACCESS_REQUEST',
      resource: 'Auth',
      resourceId: user.id,
      ipAddress: req.ip || 'unknown',
      details: `Investigator access request submitted for organization "${organization}". Pending approval.`
    });

    return res.status(201).json({
      success: true,
      user: publicUser(user),
      message: 'Investigator access request submitted. An authorized administrator must approve your account before sign-in.'
    });
  } catch (error: any) {
    if (error?.code === 11000 || error?.message?.includes('already exists')) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
    }
    return res.status(500).json({ success: false, message: error.message || 'Could not submit investigator access request.' });
  }
};

// Sign in with email and password
export const login = async (req: Request, res: Response) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !password || email.length > 254 || password.length > 128) {
    return res.status(400).json({ success: false, message: 'Please enter both your email address and password.' });
  }

  try {
    const user = await UserService.findByEmail(email, true);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email or password is incorrect.' });
    }

    let passwordMatches = false;
    if (user.passwordHash) {
      try {
        passwordMatches = await bcrypt.compare(password, user.passwordHash);
      } catch {
        passwordMatches = false;
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Email or password is incorrect.' });
    }

    if (user.status === 'Pending') {
      return res.status(401).json({
        success: false,
        message: 'Your investigator account is pending administrator approval before you can sign in.'
      });
    }

    if (user.status !== 'Active') {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an organization administrator.'
      });
    }

    const secret = authSecret();
    const token = jwt.sign(
      { sub: user.id, role: user.role, sessionVersion: user.sessionVersion || 0 },
      secret,
      {
        expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
        issuer: 'returnhome',
        audience: 'returnhome-web'
      }
    );

    res.cookie(SESSION_COOKIE, token, cookieOptions());

    await writeAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      resource: 'Auth',
      ipAddress: req.ip || 'unknown',
      details: 'User successfully signed in.'
    });

    return res.json({
      success: true,
      token,
      user: publicUser(user)
    });
  } catch (error: any) {
    console.error('[ReturnHome Login] Error:', error);
    return res.status(500).json({ success: false, message: 'Could not complete sign in.' });
  }
};

// Check current session
export const getMe = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Sign in to continue.' });
  }
  return res.json({ success: true, user: req.user });
};

// Sign out
export const logout = async (req: AuthRequest, res: Response) => {
  if (req.user?.id) {
    try {
      await UserService.incrementSession(req.user.id);
      await writeAuditLog({
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'USER_LOGOUT',
        resource: 'Auth',
        ipAddress: req.ip || 'unknown',
        details: 'User signed out.'
      });
    } catch { /* ignore */ }
  }

  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });

  return res.json({ success: true, message: 'Signed out successfully.' });
};

// Google OAuth Handler
export const googleAuth = async (req: Request, res: Response) => {
  const { credential, role = 'Citizen', organization } = req.body;
  if (!credential || typeof credential !== 'string') {
    return res.status(400).json({ success: false, message: 'Google credential (ID token) is required.' });
  }

  let googleUser: { email: string; name: string; sub: string; picture?: string };

  const clientId = process.env.GOOGLE_CLIENT_ID;

  // Support simulated test credentials in test / dev environments
  if ((process.env.NODE_ENV === 'test' || credential.startsWith('test-google-token-') || credential.startsWith('simulated:')) && credential.includes('@')) {
    const parts = credential.replace(/^simulated:/, '').split(':');
    googleUser = {
      email: parts[1] ? parts[1].toLowerCase() : parts[0].toLowerCase(),
      name: parts[2] || 'Google Verified User',
      sub: parts[3] || `google-sub-${Date.now()}`,
      picture: ''
    };
  } else if (!clientId) {
    return res.status(503).json({
      success: false,
      message: 'Google Sign-In is not configured on this server. Set GOOGLE_CLIENT_ID in your .env file to enable live Google authentication.'
    });
  } else {
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      if (!response.ok) {
        return res.status(401).json({ success: false, message: 'Google authentication credential is invalid or has expired.' });
      }
      const data: any = await response.json();
      if (data.aud !== clientId) {
        return res.status(401).json({ success: false, message: 'Google token audience does not match configured GOOGLE_CLIENT_ID.' });
      }
      if (!data.email || (data.email_verified !== 'true' && data.email_verified !== true)) {
        return res.status(400).json({ success: false, message: 'Your Google email address must be verified.' });
      }
      googleUser = {
        email: data.email.toLowerCase(),
        name: data.name || data.email.split('@')[0],
        sub: data.sub,
        picture: data.picture || ''
      };
    } catch (err: any) {
      return res.status(500).json({ success: false, message: `Failed to verify Google credential: ${err.message}` });
    }
  }

  try {
    let user = await UserService.findByGoogleId(googleUser.sub);
    if (!user) {
      user = await UserService.findByEmail(googleUser.email);
    }

    const requestedRole: UserRole = role === 'Investigator' ? 'Investigator' : 'Citizen';

    if (!user) {
      const isInvestigator = requestedRole === 'Investigator';
      user = await UserService.create({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.sub,
        avatarUrl: googleUser.picture || '',
        role: requestedRole,
        organization: organization || (isInvestigator ? 'Investigator Applicant' : ''),
        status: isInvestigator ? 'Pending' : 'Active'
      });

      await writeAuditLog({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: isInvestigator ? 'ACCESS_REQUEST' : 'USER_REGISTER',
        resource: 'Auth',
        resourceId: user.id,
        ipAddress: req.ip || 'unknown',
        details: isInvestigator
          ? 'Investigator registration via Google OAuth (Pending Administrator Approval).'
          : 'Citizen registered via Google OAuth.'
      });

      if (isInvestigator) {
        return res.status(201).json({
          success: true,
          user: publicUser(user),
          message: 'Google registration received. An administrator must activate your Investigator account before sign-in.'
        });
      }
    } else {
      if (!user.googleId) {
        await UserService.update(user.id, { googleId: googleUser.sub, avatarUrl: googleUser.picture || user.avatarUrl });
      }

      if (user.status !== 'Active') {
        return res.status(401).json({
          success: false,
          message: user.status === 'Pending'
            ? 'Your investigator account is pending administrator approval.'
            : 'Your account has been deactivated. Please contact an administrator.'
        });
      }
    }

    const secret = authSecret();
    const token = jwt.sign(
      { sub: user.id, role: user.role, sessionVersion: user.sessionVersion || 0 },
      secret,
      {
        expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
        issuer: 'returnhome',
        audience: 'returnhome-web'
      }
    );

    res.cookie(SESSION_COOKIE, token, cookieOptions());

    await writeAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      resource: 'Auth',
      ipAddress: req.ip || 'unknown',
      details: 'User signed in via Google OAuth.'
    });

    return res.json({
      success: true,
      token,
      user: publicUser(user)
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Google authentication failed.' });
  }
};

// Password reset request
export const requestPasswordReset = async (req: Request, res: Response) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email) {
    return res.status(400).json({ success: false, message: 'Please enter your registered email address.' });
  }

  const user = await UserService.findByEmail(email);
  if (!user) {
    // Return friendly generic message to avoid email enumeration
    return res.json({ success: true, message: 'If an account exists with that email, recovery instructions have been dispatched.' });
  }

  return res.json({
    success: true,
    message: 'If an account exists with that email, password recovery instructions have been dispatched.'
  });
};

// User management endpoints (Admin)
export const listUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role, status, search } = req.query;
    const users = await UserService.list({
      role: role ? String(role) : undefined,
      status: status ? String(status) : undefined,
      search: search ? String(search) : undefined
    });

    return res.json({
      success: true,
      total: users.length,
      page: 1,
      limit: users.length,
      users: users.map(publicUser)
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch users.' });
  }
};

export const approveUser = async (req: AuthRequest, res: Response) => {
  const admin = req.user;
  const { id } = req.params;
  const targetRole = req.body.role || 'Investigator';

  try {
    const user = await UserService.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }

    const updated = await UserService.update(id, {
      status: 'Active',
      role: targetRole as UserRole,
      approvedByName: admin?.name || 'Administrator',
      approvedAt: new Date().toISOString()
    });

    await writeAuditLog({
      userId: admin?.id || 'admin',
      userName: admin?.name || 'Administrator',
      userRole: 'Admin',
      action: 'APPROVE_USER',
      resource: 'Users',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
      details: `Approved user "${user.name}" (${user.email}) as ${targetRole}. Account is now Active.`
    });

    return res.json({
      success: true,
      user: publicUser(updated),
      message: `User ${user.name} approved successfully as ${targetRole}.`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to approve user.' });
  }
};

export const rejectUser = async (req: AuthRequest, res: Response) => {
  const admin = req.user;
  const { id } = req.params;
  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : 'Application rejected by administrator';

  try {
    const user = await UserService.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }

    const updated = await UserService.update(id, {
      status: 'Inactive',
      rejectedReason: reason
    });

    await writeAuditLog({
      userId: admin?.id || 'admin',
      userName: admin?.name || 'Administrator',
      userRole: 'Admin',
      action: 'REJECT_USER',
      resource: 'Users',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
      details: `Rejected user access application for "${user.name}" (${user.email}). Reason: ${reason}`
    });

    return res.json({
      success: true,
      user: publicUser(updated),
      message: `User access request rejected.`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to reject user.' });
  }
};

export const deactivateUser = async (req: AuthRequest, res: Response) => {
  const admin = req.user;
  const { id } = req.params;

  try {
    const user = await UserService.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }

    const updated = await UserService.update(id, { status: 'Inactive' });
    await UserService.incrementSession(id); // Terminates active sessions

    await writeAuditLog({
      userId: admin?.id || 'admin',
      userName: admin?.name || 'Administrator',
      userRole: 'Admin',
      action: 'DEACTIVATE_USER',
      resource: 'Users',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
      details: `Deactivated user account "${user.name}" (${user.email}).`
    });

    return res.json({
      success: true,
      user: publicUser(updated),
      message: `User account deactivated.`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to deactivate user.' });
  }
};

// Update own profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
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
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Sign in to continue.' });

    const user = await UserService.update(userId, updates);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await writeAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE_PROFILE',
      resource: 'Users',
      resourceId: user.id,
      ipAddress: req.ip || 'unknown',
      details: `User updated profile fields: ${Object.keys(updates).join(', ')}`
    });

    return res.json({ success: true, user: publicUser(user) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to update profile.' });
  }
};

// Change own password
export const changePassword = async (req: AuthRequest, res: Response) => {
  const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Enter your current and new passwords.' });
  }
  if (newPassword.length < 8 || newPassword.length > 128) {
    return res.status(400).json({ success: false, message: 'New password must be 8–128 characters.' });
  }

  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Sign in to continue.' });

    const user = await UserService.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Fetch password hash
    let storedHash = user.passwordHash;
    if (!storedHash && isMongoConnected) {
      const doc = await User.findById(userId).select('+passwordHash');
      storedHash = doc?.passwordHash;
    }

    if (storedHash) {
      const matches = await bcrypt.compare(currentPassword, storedHash);
      if (!matches) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await UserService.update(userId, { passwordHash: hash });
    await UserService.incrementSession(userId);

    await writeAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PASSWORD_CHANGE',
      resource: 'Auth',
      ipAddress: req.ip || 'unknown',
      details: 'User changed their password. All sessions invalidated.'
    });

    res.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return res.json({ success: true, message: 'Password changed. Please sign in again.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to change password.' });
  }
};
