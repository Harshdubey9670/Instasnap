import React, {
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Download,
  ShieldAlert,
  X,
} from "lucide-react-native";
import {
  useDispatch,
  useSelector,
} from "react-redux";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import api from "../../services/api";
import {
  logout,
  optimisticUpdateSetting,
  updateSettings,
} from "../../store/authSlice";
import type {
  RootState,
  AppDispatch,
} from "../../store/store";

import {
  useToast,
} from "../ui/Toast";
import {
  SettingToggle,
} from "./SettingToggle";
import {
  useTheme,
} from "../../contexts/ThemeContext";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

const DeleteAccountModal = ({
  isOpen,
  onClose,
  onDelete,
}: DeleteAccountModalProps) => {
  const [
    confirmText,
    setConfirmText,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const {
    effectiveTheme,
  } = useTheme();

  const dark =
    effectiveTheme ===
    "dark";

  if (!isOpen) {
    return null;
  }

  const handleDelete =
    async () => {
      setLoading(
        true,
      );

      try {
        await onDelete();
      } finally {
        setLoading(
          false,
        );
      }
    };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!loading) {
          onClose();
        }
      }}
    >
      <View
        style={
          styles.modalOverlay
        }
      >
        <Pressable
          style={
            styles.modalBackdrop
          }
          onPress={() => {
            if (!loading) {
              onClose();
            }
          }}
        />

        <View
          style={[
            styles.deleteModal,
            {
              backgroundColor:
                dark
                  ? "#130a1c"
                  : "#ffffff",
              borderColor:
                dark
                  ? "#2d1b3b"
                  : "#e2e8f0",
            },
          ]}
        >
          <View
            style={[
              styles.modalHeader,
              {
                borderBottomColor:
                  dark
                    ? "#2d1b3b"
                    : "#e2e8f0",
              },
            ]}
          >
            <Text
              style={
                styles.deleteTitle
              }
            >
              Delete Account
            </Text>

            <Pressable
              onPress={
                onClose
              }
              disabled={
                loading
              }
              style={
                styles.closeButton
              }
            >
              <X
                size={20}
                color={
                  dark
                    ? "#94a3b8"
                    : "#64748b"
                }
              />
            </Pressable>
          </View>

          <View
            style={
              styles.deleteContent
            }
          >
            <Text
              style={[
                styles.deleteQuestion,
                {
                  color:
                    dark
                      ? "#f8fafc"
                      : "#0f172a",
                },
              ]}
            >
              Are you absolutely sure you want to delete your account?
            </Text>

            <Text
              style={[
                styles.deleteDescription,
                {
                  color:
                    dark
                      ? "#94a3b8"
                      : "#64748b",
                },
              ]}
            >
              This action cannot be undone. This will permanently delete your account, posts, followers, and all associated data.
            </Text>

            <View
              style={
                styles.confirmField
              }
            >
              <Text
                style={[
                  styles.fieldLabel,
                  {
                    color:
                      dark
                        ? "#94a3b8"
                        : "#64748b",
                  },
                ]}
              >
                Type "DELETE" to confirm
              </Text>

              <TextInput
                value={
                  confirmText
                }
                onChangeText={
                  setConfirmText
                }
                placeholder="DELETE"
                placeholderTextColor={
                  dark
                    ? "#64748b"
                    : "#94a3b8"
                }
                autoCapitalize="characters"
                editable={
                  !loading
                }
                style={[
                  styles.textInput,
                  {
                    backgroundColor:
                      dark
                        ? "#0a0510"
                        : "#f8fafc",
                    borderColor:
                      dark
                        ? "#2d1b3b"
                        : "#e2e8f0",
                    color:
                      dark
                        ? "#f8fafc"
                        : "#0f172a",
                  },
                ]}
              />
            </View>

            <Pressable
              onPress={() =>
                void handleDelete()
              }
              disabled={
                confirmText !==
                  "DELETE" ||
                loading
              }
              style={[
                styles.deleteButton,
                (
                  confirmText !==
                    "DELETE" ||
                  loading
                ) &&
                  styles.disabledButton,
              ]}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#ffffff"
                />
              ) : (
                <Text
                  style={
                    styles.deleteButtonText
                  }
                >
                  Permanently Delete Account
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const AccountSettings =
  () => {
    const {
      user,
      settings,
    } = useSelector(
      (state: RootState) =>
        state.auth,
    );

    const dispatch =
      useDispatch<AppDispatch>();

    const {
      toast,
    } = useToast();

    const {
      effectiveTheme,
    } = useTheme();

    const [
      isDeleteModalOpen,
      setDeleteModalOpen,
    ] = useState(false);

    const [
      downloadLoading,
      setDownloadLoading,
    ] = useState(false);

    const dark =
      effectiveTheme ===
      "dark";

    const handleUpdate =
      async (
        category: string,
        key: string,
        value: boolean,
      ) => {
        const updates = {
          [category]: {
            [key]: value,
          },
        };

        dispatch(
          optimisticUpdateSetting(
            updates,
          ),
        );

        try {
          await dispatch(
            updateSettings(
              updates,
            ),
          ).unwrap();
        } catch {
          toast({
            variant:
              "error",
            title:
              "Error",
            description:
              "Failed to update setting",
          });
        }
      };

    const handleDownloadData =
      async () => {
        setDownloadLoading(
          true,
        );

        try {
          toast({
            title:
              "Processing...",
            description:
              "Aggregating your data...",
            variant:
              "info",
          });

          /*
           * Keep the original backend endpoint.
           *
           * On React Native, the browser Blob/createObjectURL
           * download flow does not exist. We receive the JSON
           * data through Axios, serialize it into a local file,
           * then open the native share/save sheet.
           */
          const response =
            await api.get(
              "/api/settings/download-data",
            );

          const data =
            response.data;

          const json =
            typeof data ===
            "string"
              ? data
              : JSON.stringify(
                  data,
                  null,
                  2,
                );

          const filename =
            `snapgram_data_${
              user?.username ||
              "user"
            }.json`;

          const fileUri =
            `${FileSystem.cacheDirectory}${filename}`;

          await FileSystem.writeAsStringAsync(
            fileUri,
            json,
            {
              encoding:
                FileSystem.EncodingType.UTF8,
            },
          );

          const sharingAvailable =
            await Sharing.isAvailableAsync();

          if (
            sharingAvailable
          ) {
            await Sharing.shareAsync(
              fileUri,
              {
                mimeType:
                  "application/json",
                dialogTitle:
                  "Save SnapGram AI data",
                UTI:
                  "public.json",
              },
            );
          }

          toast({
            title:
              "Success",
            description:
              "Data downloaded successfully",
            variant:
              "success",
          });
        } catch (
          error
        ) {
          console.error(
            "Failed to download account data:",
            error,
          );

          toast({
            title:
              "Error",
            description:
              "Failed to download data",
            variant:
              "error",
          });
        } finally {
          setDownloadLoading(
            false,
          );
        }
      };

    const handleDeleteAccount =
      async () => {
        try {
          await api.delete(
            "/api/users/me",
          );

          dispatch(
            logout(),
          );

          setDeleteModalOpen(
            false,
          );
        } catch {
          toast({
            variant:
              "error",
            title:
              "Error",
            description:
              "Failed to delete account",
          });
        }
      };

    return (
      <>
        <ScrollView
          style={[
            styles.container,
            {
              backgroundColor:
                dark
                  ? "#0a0510"
                  : "#f8fafc",
            },
          ]}
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <View>
            <Text
              style={[
                styles.pageTitle,
                {
                  color:
                    dark
                      ? "#f8fafc"
                      : "#0f172a",
                },
              ]}
            >
              Account Center
            </Text>

            <Text
              style={[
                styles.pageDescription,
                {
                  color:
                    dark
                      ? "#94a3b8"
                      : "#64748b",
                },
              ]}
            >
              Manage your personal information, security, and account data.
            </Text>
          </View>

          <SettingsCard
            title="Personal Information"
            dark={dark}
          >
            <InfoRow
              label="Email"
              value={
                user?.email ||
                ""
              }
              dark={dark}
            />

            <InfoRow
              label="Username"
              value={`@${
                user?.username ||
                ""
              }`}
              dark={dark}
            />
          </SettingsCard>

          <SettingsCard
            title="Security"
            dark={dark}
          >
            <SettingToggle
              label="Two-Factor Authentication"
              description="Require a code when logging in from an unrecognized device."
              checked={
                settings
                  ?.security
                  ?.twoFactorEnabled ||
                false
              }
              onChange={(
                value,
              ) =>
                handleUpdate(
                  "security",
                  "twoFactorEnabled",
                  value,
                )
              }
            />

            <SettingToggle
              label="Biometric Lock"
              description="Use Face ID or Fingerprint to unlock the app."
              checked={
                settings
                  ?.security
                  ?.biometricLock ||
                false
              }
              onChange={(
                value,
              ) =>
                handleUpdate(
                  "security",
                  "biometricLock",
                  value,
                )
              }
            />
          </SettingsCard>

          <SettingsCard
            title="Data & Export"
            dark={dark}
          >
            <View
              style={
                styles.exportBlock
              }
            >
              <Text
                style={[
                  styles.exportTitle,
                  {
                    color:
                      dark
                        ? "#f8fafc"
                        : "#0f172a",
                  },
                ]}
              >
                Download Account Data
              </Text>

              <Text
                style={[
                  styles.exportDescription,
                  {
                    color:
                      dark
                        ? "#94a3b8"
                        : "#64748b",
                  },
                ]}
              >
                Get a copy of everything you've shared on SnapGram AI.
              </Text>

              <Pressable
                onPress={() =>
                  void handleDownloadData()
                }
                disabled={
                  downloadLoading
                }
                style={[
                  styles.exportButton,
                  downloadLoading &&
                    styles.disabledButton,
                  {
                    backgroundColor:
                      dark
                        ? "#0a0510"
                        : "#f8fafc",
                    borderColor:
                      dark
                        ? "#2d1b3b"
                        : "#e2e8f0",
                  },
                ]}
              >
                {downloadLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      dark
                        ? "#f8fafc"
                        : "#0f172a"
                    }
                  />
                ) : (
                  <Download
                    size={17}
                    color={
                      dark
                        ? "#f8fafc"
                        : "#0f172a"
                    }
                  />
                )}

                <Text
                  style={[
                    styles.exportButtonText,
                    {
                      color:
                        dark
                          ? "#f8fafc"
                          : "#0f172a",
                    },
                  ]}
                >
                  Request Data Export
                </Text>
              </Pressable>
            </View>
          </SettingsCard>

          <View
            style={[
              styles.dangerSection,
              {
                backgroundColor:
                  dark
                    ? "#130a1c"
                    : "#ffffff",
              },
            ]}
          >
            <View
              style={
                styles.dangerHeader
              }
            >
              <ShieldAlert
                size={20}
                color="#ef4444"
              />

              <Text
                style={
                  styles.dangerTitle
                }
              >
                Danger Zone
              </Text>
            </View>

            <View
              style={
                styles.dangerContent
              }
            >
              <View
                style={
                  styles.dangerCopy
                }
              >
                <Text
                  style={[
                    styles.exportTitle,
                    {
                      color:
                        dark
                          ? "#f8fafc"
                          : "#0f172a",
                    },
                  ]}
                >
                  Delete Account
                </Text>

                <Text
                  style={[
                    styles.exportDescription,
                    {
                      color:
                        dark
                          ? "#94a3b8"
                          : "#64748b",
                    },
                  ]}
                >
                  Permanently delete your profile and posts.
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setDeleteModalOpen(
                    true,
                  )
                }
                style={
                  styles.openDeleteButton
                }
              >
                <Text
                  style={
                    styles.openDeleteText
                  }
                >
                  Delete Account
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <DeleteAccountModal
          isOpen={
            isDeleteModalOpen
          }
          onClose={() =>
            setDeleteModalOpen(
              false,
            )
          }
          onDelete={
            handleDeleteAccount
          }
        />
      </>
    );
  };

const SettingsCard = ({
  title,
  dark,
  children,
}: {
  title: string;
  dark: boolean;
  children: React.ReactNode;
}) => (
  <View
    style={[
      styles.card,
      {
        backgroundColor:
          dark
            ? "#130a1c"
            : "#ffffff",
        borderColor:
          dark
            ? "#2d1b3b"
            : "#e2e8f0",
      },
    ]}
  >
    <Text
      style={[
        styles.cardTitle,
        {
          color:
            dark
              ? "#f8fafc"
              : "#0f172a",
          borderBottomColor:
            dark
              ? "#2d1b3b"
              : "#e2e8f0",
        },
      ]}
    >
      {title}
    </Text>

    {children}
  </View>
);

const InfoRow = ({
  label,
  value,
  dark,
}: {
  label: string;
  value: string;
  dark: boolean;
}) => (
  <View
    style={
      styles.infoRow
    }
  >
    <Text
      style={[
        styles.infoLabel,
        {
          color:
            dark
              ? "#94a3b8"
              : "#64748b",
        },
      ]}
    >
      {label}
    </Text>

    <Text
      style={[
        styles.infoValue,
        {
          color:
            dark
              ? "#f8fafc"
              : "#0f172a",
        },
      ]}
      numberOfLines={2}
    >
      {value}
    </Text>
  </View>
);

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },

    content: {
      padding: 16,
      paddingBottom: 40,
      gap: 20,
    },

    pageTitle: {
      fontSize: 26,
      fontWeight: "800",
    },

    pageDescription: {
      marginTop: 5,
      fontSize: 14,
      lineHeight: 20,
    },

    card: {
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
    },

    cardTitle: {
      fontSize: 17,
      fontWeight: "800",
      paddingBottom: 10,
      marginBottom: 2,
      borderBottomWidth: 1,
    },

    infoRow: {
      minHeight: 52,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: 12,
    },

    infoLabel: {
      fontSize: 13,
    },

    infoValue: {
      flex: 1,
      textAlign:
        "right",
      fontSize: 13,
      fontWeight: "700",
    },

    exportBlock: {
      paddingVertical: 4,
    },

    exportTitle: {
      fontSize: 14,
      fontWeight: "700",
    },

    exportDescription: {
      marginTop: 4,
      marginBottom: 14,
      fontSize: 12,
      lineHeight: 17,
    },

    exportButton: {
      alignSelf:
        "flex-start",

      minHeight: 42,

      flexDirection:
        "row",
      alignItems:
        "center",

      gap: 8,

      paddingHorizontal: 14,

      borderWidth: 1,
      borderRadius: 12,
    },

    exportButtonText: {
      fontSize: 12,
      fontWeight: "700",
    },

    dangerSection: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        "rgba(239,68,68,0.35)",

      padding: 16,
    },

    dangerHeader: {
      minHeight: 40,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,

      borderBottomWidth: 1,
      borderBottomColor:
        "rgba(239,68,68,0.20)",
    },

    dangerTitle: {
      color:
        "#ef4444",
      fontSize: 17,
      fontWeight: "800",
    },

    dangerContent: {
      paddingTop: 14,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      gap: 14,
    },

    dangerCopy: {
      flex: 1,
    },

    openDeleteButton: {
      minHeight: 40,

      alignItems:
        "center",
      justifyContent:
        "center",

      paddingHorizontal: 12,

      borderRadius: 11,

      backgroundColor:
        "rgba(239,68,68,0.10)",
    },

    openDeleteText: {
      color:
        "#ef4444",
      fontSize: 11,
      fontWeight: "800",
    },

    modalOverlay: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 16,
    },

    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(0,0,0,0.55)",
    },

    deleteModal: {
      width: "100%",
      maxWidth: 460,

      borderRadius: 20,
      borderWidth: 1,

      overflow:
        "hidden",

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 14,
      },
      shadowOpacity: 0.22,
      shadowRadius: 28,
      elevation: 16,
    },

    modalHeader: {
      minHeight: 58,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      paddingHorizontal: 16,

      borderBottomWidth: 1,
    },

    deleteTitle: {
      color:
        "#ef4444",
      fontSize: 17,
      fontWeight: "800",
    },

    closeButton: {
      width: 40,
      height: 40,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 20,
    },

    deleteContent: {
      padding: 18,
      gap: 14,
    },

    deleteQuestion: {
      fontSize: 15,
      lineHeight: 21,
      fontWeight: "700",
    },

    deleteDescription: {
      fontSize: 12,
      lineHeight: 18,
    },

    confirmField: {
      gap: 7,
    },

    fieldLabel: {
      fontSize: 12,
      fontWeight: "600",
    },

    textInput: {
      minHeight: 46,

      borderWidth: 1,
      borderRadius: 12,

      paddingHorizontal: 12,

      fontSize: 14,
    },

    deleteButton: {
      minHeight: 48,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 12,

      backgroundColor:
        "#ef4444",
    },

    deleteButtonText: {
      color:
        "#ffffff",
      fontSize: 13,
      fontWeight: "800",
    },

    disabledButton: {
      opacity: 0.50,
    },
  });

export default AccountSettings;