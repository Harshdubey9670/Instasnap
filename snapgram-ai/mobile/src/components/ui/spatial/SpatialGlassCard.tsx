import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

/**
 * Frosted-glass surface for the Spatial Red/Coral design system.
 * No expo-blur dependency (avoids forcing a native rebuild) — the glass look
 * is approximated with a semi-opaque tinted surface, a hairline highlight
 * border, and a soft ambient shadow. Matches web `SpatialGlassCard`.
 */
export type SpatialGlassVariant = "default" | "elevated" | "subtle" | "pill";

interface SpatialGlassCardProps {
  children?: React.ReactNode;
  variant?: SpatialGlassVariant;
  style?: StyleProp<ViewStyle>;
}

const VARIANTS: Record<SpatialGlassVariant, ViewStyle> = {
  default: {
    backgroundColor: "rgba(170, 45, 42, 0.38)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  elevated: {
    backgroundColor: "rgba(160, 47, 44, 0.5)",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  subtle: {
    backgroundColor: "rgba(140, 30, 28, 0.28)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  pill: {
    backgroundColor: "rgba(170, 45, 42, 0.48)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
};

export const SpatialGlassCard: React.FC<SpatialGlassCardProps> = ({
  children,
  variant = "default",
  style,
}) => {
  return (
    <View style={[styles.base, VARIANTS[variant], style]}>{children}</View>
  );
};

const styles = StyleSheet.create({
  base: {
    shadowColor: "#320605",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
    overflow: "hidden",
  },
});

export default SpatialGlassCard;
