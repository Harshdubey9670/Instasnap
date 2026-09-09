import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  AtSign,
  Bell,
  Heart,
  MessageCircle,
  Send,
  Trash2,
  UserPlus,
} from "lucide-react-native";
import {
  router,
} from "expo-router";

import {
  Avatar,
} from "../ui/Avatar";
import {
  FollowButton,
} from "../profile/FollowButton";

export type NotificationType =
  | "mention"
  | "tag"
  | "like"
  | "follow"
  | "accept_request"
  | "follow_request"
  | "comment"
  | "reply"
  | "story_reply"
  | "story"
  | "reel"
  | "save"
  | "system";

interface NotificationSender {
  _id?: string;
  username?: string;
  profilePicture?: string;
  avatar?: string;
}

interface NotificationPost {
  media?: Array<{
    url?: string;
  }>;
}

export interface NotificationGroup {
  _id: string;
  type: NotificationType;
  createdAt: string;
  read?: boolean;
  message?: string;
  sender?: NotificationSender;
  senders?: NotificationSender[];
  post?: NotificationPost;
}

interface NotificationItemProps {
  group: NotificationGroup;
  isLast?: boolean;
  lastNotificationRef?: unknown;
  handleNotificationClick: (
    group: NotificationGroup,
  ) => void;
  handleMarkOneRead: (
    event: unknown,
    id: string,
  ) => void;
  handleDelete: (
    event: unknown,
    id: string,
  ) => void;
}

const getNotificationIcon =
  (
    type: NotificationType,
  ) => {
    switch (type) {
      case "mention":
      case "tag":
        return {
          Icon: AtSign,
          color: "#38bdf8",
          filled: false,
        };

      case "like":
        return {
          Icon: Heart,
          color: "#ef4444",
          filled: true,
        };

      case "follow":
      case "accept_request":
      case "follow_request":
        return {
          Icon: UserPlus,
          color: "#34d399",
          filled: false,
        };

      case "comment":
      case "reply":
        return {
          Icon: MessageCircle,
          color: "#a855f7",
          filled: false,
        };

      case "story_reply":
      case "story":
      case "reel":
        return {
          Icon: Send,
          color: "#a855f7",
          filled: false,
        };

      case "save":
        return {
          Icon: Heart,
          color: "#fbbf24",
          filled: true,
        };

      case "system":
        return {
          Icon: Bell,
          color: "#a855f7",
          filled: false,
        };

      default:
        return {
          Icon: Bell,
          color: "#64748b",
          filled: false,
        };
    }
  };

export const notificationIcon =
  (
    type: NotificationType,
  ) => {
    const {
      Icon,
      color,
      filled,
    } =
      getNotificationIcon(
        type,
      );

    return (
      <Icon
        size={12}
        color={color}
        fill={
          filled
            ? color
            : "none"
        }
        strokeWidth={2}
      />
    );
  };

export const timeAgo =
  (
    date: string,
  ): string => {
    const diff =
      Date.now() -
      new Date(
        date,
      ).getTime();

    const minutes =
      Math.floor(
        diff / 60000,
      );

    if (
      minutes < 1
    ) {
      return "just now";
    }

    if (
      minutes < 60
    ) {
      return `${minutes}m`;
    }

    const hours =
      Math.floor(
        minutes / 60,
      );

    if (
      hours < 24
    ) {
      return `${hours}h`;
    }

    const days =
      Math.floor(
        hours / 24,
      );

    return `${days}d`;
  };

const getSenderId = (
  sender:
    | NotificationSender
    | undefined,
) =>
  sender?._id;

const getSenderName = (
  sender:
    | NotificationSender
    | undefined,
) =>
  sender?.username ||
  "User";

export const formatGroupedText =
  (
    senders: NotificationSender[],
    type: NotificationType,
  ) => {
    const count =
      senders.length;

    const first =
      senders[0];

    const second =
      senders[1];

    let action: string;

    switch (type) {
      case "mention":
        action =
          "mentioned you in a post.";
        break;
      case "tag":
        action =
          "tagged you in a post.";
        break;
      case "like":
        action =
          "liked your post.";
        break;
      case "follow":
        action =
          "started following you.";
        break;
      case "follow_request":
        action =
          "requested to follow you.";
        break;
      case "accept_request":
        action =
          "accepted your follow request.";
        break;
      case "comment":
        action =
          "commented on your post.";
        break;
      case "reply":
        action =
          "replied to your comment.";
        break;
      case "story_reply":
        action =
          "replied to your story.";
        break;
      case "story":
        action =
          "mentioned you in their story.";
        break;
      case "reel":
        action =
          "shared a reel with you.";
        break;
      case "save":
        action =
          "saved your post.";
        break;
      case "system":
        action =
          "sent a system update.";
        break;
      default:
        action =
          "sent you a notification.";
    }

    return {
      senders: {
        first,
        second,
        count,
      },
      action,
    };
  };

export const NotificationItem = ({
  group,
  handleNotificationClick,
  handleMarkOneRead,
  handleDelete,
}: NotificationItemProps) => {
  const senders =
    group.senders ||
    (group.sender
      ? [group.sender]
      : []);

  const primarySender =
    senders[0] ||
    group.sender;

  const formatted =
    formatGroupedText(
      senders,
      group.type,
    );

  const buildOpenProfile =
    (
      userId?: string,
    ) => {
      if (!userId) {
        return;
      }

      router.push(
        `/app/profile/${userId}` as any,
      );
    };

  const postThumbnail =
    group.post?.media?.[0]
      ?.url;

  return (
    <Pressable
      onPress={() =>
        handleNotificationClick(
          group,
        )
      }
      style={({ pressed }) => [
        styles.container,
        !group.read &&
          styles.unreadContainer,
        pressed &&
          styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${senders
        .map(
          (sender) =>
            `@${getSenderName(
              sender,
            )}`,
        )
        .join(
          ", ",
        )} ${formatted.action}`}
    >
      {/* Avatar area */}
      <View
        style={
          styles.avatarArea
        }
      >
        {senders.length >
        1 ? (
          <View
            style={
              styles.multiAvatar
            }
          >
            <Pressable
              onPress={() =>
                buildOpenProfile(
                  getSenderId(
                    senders[0],
                  ),
                )
              }
            >
              <View
                style={
                  styles.avatarBack
                }
              >
                <Avatar
                  src={
                    senders[0]
                      ?.profilePicture ||
                    senders[0]
                      ?.avatar
                  }
                  fallback={
                    senders[0]
                      ?.username
                      ?.charAt(
                        0,
                      )
                      ?.toUpperCase() ||
                    "U"
                  }
                  size="sm"
                />
              </View>
            </Pressable>

            <Pressable
              onPress={() =>
                buildOpenProfile(
                  getSenderId(
                    senders[1],
                  ),
                )
              }
            >
              <View
                style={
                  styles.avatarFront
                }
              >
                <Avatar
                  src={
                    senders[1]
                      ?.profilePicture ||
                    senders[1]
                      ?.avatar
                  }
                  fallback={
                    senders[1]
                      ?.username
                      ?.charAt(
                        0,
                      )
                      ?.toUpperCase() ||
                    "U"
                  }
                  size="sm"
                />
              </View>
            </Pressable>
          </View>
        ) : (
          <Avatar
            src={
              primarySender
                ?.profilePicture ||
              primarySender
                ?.avatar
            }
            fallback={
              primarySender
                ?.username
                ?.charAt(
                  0,
                )
                ?.toUpperCase() ||
              "U"
            }
            size="md"
          />
        )}

        <View
          style={
            styles.typeBadge
          }
        >
          {notificationIcon(
            group.type,
          )}
        </View>
      </View>

      {/* Notification text */}
      <View
        style={
          styles.textContainer
        }
      >
        <Text
          style={
            styles.notificationText
          }
        >
          {countAndNames(
            senders,
            group.type,
          )}

          <Text
            style={
              styles.actionText
            }
          >
            {" "}
            {formatted.action}
          </Text>

          <Text
            style={
              styles.timeText
            }
          >
            {" "}
            {timeAgo(
              group.createdAt,
            )}
          </Text>
        </Text>

        {group.type ===
          "story_reply" &&
        group.message ? (
          <Text
            style={
              styles.storyMessage
            }
            numberOfLines={1}
          >
            "{group.message}"
          </Text>
        ) : null}
      </View>

      {/* Right side */}
      <View
        style={
          styles.rightActions
        }
      >
        {(group.type ===
          "follow" ||
          group.type ===
            "accept_request") &&
        primarySender?._id ? (
          <View
            style={
              styles.followContainer
            }
          >
            <FollowButton
              userId={
                primarySender._id
              }
              targetUser={
                primarySender
              }
            />
          </View>
        ) : null}

        {postThumbnail ? (
          <Pressable
            onPress={() =>
              handleNotificationClick(
                group,
              )
            }
            style={
              styles.thumbnailWrapper
            }
          >
            <Image
              source={{
                uri: postThumbnail,
              }}
              style={
                styles.thumbnail
              }
              resizeMode="cover"
              accessibilityLabel="Post thumbnail"
            />
          </Pressable>
        ) : null}

        {!group.read ? (
          <Pressable
            onPress={(
              event,
            ) =>
              handleMarkOneRead(
                event,
                group._id,
              )
            }
            style={
              styles.unreadDot
            }
            accessibilityRole="button"
            accessibilityLabel="Mark notification as read"
          />
        ) : null}

        <Pressable
          onPress={(
            event,
          ) =>
            handleDelete(
              event,
              group._id,
            )
          }
          style={
            styles.deleteButton
          }
          accessibilityRole="button"
          accessibilityLabel="Delete notification"
        >
          <Trash2
            size={16}
            color="#64748b"
          />
        </Pressable>
      </View>
    </Pressable>
  );
};

const countAndNames = (
  senders: NotificationSender[],
  type: NotificationType,
) => {
  /*
   * This renders the same grouping semantics as the web version,
   * but uses nested Text press handlers instead of react-router Links.
   */
  const count =
    senders.length;

  const actionOnlyTypes =
    new Set<NotificationType>(
      [
        "system",
      ],
    );

  if (
    actionOnlyTypes.has(
      type,
    )
  ) {
    return (
      <Text
        style={
          styles.actionText
        }
      >
        {""}
      </Text>
    );
  }

  const first =
    senders[0];

  const second =
    senders[1];

  const openProfile =
    (
      userId?: string,
    ) => {
      if (!userId) {
        return;
      }

      router.push(
        `/app/profile/${userId}` as any,
      );
    };

  return (
    <>
      {count >= 1 ? (
        <Text
          onPress={() =>
            openProfile(
              first?._id,
            )
          }
          style={
            styles.name
          }
        >
          {first?.username ||
            "User"}
        </Text>
      ) : null}

      {count === 2 ? (
        <>
          <Text
            style={
              styles.actionText
            }
          >
            {" and "}
          </Text>

          <Text
            onPress={() =>
              openProfile(
                second?._id,
              )
            }
            style={
              styles.name
            }
          >
            {second?.username ||
              "User"}
          </Text>
        </>
      ) : null}

      {count > 2 ? (
        <>
          <Text
            style={
              styles.actionText
            }
          >
            {", "}
          </Text>

          <Text
            onPress={() =>
              openProfile(
                second?._id,
              )
            }
            style={
              styles.name
            }
          >
            {second?.username ||
              "User"}
          </Text>

          <Text
            style={
              styles.actionText
            }
          >
            {` and ${
              count - 2
            } other${
              count - 2 >
              1
                ? "s"
                : ""
            }`}
          </Text>
        </>
      ) : null}
    </>
  );
};

const styles =
  StyleSheet.create({
    container: {
      minHeight: 76,

      flexDirection:
        "row",
      alignItems:
        "center",

      gap: 10,

      paddingHorizontal: 14,
      paddingVertical: 10,

      backgroundColor:
        "transparent",
    },

    unreadContainer: {
      backgroundColor:
        "rgba(168,85,247,0.05)",
    },

    pressed: {
      backgroundColor:
        "rgba(148,163,184,0.10)",
    },

    avatarArea: {
      width: 48,
      height: 48,
      position:
        "relative",
      flexShrink: 0,
    },

    multiAvatar: {
      width: 48,
      height: 48,
      position:
        "relative",
    },

    avatarBack: {
      position:
        "absolute",
      left: 0,
      bottom: 0,

      width: 34,
      height: 34,

      borderRadius: 17,

      borderWidth: 2,
      borderColor:
        "#f8fafc",

      overflow:
        "hidden",

      zIndex: 2,
    },

    avatarFront: {
      position:
        "absolute",
      right: 0,
      top: 0,

      width: 31,
      height: 31,

      borderRadius: 16,

      borderWidth: 2,
      borderColor:
        "#f8fafc",

      overflow:
        "hidden",

      zIndex: 1,
    },

    typeBadge: {
      position:
        "absolute",

      right: -1,
      bottom: -2,

      width: 20,
      height: 20,

      borderRadius: 10,

      alignItems:
        "center",
      justifyContent:
        "center",

      backgroundColor:
        "#171717",

      borderWidth: 2,
      borderColor:
        "#f8fafc",

      zIndex: 5,
    },

    textContainer: {
      flex: 1,
      minWidth: 0,
    },

    notificationText: {
      fontSize: 13,
      lineHeight: 19,
      color: "#0f172a",
    },

    name: {
      fontWeight:
        "700",
      color:
        "#0f172a",
    },

    actionText: {
      fontWeight:
        "400",
      color:
        "#0f172a",
    },

    timeText: {
      fontSize: 11,
      color:
        "#64748b",
      fontWeight:
        "400",
    },

    storyMessage: {
      marginTop: 2,
      fontSize: 11,
      lineHeight: 15,
      fontStyle:
        "italic",
      color:
        "#64748b",
    },

    rightActions: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
      flexShrink: 0,
    },

    followContainer: {
      maxWidth: 108,
    },

    thumbnailWrapper: {
      width: 44,
      height: 44,
      borderRadius: 8,
      overflow:
        "hidden",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    thumbnail: {
      width: "100%",
      height: "100%",
    },

    unreadDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor:
        "#a855f7",
    },

    deleteButton: {
      width: 34,
      height: 34,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 17,
    },
  });

export default NotificationItem;