import React from 'react';
import { LoginButton } from '../components/LoginButton';
import { useAuth } from '../auth/AuthContext';

const Home: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="d-flex justify-content-center">
        <div
          className="px-3 py-2 bg-white border rounded shadow-sm w-auto"
style={{ maxWidth: '360px' }}
        >
          <h4 className="mb-2 text-primary text-center">Welcome to VNR OutPass</h4>
          <p className="text-muted text-center mb-3" style={{ fontSize: '0.9rem' }}>
            Login with your college Google account to continue.
          </p>
          <LoginButton />
        </div>
      </div>  
    );
  }

  return null;
};

export default Home;
