// Where users enter their earnings for one income source.
// Reached by tapping a subcategory on Home, or the edit icon on History/Month.
// Pre-fills with existing entry if one has been saved for this day.
//
// Two input flows, chosen by the Total | Balance toggle on Home (passed in as
// `entryMode`):
//   'total'   → one input: today's total for this source.
//   'balance' → two inputs: the source's balance at the start of the shift and
//               its balance now. We save the difference as the earnings, so all
//               the totals math downstream is identical to total mode.
// An entry already saved in balance mode always re-opens in balance mode,
// regardless of the toggle, so editing never silently converts it.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { tokenPreview, formatDollars, toDollars } from '../utils/calculations';
import { friendlyDate } from '../utils/dateHelpers';
import { colors, font, spacing, radius, shadow } from '../styles/theme';
import shared from '../styles/shared';

export default function EntryInputScreen({ route, navigation }) {
  // subcategory, category, dateKey, and entryMode are passed in from Home.
  const { subcategory, dateKey, entryMode } = route.params;
  const { getDayEntries, setEntry, removeEntry } = useApp();

  const existing = getDayEntries(dateKey)[subcategory.id];

  const isToken    = subcategory.type === 'token';
  const tokenRate  = subcategory.tokenRate ?? 0.05;

  // A previously-saved balance entry keeps its mode; otherwise follow the toggle.
  const savedBalance = existing != null && existing.startBalance != null;
  const mode = savedBalance ? 'balance' : (entryMode === 'balance' ? 'balance' : 'total');

  // ── Total mode state ──
  const [value, setValue] = useState(
    existing && !savedBalance && existing.value != null ? String(existing.value) : ''
  );

  // ── Balance mode state ──
  const [startBal, setStartBal] = useState(
    savedBalance && existing.startBalance != null ? String(existing.startBalance) : ''
  );
  const [currentBal, setCurrentBal] = useState(
    savedBalance && existing.currentBalance != null ? String(existing.currentBalance) : ''
  );

  const bothFilled =
    startBal !== '' && currentBal !== '' &&
    !isNaN(Number(startBal)) && !isNaN(Number(currentBal));
  const earned = bothFilled ? Number(currentBal) - Number(startBal) : null;

  // ── Total mode previews ──
  const preview   = isToken ? tokenPreview(value, tokenRate) : null;
  const dollarAmt = value ? toDollars(Number(value), subcategory.type, tokenRate) : null;

  const canSave = mode === 'balance'
    ? earned != null && earned >= 0
    : !!value && !isNaN(Number(value));

  const handleSave = () => {
    if (!canSave) return;
    if (mode === 'balance') {
      setEntry(dateKey, subcategory.id, {
        value:          earned,
        type:           subcategory.type,
        tokenRate,
        startBalance:   Number(startBal),
        currentBalance: Number(currentBal),
      });
    } else {
      setEntry(dateKey, subcategory.id, {
        value:     Number(value),
        type:      subcategory.type,
        tokenRate,
      });
    }
    navigation.goBack();
  };

  const handleClear = () => {
    removeEntry(dateKey, subcategory.id);
    navigation.goBack();
  };

  // iOS PWA keyboard fix: KeyboardAvoidingView does nothing in a standalone iOS
  // PWA (the layout viewport doesn't shrink, only the visual viewport does), so
  // the second balance input can sit behind the keyboard. Track the keyboard
  // height from visualViewport and add it as scroll padding so the focused
  // field can always scroll into view.
  const [iosPWAKeyboard, setIosPWAKeyboard] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (!window.navigator?.standalone || !window.visualViewport) return;
    const onResize = () =>
      setIosPWAKeyboard(Math.max(0, window.innerHeight - window.visualViewport.height));
    window.visualViewport.addEventListener('resize', onResize);
    return () => window.visualViewport.removeEventListener('resize', onResize);
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={shared.scroll}
        contentContainerStyle={[
          shared.scrollContent,
          styles.content,
          { paddingBottom: spacing.xl + iosPWAKeyboard },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date */}
        <Text style={styles.date}>{friendlyDate(dateKey)}</Text>

        {/* Source info card */}
        <View style={styles.infoCard}>
          <Text style={styles.sourceLabel}>Income Source</Text>
          <Text style={styles.sourceName}>{subcategory.name}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {isToken ? `🪙 Token site · $${tokenRate}/token` : '💵 Dollar site'}
            </Text>
          </View>
        </View>

        {mode === 'balance' ? (
          <>
            {/* Start balance */}
            <Text style={styles.inputLabel}>
              {isToken ? 'Token balance at start of shift' : 'Balance at start of shift'}
            </Text>
            <TextInput
              style={styles.balInput}
              value={startBal}
              onChangeText={setStartBal}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />

            {/* Current balance */}
            <Text style={styles.inputLabel}>
              {isToken ? 'Token balance now' : 'Balance now'}
            </Text>
            <TextInput
              style={styles.balInput}
              value={currentBal}
              onChangeText={setCurrentBal}
              keyboardType="decimal-pad"
              selectTextOnFocus
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />

            {/* Earned preview */}
            {earned != null && earned >= 0 ? (
              <Text style={styles.dollarPreview}>
                {isToken
                  ? `Earned ${earned} tokens = ${formatDollars(toDollars(earned, 'token', tokenRate))}`
                  : `Earned ${formatDollars(earned)}`}
              </Text>
            ) : null}

            {/* Negative difference warning */}
            {earned != null && earned < 0 ? (
              <Text style={styles.warn}>
                Balance now is lower than the start — double-check your numbers.
              </Text>
            ) : null}
          </>
        ) : (
          <>
            {/* Single total input */}
            <Text style={styles.inputLabel}>
              {isToken ? "Today's tokens earned" : "Today's earnings"}
            </Text>
            <TextInput
              style={styles.bigInput}
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
            />

            {/* Token preview: "500 tokens = $25.00" */}
            {isToken && preview ? (
              <Text style={styles.preview}>{preview}</Text>
            ) : null}

            {/* Dollar preview for token sites */}
            {isToken && dollarAmt != null && dollarAmt > 0 ? (
              <Text style={styles.dollarPreview}>≈ {formatDollars(dollarAmt)}</Text>
            ) : null}
          </>
        )}

        {/* Save */}
        <TouchableOpacity
          style={[shared.primaryButton, styles.saveBtn]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={shared.primaryButtonText}>Save</Text>
        </TouchableOpacity>

        {/* Clear — only shown if an entry already exists */}
        {existing && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearText}>Clear Entry</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'stretch',
    gap: spacing.md,
  },
  date: {
    fontSize: font.sm,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: colors.cardPink,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadow.sm,
  },
  sourceLabel: {
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sourceName: {
    fontSize: font.xl,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  typeBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  typeBadgeText: {
    fontSize: font.xs,
    color: colors.primaryDeep,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: font.sm,
    color: colors.textMid,
    fontWeight: '600',
    textAlign: 'center',
  },
  bigInput: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    fontSize: 42,
    fontWeight: '700',
    color: colors.primaryDeep,
    textAlign: 'center',
    ...shadow.sm,
  },
  balInput: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 30,
    fontWeight: '700',
    color: colors.primaryDeep,
    textAlign: 'center',
    ...shadow.sm,
  },
  preview: {
    fontSize: font.md,
    color: colors.textMid,
    textAlign: 'center',
    fontWeight: '500',
  },
  dollarPreview: {
    fontSize: font.lg,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '700',
  },
  warn: {
    fontSize: font.sm,
    color: colors.negativeText,
    textAlign: 'center',
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: spacing.sm,
  },
  clearBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  clearText: {
    fontSize: font.sm,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});
