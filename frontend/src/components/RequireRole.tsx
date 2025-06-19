import React from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type Role } from '../auth/AuthContext';

export const RequireRole: React.FC<{ roles: Role[]; children: ReactNode }> = ({ roles, children }) => {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};
