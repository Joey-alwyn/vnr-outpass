import { OAuth2Client } from 'google-auth-library';
import { sign, verify } from 'jsonwebtoken';
import { GOOGLE_CLIENT_ID, JWT_SECRET, JWT_EXPIRES_IN, COOKIE_NAME, } from './config';
// console.log('🔐 Loaded JWT_SECRET:', JWT_SECRET);
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
/** Verify the Google ID token and return its payload */
export async function verifyGoogleIdToken(idToken) {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
}
/** Issue our own JWT and set it as an HttpOnly cookie */
export function issueSessionCookie(res, payload) {
    // Cast options to SignOptions so TS knows expiresIn is valid
    const options = { expiresIn: JWT_EXPIRES_IN };
    const token = sign(payload, JWT_SECRET, options);
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
}
/** Middleware to protect routes by verifying our JWT cookie */
export function isAuthenticated(req, res, next) {
    const token = req.cookies[COOKIE_NAME];
    // console.log('🍪 Received token:', token);
    if (!token) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const data = verify(token, JWT_SECRET);
        req.user = data;
        next();
    }
    catch (err) {
        console.error('JWT verification failed:', err);
        res.status(401).json({ error: 'Invalid session' });
    }
}
export function requireRole(role) {
    return (req, res, next) => {
        const user = req.user;
        if (!user || user.role !== role) {
            res.status(403).json({ error: 'Forbidden: insufficient role' });
            return;
        }
        next();
    };
}
