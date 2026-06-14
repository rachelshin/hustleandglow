// Fetches the USD → GBP exchange rate once per day and caches it locally.
//
// Source: frankfurter.dev (European Central Bank reference rates). Free, no API
// key, no rate limits worth worrying about — ideal for a PWA where we can't hide
// a secret. Returns `rate` = how many GBP one USD is worth (e.g. 0.79).
//
// Caching: we keep the last successful { rate, date } in AsyncStorage and only
// hit the network when the cached date isn't today (local time). If the fetch
// ever fails (offline, API down) we fall back to the cached value so the app
// still works — it just shows yesterday's rate.

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'prosperous_fx_usd_gbp';
const ENDPOINT  = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=GBP';
const TIMEOUT_MS = 8000; // hard cap so a stalled fetch can't hang the UI forever

/** Today's date as YYYY-MM-DD in the user's local timezone (never UTC). */
function todayStr() {
  return new Date().toLocaleDateString('en-CA');
}

/** Read the last cached { rate, date } (or null if none / unreadable). */
export async function loadCachedRate() {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Get today's USD→GBP rate, fetching from the network at most once per day.
 * @returns {Promise<{ rate: number, date: string } | null>}
 *          null only when there's no cache AND the very first fetch fails.
 */
export async function fetchUsdGbpRate() {
  const cached = await loadCachedRate();
  if (cached && cached.date === todayStr()) return cached;

  // AbortController gives us a real timeout — without it, a stalled request
  // (flaky network, iOS PWA) never settles and the caller hangs indefinitely.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const rate = json?.rates?.GBP;
    if (!rate || isNaN(rate)) throw new Error('GBP rate missing from response');

    const fresh = { rate, date: todayStr() };
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh)).catch(() => {});
    return fresh;
  } catch (e) {
    console.warn('FX fetch failed, falling back to cached rate:', e);
    return cached; // may be null on a first-ever load while offline
  } finally {
    clearTimeout(timer);
  }
}
