import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthContext';
import ExcelUpload from '../components/ExcelUpload';
import MappingManager from '../components/MappingManager';
import './AdminPanel.css';

interface UserWithRole {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface RoleChangeAction {
  type: 'unmap_students' | 'reassign_passes' | 'notify_admin';
  description: string;
  userId: string;
  userName: string;
  oldRole: string;
  newRole: string;
  affectedCount: number;
}

type AdminTab = 'users' | 'upload' | 'mappings' | 'actions';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Role change actions
  const [pendingActions, setPendingActions] = useState<RoleChangeAction[]>([]);
  
  // Manual user creation
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'STUDENT' });

  // Check VITE_NODE_ENV first, then fall back to Vite's DEV flag
  const isDevelopment = import.meta.env.VITE_NODE_ENV === 'development' || 
                       (import.meta.env.VITE_NODE_ENV !== 'production' && import.meta.env.DEV);

  console.log('🔧 AdminPanel Debug Info:', {
    isDevelopment,
    'import.meta.env.DEV': import.meta.env.DEV,
    'import.meta.env.VITE_NODE_ENV': import.meta.env.VITE_NODE_ENV,
    'import.meta.env.MODE': import.meta.env.MODE,
    activeTab,
    usersLength: users.length,
    loading,
    userAuthenticated: !!user,
    userEmail: user?.email
  });

  // Filter and search users effect
  useEffect(() => {
    let filtered = users;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, searchTerm, roleFilter]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'actions') {
      checkPendingActions();
    }
  }, [activeTab]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching users from API...');
      
      // In development mode, always try to fetch users even without authentication
      const response = await api.get('/admin/users');
      console.log('✅ Users fetched:', response.data);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('❌ Failed to fetch users:', error);
      if (!user && isDevelopment) {
        console.log('💡 Development mode: API call failed, likely due to backend authentication');
        toast.error('API call failed - check if backend is running and development bypass is working');
      } else {
        toast.error('Failed to load users');
      }
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const checkPendingActions = async () => {
    try {
      const response = await api.get('/admin/pending-actions');
      setPendingActions(response.data.actions || []);
    } catch (error) {
      console.error('Failed to fetch pending actions:', error);
      // Mock some actions for now
      setPendingActions([
        {
          type: 'unmap_students',
          description: 'Remove student mappings for users who are no longer mentors',
          userId: 'sample-id',
          userName: 'Sample User',
          oldRole: 'MENTOR',
          newRole: 'HOD',
          affectedCount: 3
        }
      ]);
    }
  };

  const createUser = async () => {
    try {
      if (!newUser.email || !newUser.name) {
        toast.error('Email and name are required');
        return;
      }
      
      const response = await api.post('/admin/users', newUser);
      toast.success('User created successfully');
      setUsers([...users, response.data.user]);
      setNewUser({ email: '', name: '', role: 'STUDENT' });
      setShowAddUser(false);
    } catch (error: any) {
      console.error('Failed to create user:', error);
      toast.error(error.response?.data?.error || 'Failed to create user');
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      console.log(`🔄 Updating user ${userId} role to ${newRole}`);
      
      // Get current user info to detect role changes
      const currentUser = users.find(u => u.id === userId);
      const oldRole = currentUser?.role;
      
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setEditingUser(null);
      toast.success('User role updated successfully');
      
      // Check if this role change requires action
      if (oldRole && oldRole !== newRole) {
        if (oldRole === 'MENTOR' && newRole !== 'MENTOR') {
          // Create pending action for unmapping students
          const newAction: RoleChangeAction = {
            type: 'unmap_students',
            description: `${currentUser?.name} changed from MENTOR to ${newRole}. Students may need reassignment.`,
            userId,
            userName: currentUser?.name || 'Unknown User',
            oldRole,
            newRole,
            affectedCount: 0 // Will be fetched from backend
          };
          setPendingActions(prev => [...prev, newAction]);
          toast.info('Role change detected! Check the Actions tab for required steps.');
        }
      }
    } catch (error) {
      console.error('❌ Failed to update user role:', error);
      toast.error('Failed to update user role');
    }
  };

  return (
    <div className="admin-panel" style={{ minHeight: '100vh', padding: '20px', backgroundColor: '#f5f7fa' }}>
      {/* Debug Info */}
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '10px', 
        marginBottom: '20px', 
        borderRadius: '8px',
        border: '1px solid #2196f3'
      }}>
        <strong>🐛 Debug Info:</strong>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>Development Mode: {isDevelopment ? 'YES' : 'NO'}</li>
          <li>Active Tab: {activeTab}</li>
          <li>Loading: {loading ? 'YES' : 'NO'}</li>
          <li>Users Count: {users.length}</li>
          <li>API Base URL: {import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}</li>
        </ul>
      </div>

      {/* Development Warning Banner */}
      {isDevelopment && (
        <div className="alert alert-warning mb-4" role="alert" style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '8px', 
          padding: '12px 16px', 
          marginBottom: '20px',
          color: '#856404'
        }}>
          <strong>🔧 Development Mode:</strong> Admin panel is accessible to all users for testing purposes.
          {!user && (
            <div style={{ marginTop: '8px' }}>
              <strong>⚠️ Note:</strong> You're not logged in. Some features may not work properly. 
              <a href="/" style={{ marginLeft: '5px', color: '#856404' }}>Login here</a> for full functionality.
            </div>
          )}
        </div>
      )}

      <div className="admin-header">
        <h1>🛠️ Admin Panel</h1>
        <p>Manage users, student-mentor relationships, and bulk data operations</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 User Management
        </button>
        <button
          className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          📊 Excel Upload
        </button>
        <button
          className={`tab-btn ${activeTab === 'mappings' ? 'active' : ''}`}
          onClick={() => setActiveTab('mappings')}
        >
          🔗 Manage Mappings
        </button>
        <button
          className={`tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => setActiveTab('actions')}
          style={{ 
            position: 'relative',
            ...(pendingActions.length > 0 && {
              backgroundColor: '#ff4444',
              color: 'white'
            })
          }}
        >
          ⚡ Actions {pendingActions.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: '#ff0000',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}>
              {pendingActions.length}
            </span>
          )}
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' && (
          <div className="tab-content">
            {/* User Management Header with Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>System Users ({filteredUsers.length} of {users.length})</h2>
              <button
                onClick={() => setShowAddUser(true)}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                ➕ Add User
              </button>
            </div>

            {/* Search and Filter Controls */}
            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ flex: '1' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  🔍 Search Users
                </label>
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  🎯 Filter by Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">All Roles</option>
                  <option value="HOD">HOD</option>
                  <option value="MENTOR">MENTOR</option>
                  <option value="STUDENT">STUDENT</option>
                  <option value="SECURITY">SECURITY</option>
                </select>
              </div>
              
              <div style={{ minWidth: '120px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  📄 Page Size
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="admin-loading">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p>Loading users...</p>
              </div>
            ) : (
              <div className="users-table-container">
                {currentUsers.length === 0 ? (
                  <div className="no-users-message" style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {filteredUsers.length === 0 && users.length > 0 ? (
                      <div>
                        <p>🔍 No users found matching your search criteria.</p>
                        <p>Try adjusting your search term or filter settings.</p>
                      </div>
                    ) : !user && isDevelopment ? (
                      <div>
                        <p>🔧 <strong>Development Mode</strong></p>
                        <p>You're not logged in, so user data cannot be loaded.</p>
                        <p>
                          <a href="/" style={{ color: '#007bff', textDecoration: 'none' }}>
                            Click here to login with Google
                          </a>
                        </p>
                        <small>Use a @vnrvjiet.in email address to login.</small>
                      </div>
                    ) : (
                      <div>
                        <p>No users found. Users will appear here after they login for the first time.</p>
                        <small>Users must login with @vnrvjiet.in email addresses to appear in this list.</small>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="users-table">
                    <div className="table-header">
                      <div>Email</div>
                      <div>Name</div>
                      <div>Role</div>
                      <div>Joined</div>
                      <div>Actions</div>
                    </div>
                    
                    {currentUsers.map(userItem => (
                      <div key={userItem.id} className="table-row">
                        <div className="user-email">{userItem.email}</div>
                        <div className="user-name">{userItem.name}</div>
                        <div className="user-role">
                          {editingUser === userItem.id ? (
                            <select
                              value={userItem.role}
                              onChange={(e) => updateUserRole(userItem.id, e.target.value)}
                              onBlur={() => setEditingUser(null)}
                              autoFocus
                            >
                              <option value="STUDENT">Student</option>
                              <option value="MENTOR">Mentor</option>
                              <option value="HOD">HOD</option>
                              <option value="SECURITY">Security</option>
                            </select>
                          ) : (
                            <span className={`role-badge role-${userItem.role.toLowerCase()}`}>
                              {userItem.role}
                            </span>
                          )}
                        </div>
                        <div className="user-date">
                          {new Date(userItem.createdAt).toLocaleDateString()}
                        </div>
                        <div className="user-actions">
                          <button
                            onClick={() => setEditingUser(userItem.id)}
                            className="edit-btn"
                            disabled={editingUser === userItem.id}
                          >
                            ✏️ Edit Role
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination Controls */}
                {filteredUsers.length > pageSize && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        backgroundColor: currentPage === 1 ? '#f5f5f5' : '#fff',
                        borderRadius: '4px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      ← Previous
                    </button>
                    
                    <span style={{ margin: '0 15px', fontSize: '14px' }}>
                      Page {currentPage} of {totalPages} ({filteredUsers.length} users)
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        backgroundColor: currentPage === totalPages ? '#f5f5f5' : '#fff',
                        borderRadius: '4px',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>📊 Bulk Excel Upload</h2>
              <p>Upload an Excel file to create student-mentor mappings in bulk</p>
            </div>
            <ExcelUpload />
          </div>
        )}

        {activeTab === 'mappings' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>🔗 Mapping Management</h2>
              <p>View and manually edit student-mentor relationships</p>
            </div>
            <MappingManager />
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>⚡ Pending Actions</h2>
              <p>Role changes that require administrative attention</p>
            </div>
            
            {pendingActions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <p style={{ fontSize: '1.2rem', color: '#28a745' }}>✅ No pending actions</p>
                <p>All role changes have been properly handled.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {pendingActions.map((action, index) => (
                  <div key={index} style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderLeft: '4px solid #ff4444'
                  }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#ff4444' }}>
                      ⚠️ {action.type === 'unmap_students' ? 'Student Unmapping Required' : 'Action Required'}
                    </h3>
                    <p><strong>User:</strong> {action.userName} ({action.oldRole} → {action.newRole})</p>
                    <p><strong>Issue:</strong> {action.description}</p>
                    {action.affectedCount > 0 && (
                      <p><strong>Affected:</strong> {action.affectedCount} students</p>
                    )}
                    
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => {
                          // Navigate to mappings tab to handle
                          setActiveTab('mappings');
                          toast.info('Navigate to mappings tab to reassign students');
                        }}
                        style={{
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        🔗 Go to Mappings
                      </button>
                      <button
                        onClick={() => {
                          setPendingActions(prev => prev.filter((_, i) => i !== index));
                          toast.success('Action marked as resolved');
                        }}
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        ✅ Mark Resolved
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>➕ Add New User</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Email Address *
              </label>
              <input
                type="email"
                placeholder="user@vnrvjiet.in"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Full Name *
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Role
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="STUDENT">Student</option>
                <option value="MENTOR">Mentor</option>
                <option value="HOD">HOD</option>
                <option value="SECURITY">Security</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddUser(false);
                  setNewUser({ email: '', name: '', role: 'STUDENT' });
                }}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={createUser}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  backgroundColor: '#28a745',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
