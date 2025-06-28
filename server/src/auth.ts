import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { sign, verify, Secret, SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import {
  GOOGLE_CLIENT_ID,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  COOKIE_NAME,
} from './config';
import { Sign } from 'crypto';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/** ✅ Verify Google ID Token */
export async function verifyGoogleIdToken(
  idToken: string
): Promise<TokenPayload> {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload()!;
}

/** ✅ Issue signed JWT in a secure HTTP-only cookie */
export function issueSessionCookie(res: Response, payload: object): void {
  const token = sign(payload, JWT_SECRET as Secret, {
    expiresIn: JWT_EXPIRES_IN,
  }as SignOptions) ;

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // ✅ only in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
}

/** ✅ Middleware to check cookie JWT and populate req.user */
export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: no session cookie' });
    return;
  }

  try {
    const decoded = verify(token, JWT_SECRET as Secret);
    (req as any).user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    res.status(401).json({ error: 'Invalid session' });
  }
}

/** ✅ Role-based access control */
export function requireRole(role: 'STUDENT' | 'MENTOR' | 'HOD' | 'SECURITY') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user || user.role !== role) {
      res.status(403).json({ error: 'Forbidden: insufficient role' });
      return;
    }

    next();
  };
}
