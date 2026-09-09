import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  BadgeCheck,
  Camera,
  Image as ImageIcon,
  X,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { isAxiosError } from "axios";
import { useDispatch } from "react-redux";

import api from "../../services/api";
import { loginSuccess } from "../../store/authSlice";
import { useTheme } from "../../contexts/ThemeContext";
import { useToast } from "../ui/Toast";

type AccountType = "personal" | "creator" | "business";
type ImageField = "avatar" | "coverPhoto";

interface ProfileUser {
  _id?: string;
  username?: string;
  bio?: string;
  website?: string;
  avatar?: string;
  profilePicture?: string;
  coverPhoto?: string;
  pronouns?: string;
  gender?: string;
  category?: string;
  accountType?: AccountType;
  isPrivate?: boolean;
  isVerified?: boolean;
  verificationRequestStatus?: string;
  [key: string]: unknown;
}

interface ProfileFormData {
  username: string;
  bio: string;
  website: string;
  avatar: string;
  coverPhoto: string;
  pronouns: string;
  gender: string;
  category: string;
  accountType: AccountType;
  isPrivate: boolean;
  verificationRequestStatus: string;
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

interface ErrorResponse {
  message?: string;
}

export interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ProfileUser | null | undefined;
  onProfileUpdated?: (user: ProfileUser) => void;
}

const INITIAL_FORM: ProfileFormData = {
  username: "",
  bio: "",
  website: "",
  avatar: "",
  coverPhoto: "",
  pronouns: "",
  gender: "",
  category: "",
  accountType: "personal",
  isPrivate: false,
  verificationRequestStatus: "none",
};

const GENDERS = [
  "",
  "Male",
  "Female",
  "Custom",
  "Prefer not to say",
];

const getErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (isAxiosError<ErrorResponse>(error)) {
    return error.response?.data?.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
};

export const EditProfileModal = ({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
}: EditProfileModalProps) => {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { effectiveTheme } = useTheme();

  const [formData, setFormData] =
    useState<ProfileFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] =
    useState(false);
  const [uploadingCover, setUploadingCover] =
    useState(false);

  const darkMode = effectiveTheme === "dark";
  const colors = useMemo(
    () => ({
      background: darkMode ? "#0a0510" : "#f8fafc",
      surface: darkMode ? "#130a1c" : "#ffffff",
      surfaceHover: darkMode ? "#1e112c" : "#f1f5f9",
      textPrimary: darkMode ? "#f8fafc" : "#0f172a",
      textSecondary: darkMode ? "#94a3b8" : "#64748b",
      border: darkMode ? "#2d1b3b" : "#e2e8f0",
      primary: "#a855f7",
    }),
    [darkMode],
  );

  useEffect(() => {
    if (!user || !isOpen) {
      return;
    }

    setFormData({
      username: user.username || "",
      bio: user.bio || "",
      website: user.website || "",
      avatar: user.avatar || user.profilePicture || "",
      coverPhoto: user.coverPhoto || "",
      pronouns: user.pronouns || "",
      gender: user.gender || "",
      category: user.category || "",
      accountType: user.accountType || "personal",
      isPrivate: Boolean(user.isPrivate),
      verificationRequestStatus:
        user.verificationRequestStatus || "none",
    });
  }, [isOpen, user]);

  const updateField = useCallback(
    <K extends keyof ProfileFormData,>(
      key: K,
      value: ProfileFormData[K],
    ) => {
      setFormData((current) => ({
        ...current,
        [key]: value,
      }));
    },
    [],
  );

  const handleImageUpload = useCallback(
    async (field: ImageField) => {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showToast(
          "error",
          "Permission Required",
          "Allow photo-library access to select an image.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: field === "avatar" ? [1, 1] : [16, 9],
        quality: 0.9,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];

      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        showToast("Image must be less than 5MB", "error");
        return;
      }

      const setUploading =
        field === "avatar" ? setUploadingAvatar : setUploadingCover;

      setUploading(true);

      try {
        showToast(`Uploading ${field}...`, "info");

        const uploadData = new FormData();
        const extension =
          asset.fileName?.split(".").pop() || "jpg";

        uploadData.append(
          "image",
          {
            uri: asset.uri,
            name: asset.fileName || `${field}.${extension}`,
            type: asset.mimeType || "image/jpeg",
          } as unknown as Blob,
        );

        const response = await api.post<
          ApiResponse<{ url?: string }>
        >("/api/upload", uploadData);

        const uploadedUrl = response.data.data?.url;

        if (response.data.success && uploadedUrl) {
          updateField(field, uploadedUrl);
          const label =
            field.charAt(0).toUpperCase() + field.slice(1);
          showToast(`${label} uploaded!`, "success");
        }
      } catch (error) {
        showToast(getErrorMessage(error, "Upload failed"), "error");
      } finally {
        setUploading(false);
      }
    },
    [showToast, updateField],
  );

  const requestVerification = useCallback(async () => {
    try {
      const response = await api.post<ApiResponse<unknown>>(
        "/api/users/verification-request",
      );

      if (response.data.success) {
        updateField("verificationRequestStatus", "pending");
        showToast("Verification requested successfully", "success");
      }
    } catch (error) {
      showToast(
        getErrorMessage(error, "Verification request failed"),
        "error",
      );
    }
  }, [showToast, updateField]);

  const handleSubmit = useCallback(async () => {
    if (loading || !formData.username.trim()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.put<ApiResponse<ProfileUser>>(
        "/api/users/update",
        formData,
      );

      if (response.data.success && response.data.data) {
        showToast("Profile updated successfully!", "success");
        dispatch(loginSuccess(response.data.data));
        onProfileUpdated?.(response.data.data);
        onClose();
      }
    } catch (error) {
      showToast(
        getErrorMessage(error, "Failed to update profile"),
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [
    dispatch,
    formData,
    loading,
    onClose,
    onProfileUpdated,
    showToast,
  ]);

  const renderInput = (
    label: string,
    key: keyof Pick<
      ProfileFormData,
      "username" | "pronouns" | "website" | "category"
    >,
    placeholder: string,
    options?: {
      autoCapitalize?: "none" | "sentences" | "words";
      keyboardType?: "default" | "url";
    },
  ) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <TextInput
        value={formData[key]}
        onChangeText={(value) => updateField(key, value)}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize={options?.autoCapitalize || "none"}
        keyboardType={options?.keyboardType || "default"}
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.surfaceHover,
            borderColor: colors.border,
          },
        ]}
      />
    </View>
  );

  return (
    <Modal
      visible={isOpen}
      transparent
      statusBarTranslucent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={[styles.header, { borderColor: colors.border }]}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Edit Profile</Text>
              <Pressable
                onPress={onClose}
                disabled={loading}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close edit profile"
              >
                <X size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}
            >
              <Pressable
                onPress={() => void handleImageUpload("coverPhoto")}
                disabled={uploadingCover}
                style={[
                  styles.cover,
                  {
                    backgroundColor: colors.surfaceHover,
                    borderColor: colors.border,
                  },
                ]}
              >
                {formData.coverPhoto ? (
                  <Image
                    source={{ uri: formData.coverPhoto }}
                    style={styles.coverImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.emptyMedia}>
                    <ImageIcon size={30} color={colors.textSecondary} />
                    <Text style={[styles.emptyMediaText, { color: colors.textSecondary }]}>Add Cover Photo</Text>
                  </View>
                )}

                <View style={styles.mediaOverlay}>
                  {uploadingCover ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Camera size={23} color="#ffffff" />
                  )}
                  <Text style={styles.mediaOverlayText}>
                    {uploadingCover ? "Uploading..." : "Change Cover"}
                  </Text>
                </View>
              </Pressable>

              <View style={styles.avatarSection}>
                <Pressable
                  onPress={() => void handleImageUpload("avatar")}
                  disabled={uploadingAvatar}
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: colors.surfaceHover,
                      borderColor: colors.background,
                    },
                  ]}
                >
                  {formData.avatar ? (
                    <Image
                      source={{ uri: formData.avatar }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={[styles.avatarFallback, { color: colors.textSecondary }]}>Avatar</Text>
                  )}
                  <View style={styles.avatarOverlay}>
                    {uploadingAvatar ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Camera size={25} color="#ffffff" />
                    )}
                  </View>
                </Pressable>
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Basic Info</Text>
                {renderInput("Username", "username", "Username")}
                {renderInput("Pronouns", "pronouns", "e.g. she/her, they/them")}

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Bio</Text>
                  <TextInput
                    value={formData.bio}
                    onChangeText={(value) => updateField("bio", value)}
                    placeholder="Tell us about yourself..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    maxLength={150}
                    textAlignVertical="top"
                    style={[
                      styles.bioInput,
                      {
                        color: colors.textPrimary,
                        backgroundColor: colors.surfaceHover,
                        borderColor: colors.border,
                      },
                    ]}
                  />
                  <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
                    {formData.bio.length} / 150
                  </Text>
                </View>

                {renderInput(
                  "Website",
                  "website",
                  "https://yourwebsite.com",
                  { keyboardType: "url" },
                )}

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Gender</Text>
                  <View style={styles.choiceWrap}>
                    {GENDERS.map((gender) => {
                      const selected = formData.gender === gender;
                      return (
                        <Pressable
                          key={gender || "not-selected"}
                          onPress={() => updateField("gender", gender)}
                          style={[
                            styles.choice,
                            {
                              borderColor: selected ? colors.primary : colors.border,
                              backgroundColor: selected
                                ? "rgba(168,85,247,0.12)"
                                : colors.surface,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.choiceText,
                              { color: selected ? colors.primary : colors.textSecondary },
                            ]}
                          >
                            {gender || "Select gender"}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={[styles.section, styles.dividedSection, { borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account Type</Text>
                <View style={styles.accountTypes}>
                  {(["personal", "creator", "business"] as AccountType[]).map(
                    (accountType) => {
                      const selected = formData.accountType === accountType;
                      return (
                        <Pressable
                          key={accountType}
                          onPress={() => updateField("accountType", accountType)}
                          style={[
                            styles.accountTypeButton,
                            {
                              borderColor: selected ? colors.primary : colors.border,
                              backgroundColor: selected
                                ? "rgba(168,85,247,0.12)"
                                : "transparent",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.accountTypeText,
                              { color: selected ? colors.primary : colors.textSecondary },
                            ]}
                          >
                            {accountType}
                          </Text>
                        </Pressable>
                      );
                    },
                  )}
                </View>

                {formData.accountType === "creator" ||
                formData.accountType === "business"
                  ? renderInput(
                      "Category",
                      "category",
                      "e.g. Artist, Musician, Entrepreneur",
                      { autoCapitalize: "words" },
                    )
                  : null}
              </View>

              <View style={[styles.section, styles.dividedSection, { borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Privacy & Verification</Text>

                <View
                  style={[
                    styles.settingCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Private Account</Text>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                      When your account is private, only people you approve can see your photos and videos.
                    </Text>
                  </View>
                  <Switch
                    value={formData.isPrivate}
                    onValueChange={(value) => updateField("isPrivate", value)}
                    trackColor={{ false: colors.surfaceHover, true: colors.primary }}
                    thumbColor="#ffffff"
                  />
                </View>

                <View
                  style={[
                    styles.settingCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.settingText}>
                    <View style={styles.verificationTitle}>
                      <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Verification Badge</Text>
                      {user?.isVerified ? (
                        <BadgeCheck size={17} color="#3b82f6" fill="#3b82f6" />
                      ) : null}
                    </View>
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                      {user?.isVerified
                        ? "Your account is verified."
                        : formData.verificationRequestStatus === "pending"
                          ? "Your verification request is pending review."
                          : "Request a blue checkmark to verify your authenticity."}
                    </Text>
                  </View>

                  {!user?.isVerified &&
                  formData.verificationRequestStatus !== "pending" ? (
                    <Pressable
                      onPress={() => void requestVerification()}
                      style={styles.requestButton}
                    >
                      <Text style={styles.requestButtonText}>Request</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </ScrollView>

            <View
              style={[
                styles.footer,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Pressable
                onPress={onClose}
                disabled={loading}
                style={({ pressed }) => [
                  styles.footerButton,
                  { backgroundColor: colors.surfaceHover },
                  pressed && styles.pressed,
                  loading && styles.disabled,
                ]}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={() => void handleSubmit()}
                disabled={loading || !formData.username.trim()}
                style={({ pressed }) => [
                  styles.footerButton,
                  styles.saveButton,
                  pressed && styles.pressed,
                  (loading || !formData.username.trim()) && styles.disabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveText}>Save Changes</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)" },
  keyboardView: { flex: 1, justifyContent: "flex-end" },
  modalCard: { width: "100%", maxWidth: 720, height: "94%", alignSelf: "center", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  header: { minHeight: 58, paddingHorizontal: 18, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontSize: 19, fontWeight: "800" },
  closeButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  content: { padding: 18, paddingBottom: 32 },
  cover: { width: "100%", height: 170, borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  coverImage: { width: "100%", height: "100%" },
  emptyMedia: { flex: 1, alignItems: "center", justifyContent: "center", gap: 7 },
  emptyMediaText: { fontSize: 14, fontWeight: "600" },
  mediaOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, minHeight: 48, paddingHorizontal: 14, backgroundColor: "rgba(0,0,0,0.48)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  mediaOverlayText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  avatarSection: { marginTop: -48, marginBottom: 8, alignItems: "center" },
  avatar: { width: 112, height: 112, borderRadius: 56, borderWidth: 4, overflow: "hidden", alignItems: "center", justifyContent: "center", shadowColor: "#000000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 9 },
  avatarImage: { width: "100%", height: "100%" },
  avatarFallback: { fontSize: 14, fontWeight: "600" },
  avatarOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.38)", alignItems: "center", justifyContent: "center" },
  section: { marginTop: 24, gap: 14 },
  dividedSection: { paddingTop: 22, borderTopWidth: StyleSheet.hairlineWidth },
  sectionTitle: { fontSize: 13, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600" },
  input: { minHeight: 46, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12, fontSize: 14 },
  bioInput: { minHeight: 94, padding: 13, borderWidth: 1, borderRadius: 12, fontSize: 14, lineHeight: 20 },
  characterCount: { alignSelf: "flex-end", fontSize: 11 },
  choiceWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { minHeight: 36, paddingHorizontal: 11, borderWidth: 1, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  choiceText: { fontSize: 12, fontWeight: "600" },
  accountTypes: { flexDirection: "row", gap: 8 },
  accountTypeButton: { flex: 1, minHeight: 42, borderWidth: 1, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  accountTypeText: { fontSize: 13, fontWeight: "700", textTransform: "capitalize" },
  settingCard: { padding: 14, borderWidth: 1, borderRadius: 13, flexDirection: "row", alignItems: "center", gap: 12 },
  settingText: { flex: 1, minWidth: 0 },
  settingTitle: { fontSize: 14, fontWeight: "700" },
  settingDescription: { marginTop: 4, fontSize: 12, lineHeight: 17 },
  verificationTitle: { flexDirection: "row", alignItems: "center", gap: 6 },
  requestButton: { minHeight: 34, paddingHorizontal: 12, borderRadius: 9, backgroundColor: "#ec4899", alignItems: "center", justifyContent: "center" },
  requestButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  footer: { padding: 14, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 10 },
  footerButton: { flex: 1, minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  saveButton: { backgroundColor: "#a855f7" },
  cancelText: { fontSize: 14, fontWeight: "700" },
  saveText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
});
