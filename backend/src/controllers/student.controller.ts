import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { generateQRCode, generateToken } from '../utils/qr.util';
import QRCode from 'qrcode';

export async function applyGatePass(req: Request, res: Response):Promise<any> {
  const user = (req as any).user;
  const { reason } = req.body;
  console.log('reason', reason);
  if (!reason || reason.trim().length < 3) {
    return res.status(400).json({ error: 'Reason must be meaningful.' });
  }

  try {
    const mentorMap = await prisma.studentMentor.findFirst({
      where: { student: { email: user.email } },
    });

    if (!mentorMap?.mentorId) return res.status(400).json({ error: 'No mentor assigned' });

    const gatePass = await prisma.gatePass.create({
      data: {
        reason,
        status: 'PENDING',
        student: { connect: { id: user.id } },
        mentor:  { connect: { id: mentorMap.mentorId } },
      },
    });


    res.status(201).json({ message: 'Submitted', gatePass });
  } catch (err) {
    console.error('Apply error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getStudentStatus(req: Request, res: Response) {
  try {
    const passes = await prisma.gatePass.findMany({
      where: { studentId: (req as any).user.id },
      orderBy: { appliedAt: 'desc' },
    });

    const enhanced = await Promise.all(passes.map(async (p) => {
      if (p.status === 'APPROVED' && p.qrToken) {
        const qr = await QRCode.toDataURL(p.qrToken);
        return { ...p, qr };
      }
      return { ...p, qr: null };
    }));

    res.json({ passes: enhanced });
  } catch (err) {
    console.error('Status fetch error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getAssignedMentor(req: Request, res: Response):Promise<any> {
  const user = (req as any).user;

  try {
    const mapping = await prisma.studentMentor.findUnique({
      where: { studentId: user.id },
      include: { mentor: true },
    });

    if (!mapping) {
      return res.status(404).json({ error: 'No mentor assigned' });
    }

    const mentor = mapping.mentor;

    res.json({
      mentor: {
        id: mentor.id,
        name: mentor.name,
        email: mentor.email,
        role: mentor.role,
      },
    });
  } catch (err) {
    console.error('Mentor fetch error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}