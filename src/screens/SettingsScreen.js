// Settings screen — reached via the gear icon in the Home header.
// Houses the display-currency toggle and the sign-out action (moved here from
// the Home header to keep that header clean).
//
// Currency model (Option 1): amounts are always stored in USD; choosing GBP
// re-values everything at today's live rate, so historical totals shift with the
// rate until payout. The CSV export always stays in USD regardless of this toggle.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { SignOutIcon } from '../components/HeaderIcons';
import { colors, font, spacing, radius, shadow } from '../styles/theme';
import shared from '../styles/shared';

export default function SettingsScreen({ navigation }) {
  const {
    currency, chooseCurrency, gbpRate, rateLoading, refreshRate,
    taxRate, chooseTaxRate, logOut,
  } = useApp();

  // £ per $1 (e.g. 0.79). null until the first fetch resolves.
  const rate = gbpRate?.rate;

  // Tax rate is stored as a fraction (0.25); the field shows a percentage.
  // toFixed(2) + unary-plus drops trailing zeros so 25 shows as "25", 22.5 as "22.5".
  const ratePct = (r) => String(+(r * 100).toFixed(2));
  const [taxText, setTaxText] = useState(ratePct(taxRate));

  // Re-sync the field if the rate changes elsewhere (e.g. loaded from storage
  // after mount). Doesn't fight typing — taxRate only changes on commit/load.
  useEffect(() => { setTaxText(ratePct(taxRate)); }, [taxRate]);

  // Commit on blur/submit: clamp to 0–100%, fall back to current rate if blank.
  const commitTax = () => {
    const n = parseFloat(taxText);
    const pct = isNaN(n) ? taxRate * 100 : Math.min(100, Math.max(0, n));
    chooseTaxRate(pct / 100);
    setTaxText(ratePct(pct / 100));
  };

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

  // Sign-out lives as an icon in the top-right of the header (clearer than a
  // button buried at the bottom of the scroll).
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={confirmSignOut}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ marginRight: spacing.md }}
          accessibilityLabel="Sign out"
        >
          <SignOutIcon size={22} color={colors.primaryDeep} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

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

      {/* ── Estimated tax rate ────────────────────────────────────────────── */}
      <Text style={shared.sectionLabel}>Estimated tax rate</Text>

      <View style={styles.card}>
        <Text style={styles.cardHint}>
          The share of earnings set aside for taxes. Drives the tax and take-home
          figures throughout the app.
        </Text>

        <View style={styles.taxRow}>
          <TextInput
            style={styles.taxInput}
            value={taxText}
            onChangeText={(t) => setTaxText(t.replace(/[^0-9.]/g, ''))}
            onBlur={commitTax}
            onSubmitEditing={commitTax}
            keyboardType="numeric"
            inputMode="numeric"
            maxLength={5}
            returnKeyType="done"
            selectTextOnFocus
          />
          <Text style={styles.taxPercent}>%</Text>
        </View>
      </View>
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
  taxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
  },
  taxInput: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    fontSize: 18, // >= 16 so iOS PWA doesn't auto-zoom on focus
    fontWeight: '700',
    color: colors.primaryDeep,
    textAlign: 'center',
    minWidth: 84,
  },
  taxPercent: {
    fontSize: font.lg,
    fontWeight: '700',
    color: colors.textMid,
  },
});
