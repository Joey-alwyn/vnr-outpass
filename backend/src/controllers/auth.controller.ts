import { Request, Response } from 'express';
import { verifyGoogleIdToken, issueSessionCookie } from '../middlewares/auth.middleware';
import { prisma } from '../prisma/client';
import { COOKIE_NAME } from '../config';

export async function googleLogin(req: Request, res: Response):Promise<any> {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'idToken missing' });

  try {
    const payload = await verifyGoogleIdToken(idToken);
    const email = payload.email?.toLowerCase();
    const name = payload.name || 'Unknown';

    if (!email) return res.status(400).json({ error: 'Invalid Google token (no email)' });

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const mentorEmails = ['aveenonights@gmail.com', 'vnr.cse.a.2022@gmail.com', 'battinans@gmail.com'];
      const studentRegex = /^[0-9a-zA-Z]{10}@vnrvjiet\.in$/i;
      let inferredRole: 'STUDENT' | 'MENTOR' | null = null;

      if (mentorEmails.includes(email)) inferredRole = 'MENTOR';
      else if (studentRegex.test(email)) inferredRole = 'STUDENT';
      else return res.status(403).json({ error: 'Access denied. Not recognized.' });

      user = await prisma.user.create({ data: { email, name, role: inferredRole } });
    }

    issueSessionCookie(res, { sub: user.id, email: user.email, name: user.name, role: user.role });
    res.json({ message: 'Logged in', user });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
}

export function logout(req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ message: 'Logged out' });
}

export function checkAuth(req: Request, res: Response) {
  res.json({ user: (req as any).user });
}
