// Quick script to add test mobile numbers
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addTestMobileNumbers() {
  try {
    console.log('🔍 Looking for test user...');
    
    // Find a student user
    const student = await prisma.user.findFirst({
      where: { role: 'STUDENT' }
    });
    
    if (student) {
      console.log('📱 Adding test mobile numbers to student:', student.name);
      
      // Update with test mobile numbers
      await prisma.user.update({
        where: { id: student.id },
        data: {
          mobile: '8341832634', // Student mobile (same number we tested before)
          parentMobile: '8341832634' // Parent mobile (same number for testing)
        }
      });
      
      console.log('✅ Test mobile numbers added successfully!');
      console.log('Student mobile: 8341832634');
      console.log('Parent mobile: 8341832634');
    } else {
      console.log('❌ No student found in database');
    }
    
    // Also find a mentor
    const mentor = await prisma.user.findFirst({
      where: { role: 'MENTOR' }
    });
    
    if (mentor) {
      console.log('📱 Adding test mobile number to mentor:', mentor.name);
      
      await prisma.user.update({
        where: { id: mentor.id },
        data: {
          mobile: '8341832634' // Mentor mobile
        }
      });
      
      console.log('✅ Mentor mobile number added successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestMobileNumbers();
