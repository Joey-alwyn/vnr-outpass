import 'express'; // This ensures global types are merged
import express from 'express';
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
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.get('/health', (_req, res) => {
    res.json({ status: 'OK' });
});
// ✅ Route groups with '/api' prefix
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/security', securityRoutes); // ✅ changed from '/security'
app.use((err, req, res, next) => {
    console.error('💥 Uncaught error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});
app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
