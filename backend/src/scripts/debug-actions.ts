import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugActions() {
  try {
    console.log('=== DEBUG: Checking Take Actions Data ===\n');

    // 1. Check all students
    const allStudents = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        mentors: true
      }
    });
    
    console.log(`Total Students: ${allStudents.length}`);
    
    // 2. Check students without mentors
    const studentsWithoutMentors = allStudents.filter(student => student.mentors.length === 0);
    console.log(`Students without mentors: ${studentsWithoutMentors.length}`);
    
    if (studentsWithoutMentors.length > 0) {
      console.log('Students without mentors:');
      studentsWithoutMentors.forEach(student => {
        console.log(`- ${student.name} (${student.email})`);
      });
    }
    
    // 3. Check role change requests
    const roleChangeRequests = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });
    
    console.log(`\nNew user registrations in last 7 days: ${roleChangeRequests.length}`);
    
    // 4. Check all student-mentor mappings
    const allMappings = await prisma.studentMentor.findMany({
      include: {
        student: true,
        mentor: true
      }
    });
    
    console.log(`\nTotal student-mentor mappings: ${allMappings.length}`);
    
    // 5. Check recent student registrations
    const recentStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        mentors: true
      }
    });
    
    console.log(`\nStudents registered in last 24 hours: ${recentStudents.length}`);
    recentStudents.forEach(student => {
      console.log(`- ${student.name} (${student.email}) - Mentors: ${student.mentors.length}`);
    });

  } catch (error) {
    console.error('Error debugging actions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugActions();
