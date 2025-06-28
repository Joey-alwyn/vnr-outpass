"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleLogin = googleLogin;
exports.logout = logout;
exports.checkAuth = checkAuth;
const auth_middleware_1 = require("../middlewares/auth.middleware");
const client_1 = require("../prisma/client");
const config_1 = require("../config");
async function googleLogin(req, res) {
    const { idToken } = req.body;
    if (!idToken)
        return res.status(400).json({ error: 'idToken missing' });
    try {
        const payload = await (0, auth_middleware_1.verifyGoogleIdToken)(idToken);
        const email = payload.email?.toLowerCase();
        const name = payload.name || 'Unknown';
        if (!email)
            return res.status(400).json({ error: 'Invalid Google token (no email)' });
        let user = await client_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            const mentorEmails = ['aveenonights@gmail.com', 'vnr.cse.a.2022@gmail.com', 'battinans@gmail.com'];
            const studentRegex = /^[0-9a-zA-Z]{10}@vnrvjiet\.in$/i;
            let inferredRole = null;
            if (mentorEmails.includes(email))
                inferredRole = 'MENTOR';
            else if (studentRegex.test(email))
                inferredRole = 'STUDENT';
            else
                return res.status(403).json({ error: 'Access denied. Not recognized.' });
            user = await client_1.prisma.user.create({ data: { email, name, role: inferredRole } });
        }
        (0, auth_middleware_1.issueSessionCookie)(res, { id: user.id, email: user.email, name: user.name, role: user.role });
        res.json({ message: 'Logged in', user });
    }
    catch (err) {
        console.error('Google login error:', err);
        res.status(401).json({ error: 'Invalid Google token' });
    }
}
function logout(req, res) {
    res.clearCookie(config_1.COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    });
    res.json({ message: 'Logged out' });
}
function checkAuth(req, res) {
    res.json({ user: req.user });
}
