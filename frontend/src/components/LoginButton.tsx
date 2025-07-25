import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { api } from '../api';
import { AlertCircle } from 'lucide-react';

export function LoginButton() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="w-100">
      <div className="d-flex justify-content-center mb-3">
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            const idToken = credentialResponse.credential;
            if (!idToken) return;
            setError(null);
            setLoading(true);

            try {
              await api.post('/auth/google', { idToken });
              window.location.reload();
            } catch (err) {
              console.error('Backend login failed:', err);
              setError('Login failed. Please check your internet connection and try again.');
            } finally {
              setLoading(false);
            }
          }}
          onError={() => {
            console.error('Google Login failed');
            setError('Google authentication failed. Please try again.');
          }}
          theme="outline"
          size="large"
          width="300"
          text="signin_with"
        />
      </div>

      {loading && (
        <div className="text-center py-3">
          <div className="d-flex align-items-center justify-content-center">
            <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span className="text-muted">Authenticating...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger border-0 py-3 fade-in">
          <div className="d-flex align-items-start">
            <AlertCircle size={18} className="text-danger me-2 mt-1 flex-shrink-0" />
            <div>
              <div className="fw-semibold mb-1">Authentication Failed</div>
              <div className="small mb-0">{error}</div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mt-3">
        <small className="text-muted">
          By signing in, you agree to use your VNR college account
        </small>
      </div>
    </div>
  );
}
