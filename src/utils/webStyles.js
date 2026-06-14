// Global web-only CSS, injected at runtime.
//
// WHY THIS LIVES HERE (and not in web/index.html):
//   This is a classic single-page Expo web app. `expo export --platform web`
//   regenerates dist/index.html from scratch on every build, so any <style>
//   added to web/index.html is silently dropped and never ships. (The favicon
//   and manifest only survive because scripts/patch-favicon.js re-injects them
//   after the build.) Injecting the CSS from JS at runtime guarantees it is
//   always present — in the dev server, the exported PWA, and on iOS/Android
//   home-screen installs — and can't be wiped by a regenerated template.
//
// WHAT IT DOES:
//   - Kills the browser's default blue focus ring on text inputs and on
//     react-native-web's focusable <div> touchables.
//   - Enforces 16px minimum font-size on inputs so iOS PWA never auto-zooms
//     the viewport when a field is focused.
//   - Restyles the system-blue focus pill inside <input type="date"> segments
//     (datetimepicker renders these on web) to the app's pink theme.

import { Platform } from 'react-native';

const CSS = `
  /* No blue focus ring — anywhere */
  input, textarea, select { outline: none !important; box-shadow: none !important; }
  *:focus, *:focus-visible { outline: none !important; }

  /* iOS PWA auto-zooms if input font-size < 16px */
  input, textarea { font-size: 16px !important; }

  /* iOS highlights the focused date segment with a system-blue pill (not an
     outline) — restyle it to the app theme instead. */
  input[type="date"]::-webkit-datetime-edit-day-field:focus,
  input[type="date"]::-webkit-datetime-edit-month-field:focus,
  input[type="date"]::-webkit-datetime-edit-year-field:focus {
    background-color: rgba(233, 30, 140, 0.18);
    color: inherit;
    outline: none;
  }
`;

export default function injectWebStyles() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById('hg-global-styles')) return; // idempotent

  const style = document.createElement('style');
  style.id = 'hg-global-styles';
  style.textContent = CSS;
  document.head.appendChild(style);
}
