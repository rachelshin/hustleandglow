// Converts all earnings entries into a CSV string and triggers a download
// (web) or share sheet (native).
//
// CSV columns:
//   Date | Category | Income Source | Type | Amount Entered | Gross | Tax (25%) | Take Home

import { Platform, Share } from 'react-native';
// Note: this export deliberately uses formatUSD, not formatDollars — the CSV is
// a financial record and must always show source-of-truth US dollars, never the
// fluctuating £ display conversion.
import { toDollars, getTaxRate, formatUSD, formatHours } from './calculations';

// ── CSV builder ───────────────────────────────────────────────────────────────

/**
 * Build a lookup map  subcategoryId → { name, categoryName }
 * from the full categories array (including soft-deleted entries so old data
 * still shows readable names).
 */
function buildSubLookup(categories) {
  const map = {};
  for (const cat of categories) {
    for (const sub of cat.subcategories) {
      map[sub.id] = { name: sub.name, categoryName: cat.name };
    }
  }
  return map;
}

/** Wrap a cell value in quotes and escape any internal quotes. */
function cell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

/**
 * Generate a CSV string from all entries.
 * @param {Object}   entries      - { 'YYYY-MM-DD': { subId: { value, type, tokenRate } } }
 * @param {Array}    categories   - full categories array from AppContext
 * @param {Function} [getDayHours] - (dateKey) => hours — from useShifts via AppContext
 * @returns {string}              - complete CSV text
 */
export function buildCSV(entries, categories, getDayHours) {
  const subLookup = buildSubLookup(categories);

  const lines = [];

  // Header row
  lines.push(
    ['Date', 'Category', 'Income Source', 'Type',
     'Amount Entered', 'Gross', 'Tax (25%)', 'Take Home', 'Hours Worked']
      .map(cell).join(',')
  );

  // Data rows — sorted newest first
  const sortedDates = Object.keys(entries).sort((a, b) => b.localeCompare(a));

  let totalGross    = 0;
  let totalTax      = 0;
  let totalTakeHome = 0;
  let totalHours    = 0;
  const countedHourDays = new Set(); // avoid double-counting hours on days with multiple entries

  for (const dateKey of sortedDates) {
    const dayEntries = entries[dateKey];
    if (!dayEntries || Object.keys(dayEntries).length === 0) continue;

    const dayHours      = getDayHours ? getDayHours(dateKey) : 0;
    const hoursDisplay  = dayHours > 0 ? formatHours(dayHours) : '';

    // Accumulate hours once per day
    if (dayHours > 0 && !countedHourDays.has(dateKey)) {
      totalHours += dayHours;
      countedHourDays.add(dateKey);
    }

    for (const [subId, entry] of Object.entries(dayEntries)) {
      const { value, type, tokenRate } = entry;
      const sub      = subLookup[subId] ?? { name: 'Unknown Source', categoryName: 'Unknown' };
      const gross    = toDollars(value, type, tokenRate);
      const tax      = gross * getTaxRate();
      const takeHome = gross - tax;

      totalGross    += gross;
      totalTax      += tax;
      totalTakeHome += takeHome;

      const amountEntered = type === 'token' ? `${value} tokens` : formatUSD(value);

      lines.push(
        [dateKey, sub.categoryName, sub.name,
         type === 'token' ? 'Token' : 'Dollar',
         amountEntered,
         formatUSD(gross), formatUSD(tax), formatUSD(takeHome),
         hoursDisplay]
          .map(cell).join(',')
      );
    }
  }

  // Blank separator + totals row
  lines.push(new Array(9).fill('').map(cell).join(','));
  lines.push(
    ['', '', '', '', 'TOTAL',
     formatUSD(totalGross), formatUSD(totalTax), formatUSD(totalTakeHome),
     totalHours > 0 ? formatHours(totalHours) : '']
      .map(cell).join(',')
  );

  return lines.join('\n');
}

// ── Export trigger ────────────────────────────────────────────────────────────

/**
 * Export all earnings as a CSV file.
 * • Web:    triggers a browser file download.
 * • Native: opens the OS share sheet so the user can save or send the file.
 */
export function exportCSV(entries, categories, getDayHours) {
  const csv      = buildCSV(entries, categories, getDayHours);
  const today    = new Date().toISOString().slice(0, 10);
  const filename = `hustle-and-glow-${today}.csv`;

  if (Platform.OS === 'web') {
    // Create a temporary <a> element and click it to trigger the download.
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href  = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // On iOS/Android, open the native share sheet with the CSV as plain text.
    // The user can save to Files, email it, etc.
    Share.share({
      title:   'Hustle & Glow Earnings Export',
      message: csv,
    }).catch((e) => console.warn('Share failed:', e));
  }
}
