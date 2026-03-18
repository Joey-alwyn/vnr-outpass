import React from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type Role } from '../auth/AuthContext';

export const RequireRole: React.FC<{ roles: Role[]; children: ReactNode }> = ({ roles, children }) => {
  const { user, loading } = useAuth();

  // In development mode, bypass ALL role requirements for any route
  // Check VITE_NODE_ENV first, then fall back to Vite's DEV flag
  const isDevelopment = import.meta.env.VITE_NODE_ENV === 'development' || 
                       (import.meta.env.VITE_NODE_ENV !== 'production' && import.meta.env.DEV);

  console.log('🔍 RequireRole: Checking route access', {
    loading: loading,
    userExists: !!user,
    userRole: user?.role || 'none',
    requiredRoles: roles,
    isDevelopment: isDevelopment,
    currentPath: window.location.pathname,
  });

  // Development bypass for ALL routes - allow access without authentication or role checks
  if (isDevelopment) {
    console.warn('⚠️ RequireRole: DEVELOPMENT MODE ACTIVE - Bypassing all role requirements', {
      currentPath: window.location.pathname,
      requiredRoles: roles,
      reason: 'Development environment detected'
    });
    return <>{children}</>;
  }

  if (loading) {
    console.log('⏳ RequireRole: Loading user authentication data...');
    return <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }

  if (!user) {
    console.error('❌ RequireRole: User not authenticated', {
      currentPath: window.location.pathname,
      requiredRoles: roles,
      redirectTo: '/'
    });
    return <Navigate to="/" replace />;
  }

  if (!user.role) {
    console.error('❌ RequireRole: User authenticated but no role assigned', {
      userEmail: user.email,
      currentPath: window.location.pathname,
      requiredRoles: roles,
      redirectTo: '/contact-admin'
    });
    return <Navigate to="/contact-admin" replace />;
  }

  if (!roles.includes(user.role)) {
    console.error('❌ RequireRole: Access denied - insufficient permissions', {
      userRole: user.role,
      requiredRoles: roles,
      userEmail: user.email,
      currentPath: window.location.pathname,
      redirectTo: '/'
    });
    return <Navigate to="/" replace />;
  }

  console.log('✅ RequireRole: Access granted', {
    userRole: user.role,
    requiredRoles: roles,
    currentPath: window.location.pathname
  });
  return <>{children}</>;
};
