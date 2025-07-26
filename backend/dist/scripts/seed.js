// backend/src/scripts/seed.ts
import { PrismaClient, Role } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    // 1. Define all your users, using the Role enum
    const users = [
        { email: '22071a0503@vnrvjiet.in', name: 'ADDAGALLA PURANDHAR', role: Role.STUDENT },
        { email: '22071a0508@vnrvjiet.in', name: 'Naga Sai Kiran', role: Role.STUDENT },
        { email: '22071a0504@vnrvjiet.in', name: 'Madhav Sarma', role: Role.STUDENT },
        { email: '22071a0555@vnrvjiet.in', name: 'Salsabil Shehnaz', role: Role.STUDENT },
        { email: 'battinans@gmail.com', name: 'Kiran', role: Role.MENTOR },
        { email: 'purandharsai007@gmail.com', name: 'Purandhar Sai', role: Role.MENTOR },
        { email: 'aveenonights@gmail.com', name: 'Joe Alwyn', role: Role.MENTOR },
        { email: 'vnr.cse.a.2022@gmail.com', name: 'Mentor 2022', role: Role.MENTOR },
        { email: 'killuaxkillua00@gmail.com', name: 'Security Guard', role: Role.SECURITY },
        { email: 'hod@vnrvjiet.in', name: 'Head of Department', role: Role.HOD },
        { email: 'admin@vnrvjiet.in', name: 'System Administrator', role: Role.HOD },
    ];
    // 2. Upsert each user by email
    for (const u of users) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: { name: u.name, role: u.role },
            create: { email: u.email, name: u.name, role: u.role },
        });
    }
    // 3. Build an email→id lookup
    const all = await prisma.user.findMany({
        where: { email: { in: users.map(u => u.email) } },
        select: { email: true, id: true },
    });
    const idByEmail = Object.fromEntries(all.map(u => [u.email, u.id]));
    // 4. Define mappings by email
    const mappings = [
        { studentEmail: '22071a0508@vnrvjiet.in', mentorEmail: 'aveenonights@gmail.com' },
        { studentEmail: '22071a0503@vnrvjiet.in', mentorEmail: 'purandharsai007@gmail.com' },
        { studentEmail: '22071a0555@vnrvjiet.in', mentorEmail: 'aveenonights@gmail.com' },
        { studentEmail: '22071a0504@vnrvjiet.in', mentorEmail: 'aveenonights@gmail.com' },
    ];
    // 5. Upsert each mapping (unique by studentId)
    for (const m of mappings) {
        const studentId = idByEmail[m.studentEmail];
        const mentorId = idByEmail[m.mentorEmail];
        if (!studentId || !mentorId) {
            console.warn(`Skipping mapping ${m.studentEmail} → ${m.mentorEmail}`);
            continue;
        }
        await prisma.studentMentor.upsert({
            where: { studentId },
            update: { mentor: { connect: { id: mentorId } } },
            create: {
                student: { connect: { id: studentId } },
                mentor: { connect: { id: mentorId } },
            },
        });
    }
    console.log('✅ Seed complete.');
}
main()
    .catch(e => {
    console.error('❌ Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
