import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
// Env files store the PEM key with literal "\n" sequences; restore real newlines.
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
        "Firebase Admin credentials missing. Add FIREBASE_ADMIN_PROJECT_ID, " +
        "FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY to .env.local " +
        "(Firebase Console > Project Settings > Service accounts > Generate new private key)."
    );
}

const adminApp = getApps().length === 0
    ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
    : getApp();

export const adminAuth = getAuth(adminApp);
