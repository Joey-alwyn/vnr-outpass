import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { PORT, COOKIE_NAME } from './config';
import {
  verifyGoogleIdToken,
  issueSessionCookie,
  isAuthenticated,
  requireRole
} from './auth';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

/**
 * POST /auth/google
 */
app.post('/auth/google', async (req: Request, res: Response) => {
  const { idToken } = req.body as { idToken?: string };
  if (!idToken) {
    res.status(400).json({ error: 'idToken missing' });
    return;
  }

  try {
    const payload = await verifyGoogleIdToken(idToken);
    const email = payload.email?.toLowerCase();
    const name = payload.name || 'Unknown';

    if (!email) {
      res.status(400).json({ error: 'Invalid Google token (no email)' });
      return;
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const mentorEmails = [
        'aveenonights@gmail.com',
        'vnr.cse.a.2022@gmail.com',
        'battinans@gmail.com',
      ];

      const studentRegex = /^[0-9a-zA-Z]{10}@vnrvjiet\.in$/i;

      let inferredRole: 'STUDENT' | 'MENTOR' | null = null;

      if (mentorEmails.includes(email)) {
        inferredRole = 'MENTOR';
      } else if (studentRegex.test(email)) {
        inferredRole = 'STUDENT';
      } else {
        res.status(403).json({ error: 'Access denied. Not recognized.' });
        return;
      }

      user = await prisma.user.create({
        data: {
          email,
          name,
          role: inferredRole,
        },
      });

      console.log(`Created new ${inferredRole} user: ${email}`);
    }

    issueSessionCookie(res, {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.json({ message: 'Logged in', user });
  } catch (err) {
    console.error('Error verifying token:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

/**
 * GET /check-auth
 */
app.get('/check-auth', isAuthenticated, (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
});

/**
 * POST /logout
 */
app.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ message: 'Logged out' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});

//posting
app.post('/student/apply', isAuthenticated, requireRole('STUDENT'), async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { reason } = req.body as { reason?: string };

  if (!reason || reason.trim().length < 3) {
    res.status(400).json({ error: 'Reason is required and must be meaningful.' });
    return;
  }

  try {
    // 1. Find the student's mentor
    const mentorMap = await prisma.studentMentor.findFirst({
      where: { student: { email: user.email } },
      include: { mentor: true },
    });

    if (!mentorMap || !mentorMap.mentorId) {
      res.status(400).json({ error: 'No mentor mapping found for student.' });
      return;
    }

    // 2. Create the gate pass
    const gatePass = await prisma.gatePass.create({
      data: {
        reason,
        studentId: user.sub,
        mentorId: mentorMap.mentorId,
        status: 'PENDING',
      },
    });

    res.status(201).json({ message: 'Gate pass submitted', gatePass });
  } catch (err) {
    console.error('Error creating gate pass:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//GET Student/Status

app.get('/student/status', isAuthenticated, requireRole('STUDENT'), async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    const passes = await prisma.gatePass.findMany({
      where: { studentId: user.sub },
      orderBy: { appliedAt: 'desc' },
      include: {
        mentor: {
          select: { name: true, email: true }
        }
      }
    });

    res.json({ passes });
  } catch (err) {
    console.error('Error fetching gate passes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /mentor/ requests

app.get('/mentor/requests', isAuthenticated, requireRole('MENTOR'), async (req: Request, res: Response) => {
  const mentor = (req as any).user;

  try {
    const requests = await prisma.gatePass.findMany({
      where: {
        mentorId: mentor.sub,
        status: 'PENDING',
      },
      orderBy: {
        appliedAt: 'desc',
      },
      include: {
        student: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    res.json({ requests });
  } catch (err) {
    console.error('Error fetching mentor requests:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST mentor/respond

app.post('/mentor/respond', isAuthenticated, requireRole('MENTOR'), async (req: Request, res: Response) => {
  const mentor = (req as any).user;
  const { gatePassId, action, comment } = req.body as {
    gatePassId?: string;
    action?: 'APPROVE' | 'REJECT';
    comment?: string;
  };

  if (!gatePassId || !action || !['APPROVE', 'REJECT'].includes(action)) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  try {
    const pass = await prisma.gatePass.findUnique({
      where: { id: gatePassId },
    });

    if (!pass || pass.mentorId !== mentor.sub) {
      res.status(404).json({ error: 'Gate pass not found or unauthorized' });
      return;
    }

    const updated = await prisma.gatePass.update({
      where: { id: gatePassId },
      data: {
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        updatedAt: new Date(),
      },
    });

    res.json({ message: `Gate pass ${action.toLowerCase()}d`, gatePass: updated }); // ✅ no return
  } catch (err) {
    console.error('Error responding to gate pass:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// HAVE NOT IMPLEMENTED QR AND NO SECURITY EMAIL ASSIGNED PLS TAKE CARE
// GET security and QR wala

app.get('/security/scan/:passId', isAuthenticated, requireRole('SECURITY'), async (req: Request, res: Response) => {
  const passId = req.params.passId;

  try {
    const gatePass = await prisma.gatePass.findUnique({
      where: { id: passId },
      include: {
        student: {
          select: {
            name: true,
            email: true,
            // TODO: Add `photo` in future
          }
        },
      },
    });

    if (!gatePass) {
      res.status(404).json({ error: 'Gate pass not found' });
      return;
    }

    res.json({
      id: gatePass.id,
      reason: gatePass.reason,
      status: gatePass.status,
      student: gatePass.student,
      appliedAt: gatePass.appliedAt,
    });
  } catch (err) {
    console.error('Error scanning gate pass:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
