"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleIdToken = verifyGoogleIdToken;
exports.issueSessionCookie = issueSessionCookie;
exports.isAuthenticated = isAuthenticated;
exports.requireRole = requireRole;
const google_auth_library_1 = require("google-auth-library");
const jsonwebtoken_1 = require("jsonwebtoken");
const config_1 = require("./config");
// console.log('🔐 Loaded JWT_SECRET:', JWT_SECRET);
const client = new google_auth_library_1.OAuth2Client(config_1.GOOGLE_CLIENT_ID);
/** Verify the Google ID token and return its payload */
async function verifyGoogleIdToken(idToken) {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: config_1.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
}
/** Issue our own JWT and set it as an HttpOnly cookie */
function issueSessionCookie(res, payload) {
    // Cast options to SignOptions so TS knows expiresIn is valid
    const options = { expiresIn: config_1.JWT_EXPIRES_IN };
    const token = (0, jsonwebtoken_1.sign)(payload, config_1.JWT_SECRET, options);
    res.cookie(config_1.COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
}
/** Middleware to protect routes by verifying our JWT cookie */
function isAuthenticated(req, res, next) {
    const token = req.cookies[config_1.COOKIE_NAME];
    // console.log('🍪 Received token:', token);
    if (!token) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const data = (0, jsonwebtoken_1.verify)(token, config_1.JWT_SECRET);
        req.user = data;
        next();
    }
    catch (err) {
        console.error('JWT verification failed:', err);
        res.status(401).json({ error: 'Invalid session' });
    }
}
function requireRole(role) {
    return (req, res, next) => {
        const user = req.user;
        if (!user || user.role !== role) {
            res.status(403).json({ error: 'Forbidden: insufficient role' });
            return;
        }
        next();
    };
}
