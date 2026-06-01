// Calendar view for the current month.
// Shows a monthly summary (gross / tax / take-home / hours) above the calendar.
// Tap any day to see its full earnings breakdown below.
// Tap the pencil icon in the breakdown to edit an entry.
// Navigate between months with the arrow buttons.

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Linking,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { calcDayTotals, formatDollars, formatHours } from '../utils/calculations';
import {
  todayKey,
  friendlyDate,
  monthLabel,
  daysInMonth,
  firstWeekdayOfMonth,
} from '../utils/dateHelpers';
import DayBreakdown from '../components/DayBreakdown';
import CategorySection from '../components/CategorySection';
import { exportCSV } from '../utils/exportCSV';
import { ExportIcon, InfoIcon } from '../components/HeaderIcons';
import { colors, font, spacing, radius, shadow } from '../styles/theme';
import shared from '../styles/shared';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function MonthScreen({ navigation }) {
  const { categories, entries, getDayEntries, getDayHours } = useApp();

  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedKey, setSelectedKey] = useState(todayKey());
  const [infoVisible, setInfoVisible] = useState(false);

  // Export + info buttons in the header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginRight: spacing.md }}>
          <TouchableOpacity
            onPress={() => setInfoVisible(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="About this app"
          >
            <InfoIcon size={22} color={colors.primaryDeep} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => exportCSV(entries, categories, getDayHours)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Export CSV"
          >
            <ExportIcon size={22} color={colors.primaryDeep} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, entries, categories, getDayHours]);

  const today  = todayKey();
  const days   = daysInMonth(year, month);
  const offset = firstWeekdayOfMonth(year, month);

  // ── Monthly totals ──────────────────────────────────────────────────────
  const monthTotals = useMemo(() => {
    let gross = 0, taxes = 0, takeHome = 0, hours = 0;
    for (const dateKey of days) {
      const dayEntries = entries[dateKey];
      if (dayEntries && Object.keys(dayEntries).length > 0) {
        const t = calcDayTotals(dayEntries);
        gross    += t.gross;
        taxes    += t.taxes;
        takeHome += t.takeHome;
      }
      hours += getDayHours(dateKey);
    }
    return { gross, taxes, takeHome, hours };
  }, [year, month, entries, getDayHours]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Selected day ────────────────────────────────────────────────────────
  const goPrev = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const goNext = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const selectedEntries = getDayEntries(selectedKey);
  const selectedTotals  = calcDayTotals(selectedEntries);
  const selectedHours   = getDayHours(selectedKey);

  return (
    <>
    <ScrollView style={shared.scroll} contentContainerStyle={shared.scrollContent}>

      {/* ── Month navigation ───────────────────────────────────────────── */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={goPrev} style={styles.navBtn}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{monthLabel(year, month)}</Text>
        <TouchableOpacity onPress={goNext} style={styles.navBtn}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* ── Monthly summary card ───────────────────────────────────────── */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          {/* Gross */}
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>GROSS</Text>
            <Text style={styles.summaryGross}>{formatDollars(monthTotals.gross)}</Text>
          </View>

          <View style={styles.summarySep} />

          {/* Tax */}
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>TAX 25%</Text>
            <Text style={styles.summaryTax}>−{formatDollars(monthTotals.taxes)}</Text>
          </View>

          <View style={styles.summarySep} />

          {/* Take Home */}
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>TAKE HOME</Text>
            <Text style={styles.summaryNet}>{formatDollars(monthTotals.takeHome)}</Text>
          </View>
        </View>

        {/* Hours row — only shown if the timer was used this month */}
        {monthTotals.hours > 0 && (
          <View style={styles.summaryHoursRow}>
            <Text style={styles.summaryHoursText}>
              ⏱ {formatHours(monthTotals.hours)} worked this month
            </Text>
          </View>
        )}
      </View>

      {/* ── Calendar grid ──────────────────────────────────────────────── */}
      <View style={styles.calCard}>
        <View style={styles.weekRow}>
          {WEEKDAYS.map((d) => (
            <Text key={d} style={styles.weekDay}>{d}</Text>
          ))}
        </View>

        <View style={styles.grid}>
          {Array.from({ length: offset }).map((_, i) => (
            <View key={`blank-${i}`} style={styles.cell} />
          ))}

          {days.map((dateKey) => {
            const dayNum     = fromKey(dateKey).getDate();
            const isToday    = dateKey === today;
            const isSelected = dateKey === selectedKey;
            const hasEntry   = entries[dateKey] && Object.keys(entries[dateKey]).length > 0;
            const { takeHome } = hasEntry ? calcDayTotals(entries[dateKey]) : {};

            return (
              <TouchableOpacity
                key={dateKey}
                style={[
                  styles.cell,
                  isToday    && styles.cellToday,
                  isSelected && styles.cellSelected,
                ]}
                onPress={() => setSelectedKey(dateKey)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.cellNum,
                  isToday    && styles.cellNumToday,
                  isSelected && styles.cellNumSelected,
                ]}>
                  {dayNum}
                </Text>
                {hasEntry ? (
                  <Text style={[styles.cellAmt, isSelected && styles.cellAmtSelected]}>
                    {formatDollars(takeHome)}
                  </Text>
                ) : (
                  <View style={styles.cellEmpty} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Selected day breakdown ─────────────────────────────────────── */}
      <View style={styles.selectedHeader}>
        <Text style={styles.selectedDate}>{friendlyDate(selectedKey)}</Text>
        {selectedTotals.takeHome > 0 && (
          <Text style={styles.selectedTotal}>{formatDollars(selectedTotals.takeHome)}</Text>
        )}
      </View>

      <DayBreakdown
        dayEntries={selectedEntries}
        categories={categories}
        hoursWorked={selectedHours}
        onEdit={(sub) => {
          const cat = categories.find((c) =>
            c.subcategories.some((s) => s.id === sub.id)
          );
          navigation.navigate('EntryInput', {
            subcategory: sub,
            category: cat,
            dateKey: selectedKey,
          });
        }}
      />

      {/* Income source shortcuts for selected day */}
      {categories.some(c => c.subcategories.length > 0) && (
        <>
          <Text style={styles.addLabel}>Add earnings for this day</Text>
          {categories.map(cat => (
            <CategorySection
              key={cat.id}
              category={cat}
              dayEntries={selectedEntries}
              onSubcategoryPress={(sub, category) =>
                navigation.navigate('EntryInput', { subcategory: sub, category, dateKey: selectedKey })
              }
            />
          ))}
        </>
      )}
    </ScrollView>

      {/* ── App info modal ─────────────────────────────────────────────── */}
      <Modal
        visible={infoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoVisible(false)}
      >
        <TouchableOpacity
          style={styles.infoOverlay}
          activeOpacity={1}
          onPress={() => setInfoVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.infoCard}>
            <Text style={styles.infoTitle}>Hustle & Glow ✨</Text>
            <Text style={styles.infoBody}>
              Love using this app? You can get the full version and support the developer in the Ko-fi store!
            </Text>
            <TouchableOpacity
              style={styles.infoLink}
              onPress={() => Linking.openURL('https://ko-fi.com/nextrightthing')}
            >
              <Text style={styles.infoLinkText}>Get it on Ko-fi →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.infoDismiss}
              onPress={() => setInfoVisible(false)}
            >
              <Text style={styles.infoDismissText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// Parse YYYY-MM-DD back to a Date (needed for .getDate())
function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const CELL_SIZE = 46;

const styles = StyleSheet.create({
  // ── Navigation ────────────────────────────────────────────────────────
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  navBtn: {
    padding: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    minWidth: 36,
    alignItems: 'center',
  },
  navArrow: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: '600',
    lineHeight: 24,
  },
  monthTitle: {
    fontSize: font.lg,
    fontWeight: '800',
    color: colors.primaryDeep,
  },

  // ── Monthly summary card ──────────────────────────────────────────────
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summarySep: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  summaryLabel: {
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryGross: {
    fontSize: font.md,
    fontWeight: '700',
    color: colors.textDark,
  },
  summaryTax: {
    fontSize: font.md,
    fontWeight: '700',
    color: colors.negativeText,
  },
  summaryNet: {
    fontSize: font.md,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  summaryHoursRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.cardPink,
  },
  summaryHoursText: {
    fontSize: font.sm,
    color: colors.textMid,
    fontWeight: '600',
  },

  // ── Calendar ──────────────────────────────────────────────────────────
  calCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekDay: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE + 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    paddingVertical: 2,
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  cellSelected: {
    backgroundColor: colors.primaryDeep,
  },
  cellNum: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.textDark,
  },
  cellNumToday: {
    color: colors.primaryDeep,
    fontWeight: '800',
  },
  cellNumSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  cellAmt: {
    fontSize: 8,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 1,
  },
  cellAmtSelected: {
    color: colors.gold,
  },
  cellEmpty: {
    height: 10,
  },

  // ── Selected day ──────────────────────────────────────────────────────
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  selectedDate: {
    fontSize: font.md,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  selectedTotal: {
    fontSize: font.lg,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  addLabel: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.textMid,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },

  // ── Info modal ────────────────────────────────────────────────────────
  infoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45,10,31,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadow.md,
  },
  infoTitle: {
    fontSize: font.xl,
    fontWeight: '800',
    color: colors.primaryDeep,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  infoBody: {
    fontSize: font.md,
    color: colors.textMid,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  infoLink: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    ...shadow.md,
  },
  infoLinkText: {
    color: '#FFFFFF',
    fontSize: font.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoDismiss: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  infoDismissText: {
    color: colors.textMuted,
    fontSize: font.sm,
    fontWeight: '600',
  },
});
