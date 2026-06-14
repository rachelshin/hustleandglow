import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { calcDayTotals, formatDollars, formatHours, formatElapsed } from '../utils/calculations';
import { todayKey, friendlyDate, dailyIndex } from '../utils/dateHelpers';
import { AFFIRMATIONS } from '../constants/defaults';
import CategorySection from '../components/CategorySection';
import UpgradeAccountModal from '../components/UpgradeAccountModal';
import { SettingsIcon } from '../components/HeaderIcons';
import { colors, font, spacing, radius, shadow } from '../styles/theme';
import { loadEntryMode, saveEntryMode } from '../utils/storage';
import shared from '../styles/shared';

export default function HomeScreen({ navigation }) {
  const {
    categories, categoriesLoading, getDayEntries,
    activeShift, elapsed, startShift, stopShift, getDayHours,
    user, isGuest,
  } = useApp();

  // "Save your account" upgrade modal (only reachable while a guest).
  const [upgradeVisible, setUpgradeVisible] = useState(false);

  // Which way the entry modal opens when you tap an income source:
  //   'total'   → one input: today's total for that source (the original flow)
  //   'balance' → two inputs: the source's balance at the start of the shift
  //               and its balance now; we save the difference as the earnings.
  // Remembered across app opens (local per-device preference). The saved entry
  // remembers its own mode, so this toggle only affects brand-new entries.
  const [entryMode, setEntryMode] = useState('total');

  // Restore the last-used toggle choice on mount.
  useEffect(() => {
    loadEntryMode().then((saved) => {
      if (saved === 'total' || saved === 'balance') setEntryMode(saved);
    });
  }, []);

  // Update + persist in one step whenever the user taps the toggle.
  const chooseEntryMode = (mode) => {
    setEntryMode(mode);
    saveEntryMode(mode);
  };

  // Header right: gear icon → Settings (currency toggle + sign out live there).
  useEffect(() => {
    if (!user) return;
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerSettings}
          onPress={() => navigation.navigate('Settings')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Settings"
        >
          <SettingsIcon size={22} color={colors.primaryDeep} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, user]);

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

      {/* Guest upgrade nudge — only shown to anonymous users */}
      {isGuest && (
        <TouchableOpacity
          style={styles.guestBanner}
          onPress={() => setUpgradeVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.guestBannerEmoji}>🔒</Text>
          <View style={styles.guestBannerTextWrap}>
            <Text style={styles.guestBannerTitle}>You're a guest</Text>
            <Text style={styles.guestBannerSub}>
              Save your account so your data isn't lost →
            </Text>
          </View>
        </TouchableOpacity>
      )}

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
          ) : (
            <Text style={styles.hoursToday}>
              {todayHours > 0 ? formatHours(todayHours) : '0 min'}{'\n'}today
            </Text>
          )}
        </View>
      </View>

      {/* Entry-mode toggle: controls which input flow a source opens */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeOption, entryMode === 'total' && styles.modeOptionActive]}
          onPress={() => chooseEntryMode('total')}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeText, entryMode === 'total' && styles.modeTextActive]}>
            Total
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeOption, entryMode === 'balance' && styles.modeOptionActive]}
          onPress={() => chooseEntryMode('balance')}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeText, entryMode === 'balance' && styles.modeTextActive]}>
            Balance
          </Text>
        </TouchableOpacity>
      </View>

      {/* Income source cards */}
      {categories.map((cat) => (
        <CategorySection
          key={cat.id}
          category={cat}
          dayEntries={dayEntries}
          onSubcategoryPress={(sub, category) =>
            navigation.navigate('EntryInput', { subcategory: sub, category, dateKey, entryMode })
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

      <UpgradeAccountModal
        visible={upgradeVisible}
        onClose={() => setUpgradeVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Header settings icon ──────────────────────────────────────────────────
  headerSettings: {
    marginRight: spacing.md,
  },

  // ── Guest upgrade banner ──────────────────────────────────────────────────
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  guestBannerEmoji: {
    fontSize: 22,
  },
  guestBannerTextWrap: {
    flex: 1,
  },
  guestBannerTitle: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  guestBannerSub: {
    fontSize: font.xs,
    color: colors.textMid,
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
  // ── Entry-mode toggle ─────────────────────────────────────────────────────
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    padding: 3,
    marginBottom: spacing.md,
    alignSelf: 'center',
  },
  modeOption: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  modeOptionActive: {
    backgroundColor: colors.card,
    ...shadow.sm,
  },
  modeText: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.textMid,
  },
  modeTextActive: {
    color: colors.primaryDeep,
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
