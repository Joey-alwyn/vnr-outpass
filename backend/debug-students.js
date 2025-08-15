const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugStudents() {
  try {
    console.log('=== DATABASE DEBUG REPORT ===');
    console.log('Current time:', new Date().toISOString());
    console.log('7 days ago:', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    console.log('\n=== ALL USERS BY ROLE ===');
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    });
    usersByRole.forEach(group => {
      console.log(`${group.role}: ${group._count.id} users`);
    });

    console.log('\n=== ALL STUDENT-MENTOR MAPPINGS ===');
    const allMappings = await prisma.studentMentor.findMany({
      include: {
        student: { select: { name: true, role: true, createdAt: true } },
        mentor: { select: { name: true, role: true } }
      }
    });
    console.log('Total mappings:', allMappings.length);
    allMappings.forEach(mapping => {
      console.log(`- Student: ${mapping.student.name} (${mapping.student.createdAt}) -> Mentor: ${mapping.mentor.name} (${mapping.mentor.role})`);
    });

    console.log('\n=== STUDENTS WITHOUT MENTORS ===');
    const studentsWithoutMentors = await prisma.user.findMany({
      where: {
        AND: [
          { role: 'STUDENT' },
          {
            mentors: {
              none: {}
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log('Students without mentors:', studentsWithoutMentors.length);
    studentsWithoutMentors.forEach(student => {
      console.log(`- ${student.name} (${student.email}) - Created: ${student.createdAt}`);
    });

    console.log('\n=== RECENT STUDENTS (Last 7 days) ===');
    const recentStudents = await prisma.user.findMany({
      where: {
        AND: [
          {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          },
          { role: 'STUDENT' }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log('Recent students (last 7 days):', recentStudents.length);
    recentStudents.forEach(student => {
      console.log(`- ${student.name} (${student.email}) - Created: ${student.createdAt}`);
    });

    console.log('\n=== RECENT STUDENTS WITHOUT MENTORS ===');
    const recentStudentsWithoutMentors = await prisma.user.findMany({
      where: {
        AND: [
          {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          },
          { role: 'STUDENT' },
          {
            mentors: {
              none: {}
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log('Recent students without mentors:', recentStudentsWithoutMentors.length);
    recentStudentsWithoutMentors.forEach(student => {
      console.log(`- ${student.name} (${student.email}) - Created: ${student.createdAt}`);
    });

    console.log('\n=== MENTORS WITH "No mentor" IN NAME ===');
    const noMentorUsers = await prisma.user.findMany({
      where: {
        name: {
          contains: 'No mentor'
        }
      }
    });
    console.log('Users with "No mentor" in name:', noMentorUsers.length);
    noMentorUsers.forEach(user => {
      console.log(`- ${user.name} (${user.role}) - Created: ${user.createdAt}`);
    });

    if (noMentorUsers.length > 0) {
      console.log('\n=== STUDENTS ASSIGNED TO "No mentor" ===');
      const noMentorMappings = await prisma.studentMentor.findMany({
        include: {
          mentor: true,
          student: true,
        },
        where: {
          mentor: {
            name: {
              contains: 'No mentor'
            }
          }
        }
      });
      console.log('Students assigned to "No mentor":', noMentorMappings.length);
      noMentorMappings.forEach(mapping => {
        console.log(`- Student: ${mapping.student.name} -> Mentor: ${mapping.mentor.name}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugStudents();
