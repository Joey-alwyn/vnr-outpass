import React from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type Role } from '../auth/AuthContext';

export const RequireRole: React.FC<{ roles: Role[]; children: ReactNode }> = ({ roles, children }) => {
  const { user, loading } = useAuth();

  console.log('🔍 RequireRole: Checking route access...', {
    loading,
    userExists: !!user,
    userRole: user?.role,
    requiredRoles: roles,
  });

  if (loading) {
    console.log('⏳ RequireRole: Loading user data...');
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log('❌ RequireRole: User not authenticated. Redirecting to home.');
    return <Navigate to="/" replace />;
  }

  if (!user.role) {
    console.log('❌ RequireRole: User has no role assigned. Redirecting to contact admin.');
    return <Navigate to="/contact-admin" replace />;
  }

  if (!roles.includes(user.role)) {
    console.log(`❌ RequireRole: Access denied. User role: ${user.role}, Required roles: ${roles.join(', ')}`);
    return <Navigate to="/" replace />;
  }

  console.log(`✅ RequireRole: Access granted. User role: ${user.role}`);
  return <>{children}</>;
};
