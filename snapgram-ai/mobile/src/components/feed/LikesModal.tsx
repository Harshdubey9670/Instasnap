import React, {
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  router,
} from "expo-router";
import {
  X,
} from "lucide-react-native";

import api from "../../services/api";
import {
  useToast,
} from "../ui/Toast";
import {
  FollowButton,
} from "../profile/FollowButton";
import {
  useTheme,
} from "../../contexts/ThemeContext";

interface LikedUser {
  _id: string;
  username?: string;
  fullName?: string;
  category?: string;
  profilePicture?: string;
  avatar?: string;
}

interface LikesModalProps {
  post: {
    _id: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LikesModal = ({
  post,
  isOpen,
  onClose,
}: LikesModalProps) => {
  const {
    toast,
  } = useToast();

  const {
    effectiveTheme,
  } = useTheme();

  const [
    likes,
    setLikes,
  ] = useState<
    LikedUser[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const dark =
    effectiveTheme ===
    "dark";

  useEffect(() => {
    if (
      isOpen &&
      post
    ) {
      void fetchLikes();
    }
  }, [
    isOpen,
    post?._id,
  ]);

  const fetchLikes =
    async () => {
      if (!post) {
        return;
      }

      setIsLoading(
        true,
      );

      try {
        const response =
          await api.get(
            `/api/posts/${post._id}/likes`,
          );

        setLikes(
          response.data
            ?.data || [],
        );
      } catch {
        toast({
          variant:
            "error",
          title:
            "Error",
          description:
            "Could not load likes",
        });
      } finally {
        setIsLoading(
          false,
        );
      }
    };

  if (
    !isOpen ||
    !post
  ) {
    return null;
  }

  const surfaceColor =
    dark
      ? "#130a1c"
      : "#ffffff";

  const baseColor =
    dark
      ? "#0a0510"
      : "#f8fafc";

  const hoverColor =
    dark
      ? "#1e112c"
      : "#f1f5f9";

  const borderColor =
    dark
      ? "#2d1b3b"
      : "#e2e8f0";

  const primaryText =
    dark
      ? "#f8fafc"
      : "#0f172a";

  const secondaryText =
    dark
      ? "#94a3b8"
      : "#64748b";

  const openProfile =
    (
      userId: string,
    ) => {
      onClose();

      router.push(
        `/app/profile/${userId}` as any,
      );
    };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
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
            styles.modal,
            {
              backgroundColor:
                surfaceColor,
              borderColor,
            },
          ]}
        >
          <View
            style={[
              styles.header,
              {
                borderBottomColor:
                  borderColor,
              },
            ]}
          >
            <Text
              style={[
                styles.title,
                {
                  color:
                    primaryText,
                },
              ]}
            >
              Likes
            </Text>

            <Pressable
              onPress={
                onClose
              }
              style={
                styles.closeButton
              }
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close likes"
            >
              <X
                size={20}
                color={
                  secondaryText
                }
              />
            </Pressable>
          </View>

          <ScrollView
            style={
              styles.list
            }
            contentContainerStyle={
              styles.listContent
            }
            showsVerticalScrollIndicator={
              false
            }
          >
            {isLoading ? (
              <View
                style={
                  styles.loading
                }
              >
                <ActivityIndicator
                  size="small"
                  color="#a855f7"
                />
              </View>
            ) : likes.length ===
              0 ? (
              <View
                style={
                  styles.empty
                }
              >
                <Text
                  style={[
                    styles.emptyText,
                    {
                      color:
                        secondaryText,
                    },
                  ]}
                >
                  No likes yet.
                </Text>
              </View>
            ) : (
              likes.map(
                (
                  user,
                ) => (
                  <View
                    key={
                      user._id
                    }
                    style={
                      styles.userRow
                    }
                  >
                    <Pressable
                      onPress={() =>
                        openProfile(
                          user._id,
                        )
                      }
                      style={
                        styles.userButton
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${user.username || "user"} profile`}
                    >
                      <Image
                        source={{
                          uri:
                            user.profilePicture ||
                            user.avatar ||
                            "https://i.pravatar.cc/150",
                        }}
                        style={
                          styles.avatar
                        }
                      />

                      <View
                        style={
                          styles.userInfo
                        }
                      >
                        <Text
                          style={[
                            styles.username,
                            {
                              color:
                                primaryText,
                            },
                          ]}
                          numberOfLines={
                            1
                          }
                        >
                          {
                            user.username
                          }
                        </Text>

                        <Text
                          style={[
                            styles.subtitle,
                            {
                              color:
                                secondaryText,
                            },
                          ]}
                          numberOfLines={
                            1
                          }
                        >
                          {user.fullName ||
                            user.category ||
                            ""}
                        </Text>
                      </View>
                    </Pressable>

                    <View
                      style={
                        styles.followContainer
                      }
                    >
                      <FollowButton
                        userId={
                          user._id
                        }
                        targetUser={
                          user
                        }
                      />
                    </View>
                  </View>
                ),
              )
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles =
  StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 16,
      paddingVertical: 48,
    },

    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(0,0,0,0.60)",
    },

    modal: {
      width: "100%",
      maxWidth: 420,
      maxHeight: "70%",

      borderWidth: 1,
      borderRadius: 20,

      overflow:
        "hidden",

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.22,
      shadowRadius: 28,
      elevation: 16,
    },

    header: {
      minHeight: 58,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",

      paddingHorizontal:
        16,

      borderBottomWidth: 1,
      position:
        "relative",
    },

    title: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "700",
    },

    closeButton: {
      position:
        "absolute",
      right: 12,
      top: 9,

      width: 40,
      height: 40,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 20,
    },

    list: {
      flexGrow: 0,
    },

    listContent: {
      padding: 16,
      gap: 16,
    },

    loading: {
      minHeight: 300,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    empty: {
      minHeight: 300,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    emptyText: {
      fontSize: 14,
    },

    userRow: {
      width: "100%",

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    userButton: {
      flex: 1,
      minWidth: 0,

      flexDirection:
        "row",
      alignItems:
        "center",
    },

    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor:
        "#f1f5f9",
    },

    userInfo: {
      flex: 1,
      minWidth: 0,
    },

    username: {
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "600",
    },

    subtitle: {
      marginTop: 2,
      fontSize: 12,
      lineHeight: 16,
    },

    followContainer: {
      marginLeft: 12,
      flexShrink: 0,
    },
  });