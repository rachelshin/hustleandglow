import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';

const KB_HEIGHT = Dimensions.get('window').height * 0.42;
import { useApp } from '../context/AppContext';

function confirmDelete(title, message, onConfirm) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ]);
  }
}
import { colors, font, spacing, radius, shadow } from '../styles/theme';
import shared from '../styles/shared';
import { SUBCATEGORY_EMOJIS } from '../constants/defaults';

// ── Subcategory form (rendered inline, not in a Modal) ─────────────────────

function SubcategoryForm({ initial, onSave, onClose }) {
  const [name, setName]           = useState(initial?.name      ?? '');
  const [type, setType]           = useState(initial?.type      ?? 'dollar');
  const [tokenRate, setTokenRate] = useState(
    initial?.tokenRate != null ? String(initial.tokenRate) : '0.05'
  );
  // Pre-fill with existing emoji on edit, or pick a random one for new sources.
  const [emoji, setEmoji] = useState(
    initial?.emoji ??
    SUBCATEGORY_EMOJIS[Math.floor(Math.random() * SUBCATEGORY_EMOJIS.length)]
  );

  const nameRef      = useRef(null);
  const tokenRateRef = useRef(null);

  useEffect(() => {
    // Delay focus so the overlay renders before the keyboard opens
    const t = setTimeout(() => nameRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (type === 'token') {
      setTimeout(() => tokenRateRef.current?.focus(), 50);
    }
  }, [type]);

  const canSave = name.trim().length > 0 && (type === 'dollar' || Number(tokenRate) > 0);

  return (
    <View style={sheet.overlay}>
      <View style={[sheet.card, { paddingBottom: KB_HEIGHT }]}>
        <Text style={sheet.title}>
          {initial ? 'Edit Income Source' : 'Add Income Source'}
        </Text>

        {/* ── Emoji picker ──────────────────────────────────────────────── */}
        <Text style={sheet.label}>Emoji</Text>
        <View style={sheet.emojiRow}>
          {/* Selected emoji — big preview */}
          <View style={sheet.emojiPreview}>
            <Text style={sheet.emojiPreviewText}>{emoji}</Text>
          </View>
          {/* Scrollable list of all options */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={sheet.emojiScroll}
            contentContainerStyle={sheet.emojiScrollContent}
            keyboardShouldPersistTaps="always"
          >
            {SUBCATEGORY_EMOJIS.map((e) => (
              <TouchableOpacity
                key={e}
                style={[sheet.emojiBtn, emoji === e && sheet.emojiBtnActive]}
                onPress={() => setEmoji(e)}
              >
                <Text style={sheet.emojiBtnText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Name ──────────────────────────────────────────────────────── */}
        <Text style={sheet.label}>Name</Text>
        <TextInput
          ref={nameRef}
          style={shared.input}
          value={name}
          onChangeText={setName}
        />

        {/* ── Payment type ──────────────────────────────────────────────── */}
        <Text style={sheet.label}>Payment type</Text>
        <View style={sheet.toggle}>
          {['dollar', 'token'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[sheet.toggleOption, type === t && sheet.toggleActive]}
              onPress={() => setType(t)}
            >
              <Text style={[sheet.toggleText, type === t && sheet.toggleTextActive]}>
                {t === 'dollar' ? '💵 Dollars' : '🪙 Tokens'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {type === 'token' && (
          <>
            <Text style={sheet.label}>Dollars per token</Text>
            <TextInput
              ref={tokenRateRef}
              style={shared.input}
              value={tokenRate}
              onChangeText={setTokenRate}
              keyboardType="decimal-pad"
            />
          </>
        )}

        <View style={sheet.actions}>
          <TouchableOpacity style={shared.ghostButton} onPress={onClose}>
            <Text style={shared.ghostButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[shared.primaryButton, !canSave && sheet.disabledBtn]}
            onPress={() => canSave && onSave({ name, type, tokenRate: Number(tokenRate), emoji })}
          >
            <Text style={shared.primaryButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Category form (rendered inline, not in a Modal) ────────────────────────

function CategoryForm({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial ?? '');
  const nameRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => nameRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={sheet.overlay}>
      <View style={[sheet.card, { paddingBottom: KB_HEIGHT }]}>
        <Text style={sheet.title}>
          {initial ? 'Rename Category' : 'Add Category'}
        </Text>
        <Text style={sheet.label}>Category name</Text>
        <TextInput
          ref={nameRef}
          style={shared.input}
          value={name}
          onChangeText={setName}
        />
        <View style={sheet.actions}>
          <TouchableOpacity style={shared.ghostButton} onPress={onClose}>
            <Text style={shared.ghostButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[shared.primaryButton, !name.trim() && sheet.disabledBtn]}
            onPress={() => name.trim() && onSave(name)}
          >
            <Text style={shared.primaryButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function CategoryManagerScreen() {
  const {
    categories, entries,
    addCategory, updateCategory, deleteCategory, softDeleteCategory,
    addSubcategory, updateSubcategory, deleteSubcategory, softDeleteSubcategory,
  } = useApp();

  const [catForm, setCatForm] = useState({ open: false, editId: null });
  const [subForm, setSubForm] = useState({ open: false, catId: null, editSub: null });

  const openAddCat    = ()           => setCatForm({ open: true, editId: null });
  const openEditCat   = (catId)      => setCatForm({ open: true, editId: catId });
  const closeCatForm  = ()           => setCatForm({ open: false, editId: null });

  const openAddSub    = (catId)      => setSubForm({ open: true, catId, editSub: null });
  const openEditSub   = (catId, sub) => setSubForm({ open: true, catId, editSub: sub });
  const closeSubForm  = ()           => setSubForm({ open: false, catId: null, editSub: null });

  const handleSaveCat = (name) => {
    if (catForm.editId) {
      updateCategory(catForm.editId, name);
    } else {
      addCategory(name);
    }
    closeCatForm();
  };

  const handleSaveSub = (data) => {
    // data already includes the emoji chosen (or confirmed) in SubcategoryForm.
    if (subForm.editSub) {
      updateSubcategory(subForm.catId, subForm.editSub.id, data);
    } else {
      addSubcategory(subForm.catId, data);
    }
    closeSubForm();
  };

  const subHasEntries = (subId) => Object.values(entries).some(day => day[subId]);

  const handleDeleteCat = (cat) => {
    const anyEntries = cat.subcategories.some(s => subHasEntries(s.id));
    confirmDelete(
      `Delete "${cat.name}"?`,
      anyEntries
        ? "This action can't be undone. Past earnings from this category will still show up in the month view."
        : "This action can't be undone.",
      () => anyEntries ? softDeleteCategory(cat.id) : deleteCategory(cat.id)
    );
  };

  const handleDeleteSub = (catId, sub) => {
    const hasEntries = subHasEntries(sub.id);
    confirmDelete(
      `Delete "${sub.name}"?`,
      hasEntries
        ? "This action can't be undone. Past earnings from this source will still show up in the month view."
        : "This action can't be undone.",
      () => hasEntries ? softDeleteSubcategory(catId, sub.id) : deleteSubcategory(catId, sub.id)
    );
  };

  const editingCat = catForm.editId
    ? categories.find((c) => c.id === catForm.editId)
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={shared.scroll} contentContainerStyle={shared.scrollContent}>
        <Text style={shared.screenTitle}>Income Sources ⚙️</Text>

        {categories.filter(cat => !cat.deleted).map((cat) => (
          <View key={cat.id} style={styles.catCard}>
            <View style={styles.catHeader}>
              <Text style={styles.catName}>{cat.name}</Text>
              <View style={styles.catActions}>
                <TouchableOpacity onPress={() => openEditCat(cat.id)}>
                  <Text style={styles.iconBtn}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteCat(cat)}>
                  <Text style={styles.iconBtn}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>

            {cat.subcategories.filter(sub => !sub.deleted).map((sub) => (
              <View key={sub.id} style={styles.subRow}>
                <View style={[styles.subBadge, sub.type === 'token' ? styles.badgeToken : styles.badgeDollar]}>
                  <Text>{sub.emoji || (sub.type === 'token' ? '🪙' : '💵')}</Text>
                </View>
                <View style={styles.subInfo}>
                  <Text style={styles.subName}>{sub.name}</Text>
                  {sub.type === 'token' && (
                    <Text style={styles.subMeta}>${sub.tokenRate}/token</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => openEditSub(cat.id, sub)} style={styles.subAction}>
                  <Text style={styles.iconBtn}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteSub(cat.id, sub)} style={styles.subAction}>
                  <Text style={styles.iconBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addSubBtn} onPress={() => openAddSub(cat.id)}>
              <Text style={styles.addSubText}>+ Add income source</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={[shared.ghostButton, styles.addCatBtn]} onPress={openAddCat}>
          <Text style={shared.ghostButtonText}>+ Add Category</Text>
        </TouchableOpacity>
      </ScrollView>

      {subForm.open && (
        <SubcategoryForm
          initial={subForm.editSub}
          onSave={handleSaveSub}
          onClose={closeSubForm}
        />
      )}

      {catForm.open && (
        <CategoryForm
          initial={editingCat?.name}
          onSave={handleSaveCat}
          onClose={closeCatForm}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  catCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadow.sm,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardPink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  catName: {
    fontSize: font.md,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  catActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subBadge: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDollar: { backgroundColor: colors.goldLight },
  badgeToken:  { backgroundColor: colors.primaryLight },
  subInfo: {
    flex: 1,
  },
  subName: {
    fontSize: font.md,
    color: colors.textDark,
    fontWeight: '500',
  },
  subMeta: {
    fontSize: font.xs,
    color: colors.textMuted,
  },
  subAction: {
    padding: spacing.xs,
  },
  iconBtn: {
    fontSize: 16,
  },
  addSubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
  },
  addSubText: {
    fontSize: font.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  addCatBtn: {
    marginTop: spacing.sm,
  },
});

const sheet = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(45,10,31,0.4)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl + spacing.md,
    gap: spacing.sm,
    ...shadow.lg,
  },
  title: {
    fontSize: font.lg,
    fontWeight: '800',
    color: colors.primaryDeep,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  label: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.textMid,
    marginTop: spacing.xs,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  toggleActive: {
    backgroundColor: colors.card,
    ...shadow.sm,
  },
  toggleText: {
    fontSize: font.sm,
    color: colors.textMuted,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.primaryDeep,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    justifyContent: 'flex-end',
  },
  disabledBtn: {
    opacity: 0.4,
  },

  // ── Emoji picker ────────────────────────────────────────────────────────
  emojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emojiPreview: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    flexShrink: 0,
  },
  emojiPreviewText: {
    fontSize: 24,
  },
  emojiScroll: {
    flex: 1,
  },
  emojiScrollContent: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  emojiBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  emojiBtnActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  emojiBtnText: {
    fontSize: 20,
  },
});
