import React from 'react';
import { 
  TrendingUp,
  Users,
  UserCheck,
  FileText
} from 'lucide-react';

interface AdminNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminNavigation: React.FC<AdminNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      icon: TrendingUp, 
      description: 'Overview & Analytics' 
    },
    { 
      id: 'users', 
      name: 'Users', 
      icon: Users, 
      description: 'User Management' 
    },
    { 
      id: 'mapping', 
      name: 'Mapping', 
      icon: UserCheck, 
      description: 'Student-Mentor' 
    },
    // { 
    //   id: 'actions', 
    //   name: 'Quick Actions', 
    //   icon: Zap, 
    //   description: 'System Alerts' 
    // },
    { 
      id: 'reports', 
      name: 'Reports', 
      icon: FileText, 
      description: 'Event Logs' 
    }
  ];

  return (
    <div className="mb-4">
      <div className="card border-0 shadow-sm">
        <div className="card-body p-2">
          <nav className="nav nav-pills justify-content-center" role="tablist">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`nav-link d-flex flex-column align-items-center py-3 px-4 mx-1 border-0 transition-all ${
                    isActive
                      ? 'active text-white'
                      : 'text-muted'
                  }`}
                  style={isActive ? {
                    background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
                  } : {}}
                >
                  <Icon className="mb-2" style={{width: '1.5rem', height: '1.5rem'}} />
                  <div className="fw-semibold">{tab.name}</div>
                  <div className={`small ${isActive ? 'text-white-50' : 'text-muted'}`}>
                    {tab.description}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default AdminNavigation;
