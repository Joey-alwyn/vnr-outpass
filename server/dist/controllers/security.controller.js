"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanQRCode = void 0;
const client_1 = require("../prisma/client");
const scanQRCode = async (req, res) => {
    const { passId, token } = req.params;
    if (!token || !passId) {
        res.status(400).json({ message: 'Token and Pass ID required' });
        return;
    }
    try {
        const pass = await client_1.prisma.gatePass.findFirst({
            where: { qrToken: token },
            include: { student: { select: { name: true, email: true } } },
        });
        if (!pass || pass.status !== 'APPROVED' || !pass.qrValid) {
            res.status(401).json({ message: 'Invalid or expired QR code' });
            return;
        }
        if (pass.scannedAt) {
            res.status(410).json({ message: 'QR already used' });
            return;
        }
        const updated = await client_1.prisma.gatePass.update({
            where: { id: pass.id },
            data: {
                qrValid: false,
                status: 'UTILIZED',
                scannedAt: new Date(),
            },
        });
        res.status(200).json({
            id: pass.id,
            reason: pass.reason,
            status: 'UTILIZED',
            scannedAt: updated.scannedAt?.toISOString() ?? null,
            student: pass.student,
            appliedAt: pass.appliedAt,
            message: 'Scan accepted — access granted.',
        });
    }
    catch (err) {
        console.error('QR Scan error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.scanQRCode = scanQRCode;
