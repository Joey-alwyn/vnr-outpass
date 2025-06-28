"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mentorRoutes = void 0;
const express_1 = require("express");
const mentor_controller_1 = require("../controllers/mentor.controller");
const auth_1 = require("../auth");
exports.mentorRoutes = (0, express_1.Router)();
exports.mentorRoutes.get('/requests', auth_1.isAuthenticated, (0, auth_1.requireRole)('MENTOR'), mentor_controller_1.getMentorRequests);
exports.mentorRoutes.post('/respond', auth_1.isAuthenticated, (0, auth_1.requireRole)('MENTOR'), mentor_controller_1.respondToRequest);
