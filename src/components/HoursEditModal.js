// Add / edit / delete the hours worked on one day, from the Month calendar.
// One component for both modes (mirrors the single add-or-edit pattern used for
// goals): `hours > 0` opens in edit mode and shows a Delete option; `0` opens in
// add mode. Hours and minutes are entered separately so users never have to
// think in decimals (2h 30m, not 2.5).

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { colors, font, spacing, radius, shadow } from '../styles/theme';
import { friendlyDate } from '../utils/dateHelpers';
import shared from '../styles/shared';

export default function HoursEditModal({ dateKey, hours, onSave, onClose }) {
  const existing = hours > 0;
  const initialH = Math.floor(hours);
  const initialM = Math.round((hours - initialH) * 60);
  const [h, setH] = useState(existing ? String(initialH) : '');
  const [m, setM] = useState(existing && initialM > 0 ? String(initialM) : '');

  // iOS PWA keyboard fix: KeyboardAvoidingView does nothing in a standalone iOS
  // PWA, so track the keyboard height from visualViewport and pad the sheet.
  const [iosPWAKeyboard, setIosPWAKeyboard] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (!window.navigator?.standalone || !window.visualViewport) return;
    const onResize = () =>
      setIosPWAKeyboard(Math.max(0, window.innerHeight - window.visualViewport.height));
    window.visualViewport.addEventListener('resize', onResize);
    return () => window.visualViewport.removeEventListener('resize', onResize);
  }, []);

  const hNum = h === '' ? 0 : Number(h);
  const mNum = m === '' ? 0 : Number(m);
  const valid = !isNaN(hNum) && !isNaN(mNum) && hNum >= 0 && mNum >= 0;
  const total = hNum + mNum / 60;
  const canSave = valid && total > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave(dateKey, total);
    onClose();
  };

  const handleDelete = () => {
    onSave(dateKey, 0);
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <View style={[styles.card, { paddingBottom: spacing.lg + iosPWAKeyboard }]}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          <Text style={styles.title}>{existing ? 'Edit hours' : 'Add hours'}</Text>
          <Text style={styles.date}>{friendlyDate(dateKey)}</Text>

          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Hours</Text>
              <TextInput
                style={[shared.input, styles.numInput]}
                value={h}
                onChangeText={setH}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                selectTextOnFocus
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Minutes</Text>
              <TextInput
                style={[shared.input, styles.numInput]}
                value={m}
                onChangeText={setM}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                selectTextOnFocus
              />
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={shared.ghostButton} onPress={onClose}>
              <Text style={shared.ghostButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[shared.primaryButton, !canSave && styles.disabled]}
              onPress={handleSave}
              disabled={!canSave}
            >
              <Text style={shared.primaryButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          {existing && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteText}>Delete hours</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(45,10,31,0.4)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '88%',
    ...shadow.lg,
  },
  title: {
    fontSize: font.lg,
    fontWeight: '800',
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  date: {
    fontSize: font.sm,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  field: {
    flex: 1,
    gap: spacing.xs,
  },
  label: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.textMid,
  },
  numInput: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.primaryDeep,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    justifyContent: 'flex-end',
  },
  disabled: {
    opacity: 0.4,
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  deleteText: {
    fontSize: font.sm,
    color: colors.negativeText,
    textDecorationLine: 'underline',
  },
});
