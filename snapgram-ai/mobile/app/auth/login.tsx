import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  Sparkles,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch } from "react-redux";
import {
  useAuthRequest,
  makeRedirectUri,
  ResponseType,
} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import { AuthPageLayout } from "../../src/components/auth/AuthPageLayout";
import { GoogleIcon } from "../../src/components/auth/GoogleIcon";
import { GradientText } from "../../src/components/ui/GradientText";
import { Input } from "../../src/components/ui/Input";
import { useToast } from "../../src/components/ui/Toast";
import { useTheme } from "../../src/contexts/ThemeContext";
import { loginSuccess } from "../../src/store/authSlice";
import api from "../../src/services/api";
import { setAuthToken, saveAccount } from "../../src/utils/authStorage";
import { primary, secondary } from "../../src/theme/colors";

WebBrowser.maybeCompleteAuthSession();

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

  const params = useLocalSearchParams<{
    from?: string;
  }>();

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Animated background blobs (mirrors web framer-motion scale+opacity) ────
  const blob1Scale   = useRef(new Animated.Value(1)).current;
  const blob1Opacity = useRef(new Animated.Value(0.25)).current;
  const blob2Scale   = useRef(new Animated.Value(1)).current;
  const blob2Opacity = useRef(new Animated.Value(0.18)).current;

  useEffect(() => {
    const makeAnim = (
      scale: Animated.Value,
      opacity: Animated.Value,
      delay = 0,
    ) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1.2,
              duration: 3000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: isDark ? 0.45 : 0.35,
              duration: 3000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1,
              duration: 3000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: isDark ? 0.25 : 0.18,
              duration: 3000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ]),
      );

    const a1 = makeAnim(blob1Scale, blob1Opacity, 0);
    const a2 = makeAnim(blob2Scale, blob2Opacity, 1000);
    a1.start();
    a2.start();
    return () => {
      a1.stop();
      a2.stop();
    };
  }, [isDark, blob1Scale, blob1Opacity, blob2Scale, blob2Opacity]);

  // Google OAuth configuration
  const discovery = {
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    revocationEndpoint: "https://oauth2.googleapis.com/revoke",
  };

  const redirectUri = makeRedirectUri({
    scheme: "snapgram",
  });

  const [googleRequest, googleResponse, promptGoogleLogin] = useAuthRequest(
    {
      responseType: ResponseType.IdToken,
      clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
      androidClientId:
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
      redirectUri,
      scopes: ["openid", "profile", "email"],
    } as any,
    discovery,
  );

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (googleResponse?.type !== "success") {
        return;
      }

      const idToken = googleResponse.params?.id_token;
      if (!idToken) {
        toast({
          variant: "error",
          title: "Login Failed",
          description: "Google authentication did not return a valid credential.",
        });
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.post("/api/auth/google", {
          credential: idToken,
        });

        const { token, user } = response.data;
        await setAuthToken(token);
        await saveAccount({
          _id: user._id,
          username: user.username,
          fullName: user.fullName || user.name,
          avatar: user.profilePicture || user.avatar,
          token,
        });
        dispatch(loginSuccess(user));

        toast({
          variant: "success",
          title: "Welcome back!",
          description: "Successfully logged in with Google.",
        });

        const destination = params.from || "/app";
        router.replace(destination as any);
      } catch {
        toast({
          variant: "error",
          title: "Google Login Failed",
          description: "Could not authenticate with Google.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void handleGoogleResponse();
  }, [googleResponse, dispatch, toast, params.from]);

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!formData.email) {
      nextErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      nextErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/api/auth/login", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      const { token, user } = response.data;
      await setAuthToken(token);
      await saveAccount({
        _id: user._id,
        username: user.username,
        fullName: user.fullName || user.name,
        avatar: user.profilePicture || user.avatar,
        token,
      });
      dispatch(loginSuccess(user));

      toast({
        variant: "success",
        title: "Welcome back!",
        description: "Successfully logged in.",
      });

      const destination = params.from || "/app";
      router.replace(destination as any);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        "Failed to connect to the server. Please try again.";

      toast({
        variant: "error",
        title: "Login Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (errors[field as keyof FormErrors]) {
      setErrors((previous) => ({
        ...previous,
        [field]: "",
      }));
    }
  };

  return (
    <AuthPageLayout>
      {/* ── Animated background blobs (mirrors web framer-motion blobs) ───── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View
          style={{
            position: "absolute",
            top: -100, left: -80,
            width: 320, height: 320,
            borderRadius: 160,
            backgroundColor: primary[500],
            transform: [{ scale: blob1Scale }],
            opacity: blob1Opacity,
          }}
        />
        <Animated.View
          style={{
            position: "absolute",
            bottom: -80, right: -80,
            width: 360, height: 360,
            borderRadius: 180,
            backgroundColor: secondary[500],
            transform: [{ scale: blob2Scale }],
            opacity: blob2Opacity,
          }}
        />
      </View>

      {/* Screen Title and Logo Header */}
      <View style={styles.headerSection}>
        {/* Glowing Squircle Logo */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={["#a855f7", "#ec4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBadge}
          >
            <Sparkles size={34} color="#ffffff" strokeWidth={2.2} />
          </LinearGradient>
        </View>

        {/* Screen Title */}
        <GradientText
          text="Welcome Back"
          fontSize={28}
          fontWeight="800"
          colors={["#d946ef", "#c084fc", "#ec4899"]}
        />

        {/* Screen Subtitle */}
        <Text
          style={[
            styles.headerSubtitle,
            { color: isDark ? "#94a3b8" : "#64748b" },
          ]}
        >
          Enter your details to access your account.
        </Text>
      </View>

      {/* Hero Glassmorphism Card */}
      <View
        style={[
          styles.glassCard,
          {
            backgroundColor: isDark
              ? "rgba(19, 10, 28, 0.82)"
              : "rgba(255, 255, 255, 0.92)",
            borderColor: isDark
              ? "rgba(168, 85, 247, 0.16)"
              : "rgba(255, 255, 255, 0.70)",
            shadowColor: isDark ? "#000000" : "#64748b",
          },
        ]}
      >
        <View style={styles.formFields}>
          {/* Email Address */}
          <Input
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChangeText={(value) => updateField("email", value)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            error={errors.email}
            leftIcon={
              <Mail
                size={19}
                color={isDark ? "#94a3b8" : "#64748b"}
                strokeWidth={1.8}
              />
            }
          />

          {/* Password */}
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={formData.password}
            onChangeText={(value) => updateField("password", value)}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            error={errors.password}
            leftIcon={
              <Lock
                size={19}
                color={isDark ? "#94a3b8" : "#64748b"}
                strokeWidth={1.8}
              />
            }
            rightIcon={
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff
                    size={19}
                    color={isDark ? "#94a3b8" : "#64748b"}
                    strokeWidth={1.8}
                  />
                ) : (
                  <Eye
                    size={19}
                    color={isDark ? "#94a3b8" : "#64748b"}
                    strokeWidth={1.8}
                  />
                )}
              </Pressable>
            }
          />

          {/* Remember Me & Forgot Password Row */}
          <View style={styles.optionsRow}>
            <Pressable
              onPress={() => updateField("rememberMe", !formData.rememberMe)}
              style={styles.rememberRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: formData.rememberMe }}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: formData.rememberMe
                      ? "#a855f7"
                      : isDark
                      ? "#1e112c"
                      : "#f1f5f9",
                    borderColor: formData.rememberMe
                      ? "#a855f7"
                      : isDark
                      ? "#3b2255"
                      : "#cbd5e1",
                  },
                ]}
              >
                {formData.rememberMe ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : null}
              </View>
              <Text
                style={[
                  styles.rememberText,
                  { color: isDark ? "#94a3b8" : "#64748b" },
                ]}
              >
                Remember me
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/auth/forgot-password" as any)}
            >
              <Text
                style={[
                  styles.forgotText,
                  { color: isDark ? "#c084fc" : "#a855f7" },
                ]}
              >
                Forgot password?
              </Text>
            </Pressable>
          </View>

          {/* Gradient Sign In Button */}
          <Pressable
            disabled={isLoading}
            onPress={() => void handleLogin()}
            style={({ pressed }) => [
              styles.submitButton,
              {
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <LinearGradient
              colors={["#a855f7", "#ec4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <LogIn size={19} color="#ffffff" strokeWidth={2.2} />
                  <Text style={styles.buttonText}>Sign In</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          {/* Divider: Or continue with */}
          <View style={styles.dividerWrapper}>
            <View
              style={[
                styles.dividerLine,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "#e2e8f0",
                },
              ]}
            />
            <View
              style={[
                styles.dividerBadge,
                {
                  backgroundColor: isDark ? "#0a0510" : "#f8fafc",
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "#e2e8f0",
                },
              ]}
            >
              <Text
                style={[
                  styles.dividerLabel,
                  { color: isDark ? "#94a3b8" : "#64748b" },
                ]}
              >
                Or continue with
              </Text>
            </View>
          </View>

          {/* Official Google Sign In Button */}
          <Pressable
            disabled={isLoading}
            onPress={() => {
              if (!googleRequest) {
                toast({
                  variant: "error",
                  title: "Google Login Unavailable",
                  description: "Google OAuth is not configured yet.",
                });
                return;
              }
              void promptGoogleLogin();
            }}
            style={({ pressed }) => [
              styles.googleButton,
              {
                borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#dadce0",
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              },
            ]}
          >
            <GoogleIcon size={18} />
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </Pressable>
        </View>
      </View>

      {/* Footer Navigation Link */}
      <View style={styles.footerSection}>
        <Text
          style={[
            styles.footerRegular,
            { color: isDark ? "#94a3b8" : "#64748b" },
          ]}
        >
          Don't have an account?{" "}
        </Text>
        <Pressable onPress={() => router.push("/auth/signup" as any)}>
          <Text
            style={[
              styles.footerHighlight,
              { color: isDark ? "#c084fc" : "#a855f7" },
            ]}
          >
            Create an account
          </Text>
        </Pressable>
      </View>
    </AuthPageLayout>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  logoContainer: {
    width: 68,
    height: 68,
    borderRadius: 22,
    marginBottom: 16,
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 12,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 6,
    fontWeight: "400",
  },
  glassCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  formFields: {
    gap: 16,
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 13,
  },
  rememberText: {
    fontSize: 13,
    fontWeight: "400",
  },
  forgotText: {
    fontSize: 13,
    fontWeight: "600",
  },
  submitButton: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 4,
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  gradientButton: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  dividerWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  dividerLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
  dividerBadge: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 3,
    borderWidth: 1,
  },
  dividerLabel: {
    fontSize: 12,
    fontWeight: "400",
  },
  googleButton: {
    width: "100%",
    height: 42,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  googleButtonText: {
    color: "#3c4043",
    fontSize: 14,
    fontWeight: "500",
  },
  footerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    marginBottom: 12,
  },
  footerRegular: {
    fontSize: 14,
  },
  footerHighlight: {
    fontSize: 14,
    fontWeight: "700",
  },
});