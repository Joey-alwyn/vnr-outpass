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

    console.log('📊 Generating scanned outpasses report:', { startDate, endDate, mentorId });

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
      'Approved By (Mentor)': (pass as any).mentor.name,
      'Mentor Email': (pass as any).mentor.email,
      'Mentor Phone Number': (pass as any).mentor.mobile || 'Not Available',
      'Reason for Outpass': pass.reason,
      'Status': pass.status,
      'Request Date': pass.appliedAt.toISOString().split('T')[0],
      'Request Time': pass.appliedAt.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      'Approval Date': pass.updatedAt.toISOString().split('T')[0],
      'Approval Time': pass.updatedAt.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      'QR Generated Date': pass.qrGeneratedAt!.toISOString().split('T')[0],
      'QR Generated Time': pass.qrGeneratedAt!.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      'Scan Date': pass.scannedAt!.toISOString().split('T')[0],
      'Scan Time': pass.scannedAt!.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      'Day of Week': pass.appliedAt.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' })
    }));

    // Create summary data for scanned outpasses
    const summaryData = [
      { 'Metric': 'Total Scanned Outpasses', 'Value': outpasses.length },
      { 'Metric': 'Date Range', 'Value': startDate && endDate 
        ? `${startDate} to ${endDate}`
        : 'All Time' },
      { 'Metric': 'Unique Students', 'Value': new Set(outpasses.map(pass => pass.student.email)).size },
      { 'Metric': 'Unique Mentors', 'Value': new Set(outpasses.map(pass => pass.mentor.email)).size },
      { 'Metric': 'Report Generated At', 'Value': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) }
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Add summary sheet
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Add detailed data sheet
    const dataSheet = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(workbook, dataSheet, 'Scanned Outpasses');

    // Generate file name
    const dateRange = startDate && endDate 
      ? `${startDate}_to_${endDate}`
      : `until_${new Date().toISOString().split('T')[0]}`;
    
    const fileName = `scanned_outpasses_${dateRange}_${Date.now()}.xlsx`;
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

    console.log('✅ Scanned outpasses report sent successfully');
    
    // Clean up file after sending
    setTimeout(() => {
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
      });
    }, 1000);

  } catch (error) {
    console.error('❌ Error generating approved & scanned report:', error);
    res.status(500).json({ error: 'Failed to generate scanned outpasses report' });
  }
};

/**
 * Smart column detection function
 * Analyzes Excel data to automatically detect column types based on content patterns
 */
function detectColumns(data: any[]): {
  rollNumber: string | null;
  studentName: string | null;
  studentMobile: string | null;
  parentMobile: string | null;
  mentorName: string | null;
  mentorEmail: string | null;
  mentorPhone: string | null;
} {
  if (!data || data.length === 0) {
    return {
      rollNumber: null,
      studentName: null,
      studentMobile: null,
      parentMobile: null,
      mentorName: null,
      mentorEmail: null,
      mentorPhone: null
    };
  }

  const columns = Object.keys(data[0]);
  const mapping = {
    rollNumber: null as string | null,
    studentName: null as string | null,
    studentMobile: null as string | null,
    parentMobile: null as string | null,
    mentorName: null as string | null,
    mentorEmail: null as string | null,
    mentorPhone: null as string | null
  };

  // Sample multiple rows to get better pattern detection (skip header rows)
  const sampleRows = data.slice(1, Math.min(11, data.length)).filter(row => {
    const firstValue = Object.values(row)[0]?.toString();
    return firstValue && !firstValue.includes('Sno') && !firstValue.includes('CSBS') && !firstValue.includes('entry');
  });

  console.log('🔍 Sample rows for detection:', sampleRows.slice(0, 3));

  // For Excel sheets with positional data (common format), try to detect by position and content
  const columnArray = columns;
  
  for (let i = 0; i < columnArray.length; i++) {
    const column = columnArray[i];
    const columnLower = column.toLowerCase();
    const sampleValues = sampleRows.map(row => row[column]).filter(val => val && val.toString().trim());

    // Skip if no valid sample values
    if (sampleValues.length === 0) continue;

    console.log(`🔍 Analyzing column ${i}: "${column}" with sample values:`, sampleValues.slice(0, 3));

    // Detect Roll Number - look for patterns like 24071A3201, 22071A0508, etc.
    if (!mapping.rollNumber && (
      columnLower.includes('roll') || 
      columnLower.includes('ht.no') || 
      columnLower.includes('htno') ||
      columnLower.includes('student data') ||
      sampleValues.some(val => /^\d{2}071[A-Z]\d{4}$/.test(val?.toString()))
    )) {
      mapping.rollNumber = column;
      console.log(`✅ Detected Roll Number column: ${column}`);
      continue;
    }

    // Detect Student Name - prioritize names that don't appear to be mentor names
    if (!mapping.studentName && sampleValues.length > 0) {
      const hasStudentNames = sampleValues.some(val => {
        const str = val?.toString();
        if (!str || str.length < 3) return false;
        // Student names are usually all caps, multiple words, no titles
        return /^[A-Z\s]+$/.test(str) && 
               str.split(' ').length >= 2 && 
               !str.includes('Dr.') && 
               !str.includes('Prof.') &&
               !str.includes('.') &&
               !str.includes('@');
      });
      
      if (hasStudentNames && (
        columnLower.includes('student') ||
        columnLower.includes('name') ||
        i === 2 // Common position for student name
      )) {
        mapping.studentName = column;
        console.log(`✅ Detected Student Name column: ${column}`);
        continue;
      }
    }

    // Detect Student Mobile - first mobile number column
    if (!mapping.studentMobile && (
      (columnLower.includes('student') && columnLower.includes('mobile')) ||
      (columnLower.includes('mobile') && !columnLower.includes('parent')) ||
      (sampleValues.some(val => /^[6-9]\d{9}$/.test(val?.toString())) && i < 6) // Usually appears before mentor phone
    )) {
      mapping.studentMobile = column;
      console.log(`✅ Detected Student Mobile column: ${column}`);
      continue;
    }

    // Detect Parent Mobile - second mobile number column or parent-specific
    if (!mapping.parentMobile && mapping.studentMobile && (
      columnLower.includes('parent') ||
      columnLower.includes('father') ||
      (sampleValues.some(val => /^[6-9]\d{9}$/.test(val?.toString())) && 
       column !== mapping.studentMobile && i < 7) // Usually appears after student mobile
    )) {
      mapping.parentMobile = column;
      console.log(`✅ Detected Parent Mobile column: ${column}`);
      continue;
    }

    // Detect Mentor Email first (more reliable identifier)
    if (!mapping.mentorEmail && (
      columnLower.includes('email') ||
      sampleValues.some(val => val?.toString().includes('@vnrvjiet.in'))
    )) {
      mapping.mentorEmail = column;
      console.log(`✅ Detected Mentor Email column: ${column}`);
      continue;
    }

    // Detect Mentor Name - look for names with titles or different pattern from student names
    if (!mapping.mentorName) {
      const hasMentorNames = sampleValues.some(val => {
        const str = val?.toString();
        if (!str || str.length < 3) return false;
        // Check if it's NOT a phone number first
        if (/^\d{10}$/.test(str)) return false;
        // Mentor names often have titles, dots, or mixed case, and are not all uppercase like student names
        return str.includes('Dr.') || 
               str.includes('Prof.') || 
               str.includes('.') ||
               /^[A-Z][a-z]+/.test(str) || // Mixed case pattern like "G.Lakshmi Deepthi"
               (str.split(' ').length >= 2 && !(/^[A-Z\s]+$/.test(str))); // Multi-word but not all caps
      });
      
      if (hasMentorNames && (
        columnLower.includes('mentor') ||
        (i > 5 && mapping.studentName && column !== mapping.studentName && // Usually appears after student data
         !sampleValues.some(val => /^\d{10}$/.test(val?.toString()))) // And not a phone number column
      )) {
        mapping.mentorName = column;
        console.log(`✅ Detected Mentor Name column: ${column}`);
        continue;
      }
    }

    // Detect Mentor Phone - last mobile number column, ensure it's actually a phone number
    if (!mapping.mentorPhone && (
      columnLower.includes('mentor') && (columnLower.includes('phone') || columnLower.includes('mobile')) ||
      (sampleValues.some(val => /^[6-9]\d{9}$/.test(val?.toString())) && 
       column !== mapping.studentMobile && 
       column !== mapping.parentMobile &&
       column !== mapping.mentorName && // Don't confuse with mentor name
       i > 6) // Usually the last mobile column
    )) {
      mapping.mentorPhone = column;
      console.log(`✅ Detected Mentor Phone column: ${column}`);
      continue;
    }
  }

  console.log('🎯 Final column mapping:', mapping);
  return mapping;
}

/**
 * POST /api/admin/bulk-add-users
 * Bulk add students and mentors from Excel file with automatic email generation (HOD only)
 */
export const bulkAddUsers = async (req: Request, res: Response) => {
  let filePath: string | undefined;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No Excel file uploaded' });
    }

    filePath = req.file.path;
    console.log('📁 Processing bulk users Excel file:', filePath);

    // Read and parse Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      cleanupFile(filePath);
      return res.status(400).json({ error: 'Excel file is empty or invalid' });
    }

    console.log(`📊 Processing ${data.length} rows from Excel file`);
    console.log('📋 Sample row data:', JSON.stringify(data[0], null, 2));
    console.log('📋 Available columns:', Object.keys(data[0] || {}));

    // Smart column detection - find the right columns based on data patterns
    const columnMapping = detectColumns(data);
    console.log('🎯 Detected column mapping:', columnMapping);

    if (!columnMapping.rollNumber || !columnMapping.studentName) {
      cleanupFile(filePath);
      return res.status(400).json({ 
        error: 'Could not detect required columns. Please ensure your Excel has roll number and student name columns.',
        detectedColumns: Object.keys(data[0] || {})
      });
    }

    // Process results tracking
    const results = {
      success: true,
      studentsCreated: 0,
      studentsUpdated: 0,
      mentorsCreated: 0,
      mappingsCreated: 0,
      errors: [] as string[],
      warnings: [] as string[],
      studentsWithoutMentors: [] as Array<{ rollNumber: string; name: string; email: string }>,
      details: {
        students: [] as Array<{ rollNumber: string; email: string; status: 'created' | 'updated' | 'error' }>,
        mentors: [] as Array<{ email: string; name: string; status: 'created' | 'existing' }>,
        mappings: [] as Array<{ studentEmail: string; mentorEmail: string; status: 'created' | 'error' }>
      }
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const rowNumber = i + 2; // Excel row number (accounting for header)

      try {
        // Extract data from row using dynamic column mapping
        const rollNumber = columnMapping.rollNumber ? row[columnMapping.rollNumber]?.toString().trim() : undefined;
        const studentName = columnMapping.studentName ? row[columnMapping.studentName]?.toString().trim() : undefined;
        const studentMobile = columnMapping.studentMobile ? row[columnMapping.studentMobile]?.toString().trim() : undefined;
        const parentMobile = columnMapping.parentMobile ? row[columnMapping.parentMobile]?.toString().trim() : undefined;
        const mentorName = columnMapping.mentorName ? row[columnMapping.mentorName]?.toString().trim() : undefined;
        const mentorEmail = columnMapping.mentorEmail ? row[columnMapping.mentorEmail]?.toString().trim().toLowerCase() : undefined;
        const mentorPhone = columnMapping.mentorPhone ? row[columnMapping.mentorPhone]?.toString().trim() : undefined;

        console.log(`🔍 Row ${rowNumber} data:`, {
          rollNumber,
          studentName,
          studentMobile,
          parentMobile,
          mentorName,
          mentorEmail,
          mentorPhone
        });

        console.log(`🔍 Row ${rowNumber} column mapping:`, columnMapping);

        // Skip rows with missing basic info (might be section headers or empty rows)
        if (!rollNumber || !studentName || 
            rollNumber === 'Sno' || rollNumber === 'H.T.NO.' || 
            studentName === 'Name of the Student' ||
            rollNumber.includes('CSBS') || rollNumber.includes('entry') ||
            rollNumber.includes('Student Data') ||
            !rollNumber.match(/^\d{2}071[A-Z]\d{4}$/)) { // Validate roll number format
          console.log(`⚠️ Skipping row ${rowNumber}: Header row, invalid roll number, or missing student name (rollNumber: "${rollNumber}", studentName: "${studentName}")`);
          continue;
        }

        // Generate student email from roll number
        const studentEmail = `${rollNumber.toLowerCase()}@vnrvjiet.in`;

        // Check if mentor info is provided (all mentor fields must be present)
        const hasMentorInfo = mentorName && mentorEmail && 
                            mentorName !== '' && mentorEmail !== '' &&
                            mentorName !== 'undefined' && mentorEmail !== 'undefined';
        
        if (hasMentorInfo && !mentorEmail.includes('@vnrvjiet.in')) {
          results.errors.push(`Row ${rowNumber}: Mentor email must be from @vnrvjiet.in domain`);
          // Still continue to process the student without mentor
        }

        // Process Mentor first (only if mentor info is provided)
        let mentor: any = null;
        if (hasMentorInfo && mentorEmail.includes('@vnrvjiet.in')) {
          try {
            // Check if mentor already exists
            mentor = await prisma.user.findUnique({
              where: { email: mentorEmail }
            });

            if (!mentor) {
              // Create new mentor
              mentor = await prisma.user.create({
                data: {
                  email: mentorEmail,
                  name: mentorName,
                  role: Role.MENTOR,
                  mobile: mentorPhone || null,
                  parentMobile: null
                } as any
              });
              results.mentorsCreated++;
              results.details.mentors.push({
                email: mentorEmail,
                name: mentorName,
                status: 'created'
              });
              console.log(`✅ Created mentor: ${mentorEmail}`);
            } else {
              // Update mentor's mobile if provided and different
              if (mentorPhone && (mentor as any).mobile !== mentorPhone) {
                await prisma.user.update({
                  where: { id: mentor.id },
                  data: { mobile: mentorPhone } as any
                });
              }
              results.details.mentors.push({
                email: mentorEmail,
                name: mentor.name,
                status: 'existing'
              });
            }
          } catch (mentorError) {
            results.errors.push(`Row ${rowNumber}: Failed to process mentor ${mentorEmail}: ${mentorError}`);
            // Don't skip student processing - continue without mentor
            mentor = null;
          }
        }

        // Process Student
        let student;
        try {
          // Check if student already exists
          student = await prisma.user.findUnique({
            where: { email: studentEmail }
          });

          if (!student) {
            // Create new student
            student = await prisma.user.create({
              data: {
                email: studentEmail,
                name: studentName,
                role: Role.STUDENT,
                mobile: studentMobile || null,
                parentMobile: parentMobile || null
              } as any
            });
            results.studentsCreated++;
            results.details.students.push({
              rollNumber,
              email: studentEmail,
              status: 'created'
            });
            console.log(`✅ Created student: ${studentEmail}`);
          } else {
            // Update existing student's details if different
            const updateData: any = {};
            if (studentName !== student.name) updateData.name = studentName;
            if (studentMobile && (student as any).mobile !== studentMobile) updateData.mobile = studentMobile;
            if (parentMobile && (student as any).parentMobile !== parentMobile) updateData.parentMobile = parentMobile;

            if (Object.keys(updateData).length > 0) {
              await prisma.user.update({
                where: { id: student.id },
                data: updateData
              });
            }
            
            results.studentsUpdated++;
            results.details.students.push({
              rollNumber,
              email: studentEmail,
              status: 'updated'
            });
          }
        } catch (studentError) {
          results.errors.push(`Row ${rowNumber}: Failed to process student ${rollNumber}: ${studentError}`);
          continue;
        }

        // Create Student-Mentor Mapping (only if mentor exists)
        if (mentor) {
          try {
            // Check if mapping already exists
            const existingMapping = await prisma.studentMentor.findUnique({
              where: { studentId: student.id }
            });

            if (!existingMapping) {
              // Create new mapping
              await prisma.studentMentor.create({
                data: {
                  studentId: student.id,
                  mentorId: mentor.id
                }
              });
              results.mappingsCreated++;
              results.details.mappings.push({
                studentEmail,
                mentorEmail,
                status: 'created'
              });
              console.log(`✅ Mapped ${studentEmail} to ${mentorEmail}`);
            } else if (existingMapping.mentorId !== mentor.id) {
              // Update mapping to new mentor
              await prisma.studentMentor.update({
                where: { studentId: student.id },
                data: { mentorId: mentor.id }
              });
              results.mappingsCreated++;
              results.details.mappings.push({
                studentEmail,
                mentorEmail,
                status: 'created'
              });
              console.log(`✅ Updated mapping: ${studentEmail} to ${mentorEmail}`);
            }
          } catch (mappingError) {
            results.errors.push(`Row ${rowNumber}: Failed to create mapping for ${rollNumber}: ${mappingError}`);
          }
        } else {
          // No mentor info provided - add to students without mentors list
          results.studentsWithoutMentors.push({
            rollNumber,
            name: studentName,
            email: studentEmail
          });
          results.warnings.push(`Row ${rowNumber}: Student ${rollNumber} (${studentName}) created without mentor assignment - missing mentor information`);
        }

      } catch (rowError) {
        results.errors.push(`Row ${rowNumber}: Unexpected error processing row: ${rowError}`);
      }
    }

    // Clean up uploaded file
    cleanupFile(filePath);

    // Determine success status
    results.success = results.errors.length < data.length; // Success if not all rows failed

    const summary = {
      totalRows: data.length,
      studentsCreated: results.studentsCreated,
      studentsUpdated: results.studentsUpdated,
      mentorsCreated: results.mentorsCreated,
      mappingsCreated: results.mappingsCreated,
      errorsCount: results.errors.length
    };

    console.log('✅ Bulk user creation complete:', summary);

    res.json(results);

  } catch (error) {
    console.error('❌ Bulk user creation failed:', error);
    
    // Clean up file on error
    if (filePath) {
      cleanupFile(filePath);
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to process Excel file',
      details: error instanceof Error ? error.message : 'Unknown error',
      studentsCreated: 0,
      studentsUpdated: 0,
      mentorsCreated: 0,
      mappingsCreated: 0,
      errors: ['Server error occurred during processing']
    });
  }
};

/**
 * POST /api/admin/undo-bulk-imports (Development only)
 * Undo bulk imported users while preserving manually created users
 */
export const undoBulkImports = async (req: Request, res: Response) => {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ 
        error: 'This feature is only available in development mode' 
      });
    }

    console.log('🔄 Starting undo bulk imports operation...');

    // Strategy: Remove users that were likely created via bulk import
    // We'll identify them by:
    // 1. Students with email pattern matching roll numbers (auto-generated emails)
    // 2. Mentors created on the same day as bulk operations
    // 3. Student-mentor mappings associated with these users

    // First, find students with auto-generated emails (roll number pattern)
    const bulkStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        email: {
          // Match roll number pattern: 24071a3201@vnrvjiet.in
          contains: '071',
        },
        // Additional filter: created recently (within last hour as a safety measure)
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    });

    // Find mentors created recently (likely from bulk import)
    const bulkMentors = await prisma.user.findMany({
      where: {
        role: 'MENTOR',
        // Only mentors created in the last hour
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    });

    console.log(`🔍 Found ${bulkStudents.length} bulk students and ${bulkMentors.length} bulk mentors to remove`);

    // Get student and mentor IDs
    const bulkStudentIds = bulkStudents.map(s => s.id);
    const bulkMentorIds = bulkMentors.map(m => m.id);
    const allBulkUserIds = [...bulkStudentIds, ...bulkMentorIds];

    // Remove student-mentor mappings for these users
    const deletedMappings = await prisma.studentMentor.deleteMany({
      where: {
        OR: [
          { studentId: { in: bulkStudentIds } },
          { mentorId: { in: bulkMentorIds } }
        ]
      }
    });

    // Remove the bulk imported users
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: { in: allBulkUserIds }
      }
    });

    console.log(`✅ Undo bulk imports complete:`);
    console.log(`   - Deleted ${bulkStudents.length} bulk students`);
    console.log(`   - Deleted ${bulkMentors.length} bulk mentors`);
    console.log(`   - Deleted ${deletedMappings.count} mappings`);

    res.json({
      success: true,
      message: 'Bulk imported users have been successfully removed',
      deletedStudents: bulkStudents.length,
      deletedMentors: bulkMentors.length,
      deletedMappings: deletedMappings.count,
      preservedExistingUsers: true
    });

  } catch (error) {
    console.error('❌ Error undoing bulk imports:', error);
    res.status(500).json({ 
      error: 'Failed to undo bulk imports',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * GET /api/admin/unmapped-students
 * Get all students without mentor assignments
 */
export const getUnmappedStudents = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Fetching students without mentor assignments...');
    
    // Get all students
    const allStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT'
      },
      select: {
        id: true,
        email: true,
        name: true,
        mobile: true,
        parentMobile: true
      }
    });

    // Get all student IDs that have mentor mappings
    const mappedStudentIds = await prisma.studentMentor.findMany({
      select: {
        studentId: true
      }
    });

    const mappedIds = new Set(mappedStudentIds.map(m => m.studentId));

    // Filter out students that have mappings
    const unmappedStudents = allStudents.filter(student => !mappedIds.has(student.id));

    console.log(`📊 Found ${unmappedStudents.length} students without mentor assignments`);

    res.json({
      success: true,
      unmappedStudents,
      count: unmappedStudents.length
    });

  } catch (error) {
    console.error('❌ Error fetching unmapped students:', error);
    res.status(500).json({ 
      error: 'Failed to fetch unmapped students',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
