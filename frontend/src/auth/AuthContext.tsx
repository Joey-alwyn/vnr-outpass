import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi, mainApi } from './authApi';
import { toast } from 'sonner';

export type Role = 'STUDENT' | 'MENTOR' | 'HOD' | 'SECURITY';

export interface User {
  id?: string;
  name: string;
  email: string;
  role?: Role | null; // Allow null for users without assigned roles
  picture?: string;
  family_name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  loginWithGoogle: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Step 1: Checking auth status with auth server (3115)...');

      // Step 1: Check if user is authenticated with the auth server (3115)
      const authResponse = await authApi.get('/check-auth');
      console.log('✅ Step 1 Complete - Auth server response:', authResponse.data);

      if (authResponse.data.logged_in && authResponse.data.user) {
        const authUser = authResponse.data.user;
        console.log('✅ User authenticated with auth server:', authUser.email);

        // Step 2: Fetch role and additional data from main backend (4000)
        console.log('🔍 Step 2: Fetching role from main backend (4000)...');
        try {
          const roleResponse = await mainApi.get('/user/profile');
          console.log('✅ Step 2 Complete - Backend response for user profile:', roleResponse.data);

          // Combine auth data with role data
          setUser({
            id: roleResponse.data.id || authUser.id,
            name: authUser.name,
            email: authUser.email,
            role: roleResponse.data.role, // Role from main backend
            picture: authUser.picture,
            family_name: authUser.family_name,
          });

          console.log('✅ Complete user profile set with role:', roleResponse.data.role);
        } catch (roleError: any) {
          console.error('❌ Failed to fetch role from backend:', roleError);
          
          // If role fetch fails, still set basic user data without role
          setUser({
            id: authUser.id,
            name: authUser.name,
            email: authUser.email,
            role: undefined, // No role available
            picture: authUser.picture,
            family_name: authUser.family_name,
          });
          
          console.log('⚠️ User set without role due to backend error');
        }
      } else {
        console.log('⚠️ User not logged in or no user data from auth server');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (token: string) => {
    try {
      console.log('🔍 Step 1: Logging in with Google token to auth server (3115)...');
      
      // Step 1: Send token to auth server for authentication (3115)
      const authResponse = await authApi.post('/auth/google', { token });
      console.log('✅ Step 1 Complete - Auth server login response:', authResponse.data);
      
      if (authResponse.data.user) {
        console.log('🔍 Step 2: Re-checking auth status to get complete user profile...');
        
        // Step 2: Re-check auth status to get updated user data with role from backend
        await checkAuthStatus();
        
        toast.success('Login Successful!', {
          description: 'Welcome to VNR OutPass system.'
        });
      }
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      if (error.response?.status === 403) {
        toast.error('Access Denied', {
          description: 'Your email is not recognized for this system.'
        });
      } else {
        toast.error('Login Failed', {
          description: 'Failed to authenticate with Google. Please try again.'
        });
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🔍 Step 1: Logging out from auth server (3115)...');
      
      // Step 1: Logout from auth server (3115)
      await authApi.post('/logout');
      console.log('✅ Step 1 Complete - Logged out from auth server');
      
      setUser(null);
      toast.success('Logged Out Successfully', {
        description: 'You have been safely logged out.'
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
      toast.error('Logout Error', {
        description: 'There was an issue logging you out, but you have been signed out locally.'
      });
      setUser(null); // Still log out locally even if server request fails
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};