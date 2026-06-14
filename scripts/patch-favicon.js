/**
 * Post-build patch for dist/index.html.
 * Expo's web export regenerates index.html from scratch each time, so custom
 * tags don't survive the build.  This script runs after `expo export` and:
 *
 *   1. Injects the SVG favicon (base64) before </head>
 *   2. Copies assets/icon.png  → dist/icon.png  (needed by the PWA manifest)
 *   3. Copies scripts/manifest.json → dist/manifest.json
 *   4. Injects <link rel="manifest"> before </head>
 *   5. Injects the apple-mobile-web-app-* meta tags (iOS home-screen PWA) before </head>
 *
 * Usage: node scripts/patch-favicon.js
 * Via package.json: "deploy": "expo export --platform web && node scripts/patch-favicon.js"
 */

const fs   = require('fs');
const path = require('path');

const ROOT      = path.join(__dirname, '..');
const DIST_HTML = path.join(ROOT, 'dist', 'index.html');

// ── 1. Favicon ────────────────────────────────────────────────────────────────

const FAVICON_B64 =
  'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAz' +
  'MiI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iI0U5MUU4QyIvPjxw' +
  'YXRoIGQ9Ik0xNiA0IEwxOSAxMyBMMjggMTYgTDE5IDE5IEwxNiAyOCBMMTMgMTkgTDQgMTYgTDEz' +
  'IDEzIFoiIGZpbGw9IiNGRkYxNzYiLz48Y2lyY2xlIGN4PSIyNSIgY3k9IjciIHI9IjEuOCIgZmls' +
  'bD0id2hpdGUiIG9wYWNpdHk9IjAuNzUiLz48Y2lyY2xlIGN4PSI4IiBjeT0iMjUiIHI9IjEuMiIg' +
  'ZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuNTUiLz48L3N2Zz4=';

// ── 2. Icon + manifest ────────────────────────────────────────────────────────

const ICON_SRC      = path.join(ROOT, 'assets', 'icon.png');
const ICON_DEST     = path.join(ROOT, 'dist',   'icon.png');
const MANIFEST_SRC  = path.join(__dirname, 'manifest.json');
const MANIFEST_DEST = path.join(ROOT, 'dist', 'manifest.json');

// ── Run ───────────────────────────────────────────────────────────────────────

if (!fs.existsSync(DIST_HTML)) {
  console.error('❌  dist/index.html not found — run expo export first.');
  process.exit(1);
}

let html = fs.readFileSync(DIST_HTML, 'utf8');

// Favicon
if (!html.includes('image/svg+xml')) {
  html = html.replace(
    '</head>',
    `  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${FAVICON_B64}" />\n  <meta name="theme-color" content="#E91E8C" />\n</head>`
  );
  console.log('✅  Favicon injected');
} else {
  console.log('ℹ️   Favicon already present');
}

// Manifest link
if (!html.includes('rel="manifest"')) {
  html = html.replace(
    '</head>',
    `  <link rel="manifest" href="/manifest.json" />\n</head>`
  );
  console.log('✅  Manifest link injected');
} else {
  console.log('ℹ️   Manifest link already present');
}

// Apple iOS PWA meta tags — required for a proper full-screen home-screen
// install (capable + status bar style + title) plus the touch icon. Points at
// /icon.png, which is copied into dist/ below (there is no apple-touch-icon.png).
if (!html.includes('apple-mobile-web-app-capable')) {
  html = html.replace(
    '</head>',
    `  <meta name="apple-mobile-web-app-capable" content="yes" />\n` +
    `  <meta name="mobile-web-app-capable" content="yes" />\n` +
    `  <meta name="apple-mobile-web-app-status-bar-style" content="default" />\n` +
    `  <meta name="apple-mobile-web-app-title" content="Hustle &amp; Glow" />\n` +
    `  <link rel="apple-touch-icon" href="/icon.png" />\n</head>`
  );
  console.log('✅  Apple PWA meta tags injected');
} else {
  console.log('ℹ️   Apple PWA meta tags already present');
}

// Viewport — add viewport-fit=cover so iOS standalone PWAs expose the real
// env(safe-area-inset-*) values. Without it those insets resolve to 0, so
// react-navigation / useSafeAreaInsets can't pad around the home indicator and
// the bottom tab bar sits under it. Expo's generated tag has no viewport-fit.
if (/viewport-fit\s*=\s*cover/i.test(html)) {
  console.log('ℹ️   viewport-fit=cover already present');
} else if (/<meta\s+name="viewport"\s+content="[^"]*"/i.test(html)) {
  html = html.replace(
    /(<meta\s+name="viewport"\s+content=")([^"]*)(")/i,
    (_m, pre, content, post) => `${pre}${content}, viewport-fit=cover${post}`
  );
  console.log('✅  viewport-fit=cover added');
} else {
  console.warn('⚠️   viewport meta not found — viewport-fit=cover NOT added');
}

fs.writeFileSync(DIST_HTML, html, 'utf8');

// Copy icon
if (fs.existsSync(ICON_SRC)) {
  fs.copyFileSync(ICON_SRC, ICON_DEST);
  console.log('✅  icon.png copied to dist/');
}

// Copy manifest
fs.copyFileSync(MANIFEST_SRC, MANIFEST_DEST);
console.log('✅  manifest.json copied to dist/');
