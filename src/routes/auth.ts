import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client';
import bcrypt from 'bcrypt';
import { signToken, verifyToken } from '../utils/jwt';

const router = Router();

// accept non-empty email string (allow local addresses like admin@local used in seed)
const loginSchema = z.object({ email: z.string().min(1), password: z.string() });

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const ok = await bcrypt.compare(body.password, user.password);
    if (!ok) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const token = signToken({ userId: user.id, role: user.role });
    const userSafe = { ...user, password: undefined };
    res.json({ success: true, data: { token, user: userSafe } });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  // For simplicity, expect old token and reissue (no refresh token storage)
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, error: 'token required' });
  try {
    const payload = verifyToken(token);
    const newToken = signToken({ userId: (payload as any).userId, role: (payload as any).role });
    res.json({ success: true, data: { token: newToken } });
  } catch (err: any) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  // Stateless JWT: logout is handled client-side or via token blacklist (not implemented)
  res.json({ success: true, data: { message: 'Logged out (client should remove token)' } });
});

export default router;
