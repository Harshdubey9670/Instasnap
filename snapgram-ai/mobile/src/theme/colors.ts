/**
 * InstaSnap Mobile — Colour Token System
 * ─────────────────────────────────────────────────────────────────────────────
 * Mirror of: snapgram-ai/client/src/styles/index.css
 *
 * IMPORTANT: Never hardcode hex colour values in components.
 * Always import from this file so mobile stays in sync with the web.
 *
 * Usage:
 *   import { getColors, primary, secondary } from "../../theme/colors";
 *   const colors = getColors(isDark);
 *   // colors.bgBase, colors.textPrimary, etc.
 */

// ─── Primary Palette (Electric Purple — AI Vibe) ─────────────────────────────
// Web: --color-primary-*
export const primary = {
  50:  "#faf5ff",
  100: "#f3e8ff",
  200: "#e9d5ff",
  300: "#d8b4fe",
  400: "#c084fc",  // used in dark-mode active icon tints
  500: "#a855f7",  // main brand purple
  600: "#9333ea",
  700: "#7e22ce",
  800: "#6b21a8",
  900: "#581c87",
} as const;

// ─── Secondary Palette (Hot Pink — Instagram Vibe) ───────────────────────────
// Web: --color-secondary-*
export const secondary = {
  50:  "#fdf2f8",
  100: "#fce7f3",
  200: "#fbcfe8",
  300: "#f9a8d4",
  400: "#f472b6",
  500: "#ec4899",  // notification dots, gradients, CTA accents
  600: "#db2777",
  700: "#be185d",
  800: "#9d174d",
  900: "#831843",
} as const;

// ─── Dark Mode Semantic Tokens ────────────────────────────────────────────────
// Web: .dark { ... }
export const dark = {
  bgBase:         "#0a0510",                    // web: --bg-base dark (OLED)
  bgSurface:      "#130a1c",                    // web: --bg-surface dark
  bgSurfaceHover: "#1e112c",                    // web: --bg-surface-hover dark
  textPrimary:    "#f8fafc",                    // web: --text-primary dark
  textSecondary:  "#94a3b8",                    // web: --text-secondary dark
  borderSoft:     "#2d1b3b",                    // web: --border-soft dark
  glassBg:        "rgba(19, 10, 28, 0.50)",     // web: --glass-bg dark
  glassBorder:    "rgba(168, 85, 247, 0.15)",   // web: --glass-border dark
} as const;

// ─── Light Mode Semantic Tokens ───────────────────────────────────────────────
// Web: :root { ... }
export const light = {
  bgBase:         "#f8fafc",                    // web: --bg-base light
  bgSurface:      "#ffffff",                    // web: --bg-surface light
  bgSurfaceHover: "#f1f5f9",                    // web: --bg-surface-hover light
  textPrimary:    "#0f172a",                    // web: --text-primary light
  textSecondary:  "#64748b",                    // web: --text-secondary light
  borderSoft:     "#e2e8f0",                    // web: --border-soft light
  glassBg:        "rgba(255, 255, 255, 0.70)",  // web: --glass-bg light
  glassBorder:    "rgba(255, 255, 255, 0.40)",  // web: --glass-border light
} as const;

// ─── Shared / Static Colours (same in both modes) ────────────────────────────
export const shared = {
  error:        "#ef4444",  // red-500 — validation errors, badge bg
  success:      "#22c55e",  // green-500 — online indicator
  warning:      "#f59e0b",  // amber-500
  notificationBadge: "#ef4444",
  onlineIndicator:   "#22c55e",
} as const;

// ─── Gradient Colour Stops (for expo-linear-gradient) ────────────────────────
// Web equivalents:
//   hero-gradient  → linear-gradient(135deg, primary-500, secondary-500)
//   ai-gradient    → linear-gradient(to right, primary-400, secondary-400, primary-500)
//   logo-gradient  → from-yellow-400 via-rose-500 to-purple-600
export const heroGradient   = ["#a855f7", "#ec4899"] as const;
export const aiGradient     = ["#c084fc", "#a855f7", "#ec4899"] as const;
export const logoGradient   = ["#facc15", "#f43f5e", "#9333ea"] as const;  // sidebar brand
export const glowPurple     = "rgba(168, 85, 247, 0.4)";
export const glowPink       = "rgba(236, 72, 153, 0.4)";

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
