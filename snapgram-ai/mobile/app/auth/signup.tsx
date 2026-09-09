import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  CheckCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Lock,
  Mail,
  Sparkles,
  User,
  UserPlus,
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

import { AuthPageLayout } from "../../src/components/auth/AuthPageLayout";
import { GoogleIcon } from "../../src/components/auth/GoogleIcon";
import { GradientText } from "../../src/components/ui/GradientText";
import { Input } from "../../src/components/ui/Input";
import { useToast } from "../../src/components/ui/Toast";
import { useTheme } from "../../src/contexts/ThemeContext";
import { loginSuccess } from "../../src/store/authSlice";
import api from "../../src/services/api";
import { setAuthToken } from "../../src/utils/authStorage";

WebBrowser.maybeCompleteAuthSession();

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

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>({
    checking: false,
    available: null,
    message: "",
  });

  // Google OAuth
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
          title: "Signup Failed",
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
        dispatch(loginSuccess(user));

        toast({
          variant: "success",
          title: "Welcome!",
          description: "Successfully signed up with Google.",
        });

        router.replace("/app" as any);
      } catch {
        toast({
          variant: "error",
          title: "Google Signup Failed",
          description: "Could not authenticate with Google.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void handleGoogleResponse();
  }, [googleResponse, dispatch, toast]);

  // Check username availability
  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed || trimmed.length < 3) {
      setUsernameStatus({ checking: false, available: null, message: "" });
      return;
    }

    const handler = setTimeout(async () => {
      setUsernameStatus({ checking: true, available: null, message: "Checking..." });
      try {
        const res = await api.post("/api/auth/check-username", { username: trimmed });
        if (res.data?.available) {
          setUsernameStatus({
            checking: false,
            available: true,
            message: "Username is available!",
          });
        } else {
          setUsernameStatus({
            checking: false,
            available: false,
            message: "Username is taken.",
          });
        }
      } catch {
        setUsernameStatus({ checking: false, available: null, message: "" });
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [username]);

  // Password strength calculation
  const strength = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6) s += 25;
    if (password.length >= 10) s += 25;
    if (/[A-Z]/.test(password)) s += 25;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) s += 25;
    return s;
  }, [password]);

  const { strengthColor, strengthLabel } = useMemo(() => {
    if (strength < 50) {
      return { strengthColor: "#ef4444", strengthLabel: "Weak" };
    }
    if (strength < 75) {
      return { strengthColor: "#eab308", strengthLabel: "Good" };
    }
    return { strengthColor: "#22c55e", strengthLabel: "Strong" };
  }, [strength]);

  const selectProfilePicture = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast({
        variant: "error",
        title: "Permission required",
        description: "Please allow access to your photos to upload an avatar.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      toast({
        variant: "error",
        title: "File too large",
        description: "Profile picture must be under 5MB.",
      });
      return;
    }

    setProfilePicture(asset);
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = "Full name is required";
    }

    if (!username.trim()) {
      nextErrors.username = "Username is required";
    } else if (username.trim().length < 3) {
      nextErrors.username = "Must be at least 3 characters";
    } else if (usernameStatus.available === false) {
      nextErrors.username = "This username is already taken";
    }

    if (!email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      nextErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      nextErrors.password = "Password is required";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
      };

      const response = await api.post("/api/auth/signup", payload);

      if (response.data?.token) {
        await setAuthToken(response.data.token);
      }

      toast({
        variant: "success",
        title: "Account Created!",
        description: "Redirecting to verification...",
      });

      router.push("/auth/otp" as any);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        "Failed to create account. Please try again.";

      toast({
        variant: "error",
        title: "Signup Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout>
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
          text="Create Account"
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
          Join SnapGram AI today.
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
          {/* Avatar Picker */}
          <Pressable
            onPress={selectProfilePicture}
            style={[
              styles.avatarPicker,
              {
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.18)"
                  : "#cbd5e1",
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.03)"
                  : "#f8fafc",
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Choose profile picture"
          >
            {profilePicture?.uri ? (
              <Image
                source={{ uri: profilePicture.uri }}
                style={styles.profilePreview}
              />
            ) : (
              <ImageIcon
                size={34}
                color={isDark ? "#94a3b8" : "#64748b"}
                strokeWidth={1.8}
              />
            )}
          </Pressable>

          {/* Full Name */}
          <Input
            placeholder="John Doe"
            value={fullName}
            onChangeText={(value) => {
              setFullName(value);
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: "" }));
            }}
            error={errors.fullName}
            leftIcon={
              <User
                size={19}
                color={isDark ? "#94a3b8" : "#64748b"}
                strokeWidth={1.8}
              />
            }
          />

          {/* Username */}
          <View>
            <Input
              placeholder="johndoe"
              value={username}
              onChangeText={(value) => {
                setUsername(value);
                if (errors.username) setErrors((prev) => ({ ...prev, username: "" }));
              }}
              autoCapitalize="none"
              error={errors.username}
              leftIcon={
                <Text
                  style={[
                    styles.atIcon,
                    { color: isDark ? "#94a3b8" : "#64748b" },
                  ]}
                >
                  @
                </Text>
              }
            />

            {/* Live Username Availability Feedback */}
            {username.trim().length >= 3 && !errors.username ? (
              <View style={styles.usernameStatus}>
                {usernameStatus.checking ? (
                  <Text
                    style={[
                      styles.checkingText,
                      { color: isDark ? "#94a3b8" : "#64748b" },
                    ]}
                  >
                    Checking availability...
                  </Text>
                ) : usernameStatus.available === true ? (
                  <>
                    <CheckCircle size={13} color="#22c55e" strokeWidth={2} />
                    <Text style={styles.availableText}>
                      {usernameStatus.message}
                    </Text>
                  </>
                ) : usernameStatus.available === false ? (
                  <>
                    <XCircle size={13} color="#ef4444" strokeWidth={2} />
                    <Text style={styles.takenText}>
                      {usernameStatus.message}
                    </Text>
                  </>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* Email Address */}
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
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
          <View style={styles.passwordContainer}>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
              }}
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
          </View>

          {/* Password Strength Meter */}
          {password ? (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthHeader}>
                <Text
                  style={[
                    styles.strengthSecondary,
                    { color: isDark ? "#94a3b8" : "#64748b" },
                  ]}
                >
                  Password Strength
                </Text>
                <Text
                  style={[
                    styles.strengthValue,
                    { color: strengthColor },
                  ]}
                >
                  {strengthLabel}
                </Text>
              </View>
              <View
                style={[
                  styles.strengthTrack,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "#f1f5f9",
                  },
                ]}
              >
                <View
                  style={[
                    styles.strengthFill,
                    {
                      width: `${strength}%`,
                      backgroundColor: strengthColor,
                    },
                  ]}
                />
              </View>
            </View>
          ) : null}

          {/* Confirm Password */}
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              if (errors.confirmPassword) {
                setErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }
            }}
            error={errors.confirmPassword}
            leftIcon={
              <Lock
                size={19}
                color={isDark ? "#94a3b8" : "#64748b"}
                strokeWidth={1.8}
              />
            }
          />

          {/* Create Account Gradient Button */}
          <Pressable
            disabled={isLoading}
            onPress={() => void handleSignup()}
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
                  <UserPlus size={19} color="#ffffff" strokeWidth={2.2} />
                  <Text style={styles.buttonText}>Create Account</Text>
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
                  title: "Google Signup Unavailable",
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
          Already have an account?{" "}
        </Text>
        <Pressable onPress={() => router.push("/auth/login" as any)}>
          <Text
            style={[
              styles.footerHighlight,
              { color: isDark ? "#c084fc" : "#a855f7" },
            ]}
          >
            Log in here
          </Text>
        </Pressable>
      </View>
    </AuthPageLayout>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    alignItems: "center",
    marginTop: 18,
    marginBottom: 18,
  },
  logoContainer: {
    width: 68,
    height: 68,
    borderRadius: 22,
    marginBottom: 14,
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
    gap: 15,
  },
  avatarPicker: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderStyle: "dashed",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 4,
  },
  profilePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 46,
  },
  atIcon: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  usernameStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  checkingText: {
    fontSize: 12,
  },
  availableText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#22c55e",
  },
  takenText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ef4444",
  },
  passwordContainer: {
    position: "relative",
  },
  strengthContainer: {
    paddingHorizontal: 4,
    marginTop: -4,
  },
  strengthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  strengthSecondary: {
    fontSize: 12,
  },
  strengthValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  strengthTrack: {
    height: 5,
    borderRadius: 999,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 999,
  },
  submitButton: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 6,
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
    paddingVertical: 6,
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
    marginTop: 26,
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