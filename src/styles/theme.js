// The entire visual identity of Hustle & Glow lives here.
// Think: press-on nails with gold charms — soft, maximalist, kawaii but digestible.
// Change these values to retheme the whole app at once.

export const colors = {
  // App background
  bg: '#FFF0F5',          // lavender blush

  // Cards
  card: '#FFFFFF',
  cardPink: '#FFF5F9',    // used for card header rows

  // Brand pinks
  primary: '#FF6EB4',     // main hot pink — buttons, accents
  primaryDeep: '#C2185B', // deep pink — headers, large text
  primaryLight: '#FFD1E8',// light pink — borders, badges

  // Gold
  gold: '#F5C842',        // warm gold — hero numbers
  goldLight: '#FFF9E6',   // very light gold — dollar badge bg

  // Text
  textDark: '#2D0A1F',    // near-black with a plum hint
  textMid: '#7A3D5C',     // medium, secondary text
  textMuted: '#B07090',   // hints, placeholders, rates

  // Semantic
  positive: '#6BD5A0',    // soft mint — could use for positive notes
  negative: '#FF8FAB',    // soft rose — taxes / deductions
  negativeText: '#C0003C',// darker red for tax amounts

  // Borders
  border: '#FFD1E8',

  // Tab bar
  tabActive: '#C2185B',
  tabInactive: '#C4A0B4',
  tabBg: '#FFFFFF',
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const font = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 38,
};

// Pink-tinted shadows — give cards a soft, lifted feel
export const shadow = {
  sm: {
    shadowColor: '#FF6EB4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#E91E8C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#C2185B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
};
