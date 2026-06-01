// Single shared context for the whole app.
//
// Auth + cloud-sync flow:
//   1. useAuth() watches Firebase and gives us user / signIn / signUp / logOut.
//   2. When the user logs in, we call syncFromCloud() to pull their Firestore
//      data into AsyncStorage for the initial load (handles new devices).
//   3. When the user signs up, we call pushLocalToCloud() first so any data
//      they had before creating an account is preserved in the cloud.
//   4. The data hooks all receive syncedUserId (null while syncing or logged
//      out), so they clear + reload automatically on auth changes.
//   5. Each hook also holds a live onSnapshot subscription (via subscribeToCloud).
//      Any write from any device propagates to every open session within ~1 s,
//      so phone + laptop open at the same time stay in sync automatically.
//   6. On logout, clearLocalData() wipes AsyncStorage.

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCategories } from '../hooks/useCategories';
import { useEntries } from '../hooks/useEntries';
import { useShifts } from '../hooks/useShifts';
import { useGoals } from '../hooks/useGoals';
import { syncFromCloud, pushLocalToCloud, clearLocalData } from '../utils/storage';
import { signInWithGoogle as firebaseGoogleSignIn } from '../config/firebase';

const AppContext = createContext(null);

/** Wrap your root navigator with this so all screens share state. */
export function AppProvider({ children }) {
  const { user, signIn, signUp: firebaseSignUp, logOut } = useAuth();

  // Tracks whether the current auth transition is a brand-new sign-up, so we
  // push local data to the cloud instead of pulling (which would overwrite it).
  const isNewSignup = useRef(false);

  // Tracks whether the user was logged in during the previous render.
  // clearLocalData() should only run on an actual sign-out (logged in → logged out),
  // NOT on first load (undefined → null) so existing users don't lose their data
  // before they've had a chance to create an account.
  const wasLoggedIn = useRef(false);

  useEffect(() => {
    // user === undefined: Firebase is still determining auth state — wait.
    if (user === undefined) return;

    if (user === null) {
      if (wasLoggedIn.current) {
        // Actual sign-out: wipe local storage so one user's data doesn't
        // linger for the next person who logs in on the same device.
        clearLocalData().catch(() => {});
      }
      // If wasLoggedIn is false this is just "not logged in on first load" —
      // leave AsyncStorage untouched so sign-up can upload existing data.
      wasLoggedIn.current = false;
      return;
    }

    // Logged in: run cloud sync in the background without blocking the UI.
    // Hooks load from local AsyncStorage immediately (instant), and their
    // onSnapshot subscriptions update state when Firestore responds (~1s).
    // syncFromCloud / pushLocalToCloud only matters on a brand-new device
    // where AsyncStorage is empty — the subscription would cover it anyway,
    // but running it in the background gives a head start.
    wasLoggedIn.current = true;
    (async () => {
      try {
        if (isNewSignup.current) {
          // New account: push any existing local data up to Firestore before
          // the subscription fires (so we don't overwrite it with null).
          isNewSignup.current = false;
          await pushLocalToCloud(user.uid);
        } else {
          await syncFromCloud(user.uid);
        }
      } catch (e) {
        console.warn('Cloud sync error (continuing with local data):', e);
      }
    })();
  }, [user]);

  // Pass userId to hooks as soon as auth is confirmed — no sync gate.
  // Hooks read local AsyncStorage immediately, then Firestore subscriptions
  // keep data fresh without any blocking wait.
  const syncedUserId = (user && user !== undefined) ? user.uid : null;

  const categoriesState = useCategories(syncedUserId);
  const entriesState    = useEntries(syncedUserId);
  const shiftsState     = useShifts(syncedUserId);
  const goalsState      = useGoals(
    entriesState.entries,
    entriesState.entryDates,
    shiftsState.getDayHours,
    syncedUserId,
  );

  /**
   * Wraps Firebase signIn — passed through directly.
   * On success, onAuthStateChanged fires, triggering the useEffect above.
   */
  const handleSignIn = (email, password) => signIn(email, password);

  /**
   * Wraps Firebase signUp.
   * Sets a flag so the auth useEffect knows to push local → cloud rather than
   * pull cloud → local.
   */
  const handleSignUp = (email, password) => {
    isNewSignup.current = true;
    return firebaseSignUp(email, password);
  };

  const value = {
    // Auth
    user,
    authChecked: user !== undefined,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInWithGoogle: firebaseGoogleSignIn,
    logOut,

    // Data
    ...categoriesState,
    ...entriesState,
    ...shiftsState,
    ...goalsState,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Use this hook in any screen or component to access shared state.
 *
 * Example:
 *   const { user, categories, getDayEntries, setEntry } = useApp();
 */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
