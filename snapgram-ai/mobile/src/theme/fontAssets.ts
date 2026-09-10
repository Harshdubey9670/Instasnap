/**
 * Font assets object for useFonts() hook.
 * Uses locally bundled TTF files from assets/fonts/ to avoid
 * network downloads at runtime (which block the splash screen).
 */
export const fontAssets = {
  Inter_400Regular: require("../../assets/fonts/Inter_400Regular.ttf"),
  Inter_500Medium: require("../../assets/fonts/Inter_500Medium.ttf"),
  Inter_600SemiBold: require("../../assets/fonts/Inter_600SemiBold.ttf"),
  Inter_700Bold: require("../../assets/fonts/Inter_700Bold.ttf"),
  Inter_800ExtraBold: require("../../assets/fonts/Inter_800ExtraBold.ttf"),
  Inter_900Black: require("../../assets/fonts/Inter_900Black.ttf"),
  Outfit_700Bold: require("../../assets/fonts/Outfit_700Bold.ttf"),
  Outfit_800ExtraBold: require("../../assets/fonts/Outfit_800ExtraBold.ttf"),
  Outfit_900Black: require("../../assets/fonts/Outfit_900Black.ttf"),
} as const;
