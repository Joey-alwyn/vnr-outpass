import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

export async function scanQRCode(req: Request, res: Response):Promise<any> {
  const { passId, token } = req.params;

  try {
    const p = await prisma.gatePass.findUnique({
      where: { id: passId },
      include: { student: { select: { name: true, email: true } } },
    });

    if (!p || p.status !== 'APPROVED' || p.qrToken !== token || !p.qrValid) {
      return res.status(401).json({ error: 'Invalid or expired QR code' });
    }

    await prisma.gatePass.update({
      where: { id: passId },
      data: { qrValid: false },
    });

    res.json({
      id: p.id,
      reason: p.reason,
      status: p.status,
      student: p.student,
      appliedAt: p.appliedAt,
      message: 'Scan accepted—access granted.',
    });
  } catch (err) {
    console.error('QR Scan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
