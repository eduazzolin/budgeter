import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import type { FirebaseConfig } from './types';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

// Define global interface for runtime environment variables
declare global {
  interface Window {
    _env_?: Record<string, string>;
  }
}

// Load config from environment variables
// Reads from runtime window._env_ (Docker) first, falls back to Vite build-time env vars (local dev)
const config: FirebaseConfig = {
  apiKey: window._env_?.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: window._env_?.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: window._env_?.VITE_FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: window._env_?.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: window._env_?.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: window._env_?.VITE_FIREBASE_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID || '',
};

if (config.apiKey && config.projectId) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('Firebase initialized successfully from environment.');
  } catch (error) {
    console.error('Failed to initialize Firebase with environment config:', error);
  }
} else {
  console.log('Firebase credentials not found in environment. Running in local-only mode.');
}

export const isFirebaseEnabled = (): boolean => {
  return db !== null && auth !== null;
};

export { app, db, auth };
