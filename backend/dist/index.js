import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { PORT, COOKIE_NAME } from './config';
import { verifyGoogleIdToken, issueSessionCookie, isAuthenticated, requireRole } from './auth';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'OK' });
});
/**
 * POST /auth/google
 */
app.post('/auth/google', async (req, res) => {
    const { idToken } = req.body;
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
            let inferredRole = null;
            if (mentorEmails.includes(email)) {
                inferredRole = 'MENTOR';
            }
            else if (studentRegex.test(email)) {
                inferredRole = 'STUDENT';
            }
            else {
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
    }
    catch (err) {
        console.error('Error verifying token:', err);
        res.status(401).json({ error: 'Invalid Google token' });
    }
});
/**
 * GET /check-auth
 */
app.get('/check-auth', isAuthenticated, (req, res) => {
    res.json({ user: req.user });
});
/**
 * POST /logout
 */
app.post('/logout', (_req, res) => {
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
app.post('/student/apply', isAuthenticated, requireRole('STUDENT'), async (req, res) => {
    const user = req.user;
    const { reason } = req.body;
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
    }
    catch (err) {
        console.error('Error creating gate pass:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
