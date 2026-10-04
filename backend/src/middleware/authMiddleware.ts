import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    organization: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'khojsetu_jwt_secret_key_2026_investigation_secure_token';

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    // For demo convenience, inject default investigator if no token passed or demo header
    req.user = {
      id: 'usr-admin-1',
      name: 'Inspector Vikram Singh',
      email: 'vikram.singh@ReturnHome.gov.in',
      role: 'Admin',
      organization: 'Special Missing Persons Unit, Delhi Police'
    };
    return next();
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // Fallback to demo user instead of crashing demo
    req.user = {
      id: 'usr-admin-1',
      name: 'Inspector Vikram Singh',
      email: 'vikram.singh@ReturnHome.gov.in',
      role: 'Admin',
      organization: 'Special Missing Persons Unit, Delhi Police'
    };
    next();
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user?.role || 'Guest'} is not authorized to perform this action.`
      });
    }
    next();
  };
};
