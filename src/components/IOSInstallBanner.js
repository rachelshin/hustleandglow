// Shows a dismissible install hint at the bottom of the screen on iOS Safari.
// Hidden automatically if already running as a standalone PWA.
// Dismissal is remembered in localStorage so it only shows once.

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors, font, spacing, radius, shadow } from '../styles/theme';

const DISMISSED_KEY = 'hg_ios_banner_dismissed';

function shouldShow() {
  if (Platform.OS !== 'web') return false;
  try {
    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isStandalone = window.navigator.standalone === true;
    const dismissed = !!localStorage.getItem(DISMISSED_KEY);
    return isIOS && !isStandalone && !dismissed;
  } catch {
    return false;
  }
}

export default function IOSInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(shouldShow());
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch {}
    setVisible(false);
  };

  return (
    <View style={styles.banner}>
      <View style={styles.row}>
        <Text style={styles.label}>
          First! Tap <Text style={styles.bold}>···</Text> bottom right
          {'  →  '}
          <Text style={styles.bold}>Share</Text>
          {'  →  '}
          <Text style={styles.bold}>Add to Home Screen</Text>
        </Text>
        <TouchableOpacity
          onPress={dismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 80,   // clears the Safari bottom toolbar + safe area
    left: 16,
    right: 16,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...shadow.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: font.sm,
    color: colors.textMid,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  close: {
    fontSize: font.sm,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
