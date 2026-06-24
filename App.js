// Root of the app. Sets up:
//   1. GestureHandlerRootView — required by react-native-gesture-handler
//   2. AppProvider — shared state (auth + data) for all screens
//   3. AppShell — reads auth state and shows either:
//        • a loading spinner   (Firebase is still checking / cloud syncing)
//        • the sign-in screen  (not logged in)
//        • the full app        (logged in and synced)
//
// Navigation structure (when logged in):
//   RootStack
//   ├── Tabs (bottom tab bar, no header)
//   │   ├── Home
//   │   ├── Hype
//   │   └── Month
//   ├── EntryInput      (navigated to from any tab)
//   └── CategoryManager (navigated to from Home's "Add Sites" link)

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';

import withSwipeTabs from './src/components/SwipeTabs';
import { AppProvider, useApp } from './src/context/AppContext';
import injectWebStyles from './src/utils/webStyles';
import IOSInstallBanner from './src/components/IOSInstallBanner';
import HomeScreen            from './src/screens/HomeScreen';
import HypeScreen            from './src/screens/HypeScreen';
import MonthScreen           from './src/screens/MonthScreen';
import EntryInputScreen      from './src/screens/EntryInputScreen';
import CategoryManagerScreen from './src/screens/CategoryManagerScreen';
import SettingsScreen        from './src/screens/SettingsScreen';
import SignInScreen          from './src/screens/SignInScreen';
import { colors, font } from './src/styles/theme';

// Inject global web CSS (kills the blue focus ring, enforces 16px inputs).
// No-op on native. See src/utils/webStyles.js for why this runs at runtime.
injectWebStyles();

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// Wrap each tab screen for horizontal swipe navigation. Created ONCE at module
// scope — building these inside TabNavigator's render would hand <Tab.Screen> a
// brand-new component type every render and remount the screen (losing state).
const HomeTab  = withSwipeTabs(HomeScreen);
const HypeTab  = withSwipeTabs(HypeScreen);
const MonthTab = withSwipeTabs(MonthScreen);

// Shared header style applied to all stack screens
const headerStyle = {
  // height trims the chunky default header (≈64) to a tighter bar. Applies on
  // web/PWA (the verified target) and Android; native-stack ignores height on
  // iOS native. NOTE: the white strip above the header in the installed PWA is
  // the iOS status bar (clock/battery/Dynamic Island), not padding — it's OS
  // chrome and can't be removed without black-translucent + viewport-fit=cover.
  headerStyle:       { backgroundColor: colors.card, height: 48 },
  headerTintColor:   colors.primaryDeep,
  headerTitleStyle:  { fontWeight: '800', fontSize: font.lg },
  headerTitleAlign:  'center',
  headerShadowVisible: false,
};

function TabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Subtle horizontal slide + cross-fade when changing tabs. Applies to
        // both tab taps and the swipe gesture (which just calls navigate()).
        animation: 'shift',
        // Snappier than the default 150ms inOut preset, which eases slowly at
        // both ends and feels "sticky". Faster + ease-out lands quickly.
        transitionSpec: {
          animation: 'timing',
          config: { duration: 110, easing: Easing.out(Easing.ease) },
        },
        tabBarIcon: ({ focused }) => {
          const icons = { Home: '✨', Hype: '⭐', Month: '📅' };
          return (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
              {icons[route.name]}
            </Text>
          );
        },
        tabBarActiveTintColor:   colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBg,
          borderTopColor:  colors.border,
          borderTopWidth:  1.5,
          // Add the device's bottom safe-area inset so labels clear the Android
          // gesture/nav bar (and iOS home indicator). On web without
          // viewport-fit=cover the inset is 0, so the PWA is unchanged.
          paddingBottom:   14 + insets.bottom,
          height:          70 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize:   font.xs,
          fontWeight: '600',
        },
        ...headerStyle,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeTab}
        options={{ title: 'Today', headerTitle: 'Today' }}
      />
      <Tab.Screen
        name="Hype"
        component={HypeTab}
        options={{ title: 'Hype', headerTitle: 'Hype 💫' }}
      />
      <Tab.Screen
        name="Month"
        component={MonthTab}
        options={{ title: 'Month' }}
      />
    </Tab.Navigator>
  );
}

const navStyles = StyleSheet.create({
  backBtn: {
    paddingRight: 8,
    marginLeft: 12,
  },
  backText: {
    color: colors.primaryDeep,
    fontSize: 17,
    fontWeight: '600',
  },
});

// ── Loading screen ────────────────────────────────────────────────────────────

function LoadingScreen() {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={shell.loading}>
      <Animated.Text style={[shell.loadingEmoji, { opacity }]}>✨</Animated.Text>
    </View>
  );
}

const shell = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 48,
  },
});

// ── App shell — auth gate ─────────────────────────────────────────────────────

function AppShell() {
  const { user, authChecked } = useApp();
  const [minDelayDone, setMinDelayDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinDelayDone(true), 1000);
    return () => clearTimeout(t);
  }, []);

  if (!authChecked || !minDelayDone) {
    return <LoadingScreen />;
  }

  // Not logged in → show sign-in / sign-up screen (no NavigationContainer needed)
  if (!user) {
    return <SignInScreen />;
  }

  // Logged in — show the app immediately, hooks load from local storage
  // while Firestore subscriptions refresh data in the background
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Tab bar — each tab manages its own header */}
        <Stack.Screen
          name="Tabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />

        {/* Entry input — shown when tapping an income source or edit pencil */}
        <Stack.Screen
          name="EntryInput"
          component={EntryInputScreen}
          options={({ route, navigation }) => ({
            title: route.params?.subcategory?.name ?? 'Add Entry',
            ...headerStyle,
            headerLeft: () => (
              <TouchableOpacity onPress={() => navigation.goBack()} style={navStyles.backBtn}>
                <Text style={navStyles.backText}>‹ Back</Text>
              </TouchableOpacity>
            ),
          })}
        />

        {/* Category manager — shown via "Add Sites" link on Home */}
        <Stack.Screen
          name="CategoryManager"
          component={CategoryManagerScreen}
          options={({ navigation }) => ({
            title: 'Manage Sources',
            ...headerStyle,
            headerLeft: () => (
              <TouchableOpacity onPress={() => navigation.goBack()} style={navStyles.backBtn}>
                <Text style={navStyles.backText}>‹ Back</Text>
              </TouchableOpacity>
            ),
          })}
        />

        {/* Settings — shown via the gear icon in the Home header */}
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={({ navigation }) => ({
            title: 'Settings',
            ...headerStyle,
            headerLeft: () => (
              <TouchableOpacity onPress={() => navigation.goBack()} style={navStyles.backBtn}>
                <Text style={navStyles.backText}>‹ Back</Text>
              </TouchableOpacity>
            ),
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ── Desktop frame (web only) ──────────────────────────────────────────────────
// On desktop browsers the app is centred in a 430 px phone-shaped container
// sitting on a deep branded gradient background.  On native it's a no-op.

function DesktopFrame({ children }) {
  if (Platform.OS !== 'web') return children;
  return (
    <LinearGradient
      colors={['#3D0A20', '#6B1040', '#1A0010']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={frame.outer}
    >
      {/* Decorative blobs — purely cosmetic */}
      <View style={frame.blobTopLeft}  pointerEvents="none" />
      <View style={frame.blobBotRight} pointerEvents="none" />

      <View style={frame.phone}>
        {children}
      </View>
    </LinearGradient>
  );
}

const frame = StyleSheet.create({
  outer: {
    // Fill the whole browser viewport. Use dvh (dynamic viewport height), not
    // vh: on Android PWA `100vh` is the LARGEST viewport and includes the strip
    // behind the system nav/gesture bar, so a `100vh` child overflows the
    // visible area and its bottom (the tab bar) gets clipped by overflow:hidden.
    flex: 1,
    minHeight: '100dvh',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  phone: {
    width: '100%',
    maxWidth: 430,
    height: '100dvh',
    overflow: 'hidden',
    // Subtle elevation so it floats over the background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 40,
  },
  blobTopLeft: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(233,30,140,0.18)',
  },
  blobBotRight: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(233,30,140,0.12)',
  },
});

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <DesktopFrame>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AppProvider>
            <AppShell />
          </AppProvider>
          <IOSInstallBanner />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </DesktopFrame>
  );
}
