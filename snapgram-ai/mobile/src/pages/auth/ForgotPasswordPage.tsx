import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Mail, KeyRound, ArrowRight } from "lucide-react-native";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import api from "../../services/api";
import { useTheme } from "../../contexts/ThemeContext";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const { effectiveTheme } = useTheme();
  const dark = effectiveTheme === "dark";

  const colors = {
    bg: dark ? "#0d0a14" : "#f8f5ff",
    card: dark ? "rgba(30,17,44,0.85)" : "rgba(255,255,255,0.85)",
    cardBorder: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)",
    text: dark ? "#f8fafc" : "#0f172a",
    textSecondary: dark ? "#94a3b8" : "#64748b",
    primary: "#a855f7",
  };

  const handleSendCode = async () => {
    if (!email) {
      setError("Email is required");
      return;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      toast({ variant: "success", title: "Code Sent", description: "If the email exists, a reset code was sent." });
      router.push({ pathname: "/auth/reset-password" as any, params: { email } });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Something went wrong. Please try again.";
      toast({ variant: "error", title: "Error", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={styles.blob} pointerEvents="none" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconBox, { borderColor: "rgba(168,85,247,0.3)", backgroundColor: "rgba(168,85,247,0.1)" }]}>
              <KeyRound size={40} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Forgot Password?</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              No worries! Enter your email address and we'll send you a 6-digit code to reset it.
            </Text>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (error) setError("");
                }}
                error={error}
                leftIcon={<Mail size={18} color={colors.textSecondary} />}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <Button
              variant="gradient"
              onPress={handleSendCode}
              isLoading={isLoading}
              rightIcon={!isLoading ? <ArrowRight size={18} color="#fff" /> : undefined}
              style={styles.btn}
            >
              Send Reset Code
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>Remember your password? </Text>
            <Pressable onPress={() => router.push("/auth/login" as any)}>
              <Text style={[styles.linkText, { color: colors.primary }]}>Log in here</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  blob: {
    position: "absolute", top: -60, left: -60,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: "rgba(168,85,247,0.2)", opacity: 0.5,
  },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 40 },
  header: { alignItems: "center", marginBottom: 32 },
  iconBox: {
    width: 80, height: 80, borderRadius: 24, borderWidth: 1,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
    shadowColor: "#a855f7", shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 8, textAlign: "center", lineHeight: 22, paddingHorizontal: 16 },
  card: {
    borderRadius: 24, padding: 24, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "500", marginBottom: 6 },
  btn: { height: 50, borderRadius: 14 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24, alignItems: "center" },
  footerText: { fontSize: 13 },
  linkText: { fontSize: 13, fontWeight: "600" },
});

export default ForgotPasswordPage;
