import React, { useState, useRef, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { ShieldCheck, RefreshCw, CheckCircle2 } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { loginSuccess } from "../../store/authSlice";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import api from "../../services/api";
import { useTheme } from "../../contexts/ThemeContext";
import type { RootState } from "../../store/store";

const OtpPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { effectiveTheme } = useTheme();
  const dark = effectiveTheme === "dark";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const colors = {
    bg: dark ? "#0d0a14" : "#f8f5ff",
    card: dark ? "rgba(30,17,44,0.85)" : "rgba(255,255,255,0.85)",
    cardBorder: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)",
    text: dark ? "#f8fafc" : "#0f172a",
    textSecondary: dark ? "#94a3b8" : "#64748b",
    primary: "#a855f7",
    otpBg: dark ? "#1e112c" : "#f1f5f9",
    otpBorder: dark ? "#2d1b3b" : "#e2e8f0",
  };

  useEffect(() => {
    if (!user?.email) {
      router.replace("/auth/login" as any);
    }
  }, [user]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((p) => p - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast({ variant: "error", title: "Incomplete OTP", description: "Please enter all 6 digits." });
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post("/api/auth/verify-otp", {
        email: user?.email,
        otp: otpString,
      });
      await AsyncStorage.setItem("token", response.data.token);
      dispatch(loginSuccess(response.data.user));
      toast({ variant: "success", title: "Verification Successful!", description: "Your account is now active." });
      router.replace("/auth/profile-setup" as any);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Invalid OTP. Please try again.";
      toast({ variant: "error", title: "Verification Failed", description: errorMessage });
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setIsResending(true);
    try {
      await api.post("/api/auth/resend-otp", { email: user?.email });
      setTimer(60);
      toast({ variant: "success", title: "OTP Sent", description: "A new verification code has been sent to your email." });
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      toast({ variant: "error", title: "Failed", description: err.response?.data?.message || "Failed to resend OTP." });
    } finally {
      setIsResending(false);
    }
  };

  if (!user?.email) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={styles.blob} pointerEvents="none" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconBox, { borderColor: "rgba(168,85,247,0.3)", backgroundColor: "rgba(168,85,247,0.1)" }]}>
              <ShieldCheck size={40} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Verify Account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We've sent a 6-digit code to{"\n"}
              <Text style={[styles.email, { color: colors.text }]}>{user?.email}</Text>
            </Text>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {/* OTP Inputs */}
            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  style={[
                    styles.otpInput,
                    {
                      backgroundColor: colors.otpBg,
                      borderColor: digit ? colors.primary : colors.otpBorder,
                      color: colors.text,
                    },
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(v) => handleChange(index, v)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                  textAlign="center"
                  selectionColor={colors.primary}
                />
              ))}
            </View>

            {/* Verify Button */}
            <Button
              variant="gradient"
              onPress={handleVerify}
              isLoading={isLoading}
              disabled={otp.join("").length !== 6}
              leftIcon={!isLoading ? <CheckCircle2 size={18} color="#fff" /> : undefined}
              style={styles.verifyBtn}
            >
              Verify Code
            </Button>

            {/* Resend section */}
            <View style={styles.resendSection}>
              <Text style={[styles.resendHint, { color: colors.textSecondary }]}>
                Didn't receive the code?
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onPress={handleResend}
                disabled={timer > 0 || isResending}
                isLoading={isResending}
                leftIcon={timer === 0 && !isResending ? <RefreshCw size={14} color={colors.primary} /> : undefined}
              >
                {timer > 0 ? `Resend code in ${timer}s` : "Resend OTP"}
              </Button>
            </View>
          </View>

          {/* Back to Login */}
          <Pressable style={styles.backBtn} onPress={() => router.replace("/auth/login" as any)}>
            <Text style={[styles.backText, { color: colors.textSecondary }]}>Back to Login</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  blob: {
    position: "absolute", top: -60, right: -60,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: "rgba(168,85,247,0.2)", opacity: 0.5,
  },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 40 },
  header: { alignItems: "center", marginBottom: 32 },
  iconBox: {
    width: 80, height: 80, borderRadius: 24,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#a855f7", shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 8, textAlign: "center", lineHeight: 22 },
  email: { fontWeight: "600" },
  card: {
    borderRadius: 24, padding: 24, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  otpRow: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 24 },
  otpInput: {
    flex: 1, height: 56, borderWidth: 1.5, borderRadius: 14,
    fontSize: 22, fontWeight: "700",
  },
  verifyBtn: { height: 50, borderRadius: 14, marginBottom: 20 },
  resendSection: { alignItems: "center", gap: 4 },
  resendHint: { fontSize: 13 },
  backBtn: { alignItems: "center", marginTop: 24 },
  backText: { fontSize: 13, fontWeight: "600" },
});

export default OtpPage;
