import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Phone,
  Search,
  Eye,
  Mail,
  Calendar,
  Award,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'MENTOR' | 'HOD' | 'SECURITY';
  createdAt: string;
  mobile?: string;
  parentMobile?: string;
}

interface UserManagementProps {
  users: User[];
  loading: boolean;
  onDeleteUser: (userId: string, force?: boolean) => void;
  onRefreshUsers: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ 
  users, 
  loading, 
  onDeleteUser, 
  onRefreshUsers 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userDependencies, setUserDependencies] = useState<any>(null);
  const [loadingDependencies, setLoadingDependencies] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBootstrapColor = (role: string) => {
    const colors: Record<string, string> = {
      'HOD': 'btn-outline-primary',
      'MENTOR': 'btn-outline-info', 
      'STUDENT': 'btn-outline-success',
      'SECURITY': 'btn-outline-warning'
    };
    return colors[role] || 'btn-outline-secondary';
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      'HOD': Award,
      'MENTOR': Users,
      'STUDENT': Users,
      'SECURITY': Shield
    };
    const Icon = icons[role] || Users;
    return <Icon style={{width: '0.75rem', height: '0.75rem'}} />;
  };

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'ALL' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleDeleteClick = async (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
    
    // Fetch user dependencies
    setLoadingDependencies(true);
    setUserDependencies(null);
    try {
      const response = await api.get(`/admin/users/${user.id}/dependencies`);
      setUserDependencies(response.data);
    } catch (error) {
      console.error('Failed to fetch user dependencies:', error);
      toast.error('Failed to check user dependencies');
      setUserDependencies(null);
    } finally {
      setLoadingDependencies(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    const hasNoDependencies = !userDependencies || userDependencies.summary.total === 0;
    
    try {
      await onDeleteUser(userToDelete.id, !hasNoDependencies);
      setUserToDelete(null);
      setUserDependencies(null);
      setDeleteDialogOpen(false);
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleDeleteCancel = () => {
    setUserToDelete(null);
    setUserDependencies(null);
    setDeleteDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="users-section-header mb-4">
        <div className="row align-items-center">
          <div className="col-lg-6">
            <div className="d-flex align-items-center">
              <Users className="text-primary me-3" style={{width: '1.75rem', height: '1.75rem'}} />
              <div>
                <h3 className="users-title fw-bold mb-1">User Management</h3>
                <p className="users-subtitle text-muted mb-0">Manage system users and permissions</p>
              </div>
            </div>
          </div>
          
          <div className="col-lg-6">
            <div className="row g-3">
              <div className="col-md-5">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <Search style={{width: '1rem', height: '1rem'}} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-control border-start-0 bg-white"
                  />
                </div>
              </div>
              
              <div className="col-md-4">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="form-select bg-white"
                >
                  <option value="ALL">All Roles</option>
                  <option value="STUDENT">Students</option>
                  <option value="MENTOR">Mentors</option>
                  <option value="HOD">HOD</option>
                  <option value="SECURITY">Security</option>
                </select>
              </div>
              
              <div className="col-md-3">
                <button 
                  onClick={() => setShowAddUserModal(true)}
                  className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                >
                  <UserPlus className="me-2" style={{width: '1.25rem', height: '1.25rem'}} />
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="users-table card border-0 shadow-lg overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="fw-bold text-muted text-uppercase small px-4 py-3">User</th>
                <th className="fw-bold text-muted text-uppercase small px-4 py-3">Role</th>
                <th className="fw-bold text-muted text-uppercase small px-4 py-3">Contact</th>
                <th className="fw-bold text-muted text-uppercase small px-4 py-3">Joined</th>
                <th className="fw-bold text-muted text-uppercase small px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-bottom">
                  <td className="px-4 py-3">
                    <div className="d-flex align-items-center">
                      <div className="user-avatar position-relative me-3">
                        <div className="rounded-3 d-flex align-items-center justify-content-center shadow" 
                             style={{
                               width: '3rem', 
                               height: '3rem', 
                               background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
                             }}>
                          <span className="text-white fw-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white" 
                             style={{width: '1rem', height: '1rem'}}></div>
                      </div>
                      <div>
                        <div className="user-name fw-bold text-dark">{user.name}</div>
                        <div className="user-email d-flex align-items-center text-muted small">
                          <Mail className="me-1" style={{width: '0.75rem', height: '0.75rem'}} />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`role-badge btn btn-sm ${getRoleBootstrapColor(user.role)} d-flex align-items-center`}>
                      {getRoleIcon(user.role)}
                      <span className="ms-1">{user.role}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      {user.mobile ? (
                        <div className="contact-info d-flex align-items-center small fw-medium text-dark">
                          <Phone className="me-2 text-muted" style={{width: '1rem', height: '1rem'}} />
                          {user.mobile}
                        </div>
                      ) : (
                        <span className="text-muted fst-italic small">No mobile</span>
                      )}
                      {user.parentMobile && (
                        <div className="contact-secondary d-flex align-items-center text-muted small">
                          <Phone className="me-1" style={{width: '0.75rem', height: '0.75rem'}} />
                          Parent: {user.parentMobile}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 small fw-medium text-dark">
                    <div className="d-flex align-items-center">
                      <Calendar className="me-2 text-muted" style={{width: '1rem', height: '1rem'}} />
                      {formatDate(user.createdAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        title="View Details"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditUserModal(true);
                        }}
                      >
                        <Eye style={{width: '1rem', height: '1rem'}} />
                      </button>
                      <button
                        className="btn btn-outline-success btn-sm"
                        title="Edit User"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditUserModal(true);
                        }}
                      >
                        <Edit style={{width: '1rem', height: '1rem'}} />
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        title="Delete User"
                        onClick={() => handleDeleteClick(user)}
                      >
                        <Trash2 style={{width: '1rem', height: '1rem'}} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="empty-state text-center py-5">
            <Users className="text-muted mb-3" style={{width: '4rem', height: '4rem'}} />
            <h5 className="fw-medium text-muted">No users found</h5>
            <p className="text-muted">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="modal-xl">
          <AlertDialogHeader>
            <div className="d-flex align-items-center">
              <div className="rounded-circle d-flex align-items-center justify-content-center me-3" 
                   style={{ 
                     width: '48px', 
                     height: '48px', 
                     background: 'linear-gradient(135deg, #dc3545 0%, #b02a37 100%)',
                     boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)'
                   }}>
                <Trash2 className="text-white" style={{width: '24px', height: '24px'}} />
              </div>
              <div>
                <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                <p className="text-muted mb-0 small fw-medium">This action is permanent and cannot be undone</p>
              </div>
            </div>
          </AlertDialogHeader>
          
          <AlertDialogDescription>
            {loadingDependencies ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status" style={{width: '3rem', height: '3rem'}}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h6 className="fw-medium text-muted">Analyzing user dependencies...</h6>
                <p className="text-muted small mb-0">Please wait while we check for related data</p>
              </div>
            ) : userToDelete ? (
              <>
                {/* User Info Card */}
                <div className="card border-0 mb-4" style={{ backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle d-flex align-items-center justify-content-center me-3" 
                           style={{
                             width: '48px', 
                             height: '48px', 
                             background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
                           }}>
                        <span className="text-white fw-bold fs-5">
                          {userToDelete.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="fw-bold mb-1 fs-5">{userToDelete.name}</h6>
                        <p className="text-muted mb-2 small">{userToDelete.email}</p>
                        <span className={`badge ${getRoleBootstrapColor(userToDelete.role)} fs-6 px-3 py-2`}>
                          {getRoleIcon(userToDelete.role)}
                          <span className="ms-2">{userToDelete.role}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {userDependencies && userDependencies.summary.total > 0 ? (
                  <>
                    {/* Warning Alert */}
                    <div className="alert border-0 mb-4" 
                         style={{ 
                           backgroundColor: '#fff3cd', 
                           borderLeft: '4px solid #ffc107',
                           borderRadius: '12px'
                         }}>
                      <div className="d-flex align-items-center">
                        <AlertTriangle className="text-warning me-3" style={{width: '24px', height: '24px'}} />
                        <div>
                          <h6 className="text-warning fw-bold mb-1">Dependency Warning</h6>
                          <p className="text-warning mb-0 small">
                            This user has <strong>{userDependencies.summary.total} active dependencies</strong> that will be affected
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Dependencies List */}
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3 text-dark">Related Data to be Deleted:</h6>
                      <div className="row g-3">
                        {userDependencies.summary.gatePasses > 0 && (
                          <div className="col-md-6">
                            <div className="card border-0 h-100" style={{ backgroundColor: '#e3f2fd', borderRadius: '12px' }}>
                              <div className="card-body p-3">
                                <div className="d-flex align-items-center">
                                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" 
                                       style={{width: '32px', height: '32px', fontSize: '14px'}}>
                                    🎫
                                  </div>
                                  <div>
                                    <h6 className="fw-bold text-primary mb-0">{userDependencies.summary.gatePasses}</h6>
                                    <small className="text-primary">Outpass Application{userDependencies.summary.gatePasses > 1 ? 's' : ''}</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {userDependencies.summary.passesToReview > 0 && (
                          <div className="col-md-6">
                            <div className="card border-0 h-100" style={{ backgroundColor: '#e8f5e8', borderRadius: '12px' }}>
                              <div className="card-body p-3">
                                <div className="d-flex align-items-center">
                                  <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center me-3" 
                                       style={{width: '32px', height: '32px', fontSize: '14px'}}>
                                    👨‍🏫
                                  </div>
                                  <div>
                                    <h6 className="fw-bold text-success mb-0">{userDependencies.summary.passesToReview}</h6>
                                    <small className="text-success">Pending Review{userDependencies.summary.passesToReview > 1 ? 's' : ''}</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {userDependencies.summary.studentMappings > 0 && (
                          <div className="col-md-6">
                            <div className="card border-0 h-100" style={{ backgroundColor: '#f3e5f5', borderRadius: '12px' }}>
                              <div className="card-body p-3">
                                <div className="d-flex align-items-center">
                                  <div className="rounded-circle bg-info text-white d-flex align-items-center justify-content-center me-3" 
                                       style={{width: '32px', height: '32px', fontSize: '14px'}}>
                                    👨‍🎓
                                  </div>
                                  <div>
                                    <h6 className="fw-bold text-info mb-0">{userDependencies.summary.studentMappings}</h6>
                                    <small className="text-info">Student Mapping{userDependencies.summary.studentMappings > 1 ? 's' : ''}</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {userDependencies.summary.mentorMappings > 0 && (
                          <div className="col-md-6">
                            <div className="card border-0 h-100" style={{ backgroundColor: '#fff3e0', borderRadius: '12px' }}>
                              <div className="card-body p-3">
                                <div className="d-flex align-items-center">
                                  <div className="rounded-circle bg-warning text-white d-flex align-items-center justify-content-center me-3" 
                                       style={{width: '32px', height: '32px', fontSize: '14px'}}>
                                    👨‍🏫
                                  </div>
                                  <div>
                                    <h6 className="fw-bold text-warning mb-0">{userDependencies.summary.mentorMappings}</h6>
                                    <small className="text-warning">Mentor Mapping{userDependencies.summary.mentorMappings > 1 ? 's' : ''}</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Critical Warning */}
                    <div className="alert border-0 mb-0" 
                         style={{ 
                           background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                           border: '2px solid #f87171',
                           borderRadius: '12px'
                         }}>
                      <div className="d-flex align-items-start">
                        <div className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center me-3 flex-shrink-0" 
                             style={{width: '32px', height: '32px', fontSize: '16px'}}>
                          ⚠️
                        </div>
                        <div>
                          <h6 className="text-danger fw-bold mb-2">CRITICAL ACTION REQUIRED</h6>
                          <ul className="text-danger mb-2 fw-medium lh-lg">
                            <li>Permanently delete user: <strong>{userToDelete.name}</strong></li>
                            <li>Delete <strong>{userDependencies.summary.total}</strong> related dependencies</li>
                            <li><strong>This action CANNOT be undone</strong></li>
                          </ul>
                          <p className="text-danger small mb-0 fst-italic">
                            Please ensure you have backed up any important data before proceeding.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="alert border-0" 
                       style={{ 
                         background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                         borderLeft: '4px solid #10b981',
                         borderRadius: '12px'
                       }}>
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center me-3" 
                           style={{width: '32px', height: '32px', fontSize: '16px'}}>
                        ✅
                      </div>
                      <div>
                        <h6 className="text-success fw-bold mb-1">Safe to Delete</h6>
                        <p className="text-success mb-0 small">
                          This user has no dependencies and can be safely deleted without affecting other data.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </AlertDialogDescription>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              variant="danger"
              onClick={handleDeleteConfirm}
              className="d-flex align-items-center"
            >
              <Trash2 className="me-2" style={{width: '18px', height: '18px'}} />
              {userDependencies && userDependencies.summary.total > 0 ? 'Delete with Dependencies' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add User Modal */}
      <AddUserModal
        show={showAddUserModal}
        onHide={() => setShowAddUserModal(false)}
        onUserAdded={onRefreshUsers}
      />

      {/* Edit User Modal */}
      <EditUserModal
        show={showEditUserModal}
        onHide={() => {
          setShowEditUserModal(false);
          setSelectedUser(null);
        }}
        onUserUpdated={onRefreshUsers}
        user={selectedUser}
      />
    </div>
  );
};

export default UserManagement;
