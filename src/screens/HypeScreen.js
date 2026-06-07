import React, { useState, useRef, useEffect, createElement } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../context/AppContext';
import { formatDollars, formatHours } from '../utils/calculations';
import { todayKey, toKey, shortDate } from '../utils/dateHelpers';
import { loadWhy, saveWhy } from '../utils/storage';
import { colors, font, spacing, radius, shadow } from '../styles/theme';
import shared from '../styles/shared';

const PERIODS = ['daily', 'custom'];
const PERIOD_LABELS = { daily: 'Daily', custom: 'Custom' };
const TYPES = ['money', 'time', 'text'];
const TYPE_LABELS = { money: '💰 Money', time: '⏱️ Time', text: '✅ Goal' };
const KB_HEIGHT = Dimensions.get('window').height * 0.42;

// ── Goal form ─────────────────────────────────────────────────────────────────

function GoalForm({ current, onSave, onClose }) {
  const [type,      setType]      = useState(current?.type      ?? 'money');
  const [amount,    setAmount]    = useState(current?.amount    ? String(current.amount) : '');
  const [goalText,  setGoalText]  = useState(current?.text      ?? '');
  const [period,    setPeriod]    = useState(current?.period    ?? 'daily');
  const [days,      setDays]      = useState(current?.days      ? String(current.days)   : '');
  const [repeat,    setRepeat]    = useState(current?.repeat    ?? false);
  const [startDate, setStartDate] = useState(
    current?.startDate ? new Date(current.startDate + 'T00:00:00') : new Date()
  );
  const [showPicker, setShowPicker] = useState(false);
  const inputRef   = useRef(null);
  const textRef    = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (type === 'text') textRef.current?.focus();
      else inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isText   = type === 'text';
  const isTime   = type === 'time';
  const isCustom = period === 'custom';
  const canSave  = isText
    ? goalText.trim().length > 0
    : Number(amount) > 0 && (!isCustom || Number(days) > 0);

  const handleSave = () => {
    if (!canSave) return;
    if (isText) {
      onSave('text', null, null, null, null, false, goalText.trim());
      return;
    }
    const startKey = isCustom ? toKey(startDate) : null;
    onSave(type, amount, period, startKey, isCustom ? Number(days) : null, isCustom ? repeat : false, null);
  };

  return (
    <View style={form.overlay}>
      <View style={form.card}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[form.scrollContent, { paddingBottom: KB_HEIGHT }]}
        >
          <Text style={form.title}>{current ? 'Edit Goal' : 'New Goal 🎯'}</Text>

          <Text style={form.label}>Goal type</Text>
          <View style={form.toggle}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[form.toggleOption, type === t && form.toggleActive]}
                onPress={() => setType(t)}
              >
                <Text style={[form.toggleText, type === t && form.toggleTextActive]}>
                  {TYPE_LABELS[t]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isText ? (
            <>
              <Text style={form.label}>What's the goal?</Text>
              <TextInput
                ref={textRef}
                style={shared.input}
                value={goalText}
                onChangeText={setGoalText}
                autoCapitalize="sentences"
              />
            </>
          ) : (
            <>
              <Text style={form.label}>{isTime ? 'Goal hours' : 'Goal amount ($)'}</Text>
              <TextInput
                ref={inputRef}
                style={shared.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />

              <Text style={form.label}>Period</Text>
              <View style={form.toggle}>
                {PERIODS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[form.toggleOption, period === p && form.toggleActive]}
                    onPress={() => setPeriod(p)}
                  >
                    <Text style={[form.toggleText, period === p && form.toggleTextActive]}>
                      {PERIOD_LABELS[p]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {isCustom && (
                <>
                  <Text style={form.label}>Start date</Text>
                  {Platform.OS === 'web' ? (
                    createElement('input', {
                      type: 'date',
                      value: toKey(startDate),
                      onChange: (e) => {
                        const d = new Date(e.target.value + 'T00:00:00');
                        if (!isNaN(d)) setStartDate(d);
                      },
                      style: {
                        fontSize: 16, padding: 12, borderRadius: 10,
                        border: '1.5px solid #FFD1E8', backgroundColor: '#FFF0F5',
                        color: '#2D0A1F', alignSelf: 'stretch', outline: 'none',
                        boxSizing: 'border-box',
                      },
                    })
                  ) : Platform.OS === 'ios' ? (
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      display="compact"
                      onChange={(_, d) => d && setStartDate(d)}
                      style={{ alignSelf: 'flex-start', marginLeft: -8 }}
                    />
                  ) : (
                    <>
                      <TouchableOpacity style={shared.input} onPress={() => setShowPicker(true)}>
                        <Text style={{ color: colors.textDark }}>{shortDate(toKey(startDate))}</Text>
                      </TouchableOpacity>
                      {showPicker && (
                        <DateTimePicker
                          value={startDate}
                          mode="date"
                          display="default"
                          onChange={(_, d) => { setShowPicker(false); if (d) setStartDate(d); }}
                        />
                      )}
                    </>
                  )}

                  <Text style={form.label}>Number of days</Text>
                  <TextInput
                    style={shared.input}
                    value={days}
                    onChangeText={setDays}
                    keyboardType="number-pad"
                  />

                  <View style={form.repeatRow}>
                    <Text style={form.label}>Repeat when period ends</Text>
                    <Switch
                      value={repeat}
                      onValueChange={setRepeat}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={colors.card}
                    />
                  </View>
                </>
              )}
            </>
          )}

          <View style={form.actions}>
            <TouchableOpacity style={shared.ghostButton} onPress={onClose}>
              <Text style={shared.ghostButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[shared.primaryButton, !canSave && form.disabled]}
              onPress={handleSave}
            >
              <Text style={shared.primaryButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ progress }) {
  const pct = Math.min(progress, 1);
  return (
    <View style={bar.track}>
      <View style={[bar.fill, { width: `${Math.round(pct * 100)}%` }]} />
      {[0.25, 0.5, 0.75].map((mark) => (
        <View
          key={mark}
          style={[bar.tick, { left: `${mark * 100}%`, opacity: pct >= mark ? 0.4 : 0.2 }]}
        />
      ))}
    </View>
  );
}

// ── Text goal card ────────────────────────────────────────────────────────────

function TextGoalCard({ goal, onToggle, onRemove }) {
  const [justChecked, setJustChecked] = useState(false);

  const handleToggle = () => {
    if (!goal.checked) {
      setJustChecked(true);
      setTimeout(() => setJustChecked(false), 1800);
    }
    onToggle(goal.id);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.textGoalX} onPress={() => onRemove(goal.id)}>
        <Text style={styles.textGoalXIcon}>✕</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.textGoalRow} onPress={handleToggle} activeOpacity={0.7}>
        <View style={[styles.textCheckbox, goal.checked && styles.textCheckboxDone]}>
          {goal.checked && <Text style={styles.textCheckmark}>✓</Text>}
        </View>
        <Text style={[styles.textGoalLabel, goal.checked && styles.textGoalStrike]}>
          {goal.text}
        </Text>
      </TouchableOpacity>

      {justChecked && (
        <Text style={styles.textGoalCelebration}>🎉 YES!! You did it!</Text>
      )}
    </View>
  );
}

// ── Single goal card ──────────────────────────────────────────────────────────

function GoalCard({ goal, onEdit, onRemove }) {
  const isTime      = goal.type === 'time';
  const currentStr  = isTime ? formatHours(goal.periodValue) : formatDollars(goal.periodValue);
  const targetStr   = isTime ? formatHours(goal.amount)      : formatDollars(goal.amount);

  let periodLabel;
  if (goal.period === 'daily') {
    periodLabel = 'Today';
  } else if (goal.effectiveStart) {
    periodLabel = `${shortDate(goal.effectiveStart)} · ${goal.days} day${goal.days === 1 ? '' : 's'}`;
    if (goal.repeat) periodLabel += ' 🔁';
  } else {
    periodLabel = 'Custom';
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {isTime ? '⏱️ TIME GOAL' : '💰 MONEY GOAL'}
        </Text>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={onEdit}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRemove}>
            <Text style={styles.removeLink}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.goalRow}>
        <Text style={styles.goalPeriod}>{periodLabel}</Text>
        <Text style={styles.goalNumbers}>
          {currentStr}
          <Text style={styles.goalOf}> / {targetStr}</Text>
        </Text>
      </View>

      <ProgressBar progress={goal.progress} />
      <Text style={styles.progressPct}>{Math.round(goal.progress * 100)}% there</Text>

      {goal.treat && (
        <View style={styles.treatBox}>
          <Text style={styles.treatText}>{goal.treat}</Text>
        </View>
      )}

      {goal.progress >= 1 && (
        <Text style={styles.goalComplete}>YOU HIT YOUR GOAL! 🎉</Text>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HypeScreen() {
  const {
    goals, addGoal, updateGoal, removeGoal, toggleTextGoal,
    streak,
    wins,
    getDayHours,
  } = useApp();

  const [formState,   setFormState]   = useState(null);
  const [whyText,     setWhyText]     = useState('');
  const [editingWhy,  setEditingWhy]  = useState(false);
  const whyRef = useRef(null);

  useEffect(() => { loadWhy().then(setWhyText); }, []);

  const handleWhyBlur = () => {
    setEditingWhy(false);
    saveWhy(whyText);
  };

  const todayHours = getDayHours(todayKey());

  const openAdd      = () => setFormState({ editId: null });
  const openEdit     = (id) => setFormState({ editId: id });
  const closeForm    = () => setFormState(null);
  const editingGoal  = formState?.editId ? goals.find(g => g.id === formState.editId) : null;

  const handleSave = (type, amount, period, startDate, days, repeat, text) => {
    if (formState.editId) {
      updateGoal(formState.editId, type, amount, period, startDate, days, repeat, text);
    } else {
      addGoal(type, amount, period, startDate, days, repeat, text);
    }
    closeForm();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={shared.scroll} contentContainerStyle={shared.scrollContent}>
        

        {/* ── My Why card ────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.whyCard}
          onPress={() => { setEditingWhy(true); setTimeout(() => whyRef.current?.focus(), 50); }}
          activeOpacity={0.85}
        >
          <Text style={styles.whyLabel}>MY WHY 💗</Text>
          {editingWhy ? (
            <TextInput
              ref={whyRef}
              style={styles.whyInput}
              value={whyText}
              onChangeText={setWhyText}
              onBlur={handleWhyBlur}
              multiline
            />
          ) : (
            <Text style={whyText ? styles.whyText : styles.whyPlaceholder}>
              {whyText || 'Why do I work?'}
            </Text>
          )}
        </TouchableOpacity>

        {/* ── Goal cards ─────────────────────────────────────────────── */}
        {goals.map((g) => g.type === 'text' ? (
          <TextGoalCard
            key={g.id}
            goal={g}
            onToggle={toggleTextGoal}
            onRemove={() => removeGoal(g.id)}
          />
        ) : (
          <GoalCard
            key={g.id}
            goal={g}
            onEdit={() => openEdit(g.id)}
            onRemove={() => removeGoal(g.id)}
          />
        ))}

        <TouchableOpacity style={styles.addGoalCard} onPress={openAdd}>
          <Text style={styles.addGoalEmoji}>🎯</Text>
          <Text style={styles.addGoalText}>
            {goals.length === 0 ? 'Set a goal' : 'Add another goal'}
          </Text>
        </TouchableOpacity>

        {/* ── Streak card ────────────────────────────────────────────── */}
        <View style={styles.statRow}>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Text style={styles.statEmoji}>{streak >= 3 ? '🔥' : '✨'}</Text>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>

          <View style={[styles.statCard, { flex: 1 }]}>
            {todayHours > 0 ? (
              <>
                <Text style={styles.statEmoji}>⏱️</Text>
                <Text style={styles.statValue}>{formatHours(todayHours)}</Text>
                <Text style={styles.statLabel}>worked today</Text>
              </>
            ) : (
              <>
                <Text style={styles.statEmoji}>⏱️</Text>
                <Text style={styles.statValueMuted}>—</Text>
                <Text style={styles.statLabel}>start a shift to{'\n'}track your time</Text>
              </>
            )}
          </View>
        </View>

        {/* ── Wins card ──────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>WINS ✨</Text>
          {wins.length > 0 ? (
            wins.map((w, i) => (
              <Text key={i} style={styles.winLine}>{w}</Text>
            ))
          ) : (
            <Text style={styles.winEmpty}>
              Start logging income and your wins will show up here 💗
            </Text>
          )}
        </View>
      </ScrollView>

      {formState !== null && (
        <GoalForm
          current={editingGoal}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  whyCard: {
    backgroundColor: '#e91e8c',
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadow.lg,
  },
  whyLabel: {
    fontSize: font.xs,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  whyText: {
    fontSize: font.lg,
    fontWeight: '700',
    color: '#FFF176',
    textAlign: 'center',
    lineHeight: 26,
  },
  whyPlaceholder: {
    fontSize: font.md,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  whyInput: {
    fontSize: font.lg,
    fontWeight: '700',
    color: '#FFF176',
    textAlign: 'center',
    lineHeight: 26,
    width: '100%',
    minHeight: 40,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    ...shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  editLink: {
    fontSize: font.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  removeLink: {
    fontSize: font.sm,
    color: colors.negative,
    fontWeight: '600',
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  goalPeriod: {
    fontSize: font.sm,
    color: colors.textMid,
    fontWeight: '600',
  },
  goalNumbers: {
    fontSize: font.lg,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  goalOf: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  progressPct: {
    fontSize: font.xs,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'right',
  },
  treatBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  treatText: {
    fontSize: font.sm,
    color: colors.primaryDeep,
    fontWeight: '600',
    lineHeight: 20,
  },
  goalComplete: {
    fontSize: font.md,
    fontWeight: '800',
    color: colors.primaryDeep,
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  textGoalX: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    padding: 4,
    zIndex: 1,
  },
  textGoalXIcon: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '700',
  },
  textGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: 28,
  },
  textCheckbox: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textCheckboxDone: {
    backgroundColor: colors.primary,
  },
  textCheckmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  textGoalLabel: {
    flex: 1,
    fontSize: font.md,
    fontWeight: '600',
    color: colors.textDark,
    lineHeight: 22,
  },
  textGoalStrike: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  textGoalCelebration: {
    fontSize: font.sm,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  addGoalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadow.sm,
  },
  addGoalEmoji: { fontSize: 18 },
  addGoalText: {
    fontSize: font.md,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadow.sm,
  },
  statEmoji: { fontSize: 28 },
  statValue: {
    fontSize: font.xl,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  statValueMuted: {
    fontSize: font.xl,
    fontWeight: '800',
    color: colors.textMuted,
  },
  statLabel: {
    fontSize: font.xs,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  winLine: {
    fontSize: font.sm,
    color: colors.textDark,
    lineHeight: 22,
  },
  winEmpty: {
    fontSize: font.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});

const bar = StyleSheet.create({
  track: {
    height: 10,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  tick: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: colors.primaryDeep,
    transform: [{ translateX: -1 }],
  },
});

const form = StyleSheet.create({
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
  scrollContent: {
    gap: spacing.sm,
  },
  title: {
    fontSize: font.lg,
    fontWeight: '800',
    color: colors.primaryDeep,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.textMid,
    marginTop: spacing.xs,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  toggleActive: {
    backgroundColor: colors.card,
    ...shadow.sm,
  },
  toggleText: {
    fontSize: font.sm,
    color: colors.textMuted,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.primaryDeep,
  },
  repeatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
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
});
