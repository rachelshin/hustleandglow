// Shared styles reused across multiple screens and components.
// Screen-specific styles live inline in their own files.

import { StyleSheet } from 'react-native';
import { colors, radius, spacing, font, shadow } from './theme';

export default StyleSheet.create({
  // ── Layout ──────────────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },

  // ── Cards ────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow.sm,
  },

  // ── Typography ───────────────────────────────────────────────────────────
  screenTitle: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.primaryDeep,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },

  // ── Buttons ──────────────────────────────────────────────────────────────
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    ...shadow.md,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: font.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ghostButton: {
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: {
    color: colors.primary,
    fontSize: font.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  dangerButton: {
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.negative,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: colors.negativeText,
    fontSize: font.sm,
    fontWeight: '600',
  },

  // ── Input ────────────────────────────────────────────────────────────────
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    color: colors.textDark,
  },
  inputFocused: {
    borderColor: colors.primary,
  },

  // ── Rows ─────────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // ── Divider ──────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
});
