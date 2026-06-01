// Sign-in / sign-up screen.
// Shown whenever the user is not authenticated.
// Toggling between "Sign In" and "Create Account" just flips local state —
// no navigation required.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import GoogleLogo from '../components/GoogleLogo';
import { useApp } from '../context/AppContext';
import { colors, font, spacing, radius, shadow } from '../styles/theme';
import shared from '../styles/shared';

// Map Firebase auth error codes to friendly messages.
function friendlyError(code) {
  switch (code) {
    case 'auth/invalid-email':        return 'That doesn\'t look like a valid email.';
    case 'auth/user-not-found':       return 'No account found — try creating one!';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':   return 'Wrong email or password. Try again.';
    case 'auth/email-already-in-use': return 'That email is already registered. Sign in instead?';
    case 'auth/weak-password':        return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':    return 'Too many attempts — wait a moment and try again.';
    case 'auth/network-request-failed':    return 'No internet connection. Check your network.';
  case 'auth/popup-closed-by-user':      return 'Sign-in was cancelled.';
  case 'auth/popup-blocked':             return 'Popup was blocked. Allow popups for this site and try again.';
  case 'google/native-not-configured':   return 'Google Sign-In isn\'t set up for mobile yet — use email/password instead.';
    default:                             return 'Something went wrong. Please try again.';
  }
}

export default function SignInScreen() {
  const { signIn, signUp, signInWithGoogle } = useApp();

  const [mode, setMode]                   = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  const isSignUp = mode === 'signup';

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    const trimEmail = email.trim().toLowerCase();

    if (!trimEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setError('Passwords don\'t match — double-check and try again.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(trimEmail, password);
      } else {
        await signIn(trimEmail, password);
      }
      // On success, AppContext updates user state → App.js switches to main nav automatically.
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={shared.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Logo area ─────────────────────────────────────────────────────── */}
        <View style={styles.logoArea}>
          <Text style={styles.logoEmoji}>✨</Text>
          <Text style={styles.appName}>Hustle & Glow</Text>
        
        </View>

        {/* ── Mode toggle ───────────────────────────────────────────────────── */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleTab, mode === 'signin' && styles.toggleTabActive]}
            onPress={() => switchMode('signin')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, mode === 'signin' && styles.toggleTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleTab, mode === 'signup' && styles.toggleTabActive]}
            onPress={() => switchMode('signup')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Form ──────────────────────────────────────────────────────────── */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={shared.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="next"
          />

          <Text style={[styles.label, { marginTop: spacing.sm }]}>Password</Text>
          <TextInput
            style={shared.input}
            value={password}
            onChangeText={setPassword}
            placeholder={isSignUp ? 'At least 6 characters' : '••••••••'}
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            returnKeyType={isSignUp ? 'next' : 'done'}
            onSubmitEditing={isSignUp ? undefined : handleSubmit}
          />

          {isSignUp && (
            <>
              <Text style={[styles.label, { marginTop: spacing.sm }]}>Confirm Password</Text>
              <TextInput
                style={shared.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat your password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </>
          )}

          {/* Error message */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit button */}
          <TouchableOpacity
            style={[shared.primaryButton, styles.submitBtn, loading && styles.disabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={shared.primaryButtonText}>
                {isSignUp ? 'Create Account ✨' : 'Sign In 💫'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign-In */}
          <TouchableOpacity
            style={[styles.googleBtn, loading && styles.disabled]}
            onPress={async () => {
              setError('');
              setLoading(true);
              try {
                await signInWithGoogle();
              } catch (e) {
                setError(friendlyError(e.code));
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            activeOpacity={0.85}
          >
            <View style={styles.googleBtnInner}>
              <GoogleLogo size={20} />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Privacy note shown only on sign-up */}
        {isSignUp && (
          <Text style={styles.privacyNote}>
            Your data is encrypted and only visible to you. 🔒
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
  },

  // ── Logo ──────────────────────────────────────────────────────────────────
  logoArea: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  logoEmoji: {
    fontSize: 64,
  },
  appName: {
    fontSize: font.hero,
    fontWeight: '800',
    color: colors.primaryDeep,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: font.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  // ── Toggle ────────────────────────────────────────────────────────────────
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    padding: 4,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.pill,
  },
  toggleTabActive: {
    backgroundColor: colors.primary,
    ...shadow.sm,
  },
  toggleText: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.primaryDeep,
  },
  toggleTextActive: {
    color: '#fff',
  },

  // ── Form ──────────────────────────────────────────────────────────────────
  form: {
    gap: spacing.xs,
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
    marginTop: spacing.xs,
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

  // ── Divider ───────────────────────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
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

  // ── Google button ─────────────────────────────────────────────────────────
  googleBtn: {
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
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

  // ── Footer ────────────────────────────────────────────────────────────────
  privacyNote: {
    fontSize: font.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
