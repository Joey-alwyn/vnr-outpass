import React from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="p-8">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">VNR OutPass</h1>
        {user && (
          <div>
            <span className="mr-4">Hello, {user.name} ({user.role})</span>
            <button onClick={logout} className="underline">Logout</button>
          </div>
        )}
      </header>

      <nav className="mb-6 space-x-4">
        <Link to="/">Home</Link>
        {user?.role === 'STUDENT' && <Link to="/apply">Apply</Link>}
        {user?.role === 'STUDENT' && <Link to="/student/status">My Passes</Link>}
        {user?.role === 'MENTOR' && <Link to="/mentor">Mentor Requests</Link>}
        {user?.role === 'SECURITY' && <Link to="/security">Scan QR</Link>}
        {user?.role === 'HOD' && <Link to="/hod">HOD Panel</Link>}
      </nav>

      <main>{children}</main>
    </div>
  );
};
