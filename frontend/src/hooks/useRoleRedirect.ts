import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';
import { getRoleDashboard } from '../utils/roleNavigation';

interface RoleRedirectOptions {
  /** Whether to redirect users with roles away from contact-admin page */
  redirectFromContactAdmin?: boolean;
  /** Whether to redirect users to their role-specific dashboard from home page */
  redirectFromHome?: boolean;
  /** Custom delay in milliseconds before redirect */
  delay?: number;
}

export const useRoleRedirect = (options: RoleRedirectOptions = {}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    redirectFromContactAdmin = true,
    redirectFromHome = false,
    delay = 1000
  } = options;

  useEffect(() => {
    if (loading || !user) return;

    console.log('🔍 useRoleRedirect: Checking redirect conditions', {
      hasUser: !!user,
      userRole: user.role || 'none',
      currentPath: location.pathname,
      redirectFromContactAdmin: redirectFromContactAdmin,
      redirectFromHome: redirectFromHome
    });

    // Redirect users without roles to contact-admin from any protected route
    if (!user.role && location.pathname !== '/contact-admin' && location.pathname !== '/') {
      console.info('ℹ️ useRoleRedirect: Redirecting user without role to contact-admin', {
        fromPath: location.pathname,
        toPath: '/contact-admin',
        userEmail: user.email
      });
      toast.info('Please request a role to access this feature');
      navigate('/contact-admin', { replace: true });
      return;
    }

    // Redirect users with roles away from contact-admin page
    if (user.role && redirectFromContactAdmin && location.pathname === '/contact-admin') {
      const targetRoute = getRoleDashboard(user.role);
      console.info('ℹ️ useRoleRedirect: Redirecting from contact-admin to role dashboard', {
        userRole: user.role,
        fromPath: location.pathname,
        toPath: targetRoute,
        delayMs: delay
      });
      setTimeout(() => {
        toast.success(`Welcome! Redirecting to your ${user.role!.toLowerCase()} dashboard...`);
        navigate(targetRoute, { replace: true });
      }, delay);
      return;
    }

    // Optional: Redirect users from home page to their role-specific dashboard
    if (user.role && redirectFromHome && location.pathname === '/') {
      const targetRoute = getRoleDashboard(user.role);
      if (targetRoute) {
        console.info('ℹ️ useRoleRedirect: Redirecting from home to role dashboard', {
          userRole: user.role,
          fromPath: location.pathname,
          toPath: targetRoute,
          delayMs: delay
        });
        setTimeout(() => {
          toast.info(`Redirecting to your ${user.role!.toLowerCase()} dashboard...`);
          navigate(targetRoute, { replace: true });
        }, delay);
      } else {
        console.warn('⚠️ useRoleRedirect: No dashboard route found for role', {
          userRole: user.role,
          currentPath: location.pathname
        });
      }
    }
  }, [user, loading, location.pathname, navigate, redirectFromContactAdmin, redirectFromHome, delay]);
};
