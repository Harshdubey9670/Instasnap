import React from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { UserCircle2 } from "lucide-react-native";

import { Button } from "../../components/ui/Button";
import { useTheme } from "../../contexts/ThemeContext";

const ProfileSetupPage = () => {
  const { effectiveTheme } = useTheme();
  const dark = effectiveTheme === "dark";
  const colors = {
    bg: dark ? "#0d0a14" : "#f8f5ff",
    text: dark ? "#f8fafc" : "#0f172a",
    textSecondary: dark ? "#94a3b8" : "#64748b",
    primary: "#a855f7",
    card: dark ? "rgba(30,17,44,0.85)" : "rgba(255,255,255,0.85)",
    cardBorder: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)",
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={styles.container}>
        <View style={[styles.iconBox, { backgroundColor: "rgba(168,85,247,0.1)", borderColor: "rgba(168,85,247,0.3)" }]}>
          <UserCircle2 size={48} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Profile Setup</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your account is verified! Complete your profile to get started.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
            Profile setup features coming soon. You can customize your profile from Settings.
          </Text>
        </View>

        <Button
          variant="gradient"
          onPress={() => router.replace("/(app)/feed" as any)}
          style={styles.btn}
        >
          Continue to App
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  iconBox: {
    width: 90, height: 90, borderRadius: 28, borderWidth: 1,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
    shadowColor: "#a855f7", shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 24, paddingHorizontal: 16 },
  card: {
    width: "100%", borderRadius: 20, padding: 20, borderWidth: 1,
    marginBottom: 24,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  placeholder: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  btn: { width: "100%", height: 50, borderRadius: 14 },
});

export default ProfileSetupPage;
