import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Insert 3 mentor users
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

  // Insert 3 test students
  await prisma.user.createMany({
    data: [
      {
        email: '22071a0508@vnrvjiet.in',
        name: 'Naga Sai Kiran',
        role: 'STUDENT',
      },
      {
        email: '22071A0504@vnrvjiet.in',
        name: 'Madhav Sarma',
        role: 'STUDENT',
      },
      {
        email: '22071A0555@vnrvjiet.in',
        name: 'Salsabil Shehnaz',
        role: 'STUDENT',
      },
    ],
    skipDuplicates: true,
  });

  // Fetch students and mentor by email
  const students = await prisma.user.findMany({
    where: {
      email: {
        in: [
          '22071a0508@vnrvjiet.in',
          '22071A0504@vnrvjiet.in',
          '22071A0555@vnrvjiet.in',
        ],
      },
    },
  });

  const mentor = await prisma.user.findFirst({
    where: {
      email: 'aveenonights@gmail.com',
      
    },
  });

  if (!mentor) {
    throw new Error('Mentor not found!');
  }

  // Map each student to the mentor
  await prisma.studentMentor.createMany({
    data: students.map((s) => ({
      studentId: s.id,
      mentorId: mentor.id,
    })),
    skipDuplicates: true,
  });

  console.log('✅ Seeded mentors, students, and mappings');
}

main().catch((e) => {
  console.error('❌ Error in seeding:', e);
  process.exit(1);
});
