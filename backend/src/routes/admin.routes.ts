import { Router } from 'express';
import { prisma } from '../prisma/client';
import { requireRole } from '../middlewares/role.middleware';
import { uploadExcel } from '../middlewares/upload.middleware';
import { parseExcelFile, cleanupFile } from '../utils/excel.util';
import { Role } from '@prisma/client';

const router = Router();

/**
 * GET /api/admin/users
 * Get all users in the system (HOD only)
 */
router.get('/users', requireRole('HOD'), async (req, res) => {
  try {
    console.log('🔍 Fetching all users for admin panel...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ Retrieved ${users.length} users for admin panel`);

    res.json({
      users,
      total: users.length,
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * PUT /api/admin/users/:userId/role
 * Update a user's role (HOD only)
 */
router.put('/users/:userId/role', requireRole('HOD'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    console.log(`🔍 Updating role for user ${userId} to ${role}...`);

    // Validate role
    const validRoles = ['STUDENT', 'MENTOR', 'HOD', 'SECURITY'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log(`✅ Updated user role:`, updatedUser);

    res.json({
      message: 'User role updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    if ((error as any).code === 'P2025') {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: 'Failed to update user role' });
    }
  }
});

/**
 * POST /api/admin/users
 * Create a new user manually (HOD only)
 */
router.post('/users', requireRole('HOD'), async (req, res) => {
  try {
    const { email, name, role } = req.body;

    console.log(`🔍 Creating new user: ${email} with role ${role}...`);

    // Validate input
    if (!email || !name || !role) {
      return res.status(400).json({ error: 'Email, name, and role are required' });
    }

    // Validate email format
    if (!email.includes('@vnrvjiet.in')) {
      return res.status(400).json({ error: 'Email must be from @vnrvjiet.in domain' });
    }

    // Validate role
    const validRoles = ['STUDENT', 'MENTOR', 'HOD', 'SECURITY'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name.trim(),
        role: role as Role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    console.log(`✅ Created new user:`, newUser);

    res.status(201).json({
      message: 'User created successfully',
      user: newUser,
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * GET /api/admin/pending-actions
 * Get pending actions that require admin attention (HOD only)
 */
router.get('/pending-actions', requireRole('HOD'), async (req, res) => {
  try {
    console.log('🔍 Checking for pending actions...');

    const actions: any[] = [];

    // Find users who are no longer mentors but still have student mappings
    const orphanedMappings = await prisma.studentMentor.findMany({
      include: {
        mentor: true,
        student: true,
      },
      where: {
        mentor: {
          role: {
            not: 'MENTOR'
          }
        }
      }
    });

    if (orphanedMappings.length > 0) {
      // Group by mentor
      const mentorGroups = orphanedMappings.reduce((acc, mapping) => {
        const mentorId = mapping.mentor.id;
        if (!acc[mentorId]) {
          acc[mentorId] = {
            mentor: mapping.mentor,
            students: []
          };
        }
        acc[mentorId].students.push(mapping.student);
        return acc;
      }, {} as any);

      Object.values(mentorGroups).forEach((group: any) => {
        actions.push({
          type: 'unmap_students',
          description: `${group.mentor.name} is no longer a MENTOR but still has ${group.students.length} students assigned. Students need to be reassigned to active mentors.`,
          userId: group.mentor.id,
          userName: group.mentor.name,
          oldRole: 'MENTOR',
          newRole: group.mentor.role,
          affectedCount: group.students.length,
          students: group.students.map((s: any) => ({ id: s.id, name: s.name, email: s.email }))
        });
      });
    }

    console.log(`✅ Found ${actions.length} pending actions`);

    res.json({
      actions,
      count: actions.length,
    });
  } catch (error) {
    console.error('❌ Error fetching pending actions:', error);
    res.status(500).json({ error: 'Failed to fetch pending actions' });
  }
});

/**
 * GET /api/admin/stats
 * Get system statistics (HOD only)
 */
router.get('/stats', requireRole('HOD'), async (req, res) => {
  try {
    console.log('🔍 Fetching system statistics...');

    const [
      totalUsers,
      totalStudents,
      totalMentors,
      totalGatePasses,
      pendingPasses,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'MENTOR' } }),
      prisma.gatePass.count(),
      prisma.gatePass.count({ where: { status: 'PENDING' } }),
    ]);

    const stats = {
      totalUsers,
      totalStudents,
      totalMentors,
      totalGatePasses,
      pendingPasses,
      roleDistribution: {
        STUDENT: totalStudents,
        MENTOR: totalMentors,
        HOD: await prisma.user.count({ where: { role: 'HOD' } }),
        SECURITY: await prisma.user.count({ where: { role: 'SECURITY' } }),
      },
    };

    console.log('✅ System statistics retrieved:', stats);

    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * POST /api/admin/upload-excel
 * Upload Excel file to create student-mentor mappings
 */
router.post('/upload-excel', requireRole('HOD'), uploadExcel, async (req, res) => {
  let filePath: string | undefined;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No Excel file uploaded' });
    }

    filePath = req.file.path;
    console.log('📁 Processing Excel file:', filePath);

    // Parse Excel file
    const parseResult = await parseExcelFile(filePath);
    
    // Process students and create/update them
    const createdStudents: string[] = [];
    const updatedStudents: string[] = [];
    const mappingResults: Array<{
      student: string;
      mentor: string | null;
      status: 'mapped' | 'failed' | 'no_mentor';
    }> = [];
    const errors = [...parseResult.errors];

    for (const studentData of parseResult.students) {
      try {
        // Create or update student
        const student = await prisma.user.upsert({
          where: { email: studentData.email },
          update: { name: studentData.name },
          create: { 
            email: studentData.email, 
            name: studentData.name, 
            role: Role.STUDENT 
          },
        });

        if (student) {
          // Check if this was a creation or update
          const existingUser = await prisma.user.findUnique({
            where: { email: studentData.email },
            select: { createdAt: true }
          });
          
          if (existingUser) {
            const wasJustCreated = (Date.now() - existingUser.createdAt.getTime()) < 1000;
            if (wasJustCreated) {
              createdStudents.push(studentData.email);
            } else {
              updatedStudents.push(studentData.email);
            }
          }
        }

        // Handle mentor mapping if mentor email is provided
        if (studentData.mentorEmail) {
          try {
            // Find or create mentor
            let mentor = await prisma.user.findUnique({
              where: { email: studentData.mentorEmail }
            });

            if (!mentor) {
              // Create mentor if not exists
              mentor = await prisma.user.create({
                data: {
                  email: studentData.mentorEmail,
                  name: studentData.mentorName || 'Mentor',
                  role: Role.MENTOR
                }
              });
              console.log(`✅ Created new mentor: ${mentor.email}`);
            }

            // Create or update student-mentor mapping
            await prisma.studentMentor.upsert({
              where: { studentId: student.id },
              update: { mentorId: mentor.id },
              create: {
                studentId: student.id,
                mentorId: mentor.id
              }
            });

            mappingResults.push({
              student: studentData.email,
              mentor: studentData.mentorEmail,
              status: 'mapped'
            });

          } catch (mentorError) {
            errors.push(`Failed to map ${studentData.email} to mentor ${studentData.mentorEmail}: ${mentorError}`);
            mappingResults.push({
              student: studentData.email,
              mentor: studentData.mentorEmail,
              status: 'failed'
            });
          }
        } else {
          mappingResults.push({
            student: studentData.email,
            mentor: null,
            status: 'no_mentor'
          });
        }

      } catch (studentError) {
        errors.push(`Failed to process student ${studentData.email}: ${studentError}`);
      }
    }

    // Clean up uploaded file
    cleanupFile(filePath);

    const response = {
      success: true,
      message: 'Excel file processed successfully',
      summary: {
        ...parseResult.summary,
        createdStudents: createdStudents.length,
        updatedStudents: updatedStudents.length,
        successfulMappings: mappingResults.filter(r => r.status === 'mapped').length,
        failedMappings: mappingResults.filter(r => r.status === 'failed').length,
      },
      details: {
        createdStudents,
        updatedStudents,
        mappingResults,
        errors
      }
    };

    console.log('✅ Excel processing complete:', response.summary);
    res.json(response);

  } catch (error) {
    console.error('❌ Excel processing failed:', error);
    
    // Clean up file on error
    if (filePath) {
      cleanupFile(filePath);
    }
    
    res.status(500).json({ 
      error: 'Failed to process Excel file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/admin/student-mentor-mappings
 * Get all student-mentor mappings
 */
router.get('/student-mentor-mappings', requireRole('HOD'), async (req, res) => {
  try {
    console.log('🔍 Fetching all student-mentor mappings...');
    
    const mappings = await prisma.studentMentor.findMany({
      include: {
        student: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        },
        mentor: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        student: {
          name: 'asc'
        }
      }
    });

    // Also get students without mentors
    const studentsWithoutMentors = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        mentors: {
          none: {}
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Get all mentors for dropdown
    const allMentors = await prisma.user.findMany({
      where: {
        role: 'MENTOR'
      },
      select: {
        id: true,
        email: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`✅ Retrieved ${mappings.length} mappings and ${studentsWithoutMentors.length} unmapped students`);

    res.json({
      mappings,
      studentsWithoutMentors,
      allMentors,
      summary: {
        totalMappings: mappings.length,
        unmappedStudents: studentsWithoutMentors.length,
        totalMentors: allMentors.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching mappings:', error);
    res.status(500).json({ error: 'Failed to fetch student-mentor mappings' });
  }
});

/**
 * PUT /api/admin/student-mentor-mappings/:studentId
 * Update or create student-mentor mapping
 */
router.put('/student-mentor-mappings/:studentId', requireRole('HOD'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { mentorId } = req.body;

    console.log(`🔍 Updating mapping for student ${studentId} to mentor ${mentorId}...`);

    if (!mentorId) {
      // Remove existing mapping
      await prisma.studentMentor.deleteMany({
        where: { studentId }
      });
      
      console.log(`✅ Removed mapping for student ${studentId}`);
      return res.json({ message: 'Mapping removed successfully' });
    }

    // Create or update mapping
    const mapping = await prisma.studentMentor.upsert({
      where: { studentId },
      update: { mentorId },
      create: {
        studentId,
        mentorId
      },
      include: {
        student: {
          select: { email: true, name: true }
        },
        mentor: {
          select: { email: true, name: true }
        }
      }
    });

    console.log(`✅ Updated mapping:`, mapping);

    res.json({
      message: 'Mapping updated successfully',
      mapping
    });

  } catch (error) {
    console.error('❌ Error updating mapping:', error);
    res.status(500).json({ error: 'Failed to update student-mentor mapping' });
  }
});

export default router;
