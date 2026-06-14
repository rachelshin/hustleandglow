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
  apiKey: "AIzaSyBh1PBdxWWIEDCVUrGmaj-UWIbpuToZVsY",
  authDomain: "hustle-and-glow.firebaseapp.com",
  projectId: "hustle-and-glow",
  storageBucket: "hustle-and-glow.firebasestorage.app",
  messagingSenderId: "1843920814",
  appId: "1:1843920814:web:5fbc50ac8583805aedd23f"
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

/**
 * Upgrade the current guest (anonymous) user to a real Google account.
 *
 * linkWithPopup keeps the SAME uid, so all the guest's Firestore data carries
 * over with zero migration. If that Google account already has its own account
 * (auth/credential-already-in-use), we can't merge — we fall back to signing
 * into the existing account instead (the guest's anonymous data is left behind).
 */
export async function linkWithGoogle() {
  if (Platform.OS !== 'web') throw { code: 'google/native-not-configured' };

  const {
    GoogleAuthProvider,
    linkWithPopup,
    signInWithPopup,
  } = require('firebase/auth');
  const provider = new GoogleAuthProvider();

  try {
    return await linkWithPopup(auth.currentUser, provider);
  } catch (e) {
    if (e.code === 'auth/credential-already-in-use') {
      // That Google account is already registered — sign into it instead.
      return signInWithPopup(auth, provider);
    }
    throw e;
  }
}
