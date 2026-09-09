import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, Moon, Sun, Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "../../contexts/ThemeContext";
import { GradientText } from "../ui/GradientText";
import { useToast } from "../ui/Toast";

interface AuthPageLayoutProps {
  children: React.ReactNode;
}

export const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({ children }) => {
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === "dark";
  const { toast } = useToast();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/" as any);
    }
  };

  const handleAiPress = () => {
    toast({
      title: "SnapGram AI Copilot",
      description: "Sign in or create an account to access AI features!",
    });
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? "#0a0510" : "#f8fafc" },
      ]}
      edges={["top", "left", "right"]}
    >
      {/* Ambient background glows */}
      <View
        pointerEvents="none"
        style={[
          styles.ambientGlowTop,
          {
            backgroundColor: isDark
              ? "rgba(168, 85, 247, 0.12)"
              : "rgba(168, 85, 247, 0.08)",
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.ambientGlowBottom,
          {
            backgroundColor: isDark
              ? "rgba(236, 72, 153, 0.10)"
              : "rgba(236, 72, 153, 0.06)",
          },
        ]}
      />

      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        {/* Back Button */}
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.roundButton,
            {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.06)"
                : "#ffffff",
              borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "#e2e8f0",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft
            size={22}
            color={isDark ? "#f8fafc" : "#0f172a"}
            strokeWidth={2.2}
          />
        </Pressable>

        {/* Center Title and Subtitle */}
        <View style={styles.titleContainer}>
          <GradientText
            text="SnapGram AI"
            fontSize={25}
            fontWeight="800"
            colors={["#d946ef", "#c084fc", "#ec4899"]}
          />
          <Text
            style={[
              styles.headerSubtitle,
              { color: isDark ? "#94a3b8" : "#64748b" },
            ]}
          >
            Join the next generation of social media.
          </Text>
        </View>

        {/* Theme Toggle Button */}
        <Pressable
          onPress={toggleTheme}
          style={({ pressed }) => [
            styles.roundButton,
            {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.06)"
                : "#ffffff",
              borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "#e2e8f0",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Toggle theme"
        >
          {isDark ? (
            <Moon size={19} color="#f8fafc" strokeWidth={2} />
          ) : (
            <Moon size={19} color="#0f172a" strokeWidth={2} />
          )}
        </Pressable>
      </View>

      {/* Main Scroll Content */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentWrapper}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating AI Copilot Assistant Launcher Button */}
      <Pressable
        onPress={handleAiPress}
        style={({ pressed }) => [
          styles.floatingAiButton,
          {
            transform: [{ scale: pressed ? 0.93 : 1 }],
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="SnapGram AI Copilot"
      >
        <LinearGradient
          colors={["#a855f7", "#9333ea", "#ec4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.floatingAiGradient}
        >
          <Sparkles size={22} color="#ffffff" strokeWidth={2.2} />
        </LinearGradient>
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 48,
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  ambientGlowTop: {
    position: "absolute",
    top: -80,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  ambientGlowBottom: {
    position: "absolute",
    bottom: -100,
    right: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    zIndex: 10,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 2,
    fontWeight: "400",
  },
  floatingAiButton: {
    position: "absolute",
    bottom: 24,
    right: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  floatingAiGradient: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
});
