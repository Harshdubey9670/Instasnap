import React, {
  useEffect,
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
  Key,
  LogOut,
  Monitor,
  Shield,
  Smartphone,
  X,
} from "lucide-react-native";
import {
  useDispatch,
  useSelector,
} from "react-redux";

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
  useTheme,
} from "../../contexts/ThemeContext";

interface Session {
  _id: string;
  deviceString?: string;
  lastActive: string;
  ip?: string;
}

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal = ({
  isOpen,
  onClose,
}: ChangePasswordModalProps) => {
  const {
    toast,
  } = useToast();

  const {
    effectiveTheme,
  } = useTheme();

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const dark =
    effectiveTheme ===
    "dark";

  const handleSubmit =
    async () => {
      if (
        newPassword !==
        confirmPassword
      ) {
        toast({
          variant:
            "error",
          title:
            "Error",
          description:
            "New passwords do not match",
        });

        return;
      }

      setLoading(
        true,
      );

      try {
        await api.put(
          "/api/auth/change-password",
          {
            currentPassword,
            newPassword,
          },
        );

        toast({
          variant:
            "success",
          title:
            "Success",
          description:
            "Password changed successfully",
        });

        setCurrentPassword(
          "",
        );
        setNewPassword(
          "",
        );
        setConfirmPassword(
          "",
        );

        onClose();
      } catch (
        error: any
      ) {
        toast({
          variant:
            "error",
          title:
            "Error",
          description:
            error?.response
              ?.data
              ?.message ||
            "Failed to change password",
        });
      } finally {
        setLoading(
          false,
        );
      }
    };

  return (
    <Modal
      visible={isOpen}
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
            styles.passwordModal,
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
              style={[
                styles.modalTitle,
                {
                  color:
                    dark
                      ? "#f8fafc"
                      : "#0f172a",
                },
              ]}
            >
              Change Password
            </Text>

            <Pressable
              onPress={
                onClose
              }
              disabled={
                loading
              }
              hitSlop={8}
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

          <ScrollView
            contentContainerStyle={
              styles.passwordForm
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={
              false
            }
          >
            <PasswordField
              label="Current Password"
              value={
                currentPassword
              }
              onChangeText={
                setCurrentPassword
              }
              editable={
                !loading
              }
              dark={dark}
            />

            <PasswordField
              label="New Password"
              value={
                newPassword
              }
              onChangeText={
                setNewPassword
              }
              editable={
                !loading
              }
              minLength={6}
              dark={dark}
            />

            <PasswordField
              label="Confirm New Password"
              value={
                confirmPassword
              }
              onChangeText={
                setConfirmPassword
              }
              editable={
                !loading
              }
              minLength={6}
              dark={dark}
            />

            <Pressable
              onPress={() =>
                void handleSubmit()
              }
              disabled={
                loading ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              style={[
                styles.primaryButton,
                (
                  loading ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
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
                    styles.primaryButtonText
                  }
                >
                  Change Password
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

interface PasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (
    value: string,
  ) => void;
  editable: boolean;
  minLength?: number;
  dark: boolean;
}

const PasswordField = ({
  label,
  value,
  onChangeText,
  editable,
  minLength,
  dark,
}: PasswordFieldProps) => (
  <View
    style={
      styles.field
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
      {label}
    </Text>

    <TextInput
      value={value}
      onChangeText={
        onChangeText
      }
      secureTextEntry
      editable={
        editable
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
);

export const SecuritySettings =
  () => {
    const {
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
      isPasswordModalOpen,
      setPasswordModalOpen,
    ] = useState(false);

    const [
      sessions,
      setSessions,
    ] = useState<
      Session[]
    >([]);

    const [
      sessionsLoading,
      setSessionsLoading,
    ] = useState(true);

    const dark =
      effectiveTheme ===
      "dark";

    const fetchSessions =
      async () => {
        try {
          const response =
            await api.get(
              "/api/auth/sessions",
            );

          setSessions(
            response.data
              ?.data || [],
          );
        } catch (
          error
        ) {
          console.error(
            "Failed to fetch sessions",
            error,
          );
        } finally {
          setSessionsLoading(
            false,
          );
        }
      };

    useEffect(() => {
      void fetchSessions();
    }, []);

    const handleUpdate2FA =
      async () => {
        const newValue =
          !Boolean(
            settings
              ?.security
              ?.twoFactorEnabled,
          );

        const updates = {
          security: {
            twoFactorEnabled:
              newValue,
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

          toast({
            variant:
              "success",
            title:
              "2FA Updated",
            description:
              newValue
                ? "Two-factor authentication enabled"
                : "Two-factor authentication disabled",
          });
        } catch {
          toast({
            variant:
              "error",
            title:
              "Error",
            description:
              "Failed to update 2FA",
          });
        }
      };

    const handleLogoutSession =
      async (
        sessionId: string,
      ) => {
        try {
          await api.delete(
            `/api/auth/sessions/${sessionId}`,
          );

          setSessions(
            (
              previous,
            ) =>
              previous.filter(
                (
                  session,
                ) =>
                  session._id !==
                  sessionId,
              ),
          );

          toast({
            variant:
              "success",
            title:
              "Success",
            description:
              "Session logged out",
          });
        } catch {
          toast({
            variant:
              "error",
            title:
              "Error",
            description:
              "Failed to logout session",
          });
        }
      };

    const handleLogoutAllOther =
      async () => {
        try {
          await api.delete(
            "/api/auth/sessions",
          );

          toast({
            variant:
              "success",
            title:
              "Success",
            description:
              "Logged out of all other devices",
          });

          await fetchSessions();
        } catch {
          toast({
            variant:
              "error",
            title:
              "Error",
            description:
              "Failed to logout other sessions",
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
          <View
            style={
              styles.titleSection
            }
          >
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
              Security
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
              Keep your account safe and
              secure.
            </Text>
          </View>

          {/* Login Security */}
          <View
            style={[
              styles.section,
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
                styles.sectionTitle,
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
              Login Security
            </Text>

            <Pressable
              onPress={() =>
                setPasswordModalOpen(
                  true,
                )
              }
              style={({ pressed }) => [
                styles.actionRow,
                pressed &&
                  styles.actionPressed,
              ]}
            >
              <View
                style={
                  styles.actionLeft
                }
              >
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor:
                        dark
                          ? "rgba(168,85,247,0.12)"
                          : "rgba(168,85,247,0.10)",
                    },
                  ]}
                >
                  <Key
                    size={20}
                    color="#a855f7"
                  />
                </View>

                <View
                  style={
                    styles.actionCopy
                  }
                >
                  <Text
                    style={[
                      styles.actionTitle,
                      {
                        color:
                          dark
                            ? "#f8fafc"
                            : "#0f172a",
                      },
                    ]}
                  >
                    Change Password
                  </Text>

                  <Text
                    style={[
                      styles.actionDescription,
                      {
                        color:
                          dark
                            ? "#94a3b8"
                            : "#64748b",
                      },
                    ]}
                  >
                    Update your password
                    regularly
                  </Text>
                </View>
              </View>
            </Pressable>

            <Pressable
              onPress={() =>
                void handleUpdate2FA()
              }
              style={({ pressed }) => [
                styles.actionRow,
                pressed &&
                  styles.actionPressed,
              ]}
            >
              <View
                style={
                  styles.actionLeft
                }
              >
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor:
                        "rgba(34,197,94,0.10)",
                    },
                  ]}
                >
                  <Shield
                    size={20}
                    color="#22c55e"
                  />
                </View>

                <View
                  style={
                    styles.actionCopy
                  }
                >
                  <Text
                    style={[
                      styles.actionTitle,
                      {
                        color:
                          dark
                            ? "#f8fafc"
                            : "#0f172a",
                      },
                    ]}
                  >
                    Two-Factor Authentication
                  </Text>

                  <Text
                    style={[
                      styles.actionDescription,
                      {
                        color:
                          dark
                            ? "#94a3b8"
                            : "#64748b",
                      },
                    ]}
                  >
                    {settings
                      ?.security
                      ?.twoFactorEnabled
                      ? "Enabled"
                      : "Add an extra layer of security"}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.switch,
                  settings
                    ?.security
                    ?.twoFactorEnabled
                    ? styles.switchOn
                    : {
                        backgroundColor:
                          dark
                            ? "#0a0510"
                            : "#f8fafc",
                        borderColor:
                          dark
                            ? "#2d1b3b"
                            : "#e2e8f0",
                        borderWidth: 1,
                      },
                ]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    settings
                      ?.security
                      ?.twoFactorEnabled &&
                      styles.switchThumbOn,
                  ]}
                />
              </View>
            </Pressable>
          </View>

          {/* Sessions */}
          <View
            style={[
              styles.section,
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
              style={
                styles.sessionsHeader
              }
            >
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color:
                      dark
                        ? "#f8fafc"
                        : "#0f172a",
                    borderBottomWidth: 0,
                    paddingBottom: 0,
                  },
                ]}
              >
                Active Sessions
              </Text>

              {sessions.length >
              1 ? (
                <Pressable
                  onPress={() =>
                    void handleLogoutAllOther()
                  }
                  style={
                    styles.logoutAllButton
                  }
                >
                  <Text
                    style={
                      styles.logoutAllText
                    }
                  >
                    Log out all other devices
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {sessionsLoading ? (
              <View
                style={
                  styles.loadingContainer
                }
              >
                <ActivityIndicator
                  size="small"
                  color="#a855f7"
                />

                <Text
                  style={[
                    styles.loadingText,
                    {
                      color:
                        dark
                          ? "#94a3b8"
                          : "#64748b",
                    },
                  ]}
                >
                  Loading sessions...
                </Text>
              </View>
            ) : sessions.length ===
              0 ? (
              <Text
                style={[
                  styles.emptyText,
                  {
                    color:
                      dark
                        ? "#94a3b8"
                        : "#64748b",
                  },
                ]}
              >
                No active sessions found.
              </Text>
            ) : (
              <View
                style={
                  styles.sessionsList
                }
              >
                {sessions.map(
                  (
                    session,
                    index,
                  ) => {
                    /*
                     * Preserve the original implementation's
                     * display rule: the latest session is treated
                     * as the current device.
                     */
                    const isCurrent =
                      index ===
                      sessions.length -
                        1;

                    const deviceString =
                      session.deviceString ||
                      "Unknown Device";

                    const isMobile =
                      deviceString
                        .toLowerCase()
                        .includes(
                          "mobile",
                        );

                    const lastActive =
                      new Date(
                        session.lastActive,
                      ).toLocaleString();

                    return (
                      <View
                        key={
                          session._id
                        }
                        style={[
                          styles.sessionRow,
                          isCurrent &&
                            styles.currentSession,
                          {
                            backgroundColor:
                              isCurrent
                                ? dark
                                  ? "#1e112c"
                                  : "#f1f5f9"
                                : "transparent",
                            borderColor:
                              isCurrent
                                ? "rgba(168,85,247,0.30)"
                                : "transparent",
                          },
                        ]}
                      >
                        <View
                          style={
                            styles.sessionLeft
                          }
                        >
                          <View
                            style={[
                              styles.deviceIcon,
                              {
                                backgroundColor:
                                  dark
                                    ? "#0a0510"
                                    : "#f8fafc",
                              },
                            ]}
                          >
                            {isMobile ? (
                              <Smartphone
                                size={20}
                                color={
                                  dark
                                    ? "#94a3b8"
                                    : "#64748b"
                                }
                              />
                            ) : (
                              <Monitor
                                size={20}
                                color={
                                  dark
                                    ? "#94a3b8"
                                    : "#64748b"
                                }
                              />
                            )}
                          </View>

                          <View
                            style={
                              styles.sessionCopy
                            }
                          >
                            <Text
                              style={[
                                styles.deviceName,
                                {
                                  color:
                                    dark
                                      ? "#f8fafc"
                                      : "#0f172a",
                                },
                              ]}
                              numberOfLines={
                                1
                              }
                            >
                              {
                                deviceString
                              }
                            </Text>

                            <Text
                              style={[
                                styles.sessionActivity,
                                {
                                  color:
                                    isCurrent
                                      ? "#22c55e"
                                      : dark
                                        ? "#94a3b8"
                                        : "#64748b",
                                },
                              ]}
                              numberOfLines={
                                2
                              }
                            >
                              {isCurrent
                                ? "Active now (This device)"
                                : `Active: ${lastActive}`}
                            </Text>

                            {session.ip ? (
                              <Text
                                style={[
                                  styles.sessionIp,
                                  {
                                    color:
                                      dark
                                        ? "#64748b"
                                        : "#94a3b8",
                                  },
                                ]}
                              >
                                IP:{" "}
                                {
                                  session.ip
                                }
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        {!isCurrent ? (
                          <Pressable
                            onPress={() =>
                              void handleLogoutSession(
                                session._id,
                              )
                            }
                            style={
                              styles.logoutButton
                            }
                          >
                            <LogOut
                              size={16}
                              color="#ef4444"
                            />

                            <Text
                              style={
                                styles.logoutText
                              }
                            >
                              Log out
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    );
                  },
                )}
              </View>
            )}
          </View>
        </ScrollView>

        <ChangePasswordModal
          isOpen={
            isPasswordModalOpen
          }
          onClose={() =>
            setPasswordModalOpen(
              false,
            )
          }
        />
      </>
    );
  };

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

    titleSection: {
      gap: 5,
      marginBottom: 2,
    },

    pageTitle: {
      fontSize: 26,
      lineHeight: 32,
      fontWeight: "800",
    },

    pageDescription: {
      fontSize: 14,
      lineHeight: 20,
    },

    section: {
      borderWidth: 1,
      borderRadius: 18,
      padding: 16,
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

    sectionTitle: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "800",

      paddingBottom: 10,
      marginBottom: 4,

      borderBottomWidth: 1,
    },

    actionRow: {
      minHeight: 70,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      paddingVertical: 10,
      borderRadius: 12,
    },

    actionPressed: {
      backgroundColor:
        "rgba(148,163,184,0.08)",
    },

    actionLeft: {
      flex: 1,
      minWidth: 0,

      flexDirection:
        "row",
      alignItems:
        "center",
    },

    iconBox: {
      width: 42,
      height: 42,

      borderRadius: 12,

      alignItems:
        "center",
      justifyContent:
        "center",

      marginRight: 12,
    },

    actionCopy: {
      flex: 1,
      minWidth: 0,
    },

    actionTitle: {
      fontSize: 14,
      fontWeight: "700",
    },

    actionDescription: {
      marginTop: 3,
      fontSize: 12,
      lineHeight: 16,
    },

    switch: {
      width: 48,
      height: 24,
      borderRadius: 12,
      justifyContent:
        "center",
      paddingHorizontal: 2,
      marginLeft: 12,
    },

    switchOn: {
      backgroundColor:
        "#a855f7",
    },

    switchThumb: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor:
        "#ffffff",
    },

    switchThumbOn: {
      alignSelf:
        "flex-end",
    },

    sessionsHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: 10,
      marginBottom: 4,
    },

    logoutAllButton: {
      maxWidth: 150,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor:
        "rgba(239,68,68,0.08)",
    },

    logoutAllText: {
      color:
        "#ef4444",
      fontSize: 11,
      fontWeight: "700",
      textAlign:
        "center",
    },

    loadingContainer: {
      minHeight: 90,
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 8,
    },

    loadingText: {
      fontSize: 12,
    },

    emptyText: {
      fontSize: 13,
      paddingVertical: 20,
    },

    sessionsList: {
      gap: 8,
      marginTop: 8,
    },

    sessionRow: {
      minHeight: 76,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      padding: 10,

      borderRadius: 14,
      borderWidth: 1,
    },

    currentSession: {
      borderColor:
        "rgba(168,85,247,0.30)",
    },

    sessionLeft: {
      flex: 1,
      minWidth: 0,

      flexDirection:
        "row",
      alignItems:
        "center",
    },

    deviceIcon: {
      width: 42,
      height: 42,

      borderRadius: 12,

      alignItems:
        "center",
      justifyContent:
        "center",

      marginRight: 11,
    },

    sessionCopy: {
      flex: 1,
      minWidth: 0,
    },

    deviceName: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700",
    },

    sessionActivity: {
      marginTop: 2,
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "600",
    },

    sessionIp: {
      marginTop: 1,
      fontSize: 9,
      lineHeight: 13,
    },

    logoutButton: {
      minHeight: 38,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 4,

      marginLeft: 8,
      paddingHorizontal: 9,

      borderRadius: 10,
      backgroundColor:
        "rgba(239,68,68,0.08)",
    },

    logoutText: {
      color:
        "#ef4444",
      fontSize: 10,
      fontWeight: "700",
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

    passwordModal: {
      width: "100%",
      maxWidth: 450,
      maxHeight: "88%",

      borderWidth: 1,
      borderRadius: 20,

      overflow:
        "hidden",

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: 0.20,
      shadowRadius: 24,
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

    modalTitle: {
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

    passwordForm: {
      padding: 16,
      gap: 16,
    },

    field: {
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

    primaryButton: {
      minHeight: 48,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 12,
      backgroundColor:
        "#a855f7",

      marginTop: 4,
    },

    primaryButtonText: {
      color:
        "#ffffff",
      fontSize: 14,
      fontWeight: "800",
    },

    disabledButton: {
      opacity: 0.50,
    },
  });

export default SecuritySettings;