// Shows a full earnings breakdown for one day — used on History and Month screens.
// Includes a "Taxes Due" line at the top styled like a deduction (negative amount).
// Optionally shows Edit buttons next to each subcategory if onEdit is provided.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, font, spacing, radius, shadow } from '../styles/theme';
import { calcDayTotals, formatDollars, formatHours, toDollars } from '../utils/calculations';

/**
 * @param {object}    props
 * @param {object}    props.dayEntries   - { subcategoryId: { value, type, tokenRate } }
 * @param {Array}     props.categories   - Full category list (for names)
 * @param {number}    [props.hoursWorked] - Hours logged via the timer for this day
 * @param {function}  [props.onEdit]     - Called with (subcategory) to open edit screen
 */
export default function DayBreakdown({ dayEntries, categories, hoursWorked = 0, onEdit }) {
  const { gross, taxes, takeHome } = calcDayTotals(dayEntries);

  if (!gross) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No entries yet ✨</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Take-home total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Take-Home</Text>
        <Text style={styles.totalAmount}>{formatDollars(takeHome)}</Text>
      </View>

      <View style={styles.divider} />

      {/* Taxes due — styled as a deduction with a minus sign */}
      <View style={styles.taxRow}>
        <View style={styles.taxLeft}>
          <View style={styles.taxBadge}>
            <Text style={styles.taxBadgeText}>TAX</Text>
          </View>
          <Text style={styles.taxLabel}>Taxes Due (25%)</Text>
        </View>
        <Text style={styles.taxAmount}>−{formatDollars(taxes)}</Text>
      </View>

      {/* Hours worked — only shown if the timer was used that day */}
      {hoursWorked > 0 && (
        <>
          <View style={styles.divider} />
          <View style={styles.hoursRow}>
            <View style={styles.hoursLeft}>
              <View style={styles.hoursBadge}>
                <Text style={styles.hoursBadgeText}>⏱</Text>
              </View>
              <Text style={styles.hoursLabel}>Hours Worked</Text>
            </View>
            <Text style={styles.hoursValue}>{formatHours(hoursWorked)}</Text>
          </View>
        </>
      )}

      <View style={styles.divider} />

      {/* Breakdown by category and subcategory */}
      {categories.map((cat) => {
        const catSubs = cat.subcategories.filter((s) => dayEntries[s.id]);
        if (!catSubs.length) return null;

        return (
          <View key={cat.id} style={styles.catGroup}>
            <Text style={styles.catLabel}>{cat.name}</Text>

            {catSubs.map((sub) => {
              const entry   = dayEntries[sub.id];
              const dollars = toDollars(entry.value, entry.type, entry.tokenRate);

              return (
                <View key={sub.id} style={styles.subRow}>
                  <View style={styles.subLeft}>
                    <Text style={styles.subName}>{sub.name}</Text>
                    {entry.type === 'token' && (
                      <Text style={styles.subDetail}>
                        {entry.value} tokens × ${entry.tokenRate}
                      </Text>
                    )}
                  </View>

                  <View style={styles.subRight}>
                    <Text style={styles.subAmount}>{formatDollars(dollars)}</Text>
                    {onEdit && (
                      <TouchableOpacity
                        onPress={() => onEdit(sub)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={{ fontSize: 14 }}>✏️</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.cardPink,
  },
  totalLabel: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.primaryDeep,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  totalAmount: {
    fontSize: font.xl,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: '#FFF5F7',
  },
  taxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  taxBadge: {
    backgroundColor: colors.negative,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  taxBadgeText: {
    color: '#FFFFFF',
    fontSize: font.xs,
    fontWeight: '800',
  },
  taxLabel: {
    fontSize: font.sm,
    color: colors.textMid,
    fontWeight: '500',
  },
  taxAmount: {
    fontSize: font.md,
    fontWeight: '700',
    color: colors.negativeText,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: '#F5F9FF',
  },
  hoursLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hoursBadge: {
    backgroundColor: '#D0E8FF',
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  hoursBadgeText: {
    fontSize: font.xs,
  },
  hoursLabel: {
    fontSize: font.sm,
    color: colors.textMid,
    fontWeight: '500',
  },
  hoursValue: {
    fontSize: font.md,
    fontWeight: '700',
    color: '#1565C0',
  },
  catGroup: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  catLabel: {
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  subLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  subName: {
    fontSize: font.md,
    color: colors.textDark,
    fontWeight: '500',
  },
  subDetail: {
    fontSize: font.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  subRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  subAmount: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.textDark,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: font.md,
    color: colors.textMuted,
  },
});
