-- Insert a test notification for demonstration
INSERT INTO "RoleAssignmentNotification" (id, userEmail, userName, createdAt, isRead)
VALUES 
  ('test-1', 'test.user@vnrvjiet.in', 'Test User', datetime('now'), 0),
  ('test-2', 'another.user@vnrvjiet.in', 'Another Test User', datetime('now', '-1 hour'), 0);
