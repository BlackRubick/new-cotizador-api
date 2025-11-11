import jwt, { SignOptions, Secret } from 'jsonwebtoken';

const JWT_SECRET: Secret = (process.env.JWT_SECRET || 'dev_secret') as Secret;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '1d';

export function signToken(payload: object) {
  return jwt.sign(payload as any, JWT_SECRET as any, { expiresIn: JWT_EXPIRES } as any);
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as object;
}
