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
import {
  CheckCircle2,
  EyeOff,
  Flag,
  ShieldAlert,
  Star,
  UserX,
  VolumeX,
  X,
  type LucideIcon,
} from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import { isAxiosError } from "axios";

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

type RelationshipAction =
  | "block"
  | "restrict"
  | "mute"
  | "closeFriends"
  | "hide"
  | "report";

interface TargetUser {
  _id?: string | number;
  id?: string | number;
  username?: string;
}

interface RelationshipState {
  isBlocked: boolean;
  isMuted: boolean;
  isRestricted: boolean;
  isCloseFriend: boolean;
}

interface RelationshipUserState {
  blockedUsers?: unknown[];
  mutedUsers?: unknown[];
  restrictedUsers?: unknown[];
  closeFriends?: unknown[];
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

export interface RelationshipActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: TargetUser | null | undefined;
  onActionComplete?: (
    actionType: RelationshipAction,
  ) => void;
}

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  actionType: RelationshipAction;
  color: string;
  borderColor: string;
  backgroundColor: string;
  loadingAction: RelationshipAction | null;
  active?: boolean;
  fillIcon?: boolean;
  disabled?: boolean;
  textColor?: string;
  onPress: () => void;
}

const getRelationshipId = (
  value: unknown,
): string | undefined => {
  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return value.toString();
  }

  if (value && typeof value === "object") {
    const possibleValue = value as {
      _id?: unknown;
      id?: unknown;
    };

    const identifier =
      possibleValue._id ?? possibleValue.id;

    if (
      typeof identifier === "string" ||
      typeof identifier === "number"
    ) {
      return identifier.toString();
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
      getRelationshipId(value) === targetId,
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

const ActionButton = ({
  icon: Icon,
  label,
  actionType,
  color,
  borderColor,
  backgroundColor,
  loadingAction,
  active = false,
  fillIcon = false,
  disabled = false,
  textColor,
  onPress,
}: ActionButtonProps) => {
  const loading =
    loadingAction === actionType;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        disabled,
        busy: loading,
        selected: active,
      }}
      style={({ pressed }) => [
        styles.actionButton,
        {
          borderColor,
          backgroundColor,
        },
        pressed &&
          !disabled &&
          styles.pressedButton,
        disabled && styles.disabledButton,
      ]}
    >
      <View style={styles.actionLabel}>
        <Icon
          size={18}
          color={color}
          fill={
            fillIcon && active
              ? color
              : "none"
          }
          strokeWidth={2}
        />

        <Text
          style={[
            styles.actionText,
            {
              color: textColor || color,
            },
          ]}
        >
          {label}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="small"
          color={color}
        />
      ) : active ? (
        <CheckCircle2
          size={18}
          color={color}
        />
      ) : null}
    </Pressable>
  );
};

export const RelationshipActionsModal = ({
  isOpen,
  onClose,
  targetUser,
  onActionComplete,
}: RelationshipActionsModalProps) => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { effectiveTheme } = useTheme();

  const authUser = useSelector(
    (state: RootState) => state.auth.user,
  ) as RelationshipUserState | null;

  const animation = useRef(
    new Animated.Value(0),
  ).current;

  const [
    loadingAction,
    setLoadingAction,
  ] = useState<RelationshipAction | null>(
    null,
  );

  const [
    reportReason,
    setReportReason,
  ] = useState("");

  const [
    showReportForm,
    setShowReportForm,
  ] = useState(false);

  const [
    relations,
    setRelations,
  ] = useState<RelationshipState>({
    isBlocked: false,
    isMuted: false,
    isRestricted: false,
    isCloseFriend: false,
  });

  const targetId = (
    targetUser?._id ?? targetUser?.id
  )?.toString();

  const targetUsername =
    targetUser?.username || "User";

  const darkMode =
    effectiveTheme === "dark";

  const colors = useMemo(
    () => ({
      overlay: "rgba(0,0,0,0.72)",
      surface: darkMode
        ? "rgba(19,10,28,0.98)"
        : "rgba(255,255,255,0.98)",
      surfaceSoft: darkMode
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
    }),
    [darkMode],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    animation.setValue(0);

    Animated.timing(animation, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [animation, isOpen]);

  useEffect(() => {
    if (
      !isOpen ||
      !targetUser ||
      !targetId
    ) {
      return;
    }

    setRelations({
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
    targetUser,
  ]);

  const toggleOptimisticState =
    useCallback(
      (actionType: RelationshipAction) => {
        setRelations((current) => {
          switch (actionType) {
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
                isMuted: !current.isMuted,
              };

            case "closeFriends":
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

        setRelations((current) => ({
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
        }));
      },
      [dispatch],
    );

  const handleAction = useCallback(
    async (
      actionType: RelationshipAction,
      endpoint: string,
      successMessage: string,
    ) => {
      if (
        loadingAction !== null ||
        !targetId
      ) {
        return;
      }

      setLoadingAction(actionType);

      const usesOptimisticToggle = [
        "block",
        "restrict",
        "mute",
        "closeFriends",
      ].includes(actionType);

      if (usesOptimisticToggle) {
        toggleOptimisticState(actionType);
      }

      try {
        const response =
          await api.post<RelationshipResponse>(
            endpoint,
          );

        synchronizeResponse(response.data);

        toast({
          variant: "success",
          title: "Success",
          description:
            response.data?.message ||
            successMessage,
        });

        onActionComplete?.(actionType);
      } catch (error) {
        if (usesOptimisticToggle) {
          toggleOptimisticState(actionType);
        }

        toast({
          variant: "error",
          title: "Action Failed",
          description: getErrorMessage(
            error,
            "Failed to update status",
          ),
        });
      } finally {
        setLoadingAction(null);
      }
    },
    [
      loadingAction,
      onActionComplete,
      synchronizeResponse,
      targetId,
      toast,
      toggleOptimisticState,
    ],
  );

  const submitReport =
    useCallback(async () => {
      const trimmedReason =
        reportReason.trim();

      if (
        !trimmedReason ||
        !targetId ||
        loadingAction !== null
      ) {
        return;
      }

      setLoadingAction("report");

      try {
        const response =
          await api.post<RelationshipResponse>(
            `/api/users/${targetId}/report`,
            {
              reason: trimmedReason,
            },
          );

        if (response.data?.success) {
          toast({
            variant: "success",
            title: "Report Submitted",
            description:
              response.data.message ||
              "Your report has been submitted.",
          });

          setShowReportForm(false);
          setReportReason("");
          onClose();
        }
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
        setLoadingAction(null);
      }
    }, [
      loadingAction,
      onClose,
      reportReason,
      targetId,
      toast,
    ]);

  if (
    !targetUser ||
    !targetId
  ) {
    return null;
  }

  const modalScale =
    animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.95, 1],
    });

  const actionDisabled =
    loadingAction !== null;

  return (
    <Modal
      visible={isOpen}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <Animated.View
          style={[
            styles.overlay,
            {
              backgroundColor:
                colors.overlay,
              opacity: animation,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.modalCard,
              {
                backgroundColor:
                  colors.surface,
                borderColor: colors.border,
                opacity: animation,
                transform: [
                  {
                    scale: modalScale,
                  },
                ],
              },
            ]}
          >
            <View
              style={[
                styles.header,
                {
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.headerTitle,
                  {
                    color:
                      colors.textPrimary,
                  },
                ]}
              >
                @{targetUsername} Options
              </Text>

              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close options"
                hitSlop={10}
                style={({ pressed }) => [
                  styles.closeButton,
                  {
                    backgroundColor:
                      pressed
                        ? colors.surfaceSoft
                        : "transparent",
                  },
                ]}
              >
                <X
                  size={21}
                  color={
                    colors.textSecondary
                  }
                />
              </Pressable>
            </View>

            {showReportForm ? (
              <View
                style={styles.reportContent}
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
                  Report @{targetUsername}
                </Text>

                <TextInput
                  value={reportReason}
                  onChangeText={setReportReason}
                  placeholder="Reason for reporting (e.g. Spam, Harassment, Fake Account)..."
                  placeholderTextColor={
                    colors.textSecondary
                  }
                  multiline
                  maxLength={1000}
                  textAlignVertical="top"
                  editable={
                    loadingAction !==
                    "report"
                  }
                  style={[
                    styles.reportInput,
                    {
                      color:
                        colors.textPrimary,
                      backgroundColor:
                        colors.surfaceSoft,
                      borderColor:
                        colors.border,
                    },
                  ]}
                  accessibilityLabel="Reason for reporting"
                />

                <View
                  style={
                    styles.reportActions
                  }
                >
                  <Pressable
                    onPress={() =>
                      setShowReportForm(
                        false,
                      )
                    }
                    disabled={
                      loadingAction ===
                      "report"
                    }
                    style={({ pressed }) => [
                      styles.reportButton,
                      {
                        backgroundColor:
                          colors.surfaceSoft,
                        borderColor:
                          colors.border,
                      },
                      pressed &&
                        styles.pressedButton,
                    ]}
                  >
                    <Text
                      style={[
                        styles.backText,
                        {
                          color:
                            colors.textSecondary,
                        },
                      ]}
                    >
                      Back
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      void submitReport()
                    }
                    disabled={
                      loadingAction ===
                        "report" ||
                      !reportReason.trim()
                    }
                    style={({ pressed }) => [
                      styles.reportButton,
                      styles.submitButton,
                      pressed &&
                        styles.pressedButton,
                      (loadingAction ===
                        "report" ||
                        !reportReason.trim()) &&
                        styles.disabledButton,
                    ]}
                  >
                    {loadingAction ===
                    "report" ? (
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
                        Submit Report
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
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={
                  styles.actionList
                }
              >
                <ActionButton
                  icon={ShieldAlert}
                  actionType="block"
                  label={
                    relations.isBlocked
                      ? "Unblock User"
                      : "Block User"
                  }
                  color="#f87171"
                  borderColor={
                    relations.isBlocked
                      ? "rgba(239,68,68,0.50)"
                      : "rgba(239,68,68,0.30)"
                  }
                  backgroundColor={
                    relations.isBlocked
                      ? "rgba(239,68,68,0.20)"
                      : "rgba(239,68,68,0.06)"
                  }
                  active={
                    relations.isBlocked
                  }
                  loadingAction={
                    loadingAction
                  }
                  disabled={actionDisabled}
                  onPress={() =>
                    void handleAction(
                      "block",
                      `/api/users/${targetId}/block`,
                      "Block status updated",
                    )
                  }
                />

                <ActionButton
                  icon={EyeOff}
                  actionType="restrict"
                  label={
                    relations.isRestricted
                      ? "Unrestrict User"
                      : "Restrict User"
                  }
                  color="#c084fc"
                  textColor={
                    relations.isRestricted
                      ? "#c084fc"
                      : colors.textPrimary
                  }
                  borderColor={
                    relations.isRestricted
                      ? "rgba(168,85,247,0.40)"
                      : colors.border
                  }
                  backgroundColor={
                    relations.isRestricted
                      ? "rgba(168,85,247,0.15)"
                      : colors.surfaceSoft
                  }
                  active={
                    relations.isRestricted
                  }
                  loadingAction={
                    loadingAction
                  }
                  disabled={actionDisabled}
                  onPress={() =>
                    void handleAction(
                      "restrict",
                      `/api/users/${targetId}/restrict`,
                      "Restrict status updated",
                    )
                  }
                />

                <ActionButton
                  icon={Star}
                  actionType="closeFriends"
                  label={
                    relations.isCloseFriend
                      ? "Remove from Close Friends"
                      : "⭐ Add to Close Friends"
                  }
                  color="#34d399"
                  textColor={
                    relations.isCloseFriend
                      ? "#34d399"
                      : colors.textPrimary
                  }
                  borderColor={
                    relations.isCloseFriend
                      ? "rgba(16,185,129,0.40)"
                      : colors.border
                  }
                  backgroundColor={
                    relations.isCloseFriend
                      ? "rgba(16,185,129,0.15)"
                      : colors.surfaceSoft
                  }
                  active={
                    relations.isCloseFriend
                  }
                  fillIcon
                  loadingAction={
                    loadingAction
                  }
                  disabled={actionDisabled}
                  onPress={() =>
                    void handleAction(
                      "closeFriends",
                      `/api/users/${targetId}/close-friends`,
                      "Close Friends status updated",
                    )
                  }
                />

                <ActionButton
                  icon={VolumeX}
                  actionType="mute"
                  label={
                    relations.isMuted
                      ? "Unmute User"
                      : "Mute User"
                  }
                  color="#fbbf24"
                  textColor={
                    relations.isMuted
                      ? "#fbbf24"
                      : colors.textPrimary
                  }
                  borderColor={
                    relations.isMuted
                      ? "rgba(245,158,11,0.40)"
                      : colors.border
                  }
                  backgroundColor={
                    relations.isMuted
                      ? "rgba(245,158,11,0.15)"
                      : colors.surfaceSoft
                  }
                  active={
                    relations.isMuted
                  }
                  loadingAction={
                    loadingAction
                  }
                  disabled={actionDisabled}
                  onPress={() =>
                    void handleAction(
                      "mute",
                      `/api/users/${targetId}/mute`,
                      "Mute status updated",
                    )
                  }
                />

                <ActionButton
                  icon={UserX}
                  actionType="hide"
                  label="Hide User Content"
                  color="#ec4899"
                  textColor={
                    colors.textPrimary
                  }
                  borderColor={
                    colors.border
                  }
                  backgroundColor={
                    colors.surfaceSoft
                  }
                  loadingAction={
                    loadingAction
                  }
                  disabled={actionDisabled}
                  onPress={() =>
                    void handleAction(
                      "hide",
                      `/api/users/${targetId}/hide-content`,
                      "Content hidden from feed",
                    )
                  }
                />

                <Pressable
                  onPress={() =>
                    setShowReportForm(true)
                  }
                  disabled={actionDisabled}
                  accessibilityRole="button"
                  accessibilityLabel="Report profile"
                  style={({ pressed }) => [
                    styles.reportProfileButton,
                    {
                      borderColor:
                        "rgba(239,68,68,0.25)",
                      backgroundColor:
                        "rgba(239,68,68,0.06)",
                    },
                    pressed &&
                      styles.pressedButton,
                    actionDisabled &&
                      styles.disabledButton,
                  ]}
                >
                  <Flag
                    size={18}
                    color="#f87171"
                  />

                  <Text
                    style={
                      styles.reportProfileText
                    }
                  >
                    Report Profile
                  </Text>
                </Pressable>
              </ScrollView>
            )}
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
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
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 18,
  },

  header: {
    paddingBottom: 12,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  headerTitle: {
    minWidth: 0,
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  actionList: {
    paddingTop: 14,
    gap: 9,
  },

  actionButton: {
    width: "100%",
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  actionLabel: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  actionText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800",
  },

  reportProfileButton: {
    width: "100%",
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  reportProfileText: {
    color: "#f87171",
    fontSize: 13,
    fontWeight: "800",
  },

  reportContent: {
    paddingTop: 16,
    gap: 14,
  },

  reportTitle: {
    fontSize: 14,
    fontWeight: "700",
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
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },

  backText: {
    fontSize: 13,
    fontWeight: "800",
  },

  submitText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },

  pressedButton: {
    opacity: 0.75,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  disabledButton: {
    opacity: 0.5,
  },
});