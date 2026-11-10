import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../services/userService';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    organization: string;
    status: string;
    isDemo?: boolean;
  };
}

const SESSION_COOKIE = 'returnhome_session';

const readCookie = (header: string | undefined, name: string): string | undefined => {
  if (!header) return undefined;
  const entry = header.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : undefined;
};

const readToken = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const candidate = authHeader.slice(7).trim();
    if (candidate) return candidate;
  }
  return readCookie(req.headers.cookie, SESSION_COOKIE);
};

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Sign in to continue.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'returnhome-super-secure-production-jwt-token-secret-key-2026-missing-person';
    const claims = jwt.verify(token, secret, {
      issuer: 'returnhome',
      audience: 'returnhome-web'
    }) as jwt.JwtPayload;

    if (!claims.sub) {
      return res.status(401).json({ success: false, message: 'Invalid session token.' });
    }

    if (claims.isDemo === true && claims.sub === 'usr-dev-demo') {
      req.user = {
        id: 'usr-dev-demo',
        name: 'Local Demo Investigator',
        email: 'demo.investigator@returnhome.gov.in',
        role: 'Investigator',
        organization: 'Local Development Testing Unit',
        status: 'Active',
        isDemo: true
      };
      return next();
    }

    const user = await UserService.findById(claims.sub);
    if (!user || user.status !== 'Active' || ((user.sessionVersion || 0) !== (claims.sessionVersion || 0))) {
      return res.status(401).json({ success: false, message: 'Your session is no longer active. Please sign in again.' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization || '',
      status: user.status
    };

    return next();
  } catch (err: any) {
    return res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
  }
};

export const restrictTo = (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role ${req.user?.role || 'Guest'} is not authorized to access this resource.`
    });
  }
  return next();
};
