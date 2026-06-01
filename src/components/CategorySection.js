// A card showing a category (e.g. "Cam") with all its subcategories listed
// directly underneath — no extra taps to drill into subcategories.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, spacing, radius, shadow } from '../styles/theme';
import SubcategoryRow from './SubcategoryRow';

/**
 * @param {object}   props
 * @param {object}   props.category            - { id, name, subcategories }
 * @param {object}   props.dayEntries          - Today's entries for all subcategories
 * @param {function} props.onSubcategoryPress  - Called with (subcategory, category)
 */
export default function CategorySection({ category, dayEntries, onSubcategoryPress }) {
  const activeSubs = category.subcategories.filter(s => !s.deleted);
  if (category.deleted || !activeSubs.length) return null;

  return (
    <View style={styles.card}>
      {/* Category header */}
      <Text style={styles.categoryName}>{category.name}</Text>

      {/* All subcategories listed inline */}
      {activeSubs.map((sub, index) => (
        <View key={sub.id}>
          {index > 0 && <View style={styles.divider} />}
          <SubcategoryRow
            subcategory={sub}
            entry={dayEntries[sub.id]}
            onPress={() => onSubcategoryPress(sub, category)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadow.sm,
  },
  categoryName: {
    fontSize: font.xs,
    fontWeight: '800',
    color: colors.primaryDeep,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardPink,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
});
