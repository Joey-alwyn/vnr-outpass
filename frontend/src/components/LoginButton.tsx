// frontend/src/components/LoginButton.tsx
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

export function LoginButton() {
  return (
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        const idToken = credentialResponse.credential;
        if (!idToken) return;
        try {
          await axios.post(
            'http://localhost:4000/auth/google',
            { idToken },
            { withCredentials: true }
          );
          // ← after login, reload so App re-checks auth
          window.location.reload();
        } catch (err) {
          console.error('Backend login failed', err);
        }
      }}
      onError={() => {
        console.error('Login Failed');
      }}
    />
  );
}
