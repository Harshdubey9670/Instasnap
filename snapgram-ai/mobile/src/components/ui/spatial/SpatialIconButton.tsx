import React from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { heroGradient, secondary } from "../../../theme/colors";

export type SpatialIconButtonVariant = "glass" | "primary" | "ghost";
export type SpatialIconButtonSize = "sm" | "md" | "lg";

interface SpatialIconButtonProps {
  children: React.ReactNode;
  variant?: SpatialIconButtonVariant;
  size?: SpatialIconButtonSize;
  active?: boolean;
  badge?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const SIZES: Record<SpatialIconButtonSize, number> = { sm: 36, md: 44, lg: 50 };

export const SpatialIconButton: React.FC<SpatialIconButtonProps> = ({
  children,
  variant = "glass",
  size = "md",
  active = false,
  badge = 0,
  onPress,
  style,
  accessibilityLabel,
}) => {
  const dim = SIZES[size];

  const body =
    variant === "primary" ? (
      <LinearGradient colors={heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.base, { width: dim, height: dim }]}>
        {children}
      </LinearGradient>
    ) : (
      <View
        style={[
          styles.base,
          { width: dim, height: dim },
          variant === "glass"
            ? {
                backgroundColor: active ? "rgba(238,117,101,0.35)" : "rgba(255,255,255,0.1)",
                borderWidth: 1,
                borderColor: active ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)",
              }
            : { backgroundColor: active ? "rgba(255,255,255,0.1)" : "transparent" },
        ]}
      >
        {children}
      </View>
    );

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }, style]}
    >
      <View>
        {body}
        {badge > 0 && (
          <View style={styles.badge}>
            <View style={styles.badgeInner} />
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: secondary[500],
    borderWidth: 2,
    borderColor: "#851613",
  },
  badgeInner: {
    flex: 1,
  },
});

export default SpatialIconButton;
