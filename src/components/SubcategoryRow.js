// A single tappable income source row used on the Home screen.
// Shows badge ($ or token), name, rate if token, and today's entered amount.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, font, spacing, radius } from '../styles/theme';
import { formatDollars, toDollars } from '../utils/calculations';

/**
 * @param {object}   props
 * @param {object}   props.subcategory  - { id, name, type, tokenRate }
 * @param {object}   [props.entry]      - Today's saved entry, if any
 * @param {function} props.onPress      - Navigate to entry input
 */
export default function SubcategoryRow({ subcategory, entry, onPress }) {
  const hasEntry = entry != null && entry.value !== '' && entry.value != null;
  const dollars  = hasEntry
    ? toDollars(Number(entry.value), entry.type, entry.tokenRate)
    : null;

  const isToken = subcategory.type === 'token';

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {/* Type badge */}
      <View style={[styles.badge, isToken ? styles.badgeToken : styles.badgeDollar]}>
        <Text style={styles.badgeEmoji}>{subcategory.emoji || (isToken ? '🪙' : '💵')}</Text>
      </View>

      {/* Name + rate */}
      <View style={styles.info}>
        <Text style={styles.name}>{subcategory.name}</Text>
        {isToken && (
          <Text style={styles.rate}>${subcategory.tokenRate}/token</Text>
        )}
      </View>

      {/* Amount or prompt */}
      <View style={styles.right}>
        {hasEntry ? (
          <Text style={styles.amount}>{formatDollars(dollars)}</Text>
        ) : (
          <Text style={styles.prompt}>Add ›</Text>
        )}
        <Text style={{ fontSize: 14, color: colors.textMuted }}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDollar: {
    backgroundColor: colors.goldLight,
  },
  badgeToken: {
    backgroundColor: colors.primaryLight,
  },
  badgeEmoji: {
    fontSize: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.textDark,
  },
  rate: {
    fontSize: font.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  amount: {
    fontSize: font.md,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  prompt: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
});
