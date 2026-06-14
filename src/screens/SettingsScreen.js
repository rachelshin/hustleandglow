// Settings screen — reached via the gear icon in the Home header.
// Houses the display-currency toggle and the sign-out action (moved here from
// the Home header to keep that header clean).
//
// Currency model (Option 1): amounts are always stored in USD; choosing GBP
// re-values everything at today's live rate, so historical totals shift with the
// rate until payout. The CSV export always stays in USD regardless of this toggle.

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, font, spacing, radius, shadow } from '../styles/theme';
import shared from '../styles/shared';

export default function SettingsScreen({ navigation }) {
  const { currency, chooseCurrency, gbpRate, rateLoading, refreshRate, logOut } = useApp();

  // £ per $1 (e.g. 0.79). null until the first fetch resolves.
  const rate = gbpRate?.rate;

  const confirmSignOut = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Sign out of Hustle & Glow?')) logOut();
    } else {
      Alert.alert('Sign Out', 'Sign out of Hustle & Glow?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logOut },
      ]);
    }
  };

  return (
    <ScrollView style={shared.scroll} contentContainerStyle={shared.scrollContent}>
      {/* ── About ─────────────────────────────────────────────────────────── */}
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>Hustle & Glow ✨</Text>
        <Text style={styles.aboutBody}>
          This app is free and ad-free — always. If you'd like to support getting
          it listed in the App Store so it's accessible to more models, donations
          on Ko-fi go directly toward that goal.
        </Text>
        <TouchableOpacity
          style={styles.kofiLink}
          onPress={() => Linking.openURL('https://ko-fi.com/nextrightthing')}
          activeOpacity={0.8}
        >
          <Text style={styles.kofiLinkText}>Support on Ko-fi →</Text>
        </TouchableOpacity>
      </View>

      {/* ── Display currency ──────────────────────────────────────────────── */}
      <Text style={shared.sectionLabel}>Display currency</Text>

      <View style={styles.card}>
        <Text style={styles.cardHint}>
          Earnings are entered in dollars. Choose how totals are shown.
        </Text>

        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.option, currency === 'USD' && styles.optionActive]}
            onPress={() => chooseCurrency('USD')}
            activeOpacity={0.8}
          >
            <Text style={[styles.optionText, currency === 'USD' && styles.optionTextActive]}>
              $ USD
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, currency === 'GBP' && styles.optionActive]}
            onPress={() => chooseCurrency('GBP')}
            activeOpacity={0.8}
          >
            <Text style={[styles.optionText, currency === 'GBP' && styles.optionTextActive]}>
              £ GBP
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live rate readout — loading, loaded, or failed (tap to retry). */}
        {rate ? (
          <Text style={styles.rateText}>
            Live rate: $1 = £{rate.toFixed(2)} · updates daily
          </Text>
        ) : rateLoading ? (
          <Text style={styles.rateMuted}>Fetching today's rate…</Text>
        ) : (
          <TouchableOpacity onPress={refreshRate} activeOpacity={0.7}>
            <Text style={styles.rateWarn}>
              Couldn't load the exchange rate{currency === 'GBP' ? ' — showing dollars for now' : ''}. Tap to retry.
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Account ───────────────────────────────────────────────────────── */}
      <Text style={shared.sectionLabel}>Account</Text>

      <TouchableOpacity
        style={[shared.dangerButton, styles.signOut]}
        onPress={confirmSignOut}
        activeOpacity={0.8}
      >
        <Text style={shared.dangerButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  aboutCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  aboutTitle: {
    fontSize: font.xl,
    fontWeight: '800',
    color: colors.primaryDeep,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  aboutBody: {
    fontSize: font.sm,
    color: colors.textMid,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  kofiLink: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    ...shadow.md,
  },
  kofiLinkText: {
    color: '#FFFFFF',
    fontSize: font.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.sm,
  },
  cardHint: {
    fontSize: font.sm,
    color: colors.textMid,
    textAlign: 'center',
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    padding: 3,
    alignSelf: 'center',
  },
  option: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  optionActive: {
    backgroundColor: colors.card,
    ...shadow.sm,
  },
  optionText: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.textMid,
  },
  optionTextActive: {
    color: colors.primaryDeep,
  },
  rateText: {
    fontSize: font.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  rateMuted: {
    fontSize: font.xs,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  rateWarn: {
    fontSize: font.xs,
    color: colors.negativeText,
    textAlign: 'center',
  },
  signOut: {
    marginTop: spacing.xs,
  },
});
