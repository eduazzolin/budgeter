import { auth, isFirebaseEnabled } from '../firebase';
import { 
  onAuthStateChanged, 
  signOut, 
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';

export interface AppUser {
  uid: string;
  isAnonymous: boolean;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

const mapFirebaseUser = (user: FirebaseUser): AppUser => ({
  uid: user.uid,
  isAnonymous: user.isAnonymous,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL
});

export const authService = {
  // Subscribe to authentication changes
  subscribeToAuthChanges: (callback: (user: AppUser | null) => void): (() => void) => {
    if (isFirebaseEnabled() && auth) {
      return onAuthStateChanged(auth, (user) => {
        if (user) {
          callback(mapFirebaseUser(user));
        } else {
          // If not logged in, return null (meaning local offline mode)
          callback(null);
        }
      });
    } else {
      // Local mode: return null to denote offline guest user
      callback(null);
      return () => {};
    }
  },

  // Login with Google
  loginWithGoogle: async (): Promise<AppUser | null> => {
    if (isFirebaseEnabled() && auth) {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // Always use popup, as redirect has known state loss issues on mobile browsers
      const cred = await signInWithPopup(auth, provider);
      return mapFirebaseUser(cred.user);
    }
    throw new Error('Firebase não está configurado.');
  },

  // Sign out
  logout: async (): Promise<void> => {
    if (isFirebaseEnabled() && auth) {
      await signOut(auth);
    }
  }
};
