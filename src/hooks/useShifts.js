import { useState, useEffect, useCallback } from 'react';
import { loadShifts, saveShifts, loadActiveShift, saveActiveShift, subscribeToCloud } from '../utils/storage';
import { todayKey } from '../utils/dateHelpers';

export function useShifts(userId) {
  const [shifts, setShifts]           = useState({});
  const [activeShift, setActiveShift] = useState(null); // { startedAt: ms, dateKey }
  const [elapsed, setElapsed]         = useState(0);    // seconds, live

  // Load from AsyncStorage whenever userId changes (instant, works offline).
  useEffect(() => {
    if (userId === null) {
      setShifts({});
      setActiveShift(null);
      return;
    }
    Promise.all([loadShifts(), loadActiveShift()]).then(([s, a]) => {
      setShifts(s ?? {});
      setActiveShift(a ?? null);
    });
  }, [userId]);

  // Real-time subscription for completed shifts.
  // activeShift is intentionally excluded — it's device-local (you can't be
  // clocked in on two devices at once) and changes every second while running.
  useEffect(() => {
    if (userId === null) return;
    return subscribeToCloud(userId, 'shifts', (cloudData) => {
      if (cloudData === null) return;
      setShifts(cloudData);
      saveShifts(cloudData); // local only
    });
  }, [userId]);

  // Tick every second while a shift is running
  useEffect(() => {
    if (!activeShift) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.floor((Date.now() - activeShift.startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeShift]);

  const startShift = useCallback(() => {
    const shift = { startedAt: Date.now(), dateKey: todayKey() };
    setActiveShift(shift);
    saveActiveShift(shift, userId);
  }, [userId]);

  const stopShift = useCallback(() => {
    if (!activeShift) return;
    const { startedAt, dateKey } = activeShift;
    const updated = {
      ...shifts,
      [dateKey]: [...(shifts[dateKey] ?? []), { start: startedAt, end: Date.now() }],
    };
    setShifts(updated);
    saveShifts(updated, userId);
    setActiveShift(null);
    saveActiveShift(null, userId);
  }, [activeShift, shifts, userId]);

  /** Total hours worked on a given day (includes live active shift if applicable). */
  const getDayHours = useCallback((dateKey) => {
    const completed = (shifts[dateKey] ?? []).reduce((sum, s) => sum + (s.end - s.start), 0);
    const active    = activeShift?.dateKey === dateKey ? (Date.now() - activeShift.startedAt) : 0;
    return (completed + active) / 3_600_000;
  }, [shifts, activeShift]);

  /**
   * Manually set the recorded hours for a day (used to correct, add, or delete
   * hours from the calendar). Replaces any timer-logged shifts for that day with
   * a single block of the given length, anchored at noon — the app only ever
   * shows a day's total, never individual shift times, so collapsing them loses
   * nothing the user can see. Passing 0 (or less) clears the day entirely. The
   * live active shift is device-local and left untouched.
   */
  const setDayHours = useCallback((dateKey, hours) => {
    const next = { ...shifts };
    if (!hours || hours <= 0) {
      delete next[dateKey];
    } else {
      const [y, m, d] = dateKey.split('-').map(Number);
      const start = new Date(y, m - 1, d, 12, 0, 0).getTime();
      next[dateKey] = [{ start, end: start + Math.round(hours * 3_600_000) }];
    }
    setShifts(next);
    saveShifts(next, userId);
  }, [shifts, userId]);

  return { activeShift, elapsed, startShift, stopShift, getDayHours, setDayHours };
}
