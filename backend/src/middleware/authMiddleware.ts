import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { isMongoConnected } from '../config/db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    organization: string;
    status: string;
  };
}

const SESSION_COOKIE = 'returnhome_session';

const readCookie = (header: string | undefined, name: string): string | undefined => {
  if (!header) return undefined;
  const entry = header.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : undefined;
};

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!isMongoConnected) {
    return res.status(503).json({ success: false, message: 'Authentication requires a configured MongoDB connection.' });
  }
  const token = readCookie(req.headers.cookie, SESSION_COOKIE);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Sign in to continue.' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32 || secret.includes('replace-with')) {
      return res.status(503).json({ success: false, message: 'Authentication is not configured.' });
    }
    const claims = jwt.verify(token, secret, {
      issuer: 'returnhome',
      audience: 'returnhome-web'
    }) as jwt.JwtPayload;
    if (!claims.sub) throw new Error('Invalid session');

    const user = await User.findById(claims.sub);
    if (!user || user.status !== 'Active' || ((user as any).sessionVersion || 0) !== claims.sessionVersion) {
      return res.status(401).json({ success: false, message: 'Your session is no longer active. Sign in again.' });
    }
    req.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      status: user.status
    };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Your session is invalid or expired. Sign in again.' });
  }
};

export const restrictTo = (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role ${req.user?.role || 'Guest'} is not authorized to perform this action.`
    });
  }
  return next();
};

