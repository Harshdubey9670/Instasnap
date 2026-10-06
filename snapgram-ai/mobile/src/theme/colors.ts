/**
 * InstaSnap Mobile — Colour Token System
 * ─────────────────────────────────────────────────────────────────────────────
 * Mirror of: snapgram-ai/client/src/styles/index.css
 *
 * IMPORTANT: Never hardcode hex colour values in components.
 * Always import from this file so mobile stays in sync with the web.
 *
 * Usage:
 *   import { getColors, primary, secondary, spatial } from "../../theme/colors";
 *   const colors = getColors(isDark);
 *   // colors.bgBase, colors.textPrimary, etc.
 */

// ─── Spatial Raw Tokens (Warm Cream / Orange Reference) ─────────────────────
export const spatial = {
  bgDeep:         "#F5F0EB",
  bg:             "#EDE7DE",
  surface:        "#FFFFFF",
  accent:         "#FF6B35",
  warm:           "#FF8C5A",
  glassHighlight: "#FFFFFF",
  text:           "#1A1A1A",
  textMuted:      "rgba(26, 26, 26, 0.60)",
  border:         "rgba(0, 0, 0, 0.08)",
  borderStrong:   "rgba(0, 0, 0, 0.14)",
  glass:          "rgba(255, 255, 255, 0.85)",
  glassStrong:    "rgba(255, 255, 255, 0.95)",
} as const;

// ─── Primary Palette (Vibrant Orange) ────────────────────────────────────────
// Web: --color-primary-*
export const primary = {
  50:  "#fff4ef",
  100: "#ffe4d6",
  200: "#ffc9ad",
  300: "#ffad84",
  400: "#ff8c5a",  // active icons, subtle orange highlights
  500: "#FF6B35",  // main brand orange
  600: "#e55a27",  // deep orange
  700: "#bf4318",  // darker orange
  800: "#963410",  // rich dark orange
  900: "#6b230a",
} as const;

// ─── Secondary Palette (Rose / Warm Accent) ──────────────────────────────────
// Web: --color-secondary-*
export const secondary = {
  50:  "#fff1f2",
  100: "#ffe4e6",
  200: "#fecdd3",
  300: "#fda4af",
  400: "#fb7185",
  500: "#f43f5e",  // notification badges, secondary accents
  600: "#e11d48",
  700: "#be123c",
  800: "#9f1239",
  900: "#881337",
} as const;

// ─── Dark Mode Semantic Tokens (OLED Spatial Red) ────────────────────────────
// Web: .dark { ... }
export const dark = {
  bgBase:         "#620d0b",                    // deep environmental red
  bgSurface:      "rgba(130, 25, 22, 0.52)",    // translucent red glass
  bgSurfaceHover: "rgba(160, 35, 30, 0.62)",
  textPrimary:    "#fff7f5",
  textSecondary:  "rgba(255, 247, 245, 0.72)",
  borderSoft:     "rgba(255, 255, 255, 0.12)",
  glassBg:        "rgba(130, 25, 22, 0.48)",
  glassBorder:    "rgba(238, 117, 101, 0.20)",
} as const;

// ─── Light Mode Semantic Tokens (Warm Cream + White Cards) ───────────────────
// Web: :root { ... }
export const light = {
  bgBase:         "#F5F0EB",                   // warm cream background
  bgSurface:      "#FFFFFF",                   // pure white card surface
  bgSurfaceHover: "#F0EBE5",                   // cream hover state
  textPrimary:    "#1A1A1A",                   // near-black text
  textSecondary:  "#9B9B9B",                   // medium gray secondary text
  borderSoft:     "rgba(0, 0, 0, 0.08)",       // subtle light border
  glassBg:        "rgba(255, 255, 255, 0.85)", // white glass
  glassBorder:    "rgba(0, 0, 0, 0.07)",       // very subtle border
} as const;

// ─── Shared / Static Colours (same in both modes) ────────────────────────────
export const shared = {
  error:        "#ef4444",  // red-500 — validation errors, badge bg
  success:      "#22c55e",  // green-500 — online indicator
  warning:      "#f59e0b",  // amber-500
  notificationBadge: "#f43f5e",
  onlineIndicator:   "#22c55e",
} as const;

// ─── Gradient Colour Stops (for expo-linear-gradient) ────────────────────────
export const heroGradient   = ["#FF6B35", "#E55A27"] as const;
export const aiGradient     = ["#FF8C5A", "#FF6B35", "#E55A27"] as const;
export const logoGradient   = ["#FFB347", "#FF8C5A", "#FF6B35"] as const;
export const storyGradient  = ["#FF6B35", "#FF8C5A", "#FFB347"] as const;
export const glowPurple     = "rgba(255, 107, 53, 0.40)";
export const glowPink       = "rgba(255, 107, 53, 0.40)";
export const glowCoral      = "rgba(255, 107, 53, 0.40)";

// ─── High-Contrast Mode (matches web .high-contrast) ─────────────────────────
export const highContrastDark = {
  bgBase:        "#000000",
  bgSurface:     "#000000",
  textPrimary:   "#ffffff",
  textSecondary: "#e2e8f0",
  borderSoft:    "#ffffff",
  accent:        "#ffff00",
} as const;

export const highContrastLight = {
  bgBase:        "#ffffff",
  bgSurface:     "#ffffff",
  textPrimary:   "#000000",
  textSecondary: "#0f172a",
  borderSoft:    "#000000",
  accent:        "#0000ff",
} as const;

// ─── Type Exports ──────────────────────────────────────────────────────────────
export type ThemeColors = typeof dark;
export type PrimaryScale = typeof primary;
export type SecondaryScale = typeof secondary;

// ─── Main Helper ──────────────────────────────────────────────────────────────
/**
 * Returns the correct semantic colour set for the current theme.
 *
 * @example
 * const { effectiveTheme } = useTheme();
 * const colors = getColors(effectiveTheme === "dark");
 * // style={{ backgroundColor: colors.bgBase }}
 */
export function getColors(isDark: boolean): ThemeColors {
  return isDark ? dark : (light as unknown as ThemeColors);
}
