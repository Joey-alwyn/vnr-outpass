import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    // ✅ Users
    await prisma.user.createMany({
        data: [
            {
                id: '070a51c3-6c6d-4a16-89de-23283abd6683',
                email: '22071a0503@vnrvjiet.in',
                name: 'ADDAGALLA PURANDHAR',
                role: 'STUDENT',
            },
            {
                id: '59142bc2-1b96-4133-b74d-b0fad4a671ec',
                email: '22071a0508@vnrvjiet.in',
                name: 'Naga Sai Kiran',
                role: 'STUDENT',
            },
            {
                id: '9990772d-d6d1-4153-9944-96080775e224',
                email: '22071a0504@vnrvjiet.in',
                name: 'Madhav Sarma',
                role: 'STUDENT',
            },
            {
                id: 'abd2f4df-34b8-4f78-9c91-7a5b1e6f419a',
                email: '22071a0555@vnrvjiet.in',
                name: 'Salsabil Shehnaz',
                role: 'STUDENT',
            },
            {
                id: '45f2bd47-cf4f-4521-962b-76038e8d6a6e',
                email: 'battinans@gmail.com',
                name: 'Kiran',
                role: 'MENTOR',
            },
            {
                id: '64238d3c-1d7d-4205-aa27-c9beb17d213d',
                email: 'purandharsai007@gmail.com',
                name: 'Purandhar Sai',
                role: 'MENTOR',
            },
            {
                id: 'b01726d5-0d09-4b9c-ae53-5b4931ff41dc',
                email: 'aveenonights@gmail.com',
                name: 'Joe Alwyn',
                role: 'MENTOR',
            },
            {
                id: 'ba359f8d-0dd1-4350-9e6f-994cc3171520',
                email: 'vnr.cse.a.2022@gmail.com',
                name: 'Mentor 2022',
                role: 'MENTOR',
            },
            {
                id: 'f64b6f8c-6fdc-4c9f-9de2-123456789abc',
                email: 'killuaxkillua00@gmail.com',
                name: 'Security_Guard',
                role: 'SECURITY',
            },
        ],
        skipDuplicates: true,
    });
    // ✅ Student-Mentor mappings
    await prisma.studentMentor.createMany({
        data: [
            {
                id: '3c0190b5-d148-43aa-814b-4052ec1bb2a4',
                studentId: '59142bc2-1b96-4133-b74d-b0fad4a671ec',
                mentorId: 'b01726d5-0d09-4b9c-ae53-5b4931ff41dc',
            },
            {
                id: '82074e98-764e-4116-8196-c39ab8f3c837',
                studentId: '070a51c3-6c6d-4a16-89de-23283abd6683',
                mentorId: '64238d3c-1d7d-4205-aa27-c9beb17d213d',
            },
            {
                id: 'db6ceea1-77c0-4263-add9-40385652200a',
                studentId: 'abd2f4df-34b8-4f78-9c91-7a5b1e6f419a',
                mentorId: 'b01726d5-0d09-4b9c-ae53-5b4931ff41dc',
            },
            {
                id: 'dda410b3-ddc9-4d90-a985-df6939705138',
                studentId: '9990772d-d6d1-4153-9944-96080775e224',
                mentorId: 'b01726d5-0d09-4b9c-ae53-5b4931ff41dc',
            },
        ],
        skipDuplicates: true,
    });
    console.log('✅ Seeded users and mentor-student mappings.');
}
main().catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
});
