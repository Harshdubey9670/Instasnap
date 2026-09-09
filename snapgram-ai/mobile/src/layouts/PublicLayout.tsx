import React from "react";
import { View, StyleSheet } from "react-native";
import { Slot } from "expo-router";
import { useTheme } from "../contexts/ThemeContext";

export default function PublicLayout() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  const bgBase = isDark ? "#0f172a" : "#f8fafc";

  return (
    <View style={[styles.container, { backgroundColor: bgBase }]}>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
