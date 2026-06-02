// All date formatting and calculation lives here.
// Storage keys are always YYYY-MM-DD strings (local time) so they sort correctly.

/**
 * Returns today's date as a YYYY-MM-DD string.
 */
export function todayKey() {
  return toKey(new Date());
}

/**
 * Converts a Date object to a YYYY-MM-DD storage key (local time).
 */
export function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses a YYYY-MM-DD key back into a Date in local time.
 * Using local time (not UTC) avoids off-by-one-day bugs.
 */
export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Long human-readable label — e.g. "Monday, May 24"
 */
export function friendlyDate(dateOrKey) {
  const date = typeof dateOrKey === 'string' ? fromKey(dateOrKey) : dateOrKey;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Short label for list rows — e.g. "May 24"
 */
export function shortDate(dateOrKey) {
  const date = typeof dateOrKey === 'string' ? fromKey(dateOrKey) : dateOrKey;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

/**
 * Month + year label — e.g. "May 2026"
 */
export function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Returns all YYYY-MM-DD keys for every day in the given month.
 * @param {number} year
 * @param {number} month - 0-indexed (0 = January)
 */
export function daysInMonth(year, month) {
  const days = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(toKey(new Date(date)));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

/**
 * Returns the weekday index (0 = Sunday) for the 1st of the given month.
 * Used to offset the calendar grid correctly.
 */
export function firstWeekdayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/**
 * Pick a daily affirmation that stays consistent within a day.
 * Uses the day-of-year so it changes every day but never mid-day.
 */
/** Returns the YYYY-MM-DD key for Monday of the current week. */
export function weekStartKey() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toKey(d);
}

/** Returns the YYYY-MM-DD key for the 1st of the current month. */
export function monthStartKey() {
  const d = new Date();
  d.setDate(1);
  return toKey(d);
}

/**
 * Returns all YYYY-MM-DD keys from a period start through today.
 * @param {'daily'|'weekly'|'monthly'|'custom'} period
 * @param {string|null} [startDate] - YYYY-MM-DD; falls back to current week/month if omitted
 * @param {number} [days] - total span in days, required when period === 'custom'
 */
export function getPeriodKeys(period, startDate, days) {
  const today = todayKey();
  if (period === 'daily') return [today];

  const start = fromKey(startDate ?? (period === 'weekly' ? weekStartKey() : monthStartKey()));

  let end;
  if (period === 'weekly') {
    end = new Date(start);
    end.setDate(end.getDate() + 6);
  } else if (period === 'monthly') {
    end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  } else {
    // custom
    end = new Date(start);
    end.setDate(end.getDate() + Math.max(1, days ?? 1) - 1);
  }

  // Never count future days
  const todayDate = fromKey(today);
  if (end > todayDate) end = todayDate;

  const keys = [];
  const d = new Date(start);
  while (d <= end) {
    keys.push(toKey(new Date(d)));
    d.setDate(d.getDate() + 1);
  }
  return keys;
}

/**
 * Count worked days in a continuous run using calendar weeks (Mon–Sun).
 * Each week allows up to 2 missed days; a week with 3+ missed days ends the streak.
 * Streak = total days worked across all valid weeks.
 */
export function calcStreak(entryDates) {
  if (entryDates.length === 0) return 0;
  const dateSet = new Set(entryDates);
  const today = fromKey(todayKey());

  // Returns the Monday of the week containing `date` (ISO: Mon–Sun).
  function getMondayOf(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sun
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return d;
  }

  // Grace: if today isn't worked yet, treat yesterday as the boundary so an
  // unfinished day doesn't immediately kill a live streak.
  const boundary = new Date(today);
  if (!dateSet.has(toKey(today))) boundary.setDate(boundary.getDate() - 1);

  let streak = 0;
  let weekMonday = getMondayOf(boundary);
  let isFirstWeek = true;

  while (weekMonday.getFullYear() >= 2020) {
    const weekSunday = new Date(weekMonday);
    weekSunday.setDate(weekMonday.getDate() + 6);

    // Only count days up to `boundary` for the first (current) week.
    const checkThrough = isFirstWeek ? boundary : weekSunday;

    let worked = 0;
    let missed = 0;
    const d = new Date(weekMonday);
    while (d <= checkThrough) {
      if (dateSet.has(toKey(d))) worked++;
      else missed++;
      d.setDate(d.getDate() + 1);
    }

    if (missed > 2) break;

    streak += worked;
    isFirstWeek = false;
    weekMonday.setDate(weekMonday.getDate() - 7);
  }

  return streak;
}

export function dailyIndex(arrayLength) {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dayOfYear % arrayLength;
}
