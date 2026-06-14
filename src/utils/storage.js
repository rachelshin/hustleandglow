// Storage layer: thin wrappers around AsyncStorage (local) + Firestore (cloud).
//
// Local keys are prefixed with 'prosperous_'.
// Cloud data lives at:  /users/{uid}/data/{type}
//
// Save functions write to AsyncStorage immediately, then fire-and-forget a
// Firestore write so the UI is never blocked by a network call.
//
// On login,  call syncFromCloud(uid)  to pull the user's cloud data into local.
// On sign-up, call pushLocalToCloud(uid) to preserve any data they had before
//   creating an account.
// On logout, call clearLocalData() to wipe the device-local copy.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

const KEYS = {
  CATEGORIES:   'prosperous_categories',
  ENTRIES:      'prosperous_entries',
  SHIFTS:       'prosperous_shifts',
  ACTIVE_SHIFT: 'prosperous_active_shift',
  GOAL:         'prosperous_goal',
  GOALS:        'prosperous_goals',
  WHY:          'prosperous_why',
  ENTRY_MODE:   'prosperous_entry_mode',
  CURRENCY:     'prosperous_currency',
};

// ── Internal cloud helpers ────────────────────────────────────────────────────

/** Reference to a user's data document in Firestore. */
const cloudDoc = (uid, type) => doc(db, 'users', uid, 'data', type);

/**
 * Fire-and-forget: push one data type to Firestore.
 * Wraps the payload in { payload: ... } since Firestore requires an object.
 */
function pushToCloud(uid, type, data) {
  setDoc(cloudDoc(uid, type), { payload: data }).catch((e) =>
    console.warn(`Cloud sync failed [${type}]:`, e)
  );
}

/**
 * Pull one data type from Firestore.
 * Returns the unwrapped value, or null if the document doesn't exist.
 */
async function pullFromCloud(uid, type) {
  try {
    const snap = await getDoc(cloudDoc(uid, type));
    return snap.exists() ? snap.data().payload : null;
  } catch (e) {
    console.warn(`Cloud load failed [${type}]:`, e);
    return null;
  }
}

// ── Real-time subscription ────────────────────────────────────────────────────

/**
 * Subscribe to live Firestore updates for one data type.
 * Calls onData(payload) whenever Firestore changes — including once immediately
 * with the current value.  Returns an unsubscribe function; call it on cleanup.
 *
 * onData receives:
 *   • the unwrapped payload value when the document exists
 *   • null when the document has never been written
 *
 * Used by hooks to keep every open session in sync automatically.
 */
export function subscribeToCloud(uid, type, onData) {
  const ref = cloudDoc(uid, type);
  return onSnapshot(
    ref,
    (snap) => onData(snap.exists() ? snap.data().payload : null),
    (err)  => console.warn(`Cloud subscription error [${type}]:`, err),
  );
}

// ── Public cloud sync ─────────────────────────────────────────────────────────

/**
 * Pull all user data from Firestore and write it into AsyncStorage.
 * Called once after sign-in, before hooks load their data.
 * Only overwrites a local key if Firestore actually has a value for it
 * (so a brand-new account won't erase existing local defaults).
 */
export async function syncFromCloud(uid) {
  const [categories, entries, shifts, activeShift, goals, why] = await Promise.all([
    pullFromCloud(uid, 'categories'),
    pullFromCloud(uid, 'entries'),
    pullFromCloud(uid, 'shifts'),
    pullFromCloud(uid, 'activeShift'),
    pullFromCloud(uid, 'goals'),
    pullFromCloud(uid, 'why'),
  ]);

  const writes = [];
  if (categories  !== null) writes.push([KEYS.CATEGORIES,   JSON.stringify(categories)]);
  if (entries     !== null) writes.push([KEYS.ENTRIES,      JSON.stringify(entries)]);
  if (shifts      !== null) writes.push([KEYS.SHIFTS,       JSON.stringify(shifts)]);
  if (activeShift !== null) writes.push([KEYS.ACTIVE_SHIFT, JSON.stringify(activeShift)]);
  if (goals       !== null) writes.push([KEYS.GOALS,        JSON.stringify(goals)]);
  if (why         !== null) writes.push([KEYS.WHY,          why]);

  if (writes.length > 0) {
    await AsyncStorage.multiSet(writes);
  }
}

/**
 * Read all local AsyncStorage data and push it to Firestore.
 * Called once after sign-up so any data the user had before creating an
 * account is preserved in the cloud.
 */
export async function pushLocalToCloud(uid) {
  const pairs = await AsyncStorage.multiGet([
    KEYS.CATEGORIES, KEYS.ENTRIES, KEYS.SHIFTS,
    KEYS.ACTIVE_SHIFT, KEYS.GOALS, KEYS.WHY,
  ]);

  const map = Object.fromEntries(pairs);
  const uploads = [
    ['categories',  map[KEYS.CATEGORIES]   ? JSON.parse(map[KEYS.CATEGORIES])   : null],
    ['entries',     map[KEYS.ENTRIES]       ? JSON.parse(map[KEYS.ENTRIES])       : null],
    ['shifts',      map[KEYS.SHIFTS]        ? JSON.parse(map[KEYS.SHIFTS])        : null],
    ['activeShift', map[KEYS.ACTIVE_SHIFT]  ? JSON.parse(map[KEYS.ACTIVE_SHIFT])  : null],
    ['goals',       map[KEYS.GOALS]         ? JSON.parse(map[KEYS.GOALS])         : null],
    ['why',         map[KEYS.WHY]           ?? null],
  ];

  await Promise.all(
    uploads
      .filter(([, v]) => v !== null)
      .map(([type, payload]) =>
        setDoc(cloudDoc(uid, type), { payload }).catch((e) =>
          console.warn(`Upload failed [${type}]:`, e)
        )
      )
  );
}

/**
 * Remove all local AsyncStorage data.
 * Called on sign-out so one user's data doesn't linger for the next.
 */
export async function clearLocalData() {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch (e) {
    console.warn('Failed to clear local data:', e);
  }
}

// ── Categories ──────────────────────────────────────────────────────────────

/** Load saved categories. Returns null if nothing saved yet (first launch). */
export async function loadCategories() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CATEGORIES);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Overwrite the entire categories list in storage. */
export async function saveCategories(categories, userId) {
  try {
    await AsyncStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
    if (userId) pushToCloud(userId, 'categories', categories);
  } catch (e) {
    console.warn('Failed to save categories', e);
  }
}

// ── Entries ─────────────────────────────────────────────────────────────────

/**
 * Load all entries.
 * Shape: { 'YYYY-MM-DD': { subcategoryId: { value, type, tokenRate } } }
 * Returns an empty object if nothing saved yet.
 */
export async function loadAllEntries() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ENTRIES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Overwrite the entire entries object in storage. */
export async function saveAllEntries(entries, userId) {
  try {
    await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(entries));
    if (userId) pushToCloud(userId, 'entries', entries);
  } catch (e) {
    console.warn('Failed to save entries', e);
  }
}

// ── Shifts ───────────────────────────────────────────────────────────────────

/** Shape: { 'YYYY-MM-DD': [{ start: ms, end: ms }, ...] } */
export async function loadShifts() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SHIFTS);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export async function saveShifts(shifts, userId) {
  try {
    await AsyncStorage.setItem(KEYS.SHIFTS, JSON.stringify(shifts));
    if (userId) pushToCloud(userId, 'shifts', shifts);
  } catch (e) { console.warn('Failed to save shifts', e); }
}

/** The currently-running shift, or null. Shape: { startedAt: ms, dateKey: string } */
export async function loadActiveShift() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ACTIVE_SHIFT);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function saveActiveShift(shift, userId) {
  try {
    if (shift === null) {
      await AsyncStorage.removeItem(KEYS.ACTIVE_SHIFT);
      if (userId) pushToCloud(userId, 'activeShift', null);
    } else {
      await AsyncStorage.setItem(KEYS.ACTIVE_SHIFT, JSON.stringify(shift));
      if (userId) pushToCloud(userId, 'activeShift', shift);
    }
  } catch (e) { console.warn('Failed to save active shift', e); }
}

// ── Goals ────────────────────────────────────────────────────────────────────

/** Shape: [{ id, type: 'money'|'time', amount: number, period: 'daily'|'weekly'|'monthly' }] */
export async function loadGoals() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.GOALS);
    if (raw) return JSON.parse(raw);
    // migrate from old single-goal format
    const old = await AsyncStorage.getItem(KEYS.GOAL);
    if (old) {
      const g = JSON.parse(old);
      return [{ id: '1', type: 'money', amount: g.amount, period: g.period }];
    }
    return [];
  } catch { return []; }
}

export async function saveGoals(goals, userId) {
  try {
    await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
    if (userId) pushToCloud(userId, 'goals', goals);
  } catch (e) { console.warn('Failed to save goals', e); }
}

// ── Entry-mode toggle ─────────────────────────────────────────────────────────
// A per-device UI preference (the Total | Balance toggle on Home). Local only —
// no cloud sync — so it remembers your last choice but doesn't fight between
// devices. Cleared on logout along with everything else.

export async function loadEntryMode() {
  try {
    return await AsyncStorage.getItem(KEYS.ENTRY_MODE);
  } catch {
    return null;
  }
}

export async function saveEntryMode(mode) {
  try {
    await AsyncStorage.setItem(KEYS.ENTRY_MODE, mode);
  } catch (e) {
    console.warn('Failed to save entry mode', e);
  }
}

// ── Display currency ──────────────────────────────────────────────────────────
// Per-device UI preference ('USD' | 'GBP'): which currency totals are shown in.
// Local only — like the entry-mode toggle — so each device remembers its own
// view. Amounts are always stored in USD; this only changes the display lens.

export async function loadCurrency() {
  try {
    return await AsyncStorage.getItem(KEYS.CURRENCY);
  } catch {
    return null;
  }
}

export async function saveCurrency(code) {
  try {
    await AsyncStorage.setItem(KEYS.CURRENCY, code);
  } catch (e) {
    console.warn('Failed to save currency', e);
  }
}

// ── Why ──────────────────────────────────────────────────────────────────────

export async function loadWhy() {
  try {
    return await AsyncStorage.getItem(KEYS.WHY) ?? '';
  } catch { return ''; }
}

export async function saveWhy(text, userId) {
  try {
    await AsyncStorage.setItem(KEYS.WHY, text);
    if (userId) pushToCloud(userId, 'why', text);
  } catch (e) { console.warn('Failed to save why', e); }
}
