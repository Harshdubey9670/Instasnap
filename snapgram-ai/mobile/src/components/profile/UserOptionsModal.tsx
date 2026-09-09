import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { isAxiosError } from "axios";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { useDispatch, useSelector } from "react-redux";

import api from "../../services/api";
import { useTheme } from "../../contexts/ThemeContext";
import { useToast } from "../ui/Toast";
import {
  updateBlockedUsers,
  updateCloseFriends,
  updateFollowing,
  updateMutedUsers,
  updateRestrictedUsers,
} from "../../store/authSlice";
import type { RootState } from "../../store/store";

type RelationshipEndpoint =
  | "block"
  | "restrict"
  | "close-friends"
  | "mute"
  | "hide-content";

interface TargetUser {
  _id?: string | number;
  id?: string | number;
  username?: string;
}

interface UserRelationshipState {
  blockedUsers?: unknown[];
  mutedUsers?: unknown[];
  restrictedUsers?: unknown[];
  closeFriends?: unknown[];
}

interface LocalRelations {
  isBlocked: boolean;
  isMuted: boolean;
  isRestricted: boolean;
  isCloseFriend: boolean;
}

interface RelationshipResponse {
  success?: boolean;
  message?: string;
  blockedUsers?: unknown[];
  restrictedUsers?: unknown[];
  mutedUsers?: unknown[];
  closeFriends?: unknown[];
  following?: unknown[];
  isBlocked?: boolean;
  isRestricted?: boolean;
  isMuted?: boolean;
  isCloseFriend?: boolean;
}

interface ErrorResponse {
  message?: string;
}

export interface UserOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: TargetUser | null | undefined;
  onActionComplete?: (
    endpoint: RelationshipEndpoint,
  ) => void;
}

interface OptionButtonProps {
  label: string;
  color: string;
  borderColor: string;
  loading: boolean;
  onPress: () => void;
}

const getUserId = (
  value: unknown,
): string | undefined => {
  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return value.toString();
  }

  if (value && typeof value === "object") {
    const possibleUser = value as {
      _id?: unknown;
      id?: unknown;
    };

    const id =
      possibleUser._id ??
      possibleUser.id;

    if (
      typeof id === "string" ||
      typeof id === "number"
    ) {
      return id.toString();
    }
  }

  return undefined;
};

const containsUser = (
  values: unknown[] | undefined,
  targetId: string,
): boolean =>
  Array.isArray(values) &&
  values.some(
    (value) =>
      getUserId(value) === targetId,
  );

const getErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (isAxiosError<ErrorResponse>(error)) {
    return (
      error.response?.data?.message ||
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};

const OptionButton = ({
  label,
  color,
  borderColor,
  loading,
  onPress,
}: OptionButtonProps) => (
  <Pressable
    onPress={onPress}
    disabled={loading}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{
      disabled: loading,
    }}
    style={({ pressed }) => [
      styles.optionButton,
      {
        borderColor,
      },
      pressed &&
        !loading &&
        styles.pressedButton,
      loading && styles.disabledButton,
    ]}
  >
    <Text
      style={[
        styles.optionText,
        {
          color,
        },
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

export const UserOptionsModal = ({
  isOpen,
  onClose,
  user,
  onActionComplete,
}: UserOptionsModalProps) => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { effectiveTheme } = useTheme();

  const authUser = useSelector(
    (state: RootState) =>
      state.auth.user,
  ) as UserRelationshipState | null;

  const animation = useRef(
    new Animated.Value(0),
  ).current;

  const [loading, setLoading] =
    useState(false);

  const [
    showReportInput,
    setShowReportInput,
  ] = useState(false);

  const [
    reportReason,
    setReportReason,
  ] = useState("");

  const [
    localRelations,
    setLocalRelations,
  ] = useState<LocalRelations>({
    isBlocked: false,
    isMuted: false,
    isRestricted: false,
    isCloseFriend: false,
  });

  const targetId = (
    user?._id ?? user?.id
  )?.toString();

  const username =
    user?.username || "User";

  const darkMode =
    effectiveTheme === "dark";

  const colors = useMemo(
    () => ({
      background: darkMode
        ? "rgba(19,10,28,0.98)"
        : "rgba(255,255,255,0.98)",
      surface: darkMode
        ? "#1e112c"
        : "#f1f5f9",
      textPrimary: darkMode
        ? "#f8fafc"
        : "#0f172a",
      textSecondary: darkMode
        ? "#94a3b8"
        : "#64748b",
      border: darkMode
        ? "#2d1b3b"
        : "#e2e8f0",
      overlay:
        "rgba(0,0,0,0.70)",
    }),
    [darkMode],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    animation.setValue(0);

    Animated.spring(animation, {
      toValue: 1,
      friction: 8,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [
    animation,
    isOpen,
  ]);

  useEffect(() => {
    if (
      !isOpen ||
      !user ||
      !targetId
    ) {
      return;
    }

    setLocalRelations({
      isBlocked: containsUser(
        authUser?.blockedUsers,
        targetId,
      ),
      isMuted: containsUser(
        authUser?.mutedUsers,
        targetId,
      ),
      isRestricted: containsUser(
        authUser?.restrictedUsers,
        targetId,
      ),
      isCloseFriend: containsUser(
        authUser?.closeFriends,
        targetId,
      ),
    });
  }, [
    authUser,
    isOpen,
    targetId,
    user,
  ]);

  const toggleOptimisticRelation =
    useCallback(
      (
        endpoint: RelationshipEndpoint,
      ) => {
        setLocalRelations((current) => {
          switch (endpoint) {
            case "block":
              return {
                ...current,
                isBlocked:
                  !current.isBlocked,
              };

            case "restrict":
              return {
                ...current,
                isRestricted:
                  !current.isRestricted,
              };

            case "mute":
              return {
                ...current,
                isMuted:
                  !current.isMuted,
              };

            case "close-friends":
              return {
                ...current,
                isCloseFriend:
                  !current.isCloseFriend,
              };

            default:
              return current;
          }
        });
      },
      [],
    );

  const synchronizeResponse =
    useCallback(
      (data: RelationshipResponse) => {
        if (data.blockedUsers) {
          dispatch(
            updateBlockedUsers(
              data.blockedUsers,
            ),
          );
        }

        if (data.restrictedUsers) {
          dispatch(
            updateRestrictedUsers(
              data.restrictedUsers,
            ),
          );
        }

        if (data.mutedUsers) {
          dispatch(
            updateMutedUsers(
              data.mutedUsers,
            ),
          );
        }

        if (data.closeFriends) {
          dispatch(
            updateCloseFriends(
              data.closeFriends,
            ),
          );
        }

        if (data.following) {
          dispatch(
            updateFollowing(
              data.following,
            ),
          );
        }

        setLocalRelations(
          (current) => ({
            ...current,

            isBlocked:
              typeof data.isBlocked ===
              "boolean"
                ? data.isBlocked
                : current.isBlocked,

            isRestricted:
              typeof data.isRestricted ===
              "boolean"
                ? data.isRestricted
                : current.isRestricted,

            isMuted:
              typeof data.isMuted ===
              "boolean"
                ? data.isMuted
                : current.isMuted,

            isCloseFriend:
              typeof data.isCloseFriend ===
              "boolean"
                ? data.isCloseFriend
                : current.isCloseFriend,
          }),
        );
      },
      [dispatch],
    );

  const handleAction = useCallback(
    async (
      actionLabel: string,
      endpoint: RelationshipEndpoint,
    ) => {
      if (
        loading ||
        !targetId
      ) {
        return;
      }

      setLoading(true);

      const usesOptimisticUpdate = [
        "block",
        "restrict",
        "mute",
        "close-friends",
      ].includes(endpoint);

      if (usesOptimisticUpdate) {
        toggleOptimisticRelation(
          endpoint,
        );
      }

      try {
        const response =
          await api.post<RelationshipResponse>(
            `/api/users/${targetId}/${endpoint}`,
          );

        synchronizeResponse(
          response.data,
        );

        toast({
          variant: "success",
          title: "Success",
          description:
            response.data?.message ||
            `${actionLabel} updated`,
        });

        onActionComplete?.(endpoint);
      } catch (error) {
        if (usesOptimisticUpdate) {
          toggleOptimisticRelation(
            endpoint,
          );
        }

        toast({
          variant: "error",
          title: "Error",
          description: getErrorMessage(
            error,
            "Failed to update status",
          ),
        });
      } finally {
        setLoading(false);
      }
    },
    [
      loading,
      onActionComplete,
      synchronizeResponse,
      targetId,
      toast,
      toggleOptimisticRelation,
    ],
  );

  const handleReportSubmit =
    useCallback(async () => {
      const reason =
        reportReason.trim();

      if (
        !reason ||
        !targetId ||
        loading
      ) {
        return;
      }

      setLoading(true);

      try {
        const response =
          await api.post<RelationshipResponse>(
            `/api/users/${targetId}/report`,
            {
              reason,
            },
          );

        toast({
          variant: "success",
          title: "Report Submitted",
          description:
            response.data?.message,
        });

        setShowReportInput(false);
        setReportReason("");
        onClose();
      } catch (error) {
        toast({
          variant: "error",
          title: "Report Failed",
          description: getErrorMessage(
            error,
            "Could not submit report",
          ),
        });
      } finally {
        setLoading(false);
      }
    }, [
      loading,
      onClose,
      reportReason,
      targetId,
      toast,
    ]);

  const handleCopyLink =
    useCallback(async () => {
      if (!targetId) {
        return;
      }

      try {
        const profileUrl =
          Linking.createURL(
            `/app/profile/${targetId}`,
          );

        await Clipboard.setStringAsync(
          profileUrl,
        );

        toast({
          variant: "success",
          title: "Copied",
          description:
            "Profile link copied to clipboard",
        });

        onClose();
      } catch (error) {
        toast({
          variant: "error",
          title: "Copy Failed",
          description:
            "Could not copy profile link",
        });
      }
    }, [
      onClose,
      targetId,
      toast,
    ]);

  if (
    !user ||
    !targetId
  ) {
    return null;
  }

  const scale =
    animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.95, 1],
    });

  const translateY =
    animation.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
    });

  return (
    <Modal
      visible={isOpen}
      transparent
      statusBarTranslucent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <Pressable
          style={[
            styles.overlay,
            {
              backgroundColor:
                colors.overlay,
            },
          ]}
          onPress={onClose}
        >
          <Animated.View
            style={[
              styles.modalCard,
              {
                backgroundColor:
                  colors.background,
                borderColor:
                  colors.border,
                opacity: animation,
                transform: [
                  { scale },
                  { translateY },
                ],
              },
            ]}
          >
            <Pressable
              onPress={(event) =>
                event.stopPropagation()
              }
            >
              {showReportInput ? (
                <View
                  style={
                    styles.reportContent
                  }
                >
                  <Text
                    style={[
                      styles.reportTitle,
                      {
                        color:
                          colors.textPrimary,
                      },
                    ]}
                  >
                    Report @{username}
                  </Text>

                  <TextInput
                    value={reportReason}
                    onChangeText={
                      setReportReason
                    }
                    placeholder="Reason for reporting (e.g. Spam, Harassment, Inappropriate)..."
                    placeholderTextColor={
                      colors.textSecondary
                    }
                    multiline
                    maxLength={1000}
                    textAlignVertical="top"
                    editable={!loading}
                    accessibilityLabel="Reason for reporting"
                    style={[
                      styles.reportInput,
                      {
                        color:
                          colors.textPrimary,
                        backgroundColor:
                          colors.surface,
                        borderColor:
                          colors.border,
                      },
                    ]}
                  />

                  <View
                    style={
                      styles.reportActions
                    }
                  >
                    <Pressable
                      onPress={() =>
                        setShowReportInput(
                          false,
                        )
                      }
                      disabled={loading}
                      style={({ pressed }) => [
                        styles.reportButton,
                        {
                          backgroundColor:
                            colors.surface,
                          borderColor:
                            colors.border,
                        },
                        pressed &&
                          styles.pressedButton,
                        loading &&
                          styles.disabledButton,
                      ]}
                    >
                      <Text
                        style={[
                          styles.cancelText,
                          {
                            color:
                              colors.textSecondary,
                          },
                        ]}
                      >
                        Cancel
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        void handleReportSubmit()
                      }
                      disabled={
                        loading ||
                        !reportReason.trim()
                      }
                      style={({ pressed }) => [
                        styles.reportButton,
                        styles.submitButton,
                        pressed &&
                          styles.pressedButton,
                        (loading ||
                          !reportReason.trim()) &&
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
                            styles.submitText
                          }
                        >
                          Submit
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : (
                <ScrollView
                  showsVerticalScrollIndicator={
                    false
                  }
                  bounces={false}
                >
                  <OptionButton
                    label={
                      localRelations.isBlocked
                        ? "Unblock User"
                        : "Block User"
                    }
                    color="#ef4444"
                    borderColor={
                      colors.border
                    }
                    loading={loading}
                    onPress={() =>
                      void handleAction(
                        localRelations.isBlocked
                          ? "Unblock"
                          : "Block",
                        "block",
                      )
                    }
                  />

                  <OptionButton
                    label={
                      localRelations.isRestricted
                        ? "Unrestrict User"
                        : "Restrict User"
                    }
                    color="#f87171"
                    borderColor={
                      colors.border
                    }
                    loading={loading}
                    onPress={() =>
                      void handleAction(
                        localRelations.isRestricted
                          ? "Unrestrict"
                          : "Restrict",
                        "restrict",
                      )
                    }
                  />

                  <OptionButton
                    label={
                      localRelations.isCloseFriend
                        ? "⭐ Remove from Close Friends"
                        : "⭐ Add to Close Friends"
                    }
                    color="#34d399"
                    borderColor={
                      colors.border
                    }
                    loading={loading}
                    onPress={() =>
                      void handleAction(
                        localRelations.isCloseFriend
                          ? "Remove Close Friend"
                          : "Add Close Friend",
                        "close-friends",
                      )
                    }
                  />

                  <OptionButton
                    label={
                      localRelations.isMuted
                        ? "Unmute User"
                        : "Mute User"
                    }
                    color={
                      colors.textPrimary
                    }
                    borderColor={
                      colors.border
                    }
                    loading={loading}
                    onPress={() =>
                      void handleAction(
                        localRelations.isMuted
                          ? "Unmute"
                          : "Mute",
                        "mute",
                      )
                    }
                  />

                  <OptionButton
                    label="Hide User Content"
                    color={
                      colors.textPrimary
                    }
                    borderColor={
                      colors.border
                    }
                    loading={loading}
                    onPress={() =>
                      void handleAction(
                        "Hide Content",
                        "hide-content",
                      )
                    }
                  />

                  <OptionButton
                    label="Report Profile"
                    color="#ef4444"
                    borderColor={
                      colors.border
                    }
                    loading={loading}
                    onPress={() =>
                      setShowReportInput(
                        true,
                      )
                    }
                  />

                  <OptionButton
                    label="Copy profile URL"
                    color={
                      colors.textPrimary
                    }
                    borderColor={
                      colors.border
                    }
                    loading={loading}
                    onPress={() =>
                      void handleCopyLink()
                    }
                  />

                  <OptionButton
                    label="Cancel"
                    color={
                      colors.textSecondary
                    }
                    borderColor="transparent"
                    loading={false}
                    onPress={onClose}
                  />
                </ScrollView>
              )}
            </Pressable>
          </Animated.View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  modalCard: {
    width: "100%",
    maxWidth: 384,
    maxHeight: "88%",
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },

  optionButton: {
    width: "100%",
    minHeight: 51,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },

  optionText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  reportContent: {
    padding: 20,
    gap: 16,
  },

  reportTitle: {
    fontSize: 16,
    fontWeight: "800",
  },

  reportInput: {
    width: "100%",
    minHeight: 104,
    maxHeight: 170,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 13,
    lineHeight: 19,
  },

  reportActions: {
    flexDirection: "row",
    gap: 10,
  },

  reportButton: {
    minHeight: 44,
    flex: 1,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  submitButton: {
    backgroundColor: "#a855f7",
    borderColor: "#a855f7",
  },

  cancelText: {
    fontSize: 13,
    fontWeight: "800",
  },

  submitText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },

  pressedButton: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  disabledButton: {
    opacity: 0.5,
  },
});