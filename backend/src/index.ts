import 'express'; // This ensures global types are merged
import express, { Request, Response, RequestHandler, NextFunction } from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { PORT } from './config';

import { authRoutes } from './routes/auth.routes';
import { studentRoutes } from './routes/student.routes';
import { mentorRoutes } from './routes/mentor.routes';
import securityRoutes from './routes/security.routes'; // ✅ correct import

dotenv.config();
const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://vnr-outpass-frontend.vercel.app',
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

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('💥 Uncaught error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
