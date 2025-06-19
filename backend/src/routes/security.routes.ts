import { Router } from 'express';
import { scanQRCode } from '../controllers/security.controller';
import { isAuthenticated, requireRole } from '../auth';

export const securityRoutes = Router();

securityRoutes.get('/scan/:passId/:token', isAuthenticated, requireRole('SECURITY'), scanQRCode);
