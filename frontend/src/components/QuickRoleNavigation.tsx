import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { redirectToRoleDashboard } from '../utils/roleNavigation';
import { ArrowRight, User } from 'lucide-react';

export const QuickRoleNavigation: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || !user.role) return null;

  const handleDashboardClick = () => {
    redirectToRoleDashboard(user.role!, navigate, { 
      replace: false, 
      showToast: false 
    });
  };
  
  return (
    <div className="alert alert-info border-0 mb-3" style={{ backgroundColor: '#e7f3ff' }}>
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <User size={20} className="text-primary me-2" />
          <span className="text-primary fw-medium">
            Quick access to your {user.role.toLowerCase()} dashboard
          </span>
        </div>
        <button 
          onClick={handleDashboardClick}
          className="btn btn-primary btn-sm d-flex align-items-center"
        >
          Go to Dashboard
          <ArrowRight size={16} className="ms-1" />
        </button>
      </div>
    </div>
  );
};
