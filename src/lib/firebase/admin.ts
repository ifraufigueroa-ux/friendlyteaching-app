// FriendlyTeaching.cl — Firebase Admin SDK (server-only)
//
// Lazy-initialised in API routes that need privileged operations:
// creating auth users, generating password reset links, reading any
// users doc bypassing security rules. NEVER import this from client code.
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App | null = null;

function initAdmin(): App {
  if (app) return app;
  const existing = getApps()[0];
  if (existing) { app = existing; return app; }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON is not set. Download a service account ' +
      'key from Firebase Console → Project Settings → Service Accounts and ' +
      'paste the full JSON (single-line) into .env.local.',
    );
  }

  let parsed: { project_id?: string; client_email?: string; private_key?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }

  const projectId   = parsed.project_id   ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = parsed.client_email;
  // Service-account JSON stores \n literally in some shells — normalise.
  const privateKey  = parsed.private_key?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Service account JSON missing project_id / client_email / private_key');
  }

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
  return app;
}

export function adminAuth(): Auth { return getAuth(initAdmin()); }
export function adminDb():   Firestore { return getFirestore(initAdmin()); }
