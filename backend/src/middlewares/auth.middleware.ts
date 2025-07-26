// backend/src/middlewares/auth.middleware.ts
import { OAuth2Client } from 'google-auth-library';
import { GOOGLE_CLIENT_ID } from '../config';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Verify Google ID Token (used by auth routes only)
 */
export async function verifyGoogleIdToken(idToken: string) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload()!;
}
