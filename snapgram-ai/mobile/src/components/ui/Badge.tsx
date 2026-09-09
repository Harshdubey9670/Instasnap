import React, {
  forwardRef,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import { useTheme } from "../../contexts/ThemeContext";

type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "outline"
  | "glass";

interface BadgeProps
  extends Omit<ViewProps, "style"> {
  variant?: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const Badge = forwardRef<
  View,
  BadgeProps
>(
  (
    {
      variant = "default",
      children,
      style,
      textStyle,
      className: _className,
      ...props
    },
    ref,
  ) => {
    const {
      effectiveTheme,
    } = useTheme();

    const dark =
      effectiveTheme === "dark";

    const colors =
      getBadgeColors(
        variant,
        dark,
      );

    return (
      <View
        ref={ref}
        style={[
          styles.base,
          {
            backgroundColor:
              colors.background,
            borderColor:
              colors.border,
            borderWidth:
              colors.borderWidth,
          },
          style,
        ]}
        {...props}
      >
        <Text
          style={[
            styles.text,
            {
              color:
                colors.text,
            },
            textStyle,
          ]}
          numberOfLines={1}
        >
          {children}
        </Text>
      </View>
    );
  },
);

Badge.displayName =
  "Badge";

function getBadgeColors(
  variant: BadgeVariant,
  dark: boolean,
) {
  switch (variant) {
    case "secondary":
      return {
        background: dark
          ? "rgba(157,23,77,0.30)"
          : "#fce7f3",
        text: dark
          ? "#f9a8d4"
          : "#9d174d",
        border: "transparent",
        borderWidth: 0,
      };

    case "success":
      return {
        background: dark
          ? "rgba(20,83,45,0.35)"
          : "#dcfce7",
        text: dark
          ? "#86efac"
          : "#166534",
        border: "transparent",
        borderWidth: 0,
      };

    case "warning":
      return {
        background: dark
          ? "rgba(113,63,18,0.35)"
          : "#fef3c7",
        text: dark
          ? "#fde68a"
          : "#854d0e",
        border: "transparent",
        borderWidth: 0,
      };

    case "danger":
      return {
        background: dark
          ? "rgba(127,29,29,0.35)"
          : "#fee2e2",
        text: dark
          ? "#fca5a5"
          : "#991b1b",
        border: "transparent",
        borderWidth: 0,
      };

    case "outline":
      return {
        background:
          "transparent",
        text: dark
          ? "#f8fafc"
          : "#0f172a",
        border: dark
          ? "#2d1b3b"
          : "#e2e8f0",
        borderWidth: 1,
      };

    case "glass":
      return {
        background: dark
          ? "rgba(19,10,28,0.50)"
          : "rgba(255,255,255,0.70)",
        text: dark
          ? "#f8fafc"
          : "#0f172a",
        border: dark
          ? "rgba(168,85,247,0.15)"
          : "rgba(255,255,255,0.40)",
        borderWidth: 1,
      };

    case "default":
    default:
      return {
        background: dark
          ? "rgba(88,28,135,0.30)"
          : "#f3e8ff",
        text: dark
          ? "#d8b4fe"
          : "#6b21a8",
        border: "transparent",
        borderWidth: 0,
      };
  }
}

const styles =
  StyleSheet.create({
    base: {
      alignSelf:
        "flex-start",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 999,
      paddingHorizontal:
        10,
      paddingVertical:
        2,
      minHeight: 20,
    },

    text: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "600",
      includeFontPadding: false,
    },
  });

export { Badge };