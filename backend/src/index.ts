import express, { Request, Response, RequestHandler, NextFunction } from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { PORT } from './config';

import { authRoutes } from './routes/auth.routes';
import { studentRoutes } from './routes/student.routes';
import { mentorRoutes } from './routes/mentor.routes';
import { securityRoutes } from './routes/security.routes';

dotenv.config();
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

// Route groups
app.use('/auth', authRoutes);
app.use('/student', studentRoutes);
app.use('/mentor', mentorRoutes);
app.use('/security', securityRoutes);
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('💥 Uncaught error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
