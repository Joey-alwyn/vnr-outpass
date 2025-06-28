"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMentorRequests = getMentorRequests;
exports.respondToRequest = respondToRequest;
const client_1 = require("../prisma/client");
const qr_util_1 = require("../utils/qr.util");
const client_2 = require("@prisma/client"); // ✅ enum import
async function getMentorRequests(req, res) {
    const mentor = req.user;
    try {
        const requests = await client_1.prisma.gatePass.findMany({
            where: { mentorId: mentor.id, status: client_2.GatePassStatus.PENDING },
            include: {
                student: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { appliedAt: 'desc' }
        });
        res.json({ requests });
    }
    catch (err) {
        console.error('Mentor requests error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function respondToRequest(req, res) {
    const mentor = req.user;
    const { gatePassId, action } = req.body;
    console.log('Received respondToRequest request:', req.body);
    if (!gatePassId || !['APPROVE', 'REJECT'].includes(action)) {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    try {
        const pass = await client_1.prisma.gatePass.findUnique({ where: { id: gatePassId } });
        if (!pass || pass.mentorId !== mentor.id) {
            return res.status(404).json({ error: 'Unauthorized or not found' });
        }
        let qr = null;
        let token = null;
        let valid = false;
        if (action === 'APPROVE') {
            token = (0, qr_util_1.generateToken)();
            qr = await (0, qr_util_1.generateQRCode)(gatePassId, token);
            valid = true;
        }
        const statusMap = {
            APPROVE: client_2.GatePassStatus.APPROVED,
            REJECT: client_2.GatePassStatus.REJECTED
        };
        const updated = await client_1.prisma.gatePass.update({
            where: { id: gatePassId },
            data: {
                status: statusMap[action], // ✅ safe enum cast
                updatedAt: new Date(),
                qrToken: token,
                qrValid: valid,
                qrGeneratedAt: valid ? new Date() : null,
            }
        });
        res.json({ message: `Gate pass ${action.toLowerCase()}d`, gatePass: updated, qr });
    }
    catch (err) {
        console.error('Mentor response error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
