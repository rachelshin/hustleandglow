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
  signInAnonymously,
  EmailAuthProvider,
  linkWithCredential,
  signOut,
} from 'firebase/auth';
import { auth, linkWithGoogle } from '../config/firebase';

export function useAuth() {
  // undefined = loading, null = no user, object = signed in
  const [user, setUser] = useState(undefined);
  // Whether the signed-in user is an anonymous guest. Tracked as its own state
  // because linking (guest → real account) does NOT re-fire onAuthStateChanged,
  // so we flip this to false manually after a successful link.
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
      setIsGuest(!!firebaseUser?.isAnonymous);
    });
    return unsubscribe; // clean up listener on unmount
  }, []);

  /** Sign in with email + password. Throws on failure. */
  const signIn = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  /** Create a new account. Throws on failure. */
  const signUp = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

  /**
   * Sign in as a guest using Firebase anonymous auth.
   * The guest is a real Firebase user (with a uid + ID token), so their data
   * lives in Firestore under users/{uid} just like a signed-in account.
   * Later they can upgrade to a real account via linkWithCredential /
   * linkWithPopup, which keeps the same uid (no data migration). Throws on failure.
   */
  const signInAsGuest = () => signInAnonymously(auth);

  /**
   * Upgrade the current guest to a real email/password account, keeping the
   * same uid (so all their data carries over). Throws on failure. On success,
   * flips isGuest to false (onAuthStateChanged won't fire for a link).
   */
  const linkEmail = async (email, password) => {
    const credential = EmailAuthProvider.credential(email, password);
    const result = await linkWithCredential(auth.currentUser, credential);
    setUser(auth.currentUser);
    setIsGuest(false);
    return result;
  };

  /**
   * Upgrade the current guest to a real Google account (see linkWithGoogle in
   * firebase.js for the same-uid / fallback behavior). Throws on failure.
   */
  const linkGoogle = async () => {
    const result = await linkWithGoogle();
    setUser(auth.currentUser);
    setIsGuest(!!auth.currentUser?.isAnonymous);
    return result;
  };

  /** Sign the current user out. */
  const logOut = () => signOut(auth);

  return { user, isGuest, signIn, signUp, signInAsGuest, linkEmail, linkGoogle, logOut };
}
