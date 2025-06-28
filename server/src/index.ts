import 'express';
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import { PORT } from './config';
import { authRoutes } from './routes/auth.routes';
import { studentRoutes } from './routes/student.routes';
import { mentorRoutes } from './routes/mentor.routes';
import securityRoutes from './routes/security.routes';

dotenv.config();

const app = express();

const FRONTEND_ORIGIN = 'https://vnr-outpass-frontend.vercel.app';

// ✅ CORS setup for credentials
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));

// ✅ Handle preflight OPTIONS requests
app.options('*', cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));

// ✅ Force CORS headers (some platforms override default behavior)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

app.use(express.json());
app.use(cookieParser());

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/security', securityRoutes);

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Uncaught error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});