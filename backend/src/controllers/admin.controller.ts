import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { parseExcelFile, cleanupFile } from '../utils/excel.util';
import { Role } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

/**
 * GET /api/admin/users
 * Get all users in the system (HOD only)
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Fetching all users for admin panel...');
    
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add mobile fields using type assertion to handle Prisma type issues
    const usersWithMobile = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      mobile: (user as any).mobile || null,
      parentMobile: (user as any).parentMobile || null,
    }));

    console.log(`✅ Retrieved ${users.length} users for admin panel`);

    res.json({
      users: usersWithMobile,
      total: users.length,
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

/**
 * PUT /api/admin/users/:userId/role
 * Update a user's role (HOD only)
 */
export const updateUserRole = async (req: Request, res: Response) => {
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
};

/**
 * POST /api/admin/users
 * Create a new user manually (HOD only)
 */
export const createUser = async (req: Request, res: Response) => {
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
};

/**
 * GET /api/admin/pending-actions
 * Get pending actions that require admin attention (HOD only)
 */
export const getPendingActions = async (req: Request, res: Response) => {
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
};

/**
 * GET /api/admin/stats
 * Get system statistics (HOD only)
 */
export const getSystemStats = async (req: Request, res: Response) => {
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
};

/**
 * POST /api/admin/upload-excel
 * Upload Excel file to create student-mentor mappings
 */
export const uploadExcelFile = async (req: Request, res: Response) => {
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
};

/**
 * GET /api/admin/student-mentor-mappings
 * Get all student-mentor mappings
 */
export const getStudentMentorMappings = async (req: Request, res: Response) => {
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
};

/**
 * PUT /api/admin/student-mentor-mappings/:studentId
 * Update or create student-mentor mapping
 */
export const updateStudentMentorMapping = async (req: Request, res: Response) => {
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
};

/**
 * PUT /api/admin/users/:userId/mobile
 * Update a user's mobile numbers (HOD only)
 */
export const updateUserMobile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { mobile, parentMobile } = req.body;

    console.log(`🔍 Updating mobile numbers for user ${userId}...`);

    // Validate mobile numbers format (optional validation)
    const mobileRegex = /^[6-9]\d{9}$/;
    
    if (mobile && !mobileRegex.test(mobile)) {
      return res.status(400).json({ error: 'Invalid mobile number format' });
    }
    
    if (parentMobile && !mobileRegex.test(parentMobile)) {
      return res.status(400).json({ error: 'Invalid parent mobile number format' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update mobile numbers
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        mobile: mobile || (existingUser as any).mobile,
        parentMobile: parentMobile || (existingUser as any).parentMobile,
      } as any,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    console.log(`✅ Mobile numbers updated for user ${userId}`);

    res.json({
      message: 'Mobile numbers updated successfully',
      user: {
        ...updatedUser,
        mobile: mobile || (existingUser as any).mobile,
        parentMobile: parentMobile || (existingUser as any).parentMobile,
      },
    });
  } catch (error) {
    console.error('❌ Error updating mobile numbers:', error);
    res.status(500).json({ error: 'Failed to update mobile numbers' });
  }
};

/**
 * GET /api/admin/users/:userId/dependencies
 * Get user dependencies for deletion confirmation (HOD only)
 */
export const getUserDependencies = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    console.log(`🔍 Checking dependencies for user ${userId}...`);

    // Check if user exists and get dependencies
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        gatePasses: {
          select: {
            id: true,
            reason: true,
            status: true,
            appliedAt: true
          }
        },
        passesToReview: {
          select: {
            id: true,
            reason: true,
            status: true,
            appliedAt: true,
            student: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        students: {
          select: {
            id: true,
            student: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        mentors: {
          select: {
            id: true,
            mentor: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const dependencies = {
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role
      },
      gatePasses: existingUser.gatePasses,
      passesToReview: existingUser.passesToReview,
      studentMappings: existingUser.students,
      mentorMappings: existingUser.mentors,
      summary: {
        gatePasses: existingUser.gatePasses.length,
        passesToReview: existingUser.passesToReview.length,
        studentMappings: existingUser.students.length,
        mentorMappings: existingUser.mentors.length,
        total: existingUser.gatePasses.length + existingUser.passesToReview.length + 
               existingUser.students.length + existingUser.mentors.length
      }
    };

    console.log(`✅ Dependencies retrieved for user ${userId}: ${dependencies.summary.total} total dependencies`);

    res.json(dependencies);

  } catch (error) {
    console.error('❌ Error getting user dependencies:', error);
    res.status(500).json({ error: 'Failed to get user dependencies' });
  }
};

/**
 * DELETE /api/admin/users/:userId
 * Delete a user from the system (HOD only)
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { force = false } = req.query;

    console.log(`🔍 Deleting user ${userId}... (force: ${force})`);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        gatePasses: true,
        passesToReview: true,
        students: true,
        mentors: true
      }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check for dependencies
    const hasGatePasses = existingUser.gatePasses.length > 0;
    const hasPassesToReview = existingUser.passesToReview.length > 0;
    const hasStudentMappings = existingUser.students.length > 0;
    const hasMentorMappings = existingUser.mentors.length > 0;

    if ((hasGatePasses || hasPassesToReview || hasStudentMappings || hasMentorMappings) && force !== 'true') {
      return res.status(400).json({ 
        error: 'Cannot delete user with existing dependencies',
        details: {
          gatePasses: existingUser.gatePasses.length,
          passesToReview: existingUser.passesToReview.length,
          studentMappings: existingUser.students.length,
          mentorMappings: existingUser.mentors.length
        }
      });
    }

    if (force === 'true') {
      console.log(`⚠️ Force deleting user ${userId} with all dependencies...`);
      
      // Delete all dependencies first
      if (hasStudentMappings) {
        await prisma.studentMentor.deleteMany({
          where: { mentorId: userId }
        });
        console.log(`🗑️ Deleted ${existingUser.students.length} student mappings`);
      }
      
      if (hasMentorMappings) {
        await prisma.studentMentor.deleteMany({
          where: { studentId: userId }
        });
        console.log(`🗑️ Deleted ${existingUser.mentors.length} mentor mappings`);
      }
      
      // Note: GatePasses will be automatically deleted due to CASCADE constraints
      if (hasGatePasses) {
        console.log(`🗑️ Will auto-delete ${existingUser.gatePasses.length} gate passes (CASCADE)`);
      }
      
      if (hasPassesToReview) {
        console.log(`🗑️ Will auto-delete ${existingUser.passesToReview.length} passes to review (CASCADE)`);
      }
    }

    // Delete the user (this will cascade delete gatePasses due to schema constraints)
    await prisma.user.delete({
      where: { id: userId }
    });

    console.log(`✅ User ${userId} deleted successfully${force === 'true' ? ' with all dependencies' : ''}`);

    res.json({
      message: `User deleted successfully${force === 'true' ? ' with all dependencies' : ''}`,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role
      },
      deletedDependencies: force === 'true' ? {
        gatePasses: existingUser.gatePasses.length,
        passesToReview: existingUser.passesToReview.length,
        studentMappings: existingUser.students.length,
        mentorMappings: existingUser.mentors.length
      } : null
    });

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

/**
 * GET /api/admin/outpass-reports
 * Get comprehensive outpass reports with filtering options (HOD only)
 */
export const getOutpassReports = async (req: Request, res: Response) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      mentorId, 
      studentId, 
      page = 1, 
      limit = 50 
    } = req.query;

    console.log('🔍 Fetching outpass reports with filters:', { startDate, endDate, status, mentorId, studentId });

    // Build where clause
    const whereClause: any = {};

    // Date filtering
    if (startDate || endDate) {
      whereClause.appliedAt = {};
      if (startDate) {
        whereClause.appliedAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999); // End of day
        whereClause.appliedAt.lte = end;
      }
    }

    // Status filtering
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    // Mentor filtering
    if (mentorId) {
      whereClause.mentorId = mentorId;
    }

    // Student filtering
    if (studentId) {
      whereClause.studentId = studentId;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get total count
    const totalCount = await prisma.gatePass.count({ where: whereClause });

    // Get outpass data
    const outpasses = await prisma.gatePass.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        mentor: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      },
      skip,
      take: Number(limit)
    });

    // Calculate summary statistics
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      todayTotal,
      todayApproved,
      todayPending,
      todayRejected,
      todayUtilized,
      totalActiveOutpasses
    ] = await Promise.all([
      prisma.gatePass.count({
        where: {
          appliedAt: { gte: todayStart, lte: todayEnd }
        }
      }),
      prisma.gatePass.count({
        where: {
          appliedAt: { gte: todayStart, lte: todayEnd },
          status: 'APPROVED'
        }
      }),
      prisma.gatePass.count({
        where: {
          appliedAt: { gte: todayStart, lte: todayEnd },
          status: 'PENDING'
        }
      }),
      prisma.gatePass.count({
        where: {
          appliedAt: { gte: todayStart, lte: todayEnd },
          status: 'REJECTED'
        }
      }),
      prisma.gatePass.count({
        where: {
          appliedAt: { gte: todayStart, lte: todayEnd },
          status: 'UTILIZED'
        }
      }),
      prisma.gatePass.count({
        where: {
          status: 'APPROVED',
          qrValid: true
        }
      })
    ]);

    const summary = {
      today: {
        total: todayTotal,
        approved: todayApproved,
        pending: todayPending,
        rejected: todayRejected,
        utilized: todayUtilized
      },
      activeOutpasses: totalActiveOutpasses,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit)),
        totalRecords: totalCount,
        recordsPerPage: Number(limit)
      }
    };

    console.log(`✅ Retrieved ${outpasses.length} outpass records`);

    res.json({
      outpasses,
      summary,
      filters: {
        startDate,
        endDate,
        status,
        mentorId,
        studentId
      }
    });

  } catch (error) {
    console.error('❌ Error fetching outpass reports:', error);
    res.status(500).json({ error: 'Failed to fetch outpass reports' });
  }
};

/**
 * GET /api/admin/live-outpass-status
 * Get real-time status of students currently outside campus (HOD only)
 */
export const getLiveOutpassStatus = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Fetching live outpass status...');

    // Get approved passes that haven't been used yet (students outside campus)
    const studentsOutside = await prisma.gatePass.findMany({
      where: {
        status: 'APPROVED',
        qrValid: true,
        scannedAt: null
      },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        mentor: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        qrGeneratedAt: 'desc'
      }
    });

    // Get recently returned students (scanned in last 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const recentlyReturned = await prisma.gatePass.findMany({
      where: {
        status: 'UTILIZED',
        scannedAt: {
          gte: twoHoursAgo
        }
      },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        mentor: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        scannedAt: 'desc'
      }
    });

    const liveStatus = {
      currentlyOutside: {
        count: studentsOutside.length,
        students: studentsOutside.map(pass => ({
          passId: pass.id,
          student: (pass as any).student,
          mentor: (pass as any).mentor,
          reason: pass.reason,
          approvedAt: pass.updatedAt,
          timeOutside: Math.floor((Date.now() - pass.qrGeneratedAt!.getTime()) / (1000 * 60)), // minutes
          qrGeneratedAt: pass.qrGeneratedAt
        }))
      },
      recentlyReturned: {
        count: recentlyReturned.length,
        students: recentlyReturned.map(pass => ({
          passId: pass.id,
          student: (pass as any).student,
          mentor: (pass as any).mentor,
          reason: pass.reason,
          returnedAt: pass.scannedAt,
          totalTimeOut: pass.scannedAt && pass.qrGeneratedAt 
            ? Math.floor((pass.scannedAt.getTime() - pass.qrGeneratedAt.getTime()) / (1000 * 60))
            : null
        }))
      }
    };

    console.log(`✅ Live status: ${studentsOutside.length} students outside, ${recentlyReturned.length} recently returned`);

    res.json(liveStatus);

  } catch (error) {
    console.error('❌ Error fetching live outpass status:', error);
    res.status(500).json({ error: 'Failed to fetch live outpass status' });
  }
};

/**
 * POST /api/admin/download-outpass-report
 * Generate and download Excel report of outpass data (HOD only)
 */
export const downloadOutpassReport = async (req: Request, res: Response) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      mentorId, 
      reportType = 'detailed' 
    } = req.body;

    console.log('📊 Generating outpass report for download:', { startDate, endDate, status, mentorId, reportType });

    // Build where clause
    const whereClause: any = {};

    if (startDate || endDate) {
      whereClause.appliedAt = {};
      if (startDate) {
        whereClause.appliedAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.appliedAt.lte = end;
      }
    }

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (mentorId) {
      whereClause.mentorId = mentorId;
    }

    // Get all matching outpass data
    const outpasses = await prisma.gatePass.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            email: true,
            name: true,
            mobile: true,
            parentMobile: true
          }
        },
        mentor: {
          select: {
            email: true,
            name: true,
            mobile: true
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    });

    // Prepare data for Excel with requested details
    const reportData = outpasses.map(pass => ({
      'Pass ID': pass.id,
      'Student Name': (pass as any).student.name,
      'Student Email': (pass as any).student.email,
      'Student Phone Number': (pass as any).student.mobile || 'Not Available',
      'Parent Phone Number': (pass as any).student.parentMobile || 'Not Available',
      'Who Approved': (pass as any).mentor.name,
      'Mentor Email': (pass as any).mentor.email,
      'Mentor Phone Number': (pass as any).mentor.mobile || 'Not Available',
      'Reason for Outpass': pass.reason,
      'Current Status': pass.status,
      'Time of Request': pass.appliedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      'Time of Approval': pass.status !== 'PENDING' ? pass.updatedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Not Yet Approved',
      'QR Generated At': pass.qrGeneratedAt ? pass.qrGeneratedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Not Generated',
      'Time of Scanning': pass.scannedAt ? pass.scannedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Not Scanned',
      'QR Valid': pass.qrValid ? 'Yes' : 'No',
      'Duration Outside (Minutes)': pass.scannedAt && pass.qrGeneratedAt 
        ? Math.floor((pass.scannedAt.getTime() - pass.qrGeneratedAt.getTime()) / (1000 * 60))
        : 'Not Available'
    }));

    // Create summary data
    const summaryData = [
      { 'Metric': 'Total Outpasses', 'Value': outpasses.length },
      { 'Metric': 'Approved', 'Value': outpasses.filter(p => p.status === 'APPROVED').length },
      { 'Metric': 'Pending', 'Value': outpasses.filter(p => p.status === 'PENDING').length },
      { 'Metric': 'Rejected', 'Value': outpasses.filter(p => p.status === 'REJECTED').length },
      { 'Metric': 'Utilized', 'Value': outpasses.filter(p => p.status === 'UTILIZED').length },
      { 'Metric': 'Report Generated At', 'Value': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) }
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Add summary sheet
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Add detailed data sheet
    const dataSheet = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(workbook, dataSheet, 'Outpass Details');

    // Generate file name
    const dateRange = startDate && endDate 
      ? `${startDate}_to_${endDate}`
      : `until_${new Date().toISOString().split('T')[0]}`;
    
    const fileName = `outpass_report_${dateRange}_${Date.now()}.xlsx`;
    const filePath = path.join(__dirname, '../../temp', fileName);

    // Ensure temp directory exists
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write file
    XLSX.writeFile(workbook, filePath);

    // Set headers for blob download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Send file as buffer
    const fileBuffer = fs.readFileSync(filePath);
    res.send(fileBuffer);

    console.log('✅ Report sent successfully');
    
    // Clean up file after sending
    setTimeout(() => {
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
      });
    }, 1000);

  } catch (error) {
    console.error('❌ Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

/**
 * POST /api/admin/export-event-logs
 * Export event logs for outpass activities (HOD only)
 */
export const exportEventLogs = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, format = 'excel' } = req.body;

    console.log('📊 Generating detailed outpass report:', { startDate, endDate, format });

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      dateFilter.lte = endDateTime;
    }

    // Fetch outpass data with events
    const outpasses = await prisma.gatePass.findMany({
      where: {
        ...(Object.keys(dateFilter).length > 0 && { appliedAt: dateFilter })
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            parentMobile: true
          }
        },
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    });

    // Generate consolidated outpass data (one row per outpass)
    const outpassData = outpasses.map(outpass => ({
      'Outpass ID': outpass.id,
      'Student Name': outpass.student.name,
      'Student Email': outpass.student.email,
      'Student Phone Number': outpass.student.mobile || 'Not Available',
      'Parent Phone Number': outpass.student.parentMobile || 'Not Available',
      'Who Approved': outpass.mentor.name,
      'Mentor Email': outpass.mentor.email,
      'Mentor Phone Number': outpass.mentor.mobile || 'Not Available',
      'Reason for Outpass': outpass.reason,
      'Current Status': outpass.status,
      'Time of Request': outpass.appliedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      'Time of Approval': outpass.status !== 'PENDING' ? outpass.updatedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Not Yet Approved',
      'QR Generated At': outpass.qrGeneratedAt ? outpass.qrGeneratedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Not Generated',
      'Time of Scanning': outpass.scannedAt ? outpass.scannedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Not Scanned',
      'QR Valid': outpass.qrValid ? 'Yes' : 'No',
      'Duration Outside (Minutes)': outpass.scannedAt && outpass.qrGeneratedAt 
        ? Math.floor((outpass.scannedAt.getTime() - outpass.qrGeneratedAt.getTime()) / (1000 * 60))
        : 'Not Available',
      'Applied Date': outpass.appliedAt.toISOString().split('T')[0],
      'Applied Time': outpass.appliedAt.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      'Approval Date': outpass.status !== 'PENDING' ? outpass.updatedAt.toISOString().split('T')[0] : 'Not Approved',
      'Approval Time': outpass.status !== 'PENDING' ? outpass.updatedAt.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Not Approved',
      'Scan Date': outpass.scannedAt ? outpass.scannedAt.toISOString().split('T')[0] : 'Not Scanned',
      'Scan Time': outpass.scannedAt ? outpass.scannedAt.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Not Scanned'
    }));

    // Sort by application date (most recent first)
    outpassData.sort((a, b) => new Date(b['Time of Request']).getTime() - new Date(a['Time of Request']).getTime());

    // Generate Excel file
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      { 'Metric': 'Total Outpasses', 'Count': outpassData.length },
      { 'Metric': 'Total Outpasses', 'Count': outpasses.length },
      { 'Metric': 'Approved', 'Count': outpasses.filter(p => p.status === 'APPROVED').length },
      { 'Metric': 'Pending', 'Count': outpasses.filter(p => p.status === 'PENDING').length },
      { 'Metric': 'Rejected', 'Count': outpasses.filter(p => p.status === 'REJECTED').length },
      { 'Metric': 'Utilized', 'Count': outpasses.filter(p => p.status === 'UTILIZED').length },
      { 'Metric': 'QR Generated', 'Count': outpasses.filter(p => p.qrGeneratedAt !== null).length },
      { 'Metric': 'QR Scanned', 'Count': outpasses.filter(p => p.scannedAt !== null).length },
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Outpass details sheet (one row per outpass)
    const outpassSheet = XLSX.utils.json_to_sheet(outpassData);
    XLSX.utils.book_append_sheet(workbook, outpassSheet, 'Outpass Details');

    // Generate file
    const dateRangeStr = startDate && endDate 
      ? `${startDate}_to_${endDate}`
      : `until_${new Date().toISOString().split('T')[0]}`;
    
    const fileName = `outpass_detailed_report_${dateRangeStr}_${Date.now()}.xlsx`;
    const filePath = path.join(__dirname, '../../temp', fileName);

    // Ensure temp directory exists
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write file
    XLSX.writeFile(workbook, filePath);

    console.log(`✅ Detailed outpass report generated: ${fileName}`);

    // Send file
    res.download(filePath, fileName, (downloadErr) => {
      if (downloadErr) {
        console.error('❌ Error sending file:', downloadErr);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to send export file' });
        }
      } else {
        console.log('✅ Detailed outpass report downloaded successfully');
        // Clean up file after sending
        setTimeout(() => {
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
          });
        }, 5000);
      }
    });

  } catch (error) {
    console.error('❌ Error generating detailed outpass report:', error);
    res.status(500).json({ error: 'Failed to generate detailed outpass report' });
  }
};

/**
 * POST /api/admin/download-approved-scanned-report
 * Generate and download Excel report of only approved and scanned outpass data (HOD only)
 */
export const downloadApprovedScannedReport = async (req: Request, res: Response) => {
  try {
    const { 
      startDate, 
      endDate, 
      mentorId 
    } = req.body;

    console.log('📊 Generating approved & scanned outpass report:', { startDate, endDate, mentorId });

    // Build where clause - only approved and scanned outpasses
    const whereClause: any = {
      status: 'UTILIZED', // Only outpasses that were approved and then scanned
      scannedAt: { not: null }, // Ensure they were actually scanned
      qrGeneratedAt: { not: null } // Ensure QR was generated (approved)
    };

    if (startDate || endDate) {
      whereClause.appliedAt = {};
      if (startDate) {
        whereClause.appliedAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.appliedAt.lte = end;
      }
    }

    if (mentorId) {
      whereClause.mentorId = mentorId;
    }

    // Get all matching outpass data
    const outpasses = await prisma.gatePass.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            email: true,
            name: true,
            mobile: true,
            parentMobile: true
          }
        },
        mentor: {
          select: {
            email: true,
            name: true,
            mobile: true
          }
        }
      },
      orderBy: {
        scannedAt: 'desc' // Sort by scan time (most recent first)
      }
    });

    // Prepare data for Excel with requested details
    const reportData = outpasses.map(pass => ({
      'Pass ID': pass.id,
      'Student Name': (pass as any).student.name,
      'Student Email': (pass as any).student.email,
      'Student Phone Number': (pass as any).student.mobile || 'Not Available',
      'Parent Phone Number': (pass as any).student.parentMobile || 'Not Available',
      'Who Approved': (pass as any).mentor.name,
      'Mentor Email': (pass as any).mentor.email,
      'Mentor Phone Number': (pass as any).mentor.mobile || 'Not Available',
      'Reason for Outpass': pass.reason,
      'Status': pass.status,
      'Time of Request': pass.appliedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      'Time of Approval': pass.updatedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      'QR Generated At': pass.qrGeneratedAt!.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      'Time of Scanning': pass.scannedAt!.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      'Duration Outside (Minutes)': Math.floor((pass.scannedAt!.getTime() - pass.qrGeneratedAt!.getTime()) / (1000 * 60)),
      'Request Date': pass.appliedAt.toISOString().split('T')[0],
      'Request Time': pass.appliedAt.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      'Approval Date': pass.updatedAt.toISOString().split('T')[0],
      'Approval Time': pass.updatedAt.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      'Scan Date': pass.scannedAt!.toISOString().split('T')[0],
      'Scan Time': pass.scannedAt!.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      'Day of Week': pass.appliedAt.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' }),
      'Time Outside (Hours)': Math.round((pass.scannedAt!.getTime() - pass.qrGeneratedAt!.getTime()) / (1000 * 60 * 60) * 100) / 100
    }));

    // Create summary data for approved & scanned outpasses
    const summaryData = [
      { 'Metric': 'Total Approved & Scanned Outpasses', 'Value': outpasses.length },
      { 'Metric': 'Average Duration Outside (Minutes)', 'Value': outpasses.length > 0 
        ? Math.round(outpasses.reduce((sum, pass) => 
            sum + Math.floor((pass.scannedAt!.getTime() - pass.qrGeneratedAt!.getTime()) / (1000 * 60)), 0) / outpasses.length)
        : 0 },
      { 'Metric': 'Longest Duration Outside (Minutes)', 'Value': outpasses.length > 0 
        ? Math.max(...outpasses.map(pass => 
            Math.floor((pass.scannedAt!.getTime() - pass.qrGeneratedAt!.getTime()) / (1000 * 60))))
        : 0 },
      { 'Metric': 'Shortest Duration Outside (Minutes)', 'Value': outpasses.length > 0 
        ? Math.min(...outpasses.map(pass => 
            Math.floor((pass.scannedAt!.getTime() - pass.qrGeneratedAt!.getTime()) / (1000 * 60))))
        : 0 },
      { 'Metric': 'Date Range', 'Value': startDate && endDate 
        ? `${startDate} to ${endDate}`
        : 'All Time' },
      { 'Metric': 'Report Generated At', 'Value': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) }
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Add summary sheet
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Add detailed data sheet
    const dataSheet = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(workbook, dataSheet, 'Approved & Scanned Outpasses');

    // Generate file name
    const dateRange = startDate && endDate 
      ? `${startDate}_to_${endDate}`
      : `until_${new Date().toISOString().split('T')[0]}`;
    
    const fileName = `approved_scanned_outpasses_${dateRange}_${Date.now()}.xlsx`;
    const filePath = path.join(__dirname, '../../temp', fileName);

    // Ensure temp directory exists
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write file
    XLSX.writeFile(workbook, filePath);

    // Set headers for blob download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Send file as buffer
    const fileBuffer = fs.readFileSync(filePath);
    res.send(fileBuffer);

    console.log('✅ Approved & scanned report sent successfully');
    
    // Clean up file after sending
    setTimeout(() => {
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
      });
    }, 1000);

  } catch (error) {
    console.error('❌ Error generating approved & scanned report:', error);
    res.status(500).json({ error: 'Failed to generate approved & scanned report' });
  }
};
