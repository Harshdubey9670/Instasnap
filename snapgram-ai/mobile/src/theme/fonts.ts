/**
 * InstaSnap Mobile — Font Token System
 * ─────────────────────────────────────────────────────────────────────────────
 * Mirror of: snapgram-ai/client/src/styles/index.css
 *   --font-sans: "Inter", "Roboto", "Outfit", sans-serif;
 *
 * Requires: @expo-google-fonts/inter  @expo-google-fonts/outfit  expo-font
 *   Install: npx expo install @expo-google-fonts/inter @expo-google-fonts/outfit expo-font
 *
 * NOTE: These fontFamily strings must match exactly what is loaded in app/_layout.tsx
 *       via useFonts({ Inter_400Regular, ... }).
 *
 * Usage:
 *   import { fonts } from "../../theme/fonts";
 *   style={{ fontFamily: fonts.bold }}
 */

// ─── Inter (primary UI font) ──────────────────────────────────────────────────
export const fonts = {
  // Regular body text
  regular:    "Inter_400Regular",

  // Medium weight — button labels, nav labels, slightly emphasised text
  medium:     "Inter_500Medium",

  // Semibold — form labels, card titles, secondary headings
  semibold:   "Inter_600SemiBold",

  // Bold — active nav labels, primary headings, CTA text
  bold:       "Inter_700Bold",

  // Extrabold — page titles, hero headings
  extrabold:  "Inter_800ExtraBold",

  // Black — logo, brand wordmark in large contexts
  black:      "Inter_900Black",

  // ── Outfit (brand / display font) ──────────────────────────────────────────
  // Used for: Navbar brand title, Sidebar logo, landing/hero text
  // Matches web: font-outfit Tailwind class
  outfitBold:      "Outfit_700Bold",
  outfitExtrabold: "Outfit_800ExtraBold",
  outfitBlack:     "Outfit_900Black",
} as const;

export type FontKey = keyof typeof fonts;

/**
 * Map from raw fontWeight string to matching Inter fontFamily.
 * Use this helper for components that previously used fontWeight strings
 * and need to be migrated systematically.
 *
 * @example
 * fontFamily: fontWeightToFamily["700"]  // → "Inter_700Bold"
 */
export const fontWeightToFamily: Record<string, string> = {
  "400": fonts.regular,
  "500": fonts.medium,
  "600": fonts.semibold,
  "700": fonts.bold,
  "800": fonts.extrabold,
  "900": fonts.black,
  normal: fonts.regular,
  bold:   fonts.bold,
};

/**
 * All font objects required by expo useFonts() hook.
 * Import this into app/_layout.tsx:
 *
 * @example
 * import { fontAssets } from "../src/theme/fonts";
 * const [fontsLoaded] = useFonts(fontAssets);
 */
export { fontAssets } from "./fontAssets";
