import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { fonts } from "../../../theme/fonts";
import { heroGradient } from "../../../theme/colors";

export type SpatialButtonVariant = "primary" | "glass" | "ghost" | "danger";
export type SpatialButtonSize = "sm" | "md" | "lg";

interface SpatialButtonProps {
  children: React.ReactNode;
  variant?: SpatialButtonVariant;
  size?: SpatialButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<SpatialButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { height: 36, paddingHorizontal: 14, fontSize: 12 },
  md: { height: 44, paddingHorizontal: 20, fontSize: 14 },
  lg: { height: 52, paddingHorizontal: 28, fontSize: 16 },
};

export const SpatialButton: React.FC<SpatialButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  icon,
  onPress,
  style,
}) => {
  const dims = SIZES[size];
  const isDisabled = disabled || isLoading;

  const content = (
    <View style={styles.row}>
      {isLoading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : icon ? (
        <View style={styles.icon}>{icon}</View>
      ) : null}
      <Text
        style={[
          styles.label,
          { fontSize: dims.fontSize, color: variant === "ghost" ? "rgba(255,247,245,0.9)" : "#FFF7F5" },
        ]}
      >
        {children}
      </Text>
    </View>
  );

  if (variant === "primary") {
    return (
      <Pressable onPress={onPress} disabled={isDisabled} style={({ pressed }) => [pressed && styles.pressed, style]}>
        <LinearGradient
          colors={heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.base,
            { height: dims.height, paddingHorizontal: dims.paddingHorizontal, opacity: isDisabled ? 0.5 : 1 },
          ]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  const variantStyle: ViewStyle =
    variant === "glass"
      ? { backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }
      : variant === "danger"
      ? { backgroundColor: "#E11D48", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }
      : { backgroundColor: "transparent" };

  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={({ pressed }) => [pressed && styles.pressed, style]}>
      <View
        style={[
          styles.base,
          variantStyle,
          { height: dims.height, paddingHorizontal: dims.paddingHorizontal, opacity: isDisabled ? 0.5 : 1 },
        ]}
      >
        {content}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    marginRight: 2,
  },
  label: {
    fontFamily: fonts.bold,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

export default SpatialButton;
