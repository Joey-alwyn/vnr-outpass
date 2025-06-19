import React from 'react';
import { LoginButton } from '../components/LoginButton';
import { useAuth } from '../auth/AuthContext';

const Home: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!user) return (
    <div className="p-8">
      <h2>Welcome to VNR OutPass</h2>
      <LoginButton />
    </div>
  );
  return null; // Redirect handled by Layout nav
};

export default Home;