import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ChevronLeft,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch } from "react-redux";
import {
  useAuthRequest,
  makeRedirectUri,
  ResponseType,
} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import { GoogleIcon } from "../../src/components/auth/GoogleIcon";
import { Input } from "../../src/components/ui/Input";
import { useToast } from "../../src/components/ui/Toast";
import { useTheme } from "../../src/contexts/ThemeContext";
import { loginSuccess } from "../../src/store/authSlice";
import api from "../../src/services/api";
import { setAuthToken, saveAccount } from "../../src/utils/authStorage";
import { primary, getColors } from "../../src/theme/colors";
import { fonts } from "../../src/theme/fonts";

WebBrowser.maybeCompleteAuthSession();

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type FormData = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type FormErrors = {
  email?: string;
  password?: string;
};

export default function LoginScreen() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";
  const colors = getColors(isDark);

  const params = useLocalSearchParams<{
    from?: string;
  }>();

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    rememberMe: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Google OAuth configuration
  const discovery = {
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    revocationEndpoint: "https://oauth2.googleapis.com/revoke",
  };

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId:
        process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
        "YOUR_EXPO_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
      scopes: ["openid", "profile", "email"],
      responseType: ResponseType.IdToken,
      redirectUri: makeRedirectUri({
        scheme: "instasnap",
        path: "auth/callback",
      }),
    },
    discovery,
  );

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      handleGoogleLogin(id_token);
    } else if (response?.type === "error") {
      toast({
        title: "Google Sign-In Error",
        description:
          response.error?.message || "Failed to sign in with Google.",
      });
    }
  }, [response]);

  const handleGoogleLogin = async (idToken: string) => {
    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/google", { credential: idToken });
      const { token, user } = res.data;

      if (token && user) {
        await setAuthToken(token);
        await saveAccount({
          _id: user._id || user.id || "",
          username: user.username,
          avatar: user.avatar || user.profilePicture,
          token,
        });

        dispatch(loginSuccess(user));
        toast({
          title: "Welcome Back",
          description: `Logged in as @${user.username}`,
        });

        const destination = params?.from || "/app";
        router.replace(destination as any);
      }
    } catch (err: any) {
      toast({
        title: "Sign-In Failed",
        description:
          err.response?.data?.message || "Google sign-in could not be completed.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!formData.email.trim()) {
      nextErrors.email = "Email or username is required";
    }

    if (!formData.password) {
      nextErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/login", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      const { token, user } = res.data;

      if (token && user) {
        await setAuthToken(token);
        await saveAccount({
          _id: user._id || user.id || "",
          username: user.username,
          avatar: user.avatar || user.profilePicture,
          token,
        });

        dispatch(loginSuccess(user));
        toast({
          title: "Welcome Back",
          description: `Logged in as @${user.username}`,
        });

        const destination = params?.from || "/app";
        router.replace(destination as any);
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        "Invalid credentials. Please check and try again.";
      toast({
        title: "Login Failed",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? "#120907" : "#F5F0EB" }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Top Half: Editorial Hero Moment with Curved Image ── */}
        <View style={styles.heroSection}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85",
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {/* Subtle gradient overlay */}
          <LinearGradient
            colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.55)"]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Floating Back Button */}
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={12}
          >
            <ChevronLeft size={22} color="#ffffff" strokeWidth={2.5} />
          </Pressable>

          {/* Script Text Overlay at Bottom Left */}
          <View style={styles.heroTextContainer}>
            <Text style={styles.scriptHeading}>
              More Moments{"\n"}Brighter Together —
            </Text>
          </View>
        </View>

        {/* ── Bottom Half: Curved Floating Login Card (rounded-t-[36px]) ── */}
        <View
          style={[
            styles.cardContainer,
            { backgroundColor: isDark ? "#1E1210" : "#FFFFFF" },
          ]}
        >
          {/* Brand Logo & Title */}
          <View style={styles.cardHeader}>
            <View style={styles.brandRow}>
              <LinearGradient
                colors={["#FF6B35", "#FF8C5A"]}
                style={styles.logoBadge}
              >
                <View style={styles.flameInner} />
              </LinearGradient>
              <Text
                style={[
                  styles.brandName,
                  { color: isDark ? "#F5F0EB" : "#1A1A1A" },
                ]}
              >
                NUVYELO
              </Text>
            </View>

            <Text
              style={[
                styles.welcomeHeading,
                { color: isDark ? "#F5F0EB" : "#1A1A1A" },
              ]}
            >
              Welcome back
            </Text>
            <Text
              style={[
                styles.welcomeSubheading,
                { color: isDark ? "#A8A29E" : "#78716C" },
              ]}
            >
              Log in to continue your journey.
            </Text>
          </View>

          {/* Inputs Section */}
          <View style={styles.formContainer}>
            {/* Email / Username */}
            <View style={styles.inputWrapper}>
              <Input
                type="email"
                placeholder="Email or username"
                value={formData.email}
                onChangeText={(value) => updateField("email", value)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                error={errors.email}
                leftIcon={
                  <Mail
                    size={18}
                    color={isDark ? "#A8A29E" : "#78716C"}
                    strokeWidth={1.8}
                  />
                }
                style={[
                  styles.inputBase,
                  { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FBF8F5" },
                ]}
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChangeText={(value) => updateField("password", value)}
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.password}
                leftIcon={
                  <Lock
                    size={18}
                    color={isDark ? "#A8A29E" : "#78716C"}
                    strokeWidth={1.8}
                  />
                }
                rightIcon={
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={10}
                  >
                    {showPassword ? (
                      <EyeOff
                        size={18}
                        color={isDark ? "#A8A29E" : "#78716C"}
                        strokeWidth={1.8}
                      />
                    ) : (
                      <Eye
                        size={18}
                        color={isDark ? "#A8A29E" : "#78716C"}
                        strokeWidth={1.8}
                      />
                    )}
                  </Pressable>
                }
                style={[
                  styles.inputBase,
                  { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FBF8F5" },
                ]}
              />
            </View>

            {/* Forgot Password Link */}
            <View style={styles.forgotRow}>
              <Pressable onPress={() => router.push("/auth/forgot-password" as any)}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            </View>

            {/* Primary Orange Gradient Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <LinearGradient
                colors={["#FF6B35", "#FF8C42"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Log In</Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* Divider: "or continue with" */}
            <View style={styles.dividerRow}>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" },
                ]}
              />
              <Text
                style={[
                  styles.dividerText,
                  { color: isDark ? "#A8A29E" : "#78716C" },
                ]}
              >
                or continue with
              </Text>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" },
                ]}
              />
            </View>

            {/* 3 Social Buttons: Google, Apple, X */}
            <View style={styles.socialRow}>
              {/* Google */}
              <Pressable
                onPress={() => promptAsync()}
                disabled={!request || isLoading}
                style={[
                  styles.socialButton,
                  {
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FBF8F5",
                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  },
                ]}
              >
                <GoogleIcon size={20} />
              </Pressable>

              {/* Apple */}
              <Pressable
                onPress={() =>
                  toast({
                    title: "Apple Sign-In",
                    description: "Apple sign-in is coming soon.",
                  })
                }
                style={[
                  styles.socialButton,
                  {
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FBF8F5",
                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.appleIconText,
                    { color: isDark ? "#F5F0EB" : "#1A1A1A" },
                  ]}
                >
                  
                </Text>
              </Pressable>

              {/* X */}
              <Pressable
                onPress={() =>
                  toast({
                    title: "X Sign-In",
                    description: "X sign-in is coming soon.",
                  })
                }
                style={[
                  styles.socialButton,
                  {
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FBF8F5",
                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.xIconText,
                    { color: isDark ? "#F5F0EB" : "#1A1A1A" },
                  ]}
                >
                  𝕏
                </Text>
              </Pressable>
            </View>

            {/* Bottom Create Account Link */}
            <View style={styles.footerRow}>
              <Text
                style={[
                  styles.footerText,
                  { color: isDark ? "#A8A29E" : "#78716C" },
                ]}
              >
                Don't have an account?{" "}
              </Text>
              <Pressable onPress={() => router.push("/auth/signup" as any)}>
                <Text style={styles.createAccountText}>Create account</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.38,
    position: "relative",
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  heroTextContainer: {
    position: "absolute",
    bottom: 46,
    left: 24,
    right: 24,
  },
  scriptHeading: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 32,
    fontStyle: "italic",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  cardContainer: {
    flex: 1,
    marginTop: -32,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  flameInner: {
    width: 10,
    height: 14,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 5,
    borderBottomRightRadius: 7,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  welcomeHeading: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  welcomeSubheading: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  formContainer: {
    gap: 12,
  },
  inputWrapper: {
    marginBottom: 4,
  },
  inputBase: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  forgotRow: {
    alignItems: "flex-end",
    marginTop: -2,
    marginBottom: 4,
  },
  forgotText: {
    color: "#FF6B35",
    fontSize: 12,
    fontWeight: "700",
  },
  loginButton: {
    width: "100%",
    height: 48,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  loginGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: "500",
    paddingHorizontal: 12,
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  appleIconText: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 26,
  },
  xIconText: {
    fontSize: 18,
    fontWeight: "800",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "500",
  },
  createAccountText: {
    color: "#FF6B35",
    fontSize: 12,
    fontWeight: "800",
  },
});