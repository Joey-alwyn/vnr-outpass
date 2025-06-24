import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // ✅ Insert mentors
  await prisma.user.createMany({
    data: [
      {
        email: 'aveenonights@gmail.com',
        name: 'Joe Alwyn',
        role: 'MENTOR',
      },
      {
        email: 'vnr.cse.a.2022@gmail.com',
        name: 'Mentor 2022',
        role: 'MENTOR',
      },
      {
        email: 'battinans@gmail.com',
        name: 'Kiran',
        role: 'MENTOR',
      },
    ],
    skipDuplicates: true,
  });

  // ✅ Insert students — all emails should be lowercase
  await prisma.user.createMany({
    data: [
      {
        email: '22071a0508@vnrvjiet.in',
        name: 'Naga Sai Kiran',
        role: 'STUDENT',
      },
      {
        email: '22071a0504@vnrvjiet.in',
        name: 'Madhav Sarma',
        role: 'STUDENT',
      },
      {
        email: '22071a0555@vnrvjiet.in',
        name: 'Salsabil Shehnaz',
        role: 'STUDENT',
      },
    ],
    skipDuplicates: true,
  });

  // ✅ Fetch mentor and students by lowercase email
  const mentor = await prisma.user.findUnique({
    where: {
      email: 'aveenonights@gmail.com',
    },
  });

  if (!mentor) throw new Error('Mentor not found');

  const studentEmails = [
    '22071a0508@vnrvjiet.in',
    '22071a0504@vnrvjiet.in',
    '22071a0555@vnrvjiet.in',
  ];

  const students = await prisma.user.findMany({
    where: {
      email: {
        in: studentEmails,
      },
    },
  });



  // ✅ Create fresh mentor mappings
  const mappings = students.map((s) => ({
    studentId: s.id,
    mentorId: mentor.id,
  }));

  await prisma.studentMentor.createMany({
    data: mappings,
    skipDuplicates: true,
  });

  console.log('✅ Seeded mentors, students, and mappings');
}

main().catch((e) => {
  console.error('❌ Error in seeding:', e);
  process.exit(1);
});
