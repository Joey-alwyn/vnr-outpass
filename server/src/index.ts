import 'express'; // Keeps global types in Express apps
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

app.use(cors({
  origin: '*', // Not secure for production
  credentials: true
}))

app.use(express.json());
app.use(cookieParser());

//Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/security', securityRoutes);

//Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Uncaught error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
