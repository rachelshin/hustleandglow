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

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TouchableOpacity } from 'react-native';

import { AppProvider, useApp } from './src/context/AppContext';
import IOSInstallBanner from './src/components/IOSInstallBanner';
import HomeScreen            from './src/screens/HomeScreen';
import HypeScreen            from './src/screens/HypeScreen';
import MonthScreen           from './src/screens/MonthScreen';
import EntryInputScreen      from './src/screens/EntryInputScreen';
import CategoryManagerScreen from './src/screens/CategoryManagerScreen';
import SignInScreen          from './src/screens/SignInScreen';
import { colors, font } from './src/styles/theme';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// Shared header style applied to all stack screens
const headerStyle = {
  headerStyle:       { backgroundColor: colors.card },
  headerTintColor:   colors.primaryDeep,
  headerTitleStyle:  { fontWeight: '800', fontSize: font.lg },
  headerTitleAlign:  'center',
  headerShadowVisible: false,
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
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
          paddingBottom:   14,
          height:          70,
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
        component={HomeScreen}
        options={{ title: 'Today', headerTitle: 'Today' }}
      />
      <Tab.Screen
        name="Hype"
        component={HypeScreen}
        options={{ title: 'Hype', headerTitle: 'Hype 💫' }}
      />
      <Tab.Screen
        name="Month"
        component={MonthScreen}
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

function LoadingScreen({ message }) {
  return (
    <View style={shell.loading}>
      <Text style={shell.loadingEmoji}>✨</Text>
      <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 16 }} />
      {message ? <Text style={shell.loadingText}>{message}</Text> : null}
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
  loadingText: {
    marginTop: 12,
    fontSize: font.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});

// ── App shell — auth gate ─────────────────────────────────────────────────────

function AppShell() {
  const { user, authChecked } = useApp();

  // Firebase hasn't resolved auth state yet
  if (!authChecked) {
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
    // Fill the whole browser viewport
    flex: 1,
    minHeight: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  phone: {
    width: '100%',
    maxWidth: 430,
    height: '100vh',
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
        <AppProvider>
          <AppShell />
        </AppProvider>
        <IOSInstallBanner />
      </GestureHandlerRootView>
    </DesktopFrame>
  );
}
