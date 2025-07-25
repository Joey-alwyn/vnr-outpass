// backend/src/config.ts
import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 4000;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
