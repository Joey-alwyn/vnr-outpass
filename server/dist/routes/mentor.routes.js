import { Router } from 'express';
import { getMentorRequests, respondToRequest } from '../controllers/mentor.controller';
import { isAuthenticated, requireRole } from '../auth';
export const mentorRoutes = Router();
mentorRoutes.get('/requests', isAuthenticated, requireRole('MENTOR'), getMentorRequests);
mentorRoutes.post('/respond', isAuthenticated, requireRole('MENTOR'), respondToRequest);
