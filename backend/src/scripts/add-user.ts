import { prisma } from '../prisma/client';
import { Role } from '@prisma/client';

/**
 * Script to add a user with roll number 22071A0508
 * Run with: npm run ts-node src/scripts/add-user.ts
 */
async function addUser() {
  try {
    const rollNo = '24071A0509';
    const email = `${rollNo}@vnrvjiet.in`;
    
    console.log(`🔄 Adding user with roll number: ${rollNo}`);
    console.log(`📧 Email: ${email}`);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log(`⚠️  User with email ${email} already exists!`);
      console.log(`User details:`, {
        id: existingUser.id,
        name: existingUser.name,
        role: existingUser.role,
        createdAt: existingUser.createdAt
      });
      return;
    }
    
    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email: email,
        name: `HOD ${rollNo}`, // You can change this to the actual name
        role: Role.HOD,
        mobile: null, // Add mobile number if available
        parentMobile: null, // Add parent mobile if available
      }
    });
    
    console.log(`✅ Successfully created user!`);
    console.log(`User details:`, {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      createdAt: newUser.createdAt
    });
    
  } catch (error) {
    console.error('❌ Error adding user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if called directly
if (require.main === module) {
  addUser()
    .then(() => {
      console.log('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { addUser };
