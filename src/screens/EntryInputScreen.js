// Where users enter their daily total for one income source.
// Reached by tapping a subcategory on Home, or the edit icon on History/Month.
// Pre-fills with existing entry if one has been saved for this day.

import React, { useState } from 'react';
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
  // subcategory, category, and dateKey are passed in from wherever we navigated from
  const { subcategory, dateKey } = route.params;
  const { getDayEntries, setEntry, removeEntry } = useApp();

  const existing = getDayEntries(dateKey)[subcategory.id];

  // Pre-fill input with previously saved value if it exists
  const [value, setValue] = useState(
    existing?.value ? String(existing.value) : ''
  );

  const isToken    = subcategory.type === 'token';
  const tokenRate  = subcategory.tokenRate ?? 0.05;
  const preview    = isToken ? tokenPreview(value, tokenRate) : null;
  const dollarAmt  = value ? toDollars(Number(value), subcategory.type, tokenRate) : null;

  const handleSave = () => {
    if (!value || isNaN(Number(value))) return;
    setEntry(dateKey, subcategory.id, {
      value:     Number(value),
      type:      subcategory.type,
      tokenRate: tokenRate,
    });
    navigation.goBack();
  };

  const handleClear = () => {
    removeEntry(dateKey, subcategory.id);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={shared.scroll}
        contentContainerStyle={[shared.scrollContent, styles.content]}
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

        {/* Input */}
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

        {/* Save */}
        <TouchableOpacity
          style={[shared.primaryButton, styles.saveBtn]}
          onPress={handleSave}
          disabled={!value || isNaN(Number(value))}
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
