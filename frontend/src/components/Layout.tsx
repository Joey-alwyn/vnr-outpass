import React from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="bg-light min-vh-100 d-flex flex-column min-vh-100 bg-light text-dark">
      <header className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top px-4 py-3 border-bottom">
        <div className="container-fluid">
          <span className="navbar-brand fw-bold text-primary fs-4">VNR OutPass</span>
          {user && (
            <div className="d-flex align-items-center ms-auto">
              <span className="me-3 text-muted small">
                Hello, <strong>{user.name}</strong> ({user.role})
              </span>
              <button className="btn btn-outline-danger btn-sm" onClick={logout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <nav className="bg-white border-bottom py-2 px-4 shadow-sm">
        <ul className="nav">
          <li className="nav-item">
            <Link to="/" className="nav-link text-dark">Home</Link>
          </li>
          {user?.role === 'STUDENT' && (
            <>
              <li className="nav-item">
                <Link to="/apply" className="nav-link text-dark">Apply</Link>
              </li>
              <li className="nav-item">
                <Link to="/student/status" className="nav-link text-dark">My Passes</Link>
              </li>
            </>
          )}
          {user?.role === 'MENTOR' && (
            <li className="nav-item">
              <Link to="/mentor" className="nav-link text-dark">Mentor Requests</Link>
            </li>
          )}
          {user?.role === 'SECURITY' && (
            <li className="nav-item">
              <Link to="/security" className="nav-link text-dark">Scan QR</Link>
            </li>
          )}
          {user?.role === 'HOD' && (
            <li className="nav-item">
              <Link to="/hod" className="nav-link text-dark">HOD Panel</Link>
            </li>
          )}
        </ul>
      </nav>

      <main className="flex-grow-1">{children}</main>
    </div>
  );
};
