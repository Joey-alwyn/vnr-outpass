import React from 'react';
import { useAuth } from '../auth/AuthContext';
import './ContactAdmin.css';

const ContactAdmin: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="contact-admin-container">
      <div className="contact-admin-card">
        <div className="contact-admin-header">
          <h1>🔐 Access Pending</h1>
          <p className="welcome-text">Welcome to VNR OutPass System, {user?.name}!</p>
        </div>
        
        <div className="contact-admin-content">
          <div className="status-info">
            <h2>Your Account Status</h2>
            <div className="status-details">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Name:</strong> {user?.name}</p>
              <p><strong>Role:</strong> <span className="pending-role">Pending Assignment</span></p>
            </div>
          </div>

          <div className="action-required">
            <h3>🎯 Action Required</h3>
            <p>
              Your account has been created successfully, but you need role assignment to access the system features.
            </p>
            
            <div className="next-steps">
              <h4>Next Steps:</h4>
              <ol>
                <li>Contact your system administrator</li>
                <li>Provide your email address: <code>{user?.email}</code></li>
                <li>Wait for role assignment (Student, Mentor, HOD, or Security)</li>
                <li>Refresh this page or log out and log back in</li>
              </ol>
            </div>
          </div>

          <div className="contact-info">
            <h3>📞 Contact Information</h3>
            <div className="contact-details">
              <p><strong>System Admin:</strong> IT Department</p>
              <p><strong>Email:</strong> admin@vnrvjiet.in</p>
              <p><strong>Phone:</strong> +91-XXX-XXX-XXXX</p>
              <p><strong>Office:</strong> Computer Center, VNR VJIET</p>
            </div>
          </div>
        </div>

        <div className="contact-admin-actions">
          <button 
            onClick={() => window.location.reload()} 
            className="refresh-btn"
          >
            🔄 Refresh Status
          </button>
          <button 
            onClick={() => {
              if (confirm('Are you sure you want to logout?')) {
                // Logout logic will be handled by context
                window.location.href = '/';
              }
            }} 
            className="logout-btn"
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactAdmin;
