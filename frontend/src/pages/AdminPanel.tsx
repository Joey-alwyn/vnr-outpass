import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { toast } from 'sonner';
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

type AdminTab = 'users' | 'upload' | 'mappings';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setEditingUser(null);
      toast.success('User role updated successfully');
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast.error('Failed to update user role');
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>�️ Admin Panel</h1>
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
      </div>

      <div className="admin-content">
        {activeTab === 'users' && (
          <div className="tab-content">
            {loading ? (
              <div className="admin-loading">Loading users...</div>
            ) : (
              <div className="users-table-container">
                <h2>System Users ({users.length})</h2>
                <div className="users-table">
                  <div className="table-header">
                    <div>Email</div>
                    <div>Name</div>
                    <div>Role</div>
                    <div>Joined</div>
                    <div>Actions</div>
                  </div>
                  
                  {users.map(userItem => (
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
                          ✏️ Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
      </div>
    </div>
  );
};

export default AdminPanel;
