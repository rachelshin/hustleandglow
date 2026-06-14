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

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCategories } from '../hooks/useCategories';
import { useEntries } from '../hooks/useEntries';
import { useShifts } from '../hooks/useShifts';
import { useGoals } from '../hooks/useGoals';
import {
  syncFromCloud, pushLocalToCloud, clearLocalData, subscribeToCloud,
  loadCurrency, saveCurrency,
  loadTaxRate, saveTaxRate,
} from '../utils/storage';
import { fetchUsdGbpRate } from '../utils/exchangeRate';
import { setCurrency, setTaxRate, DEFAULT_TAX_RATE } from '../utils/calculations';
import { signInWithGoogle as firebaseGoogleSignIn } from '../config/firebase';

const AppContext = createContext(null);

/** Wrap your root navigator with this so all screens share state. */
export function AppProvider({ children }) {
  const {
    user, isGuest, signIn, signUp: firebaseSignUp,
    signInAsGuest, linkEmail, linkGoogle, logOut,
  } = useAuth();

  // Tracks whether the current auth transition is a brand-new sign-up, so we
  // push local data to the cloud instead of pulling (which would overwrite it).
  const isNewSignup = useRef(false);

  // ── Display currency ────────────────────────────────────────────────────────
  // 'USD' (source of truth) or 'GBP' (live-converted display lens, Option 1 —
  // history re-values at today's rate). `gbpRate` holds the fetched
  // { rate, date }; null until the first fetch resolves.
  const [currency, setCurrencyState] = useState('USD');
  const [gbpRate, setGbpRate] = useState(null);

  // Estimated tax rate as a fraction (0.25 = 25%). Cloud-synced across devices
  // (see the subscription below) since it's an account-level financial setting.
  const [taxRate, setTaxRateState] = useState(DEFAULT_TAX_RATE);
  // true while a fetch is in flight; lets the UI tell "loading" from "failed"
  // (gbpRate stays null in both cases) so it can offer a retry instead of
  // spinning on "Fetching…" forever.
  const [rateLoading, setRateLoading] = useState(true);

  const refreshRate = useCallback(() => {
    setRateLoading(true);
    fetchUsdGbpRate()
      .then(setGbpRate)
      .finally(() => setRateLoading(false));
  }, []);

  // Restore the saved per-device preference + fetch today's rate on mount.
  useEffect(() => {
    loadCurrency().then((saved) => {
      if (saved === 'USD' || saved === 'GBP') setCurrencyState(saved);
    });
    loadTaxRate().then((saved) => {
      if (saved != null && !isNaN(saved)) setTaxRateState(saved);
    });
    refreshRate();
  }, [refreshRate]);

  // Push the active config into the calculations module so formatDollars renders
  // in the right currency everywhere — without threading a param through every
  // call site. This runs synchronously during render (not in an effect) on
  // purpose: AppProvider renders before its children, so the new config is in
  // place before any child calls formatDollars. An effect would run after commit,
  // leaving the toggling render one frame behind in the old currency. The write
  // is idempotent and derived purely from current state, so it's safe in render.
  // If GBP is selected but the rate hasn't loaded yet, stay on USD so we never
  // show a wrong (rate = undefined) amount.
  if (currency === 'GBP' && gbpRate?.rate) {
    setCurrency({ symbol: '£', rate: gbpRate.rate, locale: 'en-GB' });
  } else {
    setCurrency({ symbol: '$', rate: 1, locale: 'en-US' });
  }

  // Keep the calculations module's tax rate in lockstep with state, so every
  // screen's totals re-compute with the current rate (same approach as currency).
  setTaxRate(taxRate);

  // Toggle + persist in one step (mirrors the entry-mode toggle pattern).
  const chooseCurrency = (code) => {
    setCurrencyState(code);
    saveCurrency(code);
  };

  // Set + persist the tax rate (fraction). Clamped to a sane 0–100% range.
  // Passes the uid so the change is pushed to Firestore and syncs across devices.
  const chooseTaxRate = (rate) => {
    const clamped = Math.min(1, Math.max(0, rate));
    setTaxRateState(clamped);
    saveTaxRate(clamped, user?.uid);
  };

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

  // Live-sync the tax rate across devices, the same way the data hooks do. Fires
  // once immediately with the current cloud value (covers a fresh device), then on
  // every change. A null payload means this account has never set one, so fall
  // back to the default — this also resets it for a different user on the device.
  useEffect(() => {
    if (!syncedUserId) return;
    return subscribeToCloud(syncedUserId, 'taxRate', (val) => {
      setTaxRateState(typeof val === 'number' && !isNaN(val) ? val : DEFAULT_TAX_RATE);
    });
  }, [syncedUserId]);

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

  /**
   * Sign in as a guest. Like sign-up, this is a brand-new account, so flag it
   * so the auth useEffect pushes local → cloud rather than pulling cloud → local.
   */
  const handleGuestSignIn = () => {
    isNewSignup.current = true;
    return signInAsGuest();
  };

  const value = {
    // Auth
    user,
    isGuest,
    authChecked: user !== undefined,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInAsGuest: handleGuestSignIn,
    signInWithGoogle: firebaseGoogleSignIn,
    linkEmail,
    linkGoogle,
    logOut,

    // Display currency
    currency,
    chooseCurrency,
    gbpRate,
    rateLoading,
    refreshRate,
    taxRate,
    chooseTaxRate,

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
