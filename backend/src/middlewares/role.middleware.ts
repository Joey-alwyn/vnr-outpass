import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { Role } from '@prisma/client';
import { prisma } from '../prisma/client';

// Create axios instance for auth server communication
const authServerApi = axios.create({
  baseURL: 'http://localhost:3115',
  withCredentials: true,
  timeout: 5000,
});

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/**
 * Helper function to extract userToken from cookies
 */
function extractUserToken(cookieHeader: string | undefined): string | null {
  console.log('🍪 Raw cookie header:', cookieHeader);
  
  if (!cookieHeader) {
    console.log('❌ No cookie header found');
    return null;
  }
  
  const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
  console.log('🍪 Parsed cookies:', cookies);
  
  const userTokenCookie = cookies.find(cookie => cookie.startsWith('userToken='));
  console.log('🍪 UserToken cookie found:', userTokenCookie);
  
  if (userTokenCookie) {
    const token = userTokenCookie.split('=')[1];
    console.log('🔑 Extracted token:', token ? 'TOKEN_PRESENT' : 'TOKEN_EMPTY');
    return token;
  }
  
  console.log('❌ No userToken cookie found');
  return null;
}

/**
 * Helper function to verify token with auth server and get role from local DB
 */
export async function verifyTokenWithAuthServer(token: string): Promise<{ valid: boolean; user?: any }> {
  try {
    console.log('🔍 Verifying token with auth server:', token ? 'TOKEN_PRESENT' : 'NO_TOKEN');
    const response = await authServerApi.post('/verify-token', { token });
    console.log('✅ Auth server verification response:', response.data);

    if (response.data.valid && response.data.user) {
      const authUser = response.data.user;
      console.log('🔍 Fetching role from local database for email:', authUser.email);
      const localUser = await prisma.user.findUnique({
        where: { email: authUser.email?.toLowerCase() },
      });

      if (localUser) {
        const combinedUser = {
          id: localUser.id,
          email: localUser.email,
          name: localUser.name,
          role: localUser.role,
          picture: authUser.picture,
          family_name: authUser.family_name,
        };
        console.log('✅ Combined user data with role:', combinedUser);
        return { valid: true, user: combinedUser };
      } else {
        console.log('⚠️ User authenticated but not found in local database - creating new user');
        
        // Auto-create the user in the local database
        const newUser = await prisma.user.create({
          data: {
            email: authUser.email.toLowerCase(),
            name: authUser.name,
            // Don't set role - it will be null by default since it's optional
          },
        });

        console.log('✅ Created new user in local database:', newUser);

        const combinedUser = {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          picture: authUser.picture,
          family_name: authUser.family_name,
        };
        
        return { valid: true, user: combinedUser };
      }
    }

    console.log('❌ Token verification failed or user data missing');
    return response.data;
  } catch (error: any) {
    console.error('❌ Token verification failed:', error.response?.data || error.message);
    return { valid: false };
  }
}


/**
 * Middleware factory to require a specific role
 * This verifies both authentication AND role authorization
 */
export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Development bypass - still authenticate but skip role checks
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    console.log(`🔒 Checking role requirement: ${role} for ${req.method} ${req.path}`, {
      isDevelopment,
      NODE_ENV: process.env.NODE_ENV,
      nodeEnvType: typeof process.env.NODE_ENV,
    });
    
    const cookieHeader = req.headers.cookie;
    const token = extractUserToken(cookieHeader);
    
    if (!token) {
      if (isDevelopment) {
        console.log('🔧 DEVELOPMENT MODE: No token found, but allowing access anyway');
        next();
        return;
      }
      console.log('❌ No token found, rejecting request');
      res.status(401).json({ error: 'No authentication token found' });
      return;
    }

    verifyTokenWithAuthServer(token)
      .then(result => {
        console.log('🔍 Token verification result:', result);
        
        if (!result.valid || !result.user) {
          if (isDevelopment) {
            console.log('🔧 DEVELOPMENT MODE: Invalid token, but allowing access anyway');
            next();
            return;
          }
          console.log('❌ Invalid token or no user data');
          res.status(401).json({ error: 'Invalid or expired token' });
          return;
        }

        const user = result.user as AuthenticatedUser;
        console.log('👤 User data from auth server:', user);
        (req as any).user = user;

        // In development mode, bypass role checking but still set user
        console.log('🔧 Development mode check:', {
          isDevelopment,
          NODE_ENV: process.env.NODE_ENV,
          shouldBypass: isDevelopment
        });
        
        if (isDevelopment) {
          console.log('🔧 DEVELOPMENT MODE: User authenticated, bypassing role check');
          next();
          return;
        }

        // Check if user has the required role
        console.log(`🔍 Checking role: Required=${role}, User has=${user.role}`);
        if (user.role !== role) {
          console.log(`❌ Role mismatch. Required: ${role}, User has: ${user.role}`);
          res.status(403).json({ 
            error: 'Forbidden - insufficient privileges',
            required: role,
            current: user.role
          });
          return;
        }

        console.log(`✅ Role check passed for user: ${user.email} (${user.role})`);
        next();
      })
      .catch(error => {
        console.error('❌ Auth server role check failed:', error.message);
        res.status(401).json({ error: 'Authentication verification failed' });
      });
  };
}

/**
 * Middleware to check authentication but allow access if no role required
 * This is useful for endpoints that need user info but don't require specific roles
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const cookieHeader = req.headers.cookie;
  const token = extractUserToken(cookieHeader);
  
  if (!token) {
    // No token found, proceed without user info
    next();
    return;
  }

  verifyTokenWithAuthServer(token)
    .then(result => {
      if (result.valid && result.user) {
        (req as any).user = result.user;
      }
      // Always proceed, even if token is invalid
      next();
    })
    .catch(error => {
      console.warn('⚠️ Optional auth check failed:', error.message);
      // Still proceed even if auth server is down
      next();
    });
}
