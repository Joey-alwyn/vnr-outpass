import dotenv from 'dotenv';
dotenv.config(); // Load environment variables first

import 'express'; // This ensures global types are merged
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { PORT } from './config';

import { authRoutes } from './routes/auth.routes';
import { studentRoutes } from './routes/student.routes';
import { mentorRoutes } from './routes/mentor.routes';
import securityRoutes from './routes/security.routes'; // ✅ correct import
import userRoutes from './routes/user.routes'; // ✅ new user routes
import adminRoutes from './routes/admin.routes'; // ✅ new admin routes
import { keepAliveJob, autoRejectJob } from './utils/cron';

// Start cron jobs
keepAliveJob.start();
autoRejectJob.start();
console.log('🕐 Cron jobs started: Keep-alive and Auto-rejection');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3112',
  'https://dev-outpass.vjstartup.com',
  'https://outpass.vjstartup.com',

];

app.use(cors({
  origin: (incomingOrigin, cb) => {
    if (!incomingOrigin || allowedOrigins.includes(incomingOrigin)) {
      return cb(null, true);
    }
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));


app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

// ✅ Route groups with '/api' prefix
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/security', securityRoutes); // ✅ changed from '/security'
app.use('/api/user', userRoutes); // ✅ new user routes
app.use('/api/admin', adminRoutes); // ✅ new admin routes

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('💥 Uncaught error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
