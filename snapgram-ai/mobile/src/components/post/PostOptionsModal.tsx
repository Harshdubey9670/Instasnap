import React, {
  useState,
} from "react";
import {
  Alert,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  useSelector,
} from "react-redux";

import {
  EditPostModal,
} from "./EditPostModal";
import {
  useToast,
} from "../ui/Toast";
import api from "../../services/api";
import type { RootState } from "../../store/store";
import {
  useTheme,
} from "../../contexts/ThemeContext";

interface Post {
  _id: string;
  status?: string;
  isPinned?: boolean;
  user?: {
    _id?: string;
  };
  settings?: {
    commentsEnabled?: boolean;
    hideLikes?: boolean;
  };
  caption?: string;
  location?: string;
  media?: Array<{
    url: string;
    type?: string;
  }>;
}

interface PostOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onPostDeleted?: (
    postId: string,
  ) => void;
  onPostUpdated?: (
    post: unknown,
  ) => void;
}

export const PostOptionsModal =
  ({
    isOpen,
    onClose,
    post,
    onPostDeleted,
    onPostUpdated,
  }: PostOptionsModalProps) => {
    const {
      user: authUser,
    } = useSelector(
      (state: RootState) =>
        state.auth,
    );

    const {
      toast,
    } = useToast();

    const {
      effectiveTheme,
    } = useTheme();

    const [
      isEditModalOpen,
      setIsEditModalOpen,
    ] = useState(false);

    const dark =
      effectiveTheme ===
      "dark";

    const isOwner =
      authUser?._id ===
      post.user?._id;

    const isArchived =
      post.status ===
      "archived";

    const isPinned =
      Boolean(
        post.isPinned,
      );

    const handleDelete =
      () => {
        Alert.alert(
          "Delete post",
          "Are you sure you want to delete this post?",
          [
            {
              text: "Cancel",
              style:
                "cancel",
            },
            {
              text: "Delete",
              style:
                "destructive",
              onPress: async () => {
                try {
                  await api.delete(
                    `/api/posts/${post._id}`,
                  );

                  toast({
                    variant:
                      "success",
                    title:
                      "Post deleted",
                  });

                  onClose();
                  onPostDeleted?.(
                    post._id,
                  );
                } catch {
                  toast({
                    variant:
                      "error",
                    title:
                      "Failed to delete post",
                  });
                }
              },
            },
          ],
        );
      };

    const handleToggleArchive =
      async () => {
        try {
          const response =
            await api.put(
              `/api/posts/${post._id}/archive`,
            );

          toast({
            variant:
              "success",
            title:
              isArchived
                ? "Post unarchived"
                : "Post archived",
          });

          onClose();

          onPostUpdated?.(
            response.data.data,
          );
        } catch {
          toast({
            variant:
              "error",
            title:
              "Failed to archive post",
          });
        }
      };

    const handleTogglePin =
      async () => {
        try {
          const response =
            await api.put(
              `/api/posts/${post._id}/pin`,
            );

          toast({
            variant:
              "success",
            title:
              isPinned
                ? "Post unpinned"
                : "Post pinned",
          });

          onClose();

          onPostUpdated?.(
            response.data.data,
          );
        } catch {
          toast({
            variant:
              "error",
            title:
              "Failed to pin post",
          });
        }
      };

    const handleToggleComments =
      async () => {
        try {
          const current =
            post.settings
              ?.commentsEnabled ??
            true;

          const response =
            await api.put(
              `/api/posts/${post._id}/settings`,
              {
                commentsEnabled:
                  !current,
              },
            );

          toast({
            variant:
              "success",
            title:
              current
                ? "Comments turned off"
                : "Comments turned on",
          });

          onClose();

          onPostUpdated?.(
            response.data.data,
          );
        } catch {
          toast({
            variant:
              "error",
            title:
              "Failed to update post settings",
          });
        }
      };

    const handleToggleLikes =
      async () => {
        try {
          const current =
            post.settings
              ?.hideLikes ??
            false;

          const response =
            await api.put(
              `/api/posts/${post._id}/settings`,
              {
                hideLikes:
                  !current,
              },
            );

          toast({
            variant:
              "success",
            title:
              current
                ? "Like counts visible"
                : "Like counts hidden",
          });

          onClose();

          onPostUpdated?.(
            response.data.data,
          );
        } catch {
          toast({
            variant:
              "error",
            title:
              "Failed to update post settings",
          });
        }
      };

    const handleHide =
      async () => {
        try {
          await api.post(
            `/api/posts/${post._id}/hide`,
          );

          toast({
            variant:
              "success",
            title:
              "Post hidden from your feed",
          });

          onClose();

          onPostDeleted?.(
            post._id,
          );
        } catch {
          toast({
            variant:
              "error",
            title:
              "Failed to hide post",
          });
        }
      };

    const handleReport =
      () => {
        Alert.prompt(
          "Report post",
          "Why are you reporting this post?\n\nspam, nudity, hate_speech, violence, bullying, other",
          async (
            reason,
          ) => {
            if (!reason) {
              return;
            }

            try {
              await api.post(
                `/api/posts/${post._id}/report`,
                {
                  reason,
                },
              );

              toast({
                variant:
                  "success",
                title:
                  "Post reported",
                description:
                  "We will review it shortly.",
              });

              onClose();
            } catch {
              toast({
                variant:
                  "error",
                title:
                  "Failed to report post",
              });
            }
          },
          "plain-text",
          "spam",
        );
      };

    const handleCopyLink =
      async () => {
        const baseUrl =
          process.env
            .EXPO_PUBLIC_PUBLIC_URL ||
          process.env
            .EXPO_PUBLIC_API_URL ||
          "";

        const url =
          `${baseUrl}/app/post/${post._id}`;

        try {
          await Share.share({
            message:
              url,
            url,
          });

          onClose();
        } catch {
          toast({
            variant:
              "error",
            title:
              "Could not share post link",
          });
        }
      };

    const ActionButton = ({
      label,
      danger = false,
      onPress,
      last = false,
    }: {
      label: string;
      danger?: boolean;
      onPress: () => void;
      last?: boolean;
    }) => (
      <Pressable
        onPress={
          onPress
        }
        style={({ pressed }) => [
          styles.actionButton,
          {
            borderBottomColor:
              last
                ? "transparent"
                : dark
                  ? "#2d1b3b"
                  : "#e2e8f0",
          },
          pressed &&
            styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.actionText,
            {
              color:
                danger
                  ? "#ef4444"
                  : dark
                    ? "#f8fafc"
                    : "#0f172a",
              fontWeight:
                danger
                  ? "700"
                  : "500",
            },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );

    return (
      <>
        <Modal
          visible={isOpen}
          transparent
          animationType="slide"
          onRequestClose={
            onClose
          }
        >
          <View
            style={
              styles.overlay
            }
          >
            <Pressable
              style={
                styles.backdrop
              }
              onPress={
                onClose
              }
            />

            <View
              style={[
                styles.sheet,
                {
                  backgroundColor:
                    dark
                      ? "#130a1c"
                      : "#ffffff",
                },
              ]}
            >
              {isOwner ? (
                <>
                  <ActionButton
                    label="Delete"
                    danger
                    onPress={
                      handleDelete
                    }
                  />

                  <ActionButton
                    label={
                      isArchived
                        ? "Show on profile"
                        : "Archive"
                    }
                    onPress={() =>
                      void handleToggleArchive()
                    }
                  />

                  <ActionButton
                    label={
                      isPinned
                        ? "Unpin from profile"
                        : "Pin to your profile"
                    }
                    onPress={() =>
                      void handleTogglePin()
                    }
                  />

                  <ActionButton
                    label={
                      post.settings
                        ?.commentsEnabled ===
                      false
                        ? "Turn on commenting"
                        : "Turn off commenting"
                    }
                    onPress={() =>
                      void handleToggleComments()
                    }
                  />

                  <ActionButton
                    label={
                      post.settings
                        ?.hideLikes
                        ? "Unhide like count"
                        : "Hide like count"
                    }
                    onPress={() =>
                      void handleToggleLikes()
                    }
                  />

                  <ActionButton
                    label="Edit"
                    onPress={() =>
                      setIsEditModalOpen(
                        true,
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <ActionButton
                    label="Report"
                    danger
                    onPress={
                      handleReport
                    }
                  />

                  <ActionButton
                    label="Hide"
                    danger
                    onPress={
                      handleHide
                    }
                  />
                </>
              )}

              <ActionButton
                label="Share link"
                onPress={
                  handleCopyLink
                }
              />

              <ActionButton
                label="Cancel"
                onPress={
                  onClose
                }
                last
              />
            </View>
          </View>
        </Modal>

        <EditPostModal
          isOpen={
            isEditModalOpen
          }
          onClose={() => {
            setIsEditModalOpen(
              false,
            );
            onClose();
          }}
          post={post}
          onPostUpdated={
            onPostUpdated
          }
        />
      </>
    );
  };

const styles =
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent:
        "flex-end",
    },

    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(0,0,0,0.60)",
    },

    sheet: {
      width: "100%",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow:
        "hidden",
      paddingBottom: 20,

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: -8,
      },
      shadowOpacity: 0.20,
      shadowRadius: 20,
      elevation: 20,
    },

    actionButton: {
      minHeight: 52,

      alignItems:
        "center",
      justifyContent:
        "center",

      paddingHorizontal: 20,

      borderBottomWidth: 1,
    },

    actionText: {
      fontSize: 14,
    },

    pressed: {
      backgroundColor:
        "rgba(148,163,184,0.08)",
    },
  });