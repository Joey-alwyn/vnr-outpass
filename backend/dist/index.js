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
import userRoutes from './routes/user.routes'; // ✅ new user routes
import adminRoutes from './routes/admin.routes'; // ✅ new admin routes
// import cronJob from './utils/cron';
//cronJob.start();
dotenv.config();
const app = express();
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
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
app.get('/health', (_req, res) => {
    res.json({ status: 'OK' });
});
// ✅ Route groups with '/api' prefix
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/security', securityRoutes); // ✅ changed from '/security'
app.use('/api/user', userRoutes); // ✅ new user routes
app.use('/api/admin', adminRoutes); // ✅ new admin routes
app.use((err, req, res, next) => {
    console.error('💥 Uncaught error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});
app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
