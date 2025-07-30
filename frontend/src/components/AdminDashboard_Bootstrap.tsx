import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Download, 
  Edit, 
  Trash2, 
  Phone,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  RefreshCw,
  Settings,
  Shield,
  Database,
  Search,
  Eye,
  Mail,
  Calendar,
  ArrowUpRight,
  Award,
  Zap
} from 'lucide-react';

// Mock data for demonstration
const mockUsers = [
  {
    id: '1',
    email: 'john.doe@vnrvjiet.in',
    name: 'John Doe',
    role: 'STUDENT',
    mobile: '+91 9876543210',
    parentMobile: '+91 9876543211',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    email: 'jane.smith@vnrvjiet.in',
    name: 'Jane Smith',
    role: 'MENTOR',
    mobile: '+91 9876543212',
    createdAt: '2024-01-10T14:20:00Z'
  },
  {
    id: '3',
    email: 'admin@vnrvjiet.in',
    name: 'Admin User',
    role: 'HOD',
    mobile: '+91 9876543213',
    createdAt: '2024-01-05T09:15:00Z'
  },
  {
    id: '4',
    email: 'security@vnrvjiet.in',
    name: 'Security Guard',
    role: 'SECURITY',
    mobile: '+91 9876543214',
    createdAt: '2024-01-01T16:45:00Z'
  }
];

const mockStats = {
  totalUsers: 1247,
  totalStudents: 1156,
  totalMentors: 78,
  totalGatePasses: 8945,
  pendingPasses: 23,
  roleDistribution: {
    STUDENT: 1156,
    MENTOR: 78,
    HOD: 8,
    SECURITY: 5
  }
};

const mockOutpassSummary = {
  today: {
    total: 45,
    approved: 32,
    pending: 8,
    rejected: 3,
    utilized: 28
  },
  activeOutpasses: 15
};

const AdminDashboard = () => {
  const [users, setUsers] = useState(mockUsers);
  const [stats] = useState(mockStats);
  const [outpassSummary] = useState(mockOutpassSummary);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [loading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  // Simulate data fetching
  const fetchDashboardData = async () => {
    setRefreshing(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const deleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    setShowDeleteConfirm(null);
  };

  const downloadDailyReport = () => {
    // Simulate download
    alert('Daily report downloaded successfully!');
  };

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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'ALL' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #e8eaf6 100%)'}}>
        <div className="bg-white rounded shadow-lg p-5 border" style={{backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255, 255, 255, 0.9)'}}>
          <div className="d-flex flex-column align-items-center">
            <div className="spinner-border text-primary mb-4" style={{width: '4rem', height: '4rem'}}></div>
            <h5 className="text-dark fw-medium mb-2">Loading Dashboard...</h5>
            <small className="text-muted">Please wait while we fetch the latest data</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #e8eaf6 100%)'}}>
      {/* Professional Header */}
      <div className="bg-white shadow-lg border-bottom position-sticky top-0" style={{zIndex: 1040, backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255, 255, 255, 0.95)'}}>
        <div className="container-fluid">
          <div className="row align-items-center py-4">
            <div className="col-md-8 d-flex align-items-center">
              <div className="position-relative me-4">
                <div className="rounded-3 p-3 shadow" style={{background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #6366f1 100%)'}}>
                  <BarChart3 className="text-white" style={{width: '2.5rem', height: '2.5rem'}} />
                </div>
                <div className="position-absolute top-0 end-0 bg-success rounded-circle border border-white" style={{width: '1rem', height: '1rem', marginTop: '-0.25rem', marginRight: '-0.25rem'}}></div>
              </div>
              <div>
                <h1 className="h2 fw-bold mb-1" style={{background: 'linear-gradient(90deg, #1e293b 0%, #3b82f6 50%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                  Admin Dashboard
                </h1>
                <p className="text-muted mb-2 fw-medium">VNR Outpass Management System</p>
                <div className="d-flex align-items-center gap-3">
                  <span className="badge bg-success-subtle text-success d-flex align-items-center fw-medium">
                    <div className="bg-success rounded-circle me-1" style={{width: '0.5rem', height: '0.5rem'}}></div>
                    System Online
                  </span>
                  <small className="text-muted">Last updated: just now</small>
                </div>
              </div>
            </div>
            
            <div className="col-md-4 d-flex align-items-center justify-content-end gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="btn btn-outline-secondary d-flex align-items-center"
                style={{backdropFilter: 'blur(10px)'}}
              >
                {refreshing ? (
                  <div className="spinner-border spinner-border-sm text-primary me-2" style={{width: '1rem', height: '1rem'}}></div>
                ) : (
                  <RefreshCw className="me-2" style={{width: '1rem', height: '1rem'}} />
                )}
                <span className="fw-medium">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              
              <div className="vr"></div>
              
              <button
                onClick={downloadDailyReport}
                className="btn btn-primary d-flex align-items-center shadow"
                style={{background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)', border: 'none'}}
              >
                <Download className="me-2" style={{width: '1.25rem', height: '1.25rem'}} />
                <span className="fw-medium">Export Report</span>
                <ArrowUpRight className="ms-1" style={{width: '1rem', height: '1rem'}} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="container-fluid py-4">
        <div className="bg-white rounded-3 shadow border" style={{backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255, 255, 255, 0.9)'}}>
          <nav className="nav nav-pills p-2" role="tablist">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: TrendingUp, description: 'Overview & Analytics' },
              { id: 'users', name: 'Users', icon: Users, description: 'User Management' },
              { id: 'actions', name: 'Actions', icon: Settings, description: 'System Actions' }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`nav-link flex-fill text-center py-3 px-4 rounded-2 border-0 transition-all ${
                    activeTab === tab.id
                      ? 'active text-white shadow'
                      : 'text-muted'
                  }`}
                  style={activeTab === tab.id ? {
                    background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
                    transform: 'scale(1.02)'
                  } : {}}
                >
                  <Icon className="d-block mx-auto mb-2" style={{width: '1.5rem', height: '1.5rem'}} />
                  <div className="fw-semibold">{tab.name}</div>
                  <div className={`small ${activeTab === tab.id ? 'text-white-50' : 'text-muted'}`}>
                    {tab.description}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="container-fluid pb-5">
        <div className="bg-white rounded-3 shadow border p-4" style={{backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255, 255, 255, 0.9)'}}>
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Stats Cards */}
              <div className="row g-4 mb-5">
                {[
                  { 
                    title: 'Total Users', 
                    value: stats.totalUsers, 
                    icon: Users, 
                    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    bgGradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    change: '+12%',
                    changeType: 'positive' as const
                  },
                  { 
                    title: 'Total Outpasses', 
                    value: stats.totalGatePasses, 
                    icon: CheckCircle, 
                    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    bgGradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                    change: '+8%',
                    changeType: 'positive' as const
                  },
                  { 
                    title: 'Pending Requests', 
                    value: stats.pendingPasses, 
                    icon: Clock, 
                    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    bgGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    change: '-5%',
                    changeType: 'negative' as const
                  },
                  { 
                    title: 'Active Students', 
                    value: stats.totalStudents, 
                    icon: Activity, 
                    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    bgGradient: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
                    change: '+15%',
                    changeType: 'positive' as const
                  }
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="col-md-6 col-lg-3">
                      <div className="card h-100 border-0 shadow-sm" style={{background: stat.bgGradient}}>
                        <div className="card-body p-4">
                          <div className="d-flex align-items-start justify-content-between mb-3">
                            <div className="rounded-3 p-3 shadow-sm" style={{background: stat.gradient}}>
                              <Icon className="text-white" style={{width: '1.5rem', height: '1.5rem'}} />
                            </div>
                          </div>
                          <h6 className="text-muted fw-semibold mb-2">{stat.title}</h6>
                          <h3 className="fw-bold text-dark mb-2">{stat.value.toLocaleString()}</h3>
                          <div className={`d-flex align-items-center small ${stat.changeType === 'positive' ? 'text-success' : 'text-danger'}`}>
                            <span className="fw-medium">{stat.change}</span>
                            <span className="text-muted ms-1">vs last month</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Today's Activity */}
              <div className="card border-0 shadow-lg overflow-hidden" style={{background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)'}}>
                <div className="card-header border-bottom bg-transparent py-4">
                  <div className="row align-items-center">
                    <div className="col d-flex align-items-center">
                      <div className="rounded-3 p-3 shadow me-3" style={{background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'}}>
                        <Activity className="text-white" style={{width: '1.5rem', height: '1.5rem'}} />
                      </div>
                      <div>
                        <h4 className="fw-bold mb-1" style={{background: 'linear-gradient(90deg, #1e293b 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                          Today's Activity
                        </h4>
                        <p className="text-muted mb-0 fw-medium">Real-time outpass overview</p>
                      </div>
                    </div>
                    <div className="col-auto d-flex align-items-center text-muted small">
                      <Calendar className="me-1" style={{width: '1rem', height: '1rem'}} />
                      {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>
                
                <div className="card-body p-4">
                  <div className="row g-4">
                    {[
                      { label: 'Total', value: outpassSummary.today.total, color: '#3b82f6', icon: Activity },
                      { label: 'Approved', value: outpassSummary.today.approved, color: '#10b981', icon: CheckCircle },
                      { label: 'Pending', value: outpassSummary.today.pending, color: '#f59e0b', icon: Clock },
                      { label: 'Rejected', value: outpassSummary.today.rejected, color: '#ef4444', icon: AlertCircle },
                      { label: 'Utilized', value: outpassSummary.today.utilized, color: '#8b5cf6', icon: Zap }
                    ].map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div key={index} className="col-6 col-md-2">
                          <div className="text-center p-4 bg-white rounded-3 shadow-sm border h-100">
                            <div className="rounded-3 p-3 mx-auto mb-3 shadow-sm" style={{background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}dd 100%)`, width: 'fit-content'}}>
                              <Icon className="text-white" style={{width: '1.75rem', height: '1.75rem'}} />
                            </div>
                            <div className="h2 fw-bold mb-2" style={{color: item.color}}>
                              {item.value}
                            </div>
                            <div className="small text-muted fw-semibold text-uppercase">
                              {item.label}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="row align-items-center mb-4">
                <div className="col-lg-6">
                  <div className="d-flex align-items-center mb-3">
                    <Users className="text-primary me-3" style={{width: '1.75rem', height: '1.75rem'}} />
                    <div>
                      <h3 className="fw-bold mb-1" style={{background: 'linear-gradient(90deg, #1e293b 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                        User Management
                      </h3>
                      <p className="text-muted mb-0">Manage system users and permissions</p>
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
                          style={{backdropFilter: 'blur(10px)'}}
                        />
                      </div>
                    </div>
                    
                    <div className="col-md-4">
                      <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="form-select bg-white"
                        style={{backdropFilter: 'blur(10px)'}}
                      >
                        <option value="ALL">All Roles</option>
                        <option value="STUDENT">Students</option>
                        <option value="MENTOR">Mentors</option>
                        <option value="HOD">HOD</option>
                        <option value="SECURITY">Security</option>
                      </select>
                    </div>
                    
                    <div className="col-md-3">
                      <button className="btn btn-primary w-100 d-flex align-items-center justify-content-center shadow"
                              style={{background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)', border: 'none'}}>
                        <UserPlus className="me-2" style={{width: '1.25rem', height: '1.25rem'}} />
                        Add User
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card border-0 shadow-lg overflow-hidden" style={{backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)'}}>
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
                              <div className="position-relative me-3">
                                <div className="rounded-3 d-flex align-items-center justify-content-center shadow" 
                                     style={{width: '3rem', height: '3rem', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'}}>
                                  <span className="text-white fw-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white" 
                                     style={{width: '1rem', height: '1rem'}}></div>
                              </div>
                              <div>
                                <div className="fw-bold text-dark">{user.name}</div>
                                <div className="d-flex align-items-center text-muted small">
                                  <Mail className="me-1" style={{width: '0.75rem', height: '0.75rem'}} />
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`btn btn-sm ${getRoleBootstrapColor(user.role)} d-flex align-items-center`}>
                              {getRoleIcon(user.role)}
                              <span className="ms-1">{user.role}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              {user.mobile ? (
                                <div className="d-flex align-items-center small fw-medium text-dark">
                                  <Phone className="me-2 text-muted" style={{width: '1rem', height: '1rem'}} />
                                  {user.mobile}
                                </div>
                              ) : (
                                <span className="text-muted fst-italic small">No mobile</span>
                              )}
                              {user.parentMobile && (
                                <div className="d-flex align-items-center text-muted small">
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
                              >
                                <Eye style={{width: '1rem', height: '1rem'}} />
                              </button>
                              <button
                                className="btn btn-outline-success btn-sm"
                                title="Edit User"
                              >
                                <Edit style={{width: '1rem', height: '1rem'}} />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(user.id)}
                                className="btn btn-outline-danger btn-sm"
                                title="Delete User"
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
                  <div className="text-center py-5">
                    <Users className="text-muted mb-3" style={{width: '4rem', height: '4rem'}} />
                    <h5 className="fw-medium text-muted">No users found</h5>
                    <p className="text-muted">Try adjusting your search or filter criteria</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions Tab */}
          {activeTab === 'actions' && (
            <div>
              <div className="d-flex align-items-center mb-4">
                <Settings className="text-primary me-3" style={{width: '1.75rem', height: '1.75rem'}} />
                <div>
                  <h3 className="fw-bold mb-1" style={{background: 'linear-gradient(90deg, #1e293b 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                    System Actions
                  </h3>
                  <p className="text-muted mb-0">Administrative tools and system maintenance</p>
                </div>
              </div>
              
              <div className="row g-4">
                {[
                  {
                    title: 'Export Reports',
                    description: 'Download comprehensive system reports',
                    icon: Download,
                    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    bgGradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    action: downloadDailyReport,
                    buttonText: 'Download'
                  },
                  {
                    title: 'Database Backup',
                    description: 'Create backup of system database',
                    icon: Database,
                    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    bgGradient: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
                    action: () => alert('Backup initiated successfully!'),
                    buttonText: 'Backup'
                  },
                  {
                    title: 'Security Settings',
                    description: 'Configure system security options',
                    icon: Shield,
                    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    bgGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    action: () => alert('Security settings opened!'),
                    buttonText: 'Configure'
                  },
                  {
                    title: 'System Analytics',
                    description: 'View detailed system performance',
                    icon: BarChart3,
                    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    bgGradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                    action: () => setActiveTab('dashboard'),
                    buttonText: 'View Analytics'
                  },
                  {
                    title: 'User Management',
                    description: 'Quick access to user administration',
                    icon: Users,
                    gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    bgGradient: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                    action: () => setActiveTab('users'),
                    buttonText: 'Manage Users'
                  },
                  {
                    title: 'System Refresh',
                    description: 'Update all dashboard data manually',
                    icon: RefreshCw,
                    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                    bgGradient: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    action: handleRefresh,
                    buttonText: refreshing ? 'Refreshing...' : 'Refresh'
                  }
                ].map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <div key={index} className="col-md-6 col-lg-4">
                      <div className="card h-100 border-0 shadow position-relative overflow-hidden" style={{background: action.bgGradient}}>
                        {/* Decorative elements */}
                        <div className="position-absolute top-0 end-0 rounded-circle opacity-25" 
                             style={{width: '8rem', height: '8rem', background: 'rgba(255,255,255,0.4)', marginTop: '-2rem', marginRight: '-2rem'}}></div>
                        <div className="position-absolute bottom-0 start-0 rounded-circle opacity-25" 
                             style={{width: '6rem', height: '6rem', background: 'rgba(255,255,255,0.3)', marginBottom: '-2rem', marginLeft: '-2rem'}}></div>
                        
                        <div className="card-body p-4 position-relative">
                          <div className="d-flex align-items-start justify-content-between mb-3">
                            <div className="rounded-3 p-3 shadow" style={{background: action.gradient}}>
                              <Icon className="text-white" style={{width: '1.75rem', height: '1.75rem'}} />
                            </div>
                            <div className="bg-white bg-opacity-75 rounded p-2 shadow-sm">
                              <ArrowUpRight className="text-primary" style={{width: '1.25rem', height: '1.25rem'}} />
                            </div>
                          </div>
                          
                          <h5 className="fw-bold text-dark mb-3">{action.title}</h5>
                          <p className="text-muted mb-4 small">{action.description}</p>
                          
                          <button
                            onClick={action.action}
                            disabled={action.buttonText.includes('Refreshing')}
                            className="btn btn-primary w-100 d-flex align-items-center justify-content-center shadow"
                            style={{background: action.gradient, border: 'none'}}
                          >
                            {action.buttonText.includes('Refreshing') ? (
                              <div className="spinner-border spinner-border-sm me-2" style={{width: '1.25rem', height: '1.25rem'}}></div>
                            ) : (
                              <Icon className="me-2" style={{width: '1.25rem', height: '1.25rem'}} />
                            )}
                            {action.buttonText}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)'}}>
              <div className="modal-body p-4">
                <div className="d-flex align-items-center mb-4">
                  <div className="bg-danger bg-opacity-10 rounded-3 p-3 me-3">
                    <AlertCircle className="text-danger" style={{width: '2rem', height: '2rem'}} />
                  </div>
                  <div>
                    <h5 className="fw-bold text-dark mb-1">Delete User</h5>
                    <p className="text-muted mb-0">This action cannot be undone</p>
                  </div>
                </div>
                
                <div className="alert alert-danger border-danger border-opacity-25 bg-danger bg-opacity-10 mb-4">
                  <p className="text-danger small fw-medium mb-0">
                    ⚠️ Warning: This will permanently delete the user and all associated data including outpass history.
                  </p>
                </div>
                
                <div className="d-flex gap-3">
                  <button
                    onClick={() => deleteUser(showDeleteConfirm)}
                    className="btn btn-danger flex-fill d-flex align-items-center justify-content-center shadow"
                  >
                    <Trash2 className="me-2" style={{width: '1rem', height: '1rem'}} />
                    Delete Permanently
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="btn btn-secondary flex-fill"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .transition-all {
          transition: all 0.3s ease;
        }
        
        .card:hover {
          transform: translateY(-2px);
        }
        
        .btn:hover {
          transform: translateY(-1px);
        }
        
        .nav-link {
          transition: all 0.3s ease;
        }
        
        .table-hover tbody tr:hover {
          background-color: rgba(59, 130, 246, 0.05) !important;
        }
        
        /* Custom scrollbar */
        .table-responsive::-webkit-scrollbar {
          height: 6px;
        }
        
        .table-responsive::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        
        .table-responsive::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg, #3b82f6, #6366f1);
          border-radius: 3px;
        }
        
        .table-responsive::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(90deg, #2563eb, #4f46e5);
        }
        `
      }} />
    </div>
  );
};

export default AdminDashboard;
