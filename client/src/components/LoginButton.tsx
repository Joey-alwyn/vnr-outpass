import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { api } from '../api'; // Shared axios instance

export function LoginButton() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <div className="d-flex justify-content-center">
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            const idToken = credentialResponse.credential;
            if (!idToken) return;
            setError(null);
            setLoading(true);

            try {
              await api.post('/auth/google', { idToken });
              window.location.reload(); // Refresh app to recheck auth
            } catch (err) {
              console.error('Backend login failed:', err);
              setError('Login failed. Please try again.');
            } finally {
              setLoading(false);
            }
          }}
          onError={() => {
            console.error('Google Login failed');
            setError('Google Login failed. Try again.');
          }}
        />
      </div>

      {loading && (
        <div className="mt-3 d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger mt-3 text-center py-2">
          {error}
        </div>
      )}
    </div>
  );
}
