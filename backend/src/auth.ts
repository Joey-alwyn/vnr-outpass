import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { sign, verify, Secret, SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import {
  GOOGLE_CLIENT_ID,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  COOKIE_NAME,
} from './config';

// console.log('🔐 Loaded JWT_SECRET:', JWT_SECRET);

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/** Verify the Google ID token and return its payload */
export async function verifyGoogleIdToken(
  idToken: string
): Promise<TokenPayload> {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload()!;
}

/** Issue our own JWT and set it as an HttpOnly cookie */
export function issueSessionCookie(res: Response, payload: object): void {
  // Cast options to SignOptions so TS knows expiresIn is valid
  const options = { expiresIn: JWT_EXPIRES_IN } as SignOptions;
  const token = sign(
    payload,
    JWT_SECRET as Secret,
    options
  );

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
}

/** Middleware to protect routes by verifying our JWT cookie */
export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies[COOKIE_NAME];
// console.log('🍪 Received token:', token);

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const data = verify(token, JWT_SECRET as Secret);
    (req as any).user = data;
    next();
  } catch (err) {
  console.error('JWT verification failed:', err);
  res.status(401).json({ error: 'Invalid session' });
}

}


export function requireRole(role: 'STUDENT' | 'MENTOR' | 'HOD' | 'SECURITY') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== role) {
      res.status(403).json({ error: 'Forbidden: insufficient role' });
      return;
    }
    next();
  };
}
