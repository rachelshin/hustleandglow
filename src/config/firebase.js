// Firebase initialization.
//
// ── SETUP STEPS ──────────────────────────────────────────────────────────────
// 1. Go to https://console.firebase.google.com and create a project.
// 2. Add a Web app to the project (click </> in Project Overview).
// 3. Copy the firebaseConfig object and paste it below, replacing the
//    placeholder values.
// 4. In Firebase Console → Authentication → Sign-in method → enable
//    "Email/Password".
// 5. In Firebase Console → Firestore Database → Create database (start in
//    production mode), then go to Rules and paste:
//
//      rules_version = '2';
//      service cloud.firestore {
//        match /databases/{database}/documents {
//          match /users/{userId}/{document=**} {
//            allow read, write: if request.auth != null
//                               && request.auth.uid == userId;
//          }
//        }
//      }
//
// ─────────────────────────────────────────────────────────────────────────────

import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Auth persistence differs between web and native:
//   • Web (Netlify): use browser localStorage via getAuth() default
//   • Native (iOS/Android): use AsyncStorage so sessions survive app restarts
let auth;
if (Platform.OS === 'web') {
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
} else {
  const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { auth };
export const db = getFirestore(app);

/**
 * Sign in with Google.
 *
 * On web (Netlify): opens a Google popup — no SHA-1 or extra setup needed.
 * On native (iOS/Android): not yet wired up; requires expo-auth-session +
 *   Google OAuth credentials. SHA-1 is only needed for production Android
 *   standalone builds, not for development in Expo Go.
 */
export async function signInWithGoogle() {
  if (Platform.OS === 'web') {
    const { GoogleAuthProvider, signInWithPopup } = require('firebase/auth');
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  } else {
    // Native Google Sign-In requires additional setup (expo-auth-session).
    // Throw a user-friendly error so SignInScreen can show it gracefully.
    throw { code: 'google/native-not-configured' };
  }
}
