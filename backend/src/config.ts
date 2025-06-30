// backend/src/config.ts
import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 4000;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
export const JWT_SECRET = process.env.JWT_SECRET!;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const COOKIE_NAME = process.env.COOKIE_NAME || 'gatepass_token';
export const VITE_API_URL = process.env.VITE_API_URL!;
