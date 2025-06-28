"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleIdToken = verifyGoogleIdToken;
exports.issueSessionCookie = issueSessionCookie;
exports.isAuthenticated = isAuthenticated;
exports.requireRole = requireRole;
const google_auth_library_1 = require("google-auth-library");
const jsonwebtoken_1 = require("jsonwebtoken");
const config_1 = require("./config");
const client = new google_auth_library_1.OAuth2Client(config_1.GOOGLE_CLIENT_ID);
/** ✅ Verify Google ID Token */
async function verifyGoogleIdToken(idToken) {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: config_1.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
}
/** ✅ Issue signed JWT in a secure HTTP-only cookie */
function issueSessionCookie(res, payload) {
    const token = (0, jsonwebtoken_1.sign)(payload, config_1.JWT_SECRET, {
        expiresIn: config_1.JWT_EXPIRES_IN,
    });
    res.cookie(config_1.COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // ✅ only in prod
        sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
}
/** ✅ Middleware to check cookie JWT and populate req.user */
function isAuthenticated(req, res, next) {
    const token = req.cookies?.[config_1.COOKIE_NAME];
    if (!token) {
        res.status(401).json({ error: 'Unauthorized: no session cookie' });
        return;
    }
    try {
        const decoded = (0, jsonwebtoken_1.verify)(token, config_1.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        console.error('JWT verification failed:', err);
        res.status(401).json({ error: 'Invalid session' });
    }
}
/** ✅ Role-based access control */
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
