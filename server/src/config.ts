import dotenv from 'dotenv';
dotenv.config();

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`❌ Missing required environment variable: ${key}`);
  return value;
}

export const PORT = process.env.PORT || '4000';
export const GOOGLE_CLIENT_ID = getEnvVar('GOOGLE_CLIENT_ID');
export const JWT_SECRET = getEnvVar('JWT_SECRET');
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const COOKIE_NAME = process.env.COOKIE_NAME || 'gatepass_token';
