# Backend API Testing

## Auth Server Integration

The backend has been refactored to work with the separate auth server on localhost:3115.

### Key Changes:

1. **Authentication Flow:**
   - Auth server (localhost:3115) handles Google OAuth and session management
   - Main API (localhost:4000) handles role verification and business logic

2. **New Endpoints:**
   - `POST /auth/register` - Register/sync user after auth server login
   - `GET /auth/check-auth` - Check auth status (combines auth server + local data)
   - `POST /auth/logout` - Local logout cleanup

3. **Middleware Changes:**
   - `requireRole(role)` - Verifies auth with auth server AND checks role
   - `isAuthenticated` - Only verifies auth with auth server
   - `optionalAuth` - Gets user info if available, doesn't block if not authenticated

### Testing the Integration:

1. Start auth server on localhost:3115
2. Start main API on localhost:4000  
3. Start frontend on localhost:5173
4. Login should now:
   - Authenticate with auth server
   - Register/sync with main API
   - Get role information for authorization

### Architecture:
```
Frontend (5173) 
    ↓ 
Auth Server (3115) ← handles Google OAuth, sessions
    ↓
Main API (4000) ← handles roles, business logic
    ↓
Database (Prisma)
```
