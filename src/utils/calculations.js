// All income math lives here so it's consistent across every screen.
//
// How totals work:
//   gross     = sum of all dollar amounts + sum of (tokens × tokenRate)
//   taxes     = gross × 0.25  (25% set aside for taxes)
//   takeHome  = gross × 0.75  (what you actually keep)

export const TAX_RATE = 0.25;

/**
 * Convert a raw entry value to dollars.
 * @param {number} value       - What the user typed (tokens or dollars)
 * @param {'dollar'|'token'} type
 * @param {number} tokenRate   - Dollars per token (e.g. 0.05 for Chaturbate)
 * @returns {number}           - Dollar amount
 */
export function toDollars(value, type, tokenRate = 0.05) {
  if (!value || isNaN(Number(value))) return 0;
  return type === 'token' ? Number(value) * tokenRate : Number(value);
}

/**
 * Calculate totals for a single day's worth of entries.
 * @param {Object} dayEntries  - { subcategoryId: { value, type, tokenRate } }
 * @returns {{ gross: number, taxes: number, takeHome: number }}
 */
export function calcDayTotals(dayEntries = {}) {
  const gross = Object.values(dayEntries).reduce((sum, entry) => {
    return sum + toDollars(entry.value, entry.type, entry.tokenRate);
  }, 0);

  const taxes = gross * TAX_RATE;
  const takeHome = gross - taxes;

  return { gross, taxes, takeHome };
}

// ── Display currency ──────────────────────────────────────────────────────────
// IMPORTANT: every amount stored in the app is in US dollars (token sites pay in
// USD, and the tax set-aside is owed in USD). The display currency is purely a
// lens applied at format time — we never store converted amounts.
//
// This module-level config is the trick that lets us add a £/$ toggle without
// touching the ~30 call sites of formatDollars: AppContext calls setCurrency()
// whenever the user flips the toggle or a fresh FX rate arrives, and because the
// toggle lives in context state, every screen re-renders and re-formats with the
// new config automatically.
let _currency = { symbol: '$', rate: 1, locale: 'en-US' };

/**
 * Update the display currency. Called by AppContext only.
 * @param {{ symbol?: string, rate?: number, locale?: string }} cfg
 *        rate = how many display-currency units one US dollar is worth.
 */
export function setCurrency(cfg) {
  _currency = { ..._currency, ...cfg };
}

/**
 * Format a dollar amount in the user's chosen display currency.
 * e.g. with GBP at 0.79:  1234.5 → "£975.26"
 * @param {number} amount - a US dollar amount
 * @returns {string}
 */
export function formatDollars(amount) {
  const { symbol, rate, locale } = _currency;
  return symbol + Math.abs(amount * rate).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format an amount as US dollars, ignoring the display-currency toggle.
 * Used by the CSV export, which must always reflect the source-of-truth USD
 * values (records / taxes), never a fluctuating converted figure.
 * @param {number} amount
 * @returns {string}
 */
export function formatUSD(amount) {
  return '$' + Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Live preview shown while typing tokens.
 * e.g. tokenPreview(500, 0.05) → "500 tokens = $25.00"
 * @param {string|number} tokens
 * @param {number} rate
 * @returns {string}
 */
/**
 * Format total hours into a human string — e.g. "1h 30m", "45m", "2h"
 */
export function formatHours(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format elapsed seconds as a live timer string — e.g. "4:32", "1:04:32"
 */
export function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function tokenPreview(tokens, rate) {
  const n = Number(tokens);
  if (!tokens || isNaN(n) || n === 0) return '';
  return `${n} tokens = ${formatDollars(n * rate)}`;
}
