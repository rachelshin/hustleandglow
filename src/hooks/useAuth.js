// Manages Firebase Authentication state.
//
// user values:
//   undefined  → Firebase is still determining auth state (show splash)
//   null       → No user logged in (show sign-in screen)
//   object     → Logged in (show main app); use user.uid and user.email

import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../config/firebase';

export function useAuth() {
  // undefined = loading, null = no user, object = signed in
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
    });
    return unsubscribe; // clean up listener on unmount
  }, []);

  /** Sign in with email + password. Throws on failure. */
  const signIn = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  /** Create a new account. Throws on failure. */
  const signUp = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

  /** Sign the current user out. */
  const logOut = () => signOut(auth);

  return { user, signIn, signUp, logOut };
}
