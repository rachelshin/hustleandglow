// Manages all income entries.
// Data shape: { 'YYYY-MM-DD': { subcategoryId: { value, type, tokenRate } } }
// All changes are immediately persisted to AsyncStorage and pushed to Firestore
// in the background (fire-and-forget).

import { useState, useEffect, useCallback } from 'react';
import { loadAllEntries, saveAllEntries, subscribeToCloud } from '../utils/storage';

export function useEntries(userId) {
  const [entries, setEntries] = useState({});
  const [entriesLoading, setEntriesLoading] = useState(true);

  // Load from AsyncStorage whenever userId changes (instant, works offline).
  useEffect(() => {
    setEntriesLoading(true);
    if (userId === null) {
      setEntries({});
      setEntriesLoading(false);
      return;
    }
    loadAllEntries().then((saved) => {
      setEntries(saved);
      setEntriesLoading(false);
    });
  }, [userId]);

  // Real-time Firestore subscription — fires whenever another device saves.
  // Calling saveAllEntries without userId writes to AsyncStorage only (no cloud
  // echo), so there is no write loop.
  useEffect(() => {
    if (userId === null) return;
    return subscribeToCloud(userId, 'entries', (cloudData) => {
      if (cloudData === null) return; // document doesn't exist yet, keep local
      setEntries(cloudData);
      saveAllEntries(cloudData); // local only — no second argument = no cloud push
    });
  }, [userId]);

  const persist = useCallback((updated) => {
    setEntries(updated);
    saveAllEntries(updated, userId);
  }, [userId]);

  /**
   * Save or overwrite one subcategory's entry for a given day.
   * @param {string} dateKey       - 'YYYY-MM-DD'
   * @param {string} subcategoryId
   * @param {{ value: number, type: string, tokenRate: number }} entryData
   */
  const setEntry = useCallback((dateKey, subcategoryId, entryData) => {
    const updated = {
      ...entries,
      [dateKey]: {
        ...(entries[dateKey] ?? {}),
        [subcategoryId]: entryData,
      },
    };
    persist(updated);
  }, [entries, persist]);

  /**
   * Delete one subcategory's entry for a given day.
   * If the day has no remaining entries after deletion, the day key is kept
   * (empty object) — harmless and avoids a special case.
   */
  const removeEntry = useCallback((dateKey, subcategoryId) => {
    const day = { ...(entries[dateKey] ?? {}) };
    delete day[subcategoryId];
    persist({ ...entries, [dateKey]: day });
  }, [entries, persist]);

  /** Get all entries for a single day (empty object if none). */
  const getDayEntries = useCallback((dateKey) => {
    return entries[dateKey] ?? {};
  }, [entries]);

  /** All date keys that have at least one entry, sorted newest first. */
  const entryDates = Object.keys(entries)
    .filter((key) => Object.keys(entries[key]).length > 0)
    .sort((a, b) => b.localeCompare(a));

  return {
    entries,
    entriesLoading,
    entryDates,
    setEntry,
    removeEntry,
    getDayEntries,
  };
}
