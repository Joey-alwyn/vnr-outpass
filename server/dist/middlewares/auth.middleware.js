"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleIdToken = verifyGoogleIdToken;
exports.issueSessionCookie = issueSessionCookie;
exports.isAuthenticated = isAuthenticated;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const google_auth_library_1 = require("google-auth-library");
const client = new google_auth_library_1.OAuth2Client(config_1.GOOGLE_CLIENT_ID);
async function verifyGoogleIdToken(idToken) {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: config_1.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
}
function issueSessionCookie(res, payload) {
    const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie(config_1.COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
    });
}
function isAuthenticated(req, res, next) {
    const token = req.cookies[config_1.COOKIE_NAME];
    if (!token) {
        res.status(401).json({ error: 'Unauthenticated' });
        return;
    }
    try {
        const user = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = user; // ✅ this works if types are extended (see below)
        next();
    }
    catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}
function requireRole(role) {
    return (req, res, next) => {
        const token = req.cookies[config_1.COOKIE_NAME];
        if (!token) {
            res.status(401).json({ error: 'Unauthenticated' });
            return;
        }
        try {
            const user = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            req.user = user;
            if (user.role !== role) {
                res.status(403).json({ error: 'Forbidden - role mismatch' });
                return;
            }
            next();
        }
        catch {
            res.status(401).json({ error: 'Invalid token' });
        }
    };
}
