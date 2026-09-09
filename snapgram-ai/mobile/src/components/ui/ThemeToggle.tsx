import React from "react";
import {
  Pressable,
  StyleSheet,
} from "react-native";
import {
  Moon,
  Sun,
} from "lucide-react-native";

import { useTheme } from "../../contexts/ThemeContext";

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle = ({
  className: _className,
}: ThemeToggleProps) => {
  const {
    theme,
    effectiveTheme,
    toggleTheme,
  } = useTheme();

  const isDark =
    effectiveTheme === "dark";

  return (
    <Pressable
      onPress={toggleTheme}
      accessibilityRole="button"
      accessibilityLabel="Toggle theme"
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor:
            isDark
              ? "rgba(19,10,28,0.70)"
              : "rgba(255,255,255,0.70)",
          borderColor:
            isDark
              ? "rgba(168,85,247,0.15)"
              : "rgba(255,255,255,0.40)",
        },
        pressed &&
          styles.pressed,
      ]}
    >
      {isDark ? (
        <Moon
          size={19}
          color="#f8fafc"
        />
      ) : (
        <Sun
          size={19}
          color="#0f172a"
        />
      )}
    </Pressable>
  );
};

const styles =
  StyleSheet.create({
    button: {
      width: 40,
      height: 40,
      borderRadius: 20,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderWidth: 1,

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.04,
      shadowRadius: 12,
      elevation: 2,
    },

    pressed: {
      transform: [
        {
          scale: 0.90,
        },
      ],
    },
  });