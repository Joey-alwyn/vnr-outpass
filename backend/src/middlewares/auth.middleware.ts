// backend/src/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { COOKIE_NAME, GOOGLE_CLIENT_ID } from '../config';
import { OAuth2Client } from 'google-auth-library';
import { Role } from '@prisma/client';

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
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000,
  });
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      name: string;
      role: Role;
    };
    req.user = user; // ✅ this works if types are extended (see below)
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }

    try {
      const user = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        email: string;
        name: string;
        role: Role;
      };
      req.user = user;

      if (user.role !== role) {
        res.status(403).json({ error: 'Forbidden - role mismatch' });
        return;
      }

      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}
