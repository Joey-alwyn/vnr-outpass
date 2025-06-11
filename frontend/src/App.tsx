import { useEffect, useState } from 'react';
import axios from 'axios';
import { LoginButton } from './components/LoginButton';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'MENTOR' | 'HOD' | 'SECURITY';
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch session user on mount
  useEffect(() => {
    axios
      .get('http://localhost:4000/check-auth', { withCredentials: true })
      .then((res) => {
        setUser(res.data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Logout
  const logout = async () => {
    await axios.post('http://localhost:4000/logout', {}, { withCredentials: true });
    setUser(null);
  };

  if (loading) return <p>Loading...</p>;

  if (!user) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Welcome to VNR OutPass</h2>
        <LoginButton />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Hello, {user.name}</h2>
      <p>
        Logged in as <strong>{user.role}</strong> ({user.email})
      </p>

      <button onClick={logout} style={{ marginBottom: '1rem' }}>
        Logout
      </button>

      {user.role === 'STUDENT' && (
        <p>
          <a href="/apply">Apply for Gate Pass</a>
        </p>
      )}

      {user.role === 'MENTOR' && (
        <p>
          <a href="/mentor">View Pending Requests</a>
        </p>
      )}

      {user.role === 'SECURITY' && (
        <p>
          <a href="/security">Scan QR</a>
        </p>
      )}

      {user.role === 'HOD' && (
        <p>
          <a href="/hod">HOD Review Panel</a>
        </p>
      )}
    </div>
  );
}

export default App;
