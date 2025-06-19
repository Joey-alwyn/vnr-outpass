import { Router } from 'express';
import { applyGatePass, getStudentStatus } from '../controllers/student.controller';
import { isAuthenticated, requireRole } from '../auth';

export const studentRoutes = Router();

studentRoutes.post('/apply', isAuthenticated, requireRole('STUDENT'), applyGatePass);
studentRoutes.get('/status', isAuthenticated, requireRole('STUDENT'), getStudentStatus);
