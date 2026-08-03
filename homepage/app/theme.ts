// Single source of truth for the Steward palette, mirrored in the CSS
// custom properties defined in globals.css. Cold, precise, engineered —
// no amber, no warm tones.

export const palette = {
  void: "#02070b",
  deepNavy: "#06111a",
  panelNavy: "#081722",
  cyan: "#4dd9e8",
  teal: "#2dd4bf",
  softCore: "#dffcff",
  mutedText: "#87a9b4",
  dimText: "#48616c",
  danger: "#ff6b7a"
} as const;

export const statusColor = {
  nominal: palette.teal,
  active: palette.cyan,
  attention: palette.danger,
  inactive: palette.dimText
} as const;
