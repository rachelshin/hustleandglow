// "Save your account" modal — upgrades a guest (anonymous) user to a real
// account while keeping the same uid, so all their data carries over.
//
// Single modal, two paths:
//   • Email + password → linkEmail (EmailAuthProvider + linkWithCredential)
//   • Google           → linkGoogle (linkWithPopup, with fallback)
//
// Shown from HomeScreen when isGuest is true. Closes itself on success.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GoogleLogo from './GoogleLogo';
import { useApp } from '../context/AppContext';
import { colors, font, spacing, radius, shadow } from '../styles/theme';
import shared from '../styles/shared';

// Friendly messages for the auth error codes that linking can throw.
function friendlyError(code) {
  switch (code) {
    case 'auth/invalid-email':           return 'That doesn\'t look like a valid email.';
    case 'auth/weak-password':           return 'Password must be at least 6 characters.';
    case 'auth/email-already-in-use':    return 'That email already has an account. Sign out and sign in with it instead.';
    case 'auth/credential-already-in-use': return 'That account already exists. Sign out and sign in with it instead.';
    case 'auth/provider-already-linked': return 'This account is already saved.';
    case 'auth/requires-recent-login':   return 'Please sign out and back in, then try again.';
    case 'auth/network-request-failed':  return 'No internet connection. Check your network.';
    case 'auth/popup-closed-by-user':    return 'Sign-in was cancelled.';
    case 'auth/popup-blocked':           return 'Popup was blocked. Allow popups for this site and try again.';
    case 'google/native-not-configured': return 'Google sign-in isn\'t set up for mobile yet — use email/password instead.';
    default:                             return 'Something went wrong. Please try again.';
  }
}

export default function UpgradeAccountModal({ visible, onClose }) {
  const { linkEmail, linkGoogle } = useApp();
  const insets = useSafeAreaInsets();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // iOS PWA keyboard fix: the layout viewport doesn't shrink when the keyboard
  // opens, only the visual viewport does, so we pad the sheet manually.
  const [iosPWAKeyboard, setIosPWAKeyboard] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (!window.navigator?.standalone || !window.visualViewport) return;
    const onResize = () =>
      setIosPWAKeyboard(Math.max(0, window.innerHeight - window.visualViewport.height));
    window.visualViewport.addEventListener('resize', onResize);
    return () => window.visualViewport.removeEventListener('resize', onResize);
  }, []);

  // Reset fields whenever the modal is reopened.
  useEffect(() => {
    if (visible) {
      setEmail('');
      setPassword('');
      setError('');
      setLoading(false);
    }
  }, [visible]);

  const handleEmailUpgrade = async () => {
    setError('');
    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail || !password) {
      setError('Please enter your email and a password.');
      return;
    }
    setLoading(true);
    try {
      await linkEmail(trimEmail, password);
      onClose();
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleUpgrade = async () => {
    setError('');
    setLoading(true);
    try {
      await linkGoogle();
      onClose();
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg + iosPWAKeyboard }]}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Save your account ✨</Text>
            <Text style={styles.subtitle}>
              You're using a guest account — your data lives only on this device.
              Add an email or Google to keep it safe and access it anywhere. Nothing
              you've entered is lost.
            </Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={shared.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="next"
              editable={!loading}
            />

            <Text style={[styles.label, { marginTop: spacing.sm }]}>Password</Text>
            <TextInput
              style={shared.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={handleEmailUpgrade}
              editable={!loading}
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[shared.primaryButton, styles.submitBtn, loading && styles.disabled]}
              onPress={handleEmailUpgrade}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={shared.primaryButtonText}>Save Account 💫</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.googleBtn, loading && styles.disabled]}
              onPress={handleGoogleUpgrade}
              disabled={loading}
              activeOpacity={0.85}
            >
              <View style={styles.googleBtnInner}>
                <GoogleLogo size={20} />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.dismissText}>Maybe later</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    maxHeight: '90%',
  },
  title: {
    fontSize: font.xl,
    fontWeight: '800',
    color: colors.primaryDeep,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: font.sm,
    color: colors.textMid,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.textMid,
    marginBottom: 2,
  },
  errorBox: {
    backgroundColor: '#FFE4EC',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.negative,
  },
  errorText: {
    color: colors.negativeText,
    fontSize: font.sm,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: spacing.md,
  },
  disabled: {
    opacity: 0.65,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: font.xs,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  googleBtn: {
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    marginTop: spacing.md,
    ...shadow.sm,
  },
  googleBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  googleBtnText: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.textDark,
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  dismissText: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
