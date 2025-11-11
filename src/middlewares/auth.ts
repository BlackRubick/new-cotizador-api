import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: any;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = (req.headers as any).authorization;
  if (!header) return res.status(401).json({ success: false, error: 'No token' });
  const parts = header.split(' ');
  if (parts.length !== 2) return res.status(401).json({ success: false, error: 'Bad token' });
  const token = parts[1];
  try {
    const payload = verifyToken(token) as any;
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'No user' });
    if (!roles.includes(user.role)) return res.status(403).json({ success: false, error: 'Forbidden' });
    next();
  };
}
