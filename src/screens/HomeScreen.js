import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { calcDayTotals, formatDollars, formatHours, formatElapsed } from '../utils/calculations';
import { todayKey, friendlyDate, dailyIndex } from '../utils/dateHelpers';
import { AFFIRMATIONS } from '../constants/defaults';
import CategorySection from '../components/CategorySection';
import { SignOutIcon } from '../components/HeaderIcons';
import { colors, font, spacing, radius, shadow } from '../styles/theme';
import shared from '../styles/shared';

export default function HomeScreen({ navigation }) {
  const {
    categories, categoriesLoading, getDayEntries,
    activeShift, elapsed, startShift, stopShift, getDayHours,
    user, logOut,
  } = useApp();

  // Header right: manage-sources icon + sign-out icon.
  useEffect(() => {
    if (!user) return;
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerSignOut}
          onPress={() => {
            if (Platform.OS === 'web') {
              if (window.confirm('Sign out of Hustle & Glow?')) logOut();
            } else {
              Alert.alert(
                'Sign Out',
                'Sign out of Hustle & Glow?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign Out', style: 'destructive', onPress: logOut },
                ]
              );
            }
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Sign out"
        >
          <SignOutIcon size={22} color={colors.primaryDeep} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, user, logOut]);

  const dateKey    = todayKey();
  const dayEntries = getDayEntries(dateKey);
  const totals     = calcDayTotals(dayEntries);
  const affirmation = AFFIRMATIONS[dailyIndex(AFFIRMATIONS.length)];
  const todayHours  = getDayHours(dateKey);

  if (categoriesLoading) {
    return (
      <View style={[shared.screen, styles.loading]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const hasSources = categories.some((c) => c.subcategories.length > 0);

  return (
    <ScrollView style={shared.scroll} contentContainerStyle={shared.scrollContent}>
      {/* Date label */}
      <Text style={styles.date}>{friendlyDate(dateKey)}</Text>

      <Text style={styles.affirmation}>{affirmation}</Text>

      {/* Hero card: amount left, button center, time right */}
      <View style={styles.heroCard}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroLabel}>TAKE HOME</Text>
          <Text style={styles.heroAmount} numberOfLines={1}>
            {formatDollars(totals.takeHome)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.shiftBtn, activeShift && styles.shiftBtnActive]}
          onPress={activeShift ? stopShift : startShift}
          activeOpacity={0.75}
        >
          {activeShift
            ? <View style={styles.stopSquare} />
            : <Text style={styles.shiftEmoji}>▶</Text>
          }
        </TouchableOpacity>

        <View style={styles.heroRight}>
          {activeShift ? (
            <Text style={styles.elapsed}>{formatElapsed(elapsed)}</Text>
          ) : todayHours > 0 ? (
            <Text style={styles.hoursToday}>{formatHours(todayHours)}{'\n'}today</Text>
          ) : null}
        </View>
      </View>

      {/* Income source cards */}
      {categories.map((cat) => (
        <CategorySection
          key={cat.id}
          category={cat}
          dayEntries={dayEntries}
          onSubcategoryPress={(sub, category) =>
            navigation.navigate('EntryInput', { subcategory: sub, category, dateKey })
          }
        />
      ))}

      {/* Add / manage sources — circular FAB */}
      {hasSources ? (
        <TouchableOpacity
          style={styles.addSourcesBtn}
          onPress={() => navigation.navigate('CategoryManager')}
          activeOpacity={0.75}
          accessibilityLabel="Add or edit income sources"
        >
          <Text style={styles.addSourcesPlus}>+</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💅</Text>
          <TouchableOpacity
            style={styles.addSourcesBtn}
            onPress={() => navigation.navigate('CategoryManager')}
            activeOpacity={0.75}
            accessibilityLabel="Add income sources"
          >
            <Text style={styles.addSourcesPlus}>+</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Header sign-out icon ──────────────────────────────────────────────────
  headerSignOut: {
    marginRight: spacing.md,
  },

  date: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.textMid,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  affirmation: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  heroCard: {
    backgroundColor: '#E91E8C',
    borderRadius: radius.xl,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow.lg,
  },
  heroLeft: {
    flex: 1,
    alignItems: 'center',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: font.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  heroAmount: {
    color: '#FFF176',
    fontSize: font.xxl,
    fontWeight: '800',
  },
  heroRight: {
    flex: 1,
    alignItems: 'center',
  },
  shiftBtn: {
    // Fixed size — both play and stop states occupy exactly this space so
    // the hero card never changes height when the button toggles.
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  shiftBtnActive: {
    backgroundColor: 'transparent',
  },
  shiftEmoji: {
    fontSize: 56,
    lineHeight: 60,
    color: '#FFF176',
    includeFontPadding: false,
  },
  stopSquare: {
    // Intentionally smaller than the container so it reads as an icon, not a slab.
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FFF176',
  },
  shiftLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shiftLabelActive: {
    color: colors.negative,
  },
  elapsed: {
    color: colors.gold,
    fontSize: font.md,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  hoursToday: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: font.xs,
    fontWeight: '600',
  },
  // ── Add sources FAB (circular) ────────────────────────────────────────────
  addSourcesBtn: {
    marginTop: spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    ...shadow.md,
  },
  addSourcesPlus: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 34,
    includeFontPadding: false,
  },

  // ── Empty state (no sources yet) ─────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: font.lg,
    fontWeight: '700',
    color: colors.primaryDeep,
  },

});
