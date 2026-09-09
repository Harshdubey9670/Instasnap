import React, { useState, useRef } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { useDispatch } from "react-redux";
import { Lock, Eye, EyeOff, Save, KeyRound } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { loginSuccess } from "../../store/authSlice";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import api from "../../services/api";
import { useTheme } from "../../contexts/ThemeContext";

const calculateStrength = (p: string) => {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 6) s += 25;
  if (p.length >= 10) s += 25;
  if (/[A-Z]/.test(p)) s += 25;
  if (/[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)) s += 25;
  return s;
};

const ResetPasswordPage = () => {
  const params = useLocalSearchParams<{ email?: string }>();
  const emailFromParams = params.email || "";
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { effectiveTheme } = useTheme();
  const dark = effectiveTheme === "dark";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const colors = {
    bg: dark ? "#0d0a14" : "#f8f5ff",
    card: dark ? "rgba(30,17,44,0.85)" : "rgba(255,255,255,0.85)",
    cardBorder: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)",
    text: dark ? "#f8fafc" : "#0f172a",
    textSecondary: dark ? "#94a3b8" : "#64748b",
    primary: "#a855f7",
    secondary: "#ec4899",
    otpBg: dark ? "#1e112c" : "#f1f5f9",
    otpBorder: dark ? "#2d1b3b" : "#e2e8f0",
    divider: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    surface: dark ? "#1e112c" : "#f1f5f9",
  };

  const strength = calculateStrength(formData.password);
  const strengthColor = strength < 50 ? "#ef4444" : strength < 75 ? "#eab308" : "#22c55e";
  const strengthLabel = strength < 50 ? "Weak" : strength < 75 ? "Good" : "Strong";

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResetPassword = async () => {
    const otpString = otp.join("");
    const newErrors: Record<string, string> = {};
    if (otpString.length !== 6) newErrors.otp = "Please enter all 6 digits of the OTP";
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post("/api/auth/reset-password", {
        email: emailFromParams,
        otp: otpString,
        newPassword: formData.password,
      });
      await AsyncStorage.setItem("token", response.data.token);
      dispatch(loginSuccess(response.data.user));
      toast({ variant: "success", title: "Password Reset Successful!", description: "You have been automatically logged in." });
      router.replace("/(app)/feed" as any);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to reset password. Please try again.";
      toast({ variant: "error", title: "Error", description: errorMessage });
      if (errorMessage.includes("OTP")) {
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!emailFromParams) {
    router.replace("/auth/forgot-password" as any);
    return null;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={[styles.blob, { backgroundColor: "rgba(236,72,153,0.15)" }]} pointerEvents="none" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconBox, { borderColor: "rgba(236,72,153,0.3)", backgroundColor: "rgba(236,72,153,0.1)" }]}>
              <KeyRound size={40} color={colors.secondary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Create New Password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter the 6-digit code sent to{"\n"}
              <Text style={{ fontWeight: "600", color: colors.text }}>{emailFromParams}</Text>
              {"\n"}and create a new secure password.
            </Text>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {/* OTP Row */}
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Verification Code</Text>
            {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}
            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  style={[
                    styles.otpInput,
                    {
                      backgroundColor: colors.otpBg,
                      borderColor: digit ? colors.secondary : colors.otpBorder,
                      color: colors.text,
                    },
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(v) => handleOtpChange(index, v)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
                  textAlign="center"
                  selectionColor={colors.secondary}
                />
              ))}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            {/* New Password */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>New Password</Text>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChangeText={(v) => {
                  setFormData((p) => ({ ...p, password: v }));
                  if (errors.password) setErrors((p) => ({ ...p, password: "" }));
                }}
                error={errors.password}
                leftIcon={<Lock size={18} color={colors.textSecondary} />}
                rightIcon={
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    {showPassword ? <EyeOff size={18} color={colors.textSecondary} /> : <Eye size={18} color={colors.textSecondary} />}
                  </Pressable>
                }
                secureTextEntry={!showPassword}
              />
              {formData.password.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <View style={styles.strengthRow}>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>Password Strength</Text>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: strengthColor }}>{strengthLabel}</Text>
                  </View>
                  <View style={[styles.strengthBg, { backgroundColor: colors.surface }]}>
                    <View style={[styles.strengthBar, { width: `${strength}%` as any, backgroundColor: strengthColor }]} />
                  </View>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm New Password</Text>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChangeText={(v) => {
                  setFormData((p) => ({ ...p, confirmPassword: v }));
                  if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: "" }));
                }}
                error={errors.confirmPassword}
                leftIcon={<Lock size={18} color={colors.textSecondary} />}
                secureTextEntry={!showPassword}
              />
            </View>

            <Button
              variant="gradient"
              onPress={handleResetPassword}
              isLoading={isLoading}
              leftIcon={!isLoading ? <Save size={18} color="#fff" /> : undefined}
              style={styles.btn}
            >
              Reset Password
            </Button>
          </View>

          <Pressable style={styles.backBtn} onPress={() => router.push("/auth/login" as any)}>
            <Text style={[styles.backText, { color: colors.textSecondary }]}>Cancel and return to Login</Text>
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
    position: "absolute", top: -40, right: -40,
    width: 220, height: 220, borderRadius: 110, opacity: 0.5,
  },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 36 },
  header: { alignItems: "center", marginBottom: 28 },
  iconBox: {
    width: 80, height: 80, borderRadius: 24, borderWidth: 1,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
    shadowColor: "#ec4899", shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  title: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 8, textAlign: "center", lineHeight: 21, paddingHorizontal: 10 },
  card: {
    borderRadius: 24, padding: 22, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  sectionLabel: { fontSize: 13, fontWeight: "600", textAlign: "center", marginBottom: 12 },
  errorText: { color: "#ef4444", fontSize: 12, textAlign: "center", marginBottom: 8 },
  otpRow: { flexDirection: "row", justifyContent: "space-between", gap: 6, marginBottom: 16 },
  otpInput: {
    flex: 1, height: 52, borderWidth: 1.5, borderRadius: 12,
    fontSize: 20, fontWeight: "700",
  },
  divider: { height: 1, marginVertical: 20 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "500", marginBottom: 6 },
  strengthRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  strengthBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  strengthBar: { height: "100%", borderRadius: 3 },
  btn: { height: 50, borderRadius: 14, marginTop: 8 },
  backBtn: { alignItems: "center", marginTop: 24 },
  backText: { fontSize: 13, fontWeight: "600" },
});

export default ResetPasswordPage;
