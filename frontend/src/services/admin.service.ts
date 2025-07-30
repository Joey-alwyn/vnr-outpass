import { api } from '../api';

// Types for API responses
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'MENTOR' | 'HOD' | 'SECURITY';
  createdAt: string;
  mobile?: string;
  parentMobile?: string;
}

export interface SystemStats {
  totalUsers: number;
  totalStudents: number;
  totalMentors: number;
  totalGatePasses: number;
  pendingPasses: number;
  roleDistribution: {
    STUDENT: number;
    MENTOR: number;
    HOD: number;
    SECURITY: number;
  };
}

export interface OutpassSummary {
  today: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    utilized: number;
  };
  activeOutpasses: number;
}

export interface OutpassReport {
  outpasses: Array<{
    id: string;
    student: {
      id: string;
      email: string;
      name: string;
    };
    mentor: {
      id: string;
      email: string;
      name: string;
    };
    purpose: string;
    destination: string;
    fromDate: string;
    toDate: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UTILIZED';
    appliedAt: string;
    approvedAt?: string;
    qrValid: boolean;
  }>;
  summary: OutpassSummary;
}

export interface PendingAction {
  id: string;
  type: 'OUTPASS_PENDING' | 'USER_REGISTRATION';
  title: string;
  description: string;
  createdAt: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

// API service class
export class AdminApiService {
  
  /**
   * Get all users in the system
   */
  static async getAllUsers(): Promise<{ users: User[]; total: number }> {
    try {
      console.log('🔍 Fetching all users...');
      const response = await api.get('/admin/users');
      console.log('✅ Users fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Get system statistics
   */
  static async getSystemStats(): Promise<SystemStats> {
    try {
      console.log('🔍 Fetching system statistics...');
      const response = await api.get('/admin/stats');
      console.log('✅ System stats fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching system stats:', error);
      throw new Error('Failed to fetch system statistics');
    }
  }

  /**
   * Get outpass reports with today's summary
   */
  static async getOutpassReports(params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<OutpassReport> {
    try {
      console.log('🔍 Fetching outpass reports...');
      const queryParams = new URLSearchParams();
      
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await api.get(`/admin/outpass-reports?${queryParams.toString()}`);
      console.log('✅ Outpass reports fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching outpass reports:', error);
      throw new Error('Failed to fetch outpass reports');
    }
  }

  /**
   * Get pending actions that require admin attention
   */
  static async getPendingActions(): Promise<PendingAction[]> {
    try {
      console.log('🔍 Fetching pending actions...');
      const response = await api.get('/admin/pending-actions');
      console.log('✅ Pending actions fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching pending actions:', error);
      throw new Error('Failed to fetch pending actions');
    }
  }

  /**
   * Get live outpass status (currently active)
   */
  static async getLiveOutpassStatus(): Promise<any> {
    try {
      console.log('🔍 Fetching live outpass status...');
      const response = await api.get('/admin/live-outpass-status');
      console.log('✅ Live outpass status fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching live outpass status:', error);
      throw new Error('Failed to fetch live outpass status');
    }
  }

  /**
   * Create a new user
   */
  static async createUser(userData: {
    email: string;
    name: string;
    role: string;
    mobile?: string;
    parentMobile?: string;
  }): Promise<User> {
    try {
      console.log('🔍 Creating new user:', userData);
      const response = await api.post('/admin/users', userData);
      console.log('✅ User created successfully:', response.data);
      return response.data.user;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: string, role: string): Promise<User> {
    try {
      console.log(`🔍 Updating user ${userId} role to ${role}...`);
      const response = await api.put(`/admin/users/${userId}/role`, { role });
      console.log('✅ User role updated successfully:', response.data);
      return response.data.user;
    } catch (error) {
      console.error('❌ Error updating user role:', error);
      throw new Error('Failed to update user role');
    }
  }

  /**
   * Update user mobile numbers
   */
  static async updateUserMobile(userId: string, mobileData: {
    mobile?: string;
    parentMobile?: string;
  }): Promise<User> {
    try {
      console.log(`🔍 Updating user ${userId} mobile numbers...`);
      const response = await api.put(`/admin/users/${userId}/mobile`, mobileData);
      console.log('✅ User mobile updated successfully:', response.data);
      return response.data.user;
    } catch (error) {
      console.error('❌ Error updating user mobile:', error);
      throw new Error('Failed to update user mobile');
    }
  }

  /**
   * Delete a user
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      console.log(`🔍 Deleting user ${userId}...`);
      await api.delete(`/admin/users/${userId}`);
      console.log('✅ User deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Download outpass report
   */
  static async downloadOutpassReport(params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    format?: 'excel' | 'pdf';
  }): Promise<Blob> {
    try {
      console.log('🔍 Downloading outpass report...');
      const response = await api.post('/admin/download-outpass-report', params, {
        responseType: 'blob'
      });
      console.log('✅ Outpass report downloaded successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error downloading outpass report:', error);
      throw new Error('Failed to download outpass report');
    }
  }

  /**
   * Get student-mentor mappings
   */
  static async getStudentMentorMappings(): Promise<any> {
    try {
      console.log('🔍 Fetching student-mentor mappings...');
      const response = await api.get('/admin/student-mentor-mappings');
      console.log('✅ Student-mentor mappings fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching student-mentor mappings:', error);
      throw new Error('Failed to fetch student-mentor mappings');
    }
  }

  /**
   * Update student-mentor mapping
   */
  static async updateStudentMentorMapping(studentId: string, mentorId: string): Promise<any> {
    try {
      console.log(`🔍 Updating student-mentor mapping: ${studentId} -> ${mentorId}`);
      const response = await api.put(`/admin/student-mentor-mappings/${studentId}`, { mentorId });
      console.log('✅ Student-mentor mapping updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating student-mentor mapping:', error);
      throw new Error('Failed to update student-mentor mapping');
    }
  }
}

// Export individual functions for convenience
export const {
  getAllUsers,
  getSystemStats,
  getOutpassReports,
  getPendingActions,
  getLiveOutpassStatus,
  createUser,
  updateUserRole,
  updateUserMobile,
  deleteUser,
  downloadOutpassReport,
  getStudentMentorMappings,
  updateStudentMentorMapping
} = AdminApiService;
