import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Slot, useRouter } from "expo-router";
import { useTheme } from "../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthLayout() {
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === "dark";
  const router = useRouter();

  const colors = {
    bgBase: isDark ? "#0f172a" : "#f8fafc",
    textPrimary: isDark ? "#f1f5f9" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgBase }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/")}
          style={styles.iconButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
          <Ionicons
            name={isDark ? "moon" : "sunny"}
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            SnapGram AI
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Join the next generation of social media.
          </Text>
        </View>

        <Slot />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  iconButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
});
