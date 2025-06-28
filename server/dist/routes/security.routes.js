"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const security_controller_1 = require("../controllers/security.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// in security.routes.ts
router.post('/scan-test', (req, res) => {
    console.log('Scan test hit!');
    res.json({ message: 'Scan test route works!' });
});
// ✅ Fix: use GET and include route params
router.get('/scan/:passId/:token', (0, auth_middleware_1.requireRole)('SECURITY'), security_controller_1.scanQRCode);
exports.default = router;
