import { useState, useEffect, useCallback, useMemo } from 'react';
import { loadGoals, saveGoals, subscribeToCloud } from '../utils/storage';
import { calcDayTotals, formatDollars } from '../utils/calculations';
import { getPeriodKeys, calcStreak, shortDate, fromKey, toKey, todayKey } from '../utils/dateHelpers';
import { GOAL_TREATS } from '../constants/defaults';

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getMilestone(progress) {
  if (progress >= 1)    return 100;
  if (progress >= 0.75) return 75;
  if (progress >= 0.5)  return 50;
  if (progress >= 0.25) return 25;
  return null;
}

// For repeating custom goals, find which window is currently active.
function effectiveStartDate(goal) {
  if (goal.period !== 'custom' || !goal.repeat || !goal.startDate || !goal.days) {
    return goal.startDate;
  }
  const start   = fromKey(goal.startDate);
  const today   = fromKey(todayKey());
  const spanMs  = goal.days * 86_400_000;
  const elapsed = today.getTime() - start.getTime();
  if (elapsed < 0) return goal.startDate;
  const periods = Math.floor(elapsed / spanMs);
  return toKey(new Date(start.getTime() + periods * spanMs));
}

export function useGoals(entries, entryDates, getDayHours, userId) {
  const [goals, setGoals] = useState([]);

  // Load from AsyncStorage whenever userId changes (instant, works offline).
  useEffect(() => {
    if (userId === null) {
      setGoals([]);
      return;
    }
    loadGoals().then(g => setGoals(g ?? []));
  }, [userId]);

  // Real-time Firestore subscription.
  useEffect(() => {
    if (userId === null) return;
    return subscribeToCloud(userId, 'goals', (cloudData) => {
      if (cloudData === null) return;
      setGoals(cloudData);
      saveGoals(cloudData); // local only
    });
  }, [userId]);

  const persist = useCallback((updated) => {
    setGoals(updated);
    saveGoals(updated, userId);
  }, [userId]);

  const addGoal = useCallback((type, amount, period, startDate, days, repeat, text) => {
    if (type === 'text') {
      persist([...goals, { id: makeId(), type: 'text', text, checked: false }]);
      return;
    }
    persist([...goals, {
      id: makeId(), type, amount: Number(amount),
      period, startDate: startDate ?? null,
      days: days ?? null, repeat: repeat ?? false,
    }]);
  }, [goals, persist]);

  const updateGoal = useCallback((id, type, amount, period, startDate, days, repeat) => {
    persist(goals.map(g => g.id === id
      ? { ...g, type, amount: Number(amount), period, startDate: startDate ?? null, days: days ?? null, repeat: repeat ?? false }
      : g
    ));
  }, [goals, persist]);

  const removeGoal = useCallback((id) => {
    persist(goals.filter(g => g.id !== id));
  }, [goals, persist]);

  const toggleTextGoal = useCallback((id) => {
    persist(goals.map(g => g.id === id ? { ...g, checked: !g.checked } : g));
  }, [goals, persist]);

  const streak = useMemo(() => calcStreak(entryDates), [entryDates]);

  const goalsWithStats = goals.map(goal => {
    if (goal.type === 'text') return goal;
    const start = effectiveStartDate(goal);
    const keys  = getPeriodKeys(goal.period, start, goal.days);
    const periodValue = goal.type === 'money'
      ? keys.reduce((sum, key) => {
          const day = entries[key];
          return day ? sum + calcDayTotals(day).takeHome : sum;
        }, 0)
      : keys.reduce((sum, key) => sum + getDayHours(key), 0);

    const progress  = goal.amount > 0 ? Math.min(periodValue / goal.amount, 1) : 0;
    const milestone = getMilestone(progress);
    const pool      = milestone ? GOAL_TREATS[milestone] : null;
    const treat     = pool ? pool[Math.floor(goal.amount) % pool.length] : null;
    return { ...goal, effectiveStart: start, periodValue, progress, milestone, treat };
  });

  const wins = useMemo(() => {
    const result = [];
    const allDays = Object.entries(entries);
    if (allDays.length === 0) return result;

    let best = { amount: 0, dateKey: null };
    for (const [dateKey, dayEntries] of allDays) {
      const { takeHome } = calcDayTotals(dayEntries);
      if (takeHome > best.amount) best = { amount: takeHome, dateKey };
    }
    if (best.amount > 0) {
      result.push(`Best day ever: ${formatDollars(best.amount)} on ${shortDate(best.dateKey)} 🌟`);
    }

    const weekTotal = getPeriodKeys('weekly').reduce((sum, key) => {
      const day = entries[key];
      return day ? sum + calcDayTotals(day).takeHome : sum;
    }, 0);
    if (weekTotal > 0) result.push(`Earned ${formatDollars(weekTotal)} this week 💪`);

    const monthDays = getPeriodKeys('monthly').filter(key => {
      const day = entries[key];
      return day && Object.keys(day).length > 0;
    }).length;
    if (monthDays > 0) result.push(`Worked ${monthDays} day${monthDays === 1 ? '' : 's'} this month 📅`);

    return result;
  }, [entries]);

  return { goals: goalsWithStats, addGoal, updateGoal, removeGoal, toggleTextGoal, streak, wins };
}
