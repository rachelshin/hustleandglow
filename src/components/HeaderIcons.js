// SVG-based icon components for navigation headers.
// react-native-svg renders immediately (no async font loading),
// so these never show as a blank square in React Navigation headers.

import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

/**
 * Export / download icon: downward arrow into a tray.
 * Used for "Export CSV" on the Month screen.
 */
export function ExportIcon({ size = 22, color = '#C2185B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Arrow shaft */}
      <Path
        d="M12 3v11"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Arrowhead */}
      <Path
        d="M7 10l5 5 5-5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Tray */}
      <Path
        d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Info icon: circle outline with a lowercase "i".
 */
export function InfoIcon({ size = 22, color = '#C2185B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
      <Path d="M12 11v5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={12} cy={7.5} r={1} fill={color} />
    </Svg>
  );
}

/**
 * Classic sign-out icon: open door frame + right-pointing arrow.
 */
export function SignOutIcon({ size = 22, color = '#C2185B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Door frame (open bracket) */}
      <Path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrow shaft */}
      <Path
        d="M21 12H9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrowhead */}
      <Path
        d="M16 7l5 5-5 5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Gear / settings icon: cog outline with a centre hub.
 * Used for the Settings screen entry point in the Home header.
 */
export function SettingsIcon({ size = 22, color = '#C2185B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Cog body — 8-tooth rounded gear */}
      <Path
        d="M12 2.5l1.5 2.2 2.6-.6.4 2.6 2.4 1.1-1 2.4 1.6 2.1-2 1.7.5 2.6-2.6.3L14 22l-2-1.7L10 22l-1.4-2.3-2.6-.3.5-2.6-2-1.7 1.6-2.1-1-2.4 2.4-1.1.4-2.6 2.6.6L12 2.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      {/* Centre hub */}
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

/**
 * Sliders / manage icon: three horizontal lines, each with a movable knob.
 * Used for "Manage Sources" / settings.
 */
export function ManageIcon({ size = 22, color = '#C2185B', bg = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top line + knob at left */}
      <Path d="M4 6h16"  stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Circle cx={8}  cy={6}  r={2.6} fill={bg} stroke={color} strokeWidth={1.9} />

      {/* Middle line + knob at right */}
      <Path d="M4 12h16" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Circle cx={16} cy={12} r={2.6} fill={bg} stroke={color} strokeWidth={1.9} />

      {/* Bottom line + knob at centre-left */}
      <Path d="M4 18h16" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Circle cx={10} cy={18} r={2.6} fill={bg} stroke={color} strokeWidth={1.9} />
    </Svg>
  );
}
