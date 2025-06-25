import { Router, Request, Response, NextFunction } from 'express';

import { googleLogin, logout, checkAuth } from '../controllers/auth.controller';
import { isAuthenticated } from '../auth';

export const authRoutes = Router();

authRoutes.post('/google', googleLogin);
authRoutes.get('/check-auth', isAuthenticated, checkAuth);
authRoutes.post('/logout', logout);
