import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Menu, X, User, LogOut, Home, FileText, Users, Scan, Shield, Settings } from 'lucide-react';
import './Layout.css';

export const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const getNavItems = () => {
    const items = [
      { path: '/', label: 'Home', icon: Home, roles: ['STUDENT', 'MENTOR', 'SECURITY', 'HOD'] },
    ];

    if (user?.role === 'STUDENT') {
      items.push(
        { path: '/apply', label: 'Apply Pass', icon: FileText, roles: ['STUDENT'] },
        { path: '/student/status', label: 'My Passes', icon: Shield, roles: ['STUDENT'] }
      );
    }

    if (user?.role === 'MENTOR') {
      items.push({ path: '/mentor', label: 'Requests', icon: Users, roles: ['MENTOR'] });
    }

    if (user?.role === 'SECURITY') {
      items.push({ path: '/security', label: 'Scan QR', icon: Scan, roles: ['SECURITY'] });
    }

    if (user?.role === 'HOD') {
      items.push(
        { path: '/hod', label: 'HOD Panel', icon: Shield, roles: ['HOD'] },
        { path: '/admin', label: 'Admin Panel', icon: Settings, roles: ['HOD'] }
      );
    }

    // Note: Admin Panel is only accessible to HOD users
    // No development mode override - strict role-based access control

    return items.filter(item => item.roles.includes(user?.role || ''));
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      {/* Header */}
      <header className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
        <div className="container-fluid px-3 px-lg-4">
          {/* Brand */}
          <div className="d-flex align-items-center">
            <Link to="/" className="navbar-brand d-flex align-items-center text-decoration-none">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" 
                   style={{ width: '40px', height: '40px' }}>
                <Shield size={20} />
              </div>
              <span className="fw-bold text-primary fs-4 d-none d-sm-block">VNR OutPass</span>
              <span className="fw-bold text-primary fs-5 d-block d-sm-none">VNR</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {user && (
            <div className="d-none d-lg-flex align-items-center">
              <nav className="navbar-nav me-4">
                <div className="d-flex gap-1">
                  {getNavItems().map(({ path, label, icon: Icon }) => (
                    <Link
                      key={path}
                      to={path}
                      className={`nav-link px-3 py-2 rounded-pill text-decoration-none fw-medium transition-all ${
                        isActiveRoute(path)
                          ? 'bg-primary text-white'
                          : 'text-secondary hover:bg-light'
                      }`}
                    >
                      <Icon size={16} className="me-1" />
                      {label}
                    </Link>
                  ))}
                </div>
              </nav>

              {/* User Info & Logout */}
              <div className="d-flex align-items-center gap-3">
                <div className="text-end d-none d-xl-block">
                  <div className="fw-semibold text-dark">{user.name}</div>
                  <div className="small text-muted">{user.role}</div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-light rounded-circle p-2">
                    <User size={20} className="text-secondary" />
                  </div>
                  <button 
                    className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                    onClick={logout}
                  >
                    <LogOut size={16} />
                    <span className="d-none d-lg-inline">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          {user && (
            <button
              className="btn btn-outline-secondary d-lg-none"
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>

        {/* Mobile Navigation */}
        {user && isMobileMenuOpen && (
          <div className="d-lg-none border-top bg-white">
            <div className="container-fluid px-3 py-3">
              {/* User Info */}
              <div className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
                <div className="bg-light rounded-circle p-2">
                  <User size={24} className="text-secondary" />
                </div>
                <div>
                  <div className="fw-semibold text-dark">{user.name}</div>
                  <div className="small text-muted">{user.role}</div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="mb-3">
                {getNavItems().map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`d-flex align-items-center gap-3 py-2 px-3 rounded text-decoration-none mb-1 ${
                      isActiveRoute(path)
                        ? 'bg-primary text-white'
                        : 'text-secondary'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon size={20} />
                    <span className="fw-medium">{label}</span>
                  </Link>
                ))}
              </nav>

              {/* Logout Button */}
              <button 
                className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow-1">{children}</main>
    </div>
  );
};
