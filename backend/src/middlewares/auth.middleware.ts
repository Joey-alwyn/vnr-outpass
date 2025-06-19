import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { COOKIE_NAME, GOOGLE_CLIENT_ID } from '../config';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function verifyGoogleIdToken(idToken: string) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload()!;
}

export function issueSessionCookie(res: Response, payload: object) {
  const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1d' });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Unauthenticated' });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(role: 'STUDENT' | 'MENTOR' | 'SECURITY') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (user?.role !== role) {
      return res.status(403).json({ error: 'Forbidden - role mismatch' });
    }
    next();
  };
}
