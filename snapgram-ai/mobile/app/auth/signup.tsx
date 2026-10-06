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
import { router } from "expo-router";
import {
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  XCircle,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch } from "react-redux";
import {
  useAuthRequest,
  makeRedirectUri,
  ResponseType,
} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as ImagePicker from "expo-image-picker";

import { GoogleIcon } from "../../src/components/auth/GoogleIcon";
import { Input } from "../../src/components/ui/Input";
import { useToast } from "../../src/components/ui/Toast";
import { useTheme } from "../../src/contexts/ThemeContext";
import { loginSuccess } from "../../src/store/authSlice";
import api from "../../src/services/api";
import { setAuthToken, saveAccount } from "../../src/utils/authStorage";

WebBrowser.maybeCompleteAuthSession();

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type UsernameStatus = {
  checking: boolean;
  available: boolean | null;
  message: string;
};

type FormErrors = {
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
};

export default function SignupScreen() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>({
    checking: false,
    available: null,
    message: "",
  });

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
      void handleGoogleSignup(id_token);
    } else if (response?.type === "error") {
      toast({
        title: "Google Sign-Up Error",
        description:
          response.error?.message || "Failed to sign up with Google.",
      });
    }
  }, [response]);

  const handleGoogleSignup = async (idToken: string) => {
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
          title: "Welcome to NUVYELO!",
          description: `Logged in as @${user.username}`,
        });

        router.replace("/app" as any);
      }
    } catch (err: any) {
      toast({
        title: "Google Sign-Up Failed",
        description:
          err.response?.data?.message || "Google signup could not be completed.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Live Debounced Username Availability Check
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed || trimmed.length < 3) {
      setUsernameStatus({ checking: false, available: null, message: "" });
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus({ checking: true, available: null, message: "Checking..." });
      try {
        const res = await api.post("/api/auth/check-username", { username: trimmed });
        if (res.data?.available) {
          setUsernameStatus({
            checking: false,
            available: true,
            message: "Username is available",
          });
        } else {
          setUsernameStatus({
            checking: false,
            available: false,
            message: "Username is already taken",
          });
        }
      } catch {
        setUsernameStatus({ checking: false, available: null, message: "" });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [username]);

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        toast({
          title: "Permission Required",
          description: "Please allow photo library access to choose an avatar.",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePicture(result.assets[0]);
      }
    } catch {
      toast({
        title: "Image Selection Error",
        description: "Could not open image picker.",
      });
    }
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = "Full name is required";
    }

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      nextErrors.username = "Username is required";
    } else if (trimmedUser.length < 3) {
      nextErrors.username = "Must be at least 3 characters";
    } else if (usernameStatus.available === false) {
      nextErrors.username = "This username is taken";
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      nextErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      nextErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      nextErrors.password = "Password is required";
    } else if (password.length < 6) {
      nextErrors.password = "Must be at least 6 characters";
    }

    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    if (!agreedToTerms) {
      nextErrors.terms = "You must agree to continue";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
      };

      const res = await api.post("/api/auth/signup", payload);
      const { token, user } = res.data;

      if (token && user) {
        await setAuthToken(token);
        await saveAccount({
          _id: user._id || user.id || "",
          username: user.username,
          avatar: user.avatar || user.profilePicture || profilePicture?.uri,
          token,
        });

        dispatch(loginSuccess(user));
      }

      toast({
        title: "Account Created!",
        description: "Please check your email for the OTP code.",
      });

      router.push({
        pathname: "/auth/otp",
        params: { email: email.trim().toLowerCase() },
      } as any);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Could not create account. Please check your details.";
      toast({
        title: "Sign-Up Failed",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#120907" : "#F5F0EB" },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Bar Header ── */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.backButton,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.85)",
              },
            ]}
            hitSlop={12}
          >
            <ChevronLeft
              size={20}
              color={isDark ? "#F5F0EB" : "#1A1A1A"}
              strokeWidth={2.4}
            />
          </Pressable>

          {/* InstaSnap Brand Pill */}
          <View
            style={[
              styles.brandPill,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "#FFFFFF",
              },
            ]}
          >
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

          <View style={{ width: 40 }} />
        </View>

        {/* ── Main Signup Card ── */}
        <View
          style={[
            styles.cardContainer,
            {
              backgroundColor: isDark ? "#1E1210" : "#FFFFFF",
              borderColor: isDark ? "rgba(255,255,255,0.06)" : "#EBE3D9",
            },
          ]}
        >
          {/* Header Title & Subtitle */}
          <View style={styles.cardHeader}>
            <Text style={styles.kickerText}>JOIN OUR CREATIVE COMMUNITY</Text>
            <Text
              style={[
                styles.mainHeading,
                { color: isDark ? "#F5F0EB" : "#1A1A1A" },
              ]}
            >
              Create Your Account
            </Text>
            <Text
              style={[
                styles.subHeading,
                { color: isDark ? "#A8A29E" : "#78716C" },
              ]}
            >
              Join a community that sees the beauty in everyday moments. ✨
            </Text>
          </View>

          {/* Profile Photo Upload Circle */}
          <View style={styles.avatarSection}>
            <Pressable
              onPress={pickImage}
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.04)"
                    : "#FAF6F0",
                  borderColor: profilePicture ? "#FF6B35" : "#E5DECE",
                },
              ]}
            >
              {profilePicture?.uri ? (
                <Image
                  source={{ uri: profilePicture.uri }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Camera size={26} color="#FF6B35" strokeWidth={1.8} />
                </View>
              )}
            </Pressable>

            <Pressable onPress={pickImage} style={styles.uploadBadge}>
              <Text style={styles.uploadBadgeText}>
                {profilePicture ? "Change Photo" : "+ Upload Photo"}
              </Text>
            </Pressable>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Full Name */}
            <View style={styles.inputWrapper}>
              <Input
                placeholder="Full Name"
                value={fullName}
                onChangeText={(val) => {
                  setFullName(val);
                  if (errors.fullName) {
                    setErrors((p) => ({ ...p, fullName: undefined }));
                  }
                }}
                error={errors.fullName}
                leftIcon={
                  <User
                    size={18}
                    color={isDark ? "#A8A29E" : "#78716C"}
                    strokeWidth={1.8}
                  />
                }
                style={[
                  styles.inputBase,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "#FBF8F5",
                  },
                ]}
              />
            </View>

            {/* Username */}
            <View style={styles.inputWrapper}>
              <Input
                placeholder="Username (e.g. sophia.art)"
                value={username}
                onChangeText={(val) => {
                  setUsername(val);
                  if (errors.username) {
                    setErrors((p) => ({ ...p, username: undefined }));
                  }
                }}
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.username}
                leftIcon={
                  <Text
                    style={[
                      styles.atSymbol,
                      { color: isDark ? "#A8A29E" : "#78716C" },
                    ]}
                  >
                    @
                  </Text>
                }
                rightIcon={
                  username.trim().length >= 3 ? (
                    usernameStatus.checking ? (
                      <ActivityIndicator size="small" color="#FF6B35" />
                    ) : usernameStatus.available === true ? (
                      <CheckCircle2 size={18} color="#22C55E" />
                    ) : usernameStatus.available === false ? (
                      <XCircle size={18} color="#EF4444" />
                    ) : null
                  ) : null
                }
                style={[
                  styles.inputBase,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "#FBF8F5",
                  },
                ]}
              />
              {usernameStatus.message ? (
                <Text
                  style={[
                    styles.statusMessage,
                    {
                      color:
                        usernameStatus.available === true
                          ? "#22C55E"
                          : usernameStatus.available === false
                          ? "#EF4444"
                          : "#78716C",
                    },
                  ]}
                >
                  {usernameStatus.message}
                </Text>
              ) : null}
            </View>

            {/* Email Address */}
            <View style={styles.inputWrapper}>
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (errors.email) {
                    setErrors((p) => ({ ...p, email: undefined }));
                  }
                }}
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
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "#FBF8F5",
                  },
                ]}
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password (min. 6 chars)"
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errors.password) {
                    setErrors((p) => ({ ...p, password: undefined }));
                  }
                }}
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
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "#FBF8F5",
                  },
                ]}
              />
            </View>

            {/* Confirm Password */}
            <View style={styles.inputWrapper}>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  if (errors.confirmPassword) {
                    setErrors((p) => ({ ...p, confirmPassword: undefined }));
                  }
                }}
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.confirmPassword}
                leftIcon={
                  <Lock
                    size={18}
                    color={isDark ? "#A8A29E" : "#78716C"}
                    strokeWidth={1.8}
                  />
                }
                rightIcon={
                  <Pressable
                    onPress={() => setShowConfirmPassword((v) => !v)}
                    hitSlop={10}
                  >
                    {showConfirmPassword ? (
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
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "#FBF8F5",
                  },
                ]}
              />
            </View>

            {/* Terms & Privacy Agreement Checkbox */}
            <View style={styles.termsWrapper}>
              <Pressable
                onPress={() => {
                  setAgreedToTerms((prev) => !prev);
                  if (errors.terms) {
                    setErrors((p) => ({ ...p, terms: undefined }));
                  }
                }}
                style={styles.termsRow}
              >
                <View
                  style={[
                    styles.checkbox,
                    agreedToTerms && styles.checkboxActive,
                    {
                      borderColor: agreedToTerms
                        ? "#FF6B35"
                        : isDark
                        ? "rgba(255,255,255,0.25)"
                        : "#D6D3D1",
                    },
                  ]}
                >
                  {agreedToTerms && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text
                  style={[
                    styles.termsText,
                    { color: isDark ? "#A8A29E" : "#78716C" },
                  ]}
                >
                  I agree to the{" "}
                  <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </Pressable>
              {errors.terms ? (
                <Text style={styles.termsError}>{errors.terms}</Text>
              ) : null}
            </View>

            {/* Primary Orange Gradient Button */}
            <Pressable
              onPress={handleSignup}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <LinearGradient
                colors={["#FF6B35", "#E55A27"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Create Account</Text>
                    <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
                  </View>
                )}
              </LinearGradient>
            </Pressable>

            {/* Divider: "or continue with" */}
            <View style={styles.dividerRow}>
              <View
                style={[
                  styles.dividerLine,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.08)",
                  },
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
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.08)",
                  },
                ]}
              />
            </View>

            {/* Social Buttons Row (Google, Apple, X) */}
            <View style={styles.socialRow}>
              {/* Google */}
              <Pressable
                onPress={() => promptAsync()}
                disabled={!request || isLoading}
                style={[
                  styles.socialButton,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "#FBF8F5",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.06)",
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
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "#FBF8F5",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.06)",
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
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "#FBF8F5",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.06)",
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

            {/* Bottom Link: "Already have an account? Log in" */}
            <View style={styles.footerRow}>
              <Text
                style={[
                  styles.footerText,
                  { color: isDark ? "#A8A29E" : "#78716C" },
                ]}
              >
                Already have an account?{" "}
              </Text>
              <Pressable onPress={() => router.push("/auth/login" as any)}>
                <Text style={styles.loginLink}>Log in</Text>
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
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 54 : 42,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    gap: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  logoBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  flameInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  brandName: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  cardContainer: {
    marginHorizontal: 16,
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    shadowColor: "#2D2622",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 5,
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  kickerText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FF6B35",
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  mainHeading: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: "center",
  },
  subHeading: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 22,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FAF6F0",
    borderWidth: 1,
    borderColor: "#E5DECE",
  },
  uploadBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FF6B35",
  },
  formContainer: {
    gap: 14,
  },
  inputWrapper: {
    marginBottom: 2,
  },
  inputBase: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5DECE",
  },
  atSymbol: {
    fontSize: 16,
    fontWeight: "700",
  },
  statusMessage: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    marginLeft: 6,
  },
  termsWrapper: {
    marginTop: 2,
    marginBottom: 4,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxActive: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
  },
  termsText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  termsLink: {
    color: "#FF6B35",
    fontWeight: "600",
  },
  termsError: {
    fontSize: 11,
    color: "#EF4444",
    marginTop: 4,
    marginLeft: 30,
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 6,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  buttonGradient: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "500",
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  appleIconText: {
    fontSize: 20,
    fontWeight: "600",
  },
  xIconText: {
    fontSize: 17,
    fontWeight: "800",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: 13,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FF6B35",
  },
});