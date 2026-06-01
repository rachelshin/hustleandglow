// Manages the list of categories and subcategories.
// All changes are immediately persisted to AsyncStorage and pushed to Firestore
// in the background (fire-and-forget).

import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_CATEGORIES } from '../constants/defaults';
import { loadCategories, saveCategories, subscribeToCloud } from '../utils/storage';

export function useCategories(userId) {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Load from AsyncStorage whenever userId changes (instant, works offline).
  useEffect(() => {
    setCategoriesLoading(true);
    if (userId === null) {
      setCategories([]);
      setCategoriesLoading(false);
      return;
    }
    loadCategories().then((saved) => {
      setCategories(saved ?? DEFAULT_CATEGORIES);
      setCategoriesLoading(false);
    });
  }, [userId]);

  // Real-time Firestore subscription — fires whenever another device saves.
  useEffect(() => {
    if (userId === null) return;
    return subscribeToCloud(userId, 'categories', (cloudData) => {
      if (cloudData === null) return;
      setCategories(cloudData);
      saveCategories(cloudData); // local only
    });
  }, [userId]);

  // Helper: update state and persist in one call
  const persist = useCallback((updated) => {
    setCategories(updated);
    saveCategories(updated, userId);
  }, [userId]);

  // ── Category operations ────────────────────────────────────────────────

  const addCategory = useCallback((name) => {
    const newCat = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      subcategories: [],
    };
    persist([...categories, newCat]);
  }, [categories, persist]);

  const updateCategory = useCallback((catId, name) => {
    persist(categories.map((c) =>
      c.id === catId ? { ...c, name: name.trim() } : c
    ));
  }, [categories, persist]);

  const deleteCategory = useCallback((catId) => {
    persist(categories.filter((c) => c.id !== catId));
  }, [categories, persist]);

  // ── Subcategory operations ─────────────────────────────────────────────

  const addSubcategory = useCallback((catId, { name, type, tokenRate, emoji }) => {
    const newSub = {
      id: `sub-${Date.now()}`,
      name: name.trim(),
      type,                            // 'dollar' | 'token'
      tokenRate: type === 'token' ? Number(tokenRate) : null,
      emoji: emoji ?? null,
    };
    persist(categories.map((c) =>
      c.id === catId
        ? { ...c, subcategories: [...c.subcategories, newSub] }
        : c
    ));
  }, [categories, persist]);

  const updateSubcategory = useCallback((catId, subId, updates) => {
    persist(categories.map((c) =>
      c.id === catId
        ? {
            ...c,
            subcategories: c.subcategories.map((s) =>
              s.id === subId ? { ...s, ...updates } : s
            ),
          }
        : c
    ));
  }, [categories, persist]);

  const deleteSubcategory = useCallback((catId, subId) => {
    persist(categories.map((c) =>
      c.id === catId
        ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== subId) }
        : c
    ));
  }, [categories, persist]);

  // Keeps the subcategory in storage (for history name lookup) but hides it from active UI.
  const softDeleteSubcategory = useCallback((catId, subId) => {
    persist(categories.map((c) =>
      c.id === catId
        ? { ...c, subcategories: c.subcategories.map((s) => s.id === subId ? { ...s, deleted: true } : s) }
        : c
    ));
  }, [categories, persist]);

  // Soft-deletes all subcategories and the category shell itself.
  const softDeleteCategory = useCallback((catId) => {
    persist(categories.map((c) =>
      c.id === catId
        ? { ...c, deleted: true, subcategories: c.subcategories.map((s) => ({ ...s, deleted: true })) }
        : c
    ));
  }, [categories, persist]);

  return {
    categories,
    categoriesLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    softDeleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    softDeleteSubcategory,
  };
}
