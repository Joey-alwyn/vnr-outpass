"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express");
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const auth_routes_1 = require("./routes/auth.routes");
const student_routes_1 = require("./routes/student.routes");
const mentor_routes_1 = require("./routes/mentor.routes");
const security_routes_1 = __importDefault(require("./routes/security.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const FRONTEND_ORIGIN = 'https://vnr-outpass-frontend.vercel.app';
// ✅ CORS setup for credentials
app.use((0, cors_1.default)({
    origin: FRONTEND_ORIGIN,
    credentials: true,
}));
// ✅ Handle preflight OPTIONS requests
app.options('*', (0, cors_1.default)({
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
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Health check route
app.get('/health', (_req, res) => {
    res.json({ status: 'OK' });
});
// API routes
app.use('/api/auth', auth_routes_1.authRoutes);
app.use('/api/student', student_routes_1.studentRoutes);
app.use('/api/mentor', mentor_routes_1.mentorRoutes);
app.use('/api/security', security_routes_1.default);
// Global error handler
app.use((err, _req, res, _next) => {
    console.error('Uncaught error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});
app.listen(config_1.PORT, () => {
    console.log(`Backend running on http://localhost:${config_1.PORT}`);
});
