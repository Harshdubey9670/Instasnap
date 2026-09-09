
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  router,
} from "expo-router";
import {
  AtSign,
  Bell,
  CheckCheck,
  Heart,
  MessageCircle,
  Send,
  Trash2,
  UserPlus,
} from "lucide-react-native";
import {
  useDispatch,
} from "react-redux";

import {
  clearUnreadCount,
} from "../../src/store/authSlice";
import {
  Avatar,
} from "../../src/components/ui/Avatar";
import api from "../../src/services/api";
import {
  useToast,
} from "../../src/components/ui/Toast";

type NotificationType =
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
  | "system"
  | string;

interface UserData {
  _id: string;
  username?: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
}

interface PostData {
  _id: string;
  media?: {
    url?: string;
  }[];
}

interface NotificationData {
  _id: string;
  type: NotificationType;
  sender?: UserData;
  post?: PostData;
  message?: string;
  read?: boolean;
  createdAt: string;
}

interface GroupedNotification
  extends NotificationData {
  senders: UserData[];
  ids: string[];
}

interface FollowRequest extends UserData {}

type NotificationSection = {
  title: string;
  data: GroupedNotification[];
};

const API_PAGE_SIZE = 15;

function getNotificationIcon(
  type: NotificationType,
) {
  switch (type) {
    case "mention":
    case "tag":
      return AtSign;

    case "like":
      return Heart;

    case "follow":
    case "accept_request":
    case "follow_request":
      return UserPlus;

    case "comment":
    case "reply":
      return MessageCircle;

    case "story_reply":
    case "story":
    case "reel":
      return Send;

    case "save":
      return Heart;

    case "system":
    default:
      return Bell;
  }
}

function getNotificationIconColor(
  type: NotificationType,
) {
  switch (type) {
    case "mention":
    case "tag":
      return "#38bdf8";

    case "like":
      return "#ef4444";

    case "follow":
    case "accept_request":
    case "follow_request":
      return "#34d399";

    case "comment":
    case "reply":
    case "story_reply":
    case "story":
    case "reel":
      return "#a855f7";

    case "save":
      return "#f59e0b";

    case "system":
    default:
      return "#94a3b8";
  }
}

function timeAgo(
  date: string,
) {
  const diff =
    Math.max(
      0,
      Date.now() -
        new Date(
          date,
        ).getTime(),
    );

  const minutes =
    Math.floor(
      diff / 60000,
    );

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  if (hours < 24) {
    return `${hours}h`;
  }

  const days =
    Math.floor(
      hours / 24,
    );

  return `${days}d`;
}

function groupNotifications(
  notifications: NotificationData[],
): GroupedNotification[] {
  const grouped: GroupedNotification[] =
    [];

  notifications.forEach(
    (notification) => {
      const canGroup =
        Boolean(
          notification.post?._id,
        ) &&
        [
          "like",
          "comment",
          "mention",
        ].includes(
          notification.type,
        );

      if (!canGroup) {
        grouped.push({
          ...notification,
          senders:
            notification.sender
              ? [notification.sender]
              : [],
          ids: [
            notification._id,
          ],
        });

        return;
      }

      const lastGroup =
        grouped[
          grouped.length - 1
        ];

      if (
        lastGroup &&
        lastGroup.type ===
          notification.type &&
        lastGroup.post?._id ===
          notification.post?._id
      ) {
        const senderExists =
          lastGroup.senders.some(
            (sender) =>
              sender?._id ===
              notification.sender?._id,
          );

        if (
          !senderExists &&
          notification.sender
        ) {
          lastGroup.senders.push(
            notification.sender,
          );
        }

        if (!notification.read) {
          lastGroup.read = false;
        }

        lastGroup.ids.push(
          notification._id,
        );
      } else {
        grouped.push({
          ...notification,
          senders:
            notification.sender
              ? [notification.sender]
              : [],
          ids: [
            notification._id,
          ],
        });
      }
    },
  );

  return grouped;
}

function getNotificationAction(
  type: NotificationType,
) {
  switch (type) {
    case "mention":
      return "mentioned you in a post.";

    case "tag":
      return "tagged you in a post.";

    case "like":
      return "liked your post.";

    case "follow":
      return "started following you.";

    case "follow_request":
      return "requested to follow you.";

    case "accept_request":
      return "accepted your follow request.";

    case "comment":
      return "commented on your post.";

    case "reply":
      return "replied to your comment.";

    case "story_reply":
      return "replied to your story.";

    case "story":
      return "mentioned you in their story.";

    case "reel":
      return "shared a reel with you.";

    case "save":
      return "saved your post.";

    case "system":
      return "sent a system update.";

    default:
      return "sent you a notification.";
  }
}

function getGroupedMessage(
  group: GroupedNotification,
) {
  const senders =
    group.senders || [];

  const names =
    senders
      .map(
        (sender) =>
          sender?.username ||
          "user",
      );

  if (names.length === 0) {
    return `Someone ${getNotificationAction(
      group.type,
    )}`;
  }

  if (names.length === 1) {
    return `${names[0]} ${getNotificationAction(
      group.type,
    )}`;
  }

  if (names.length === 2) {
    return `${names[0]} and ${names[1]} ${getNotificationAction(
      group.type,
    )}`;
  }

  return `${names[0]}, ${names[1]} and ${
    names.length - 2
  } other${
    names.length - 2 > 1
      ? "s"
      : ""
  } ${getNotificationAction(
    group.type,
  )}`;
}

function categorizeNotifications(
  notifications: GroupedNotification[],
) {
  const now =
    Date.now();

  const oneDay =
    24 * 60 * 60 * 1000;

  const sevenDays =
    7 * oneDay;

  const today: GroupedNotification[] =
    [];

  const thisWeek: GroupedNotification[] =
    [];

  const earlier: GroupedNotification[] =
    [];

  notifications.forEach(
    (notification) => {
      const age =
        now -
        new Date(
          notification.createdAt,
        ).getTime();

      if (
        age <= oneDay
      ) {
        today.push(
          notification,
        );
      } else if (
        age <= sevenDays
      ) {
        thisWeek.push(
          notification,
        );
      } else {
        earlier.push(
          notification,
        );
      }
    },
  );

  return {
    today,
    thisWeek,
    earlier,
  };
}

export default function NotificationsScreen() {
  const dispatch =
    useDispatch();

  const { showToast } =
    useToast();

  const [
    notifications,
    setNotifications,
  ] = useState<
    NotificationData[]
  >([]);

  const [
    followRequests,
    setFollowRequests,
  ] = useState<
    FollowRequest[]
  >([]);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    hasMore,
    setHasMore,
  ] = useState(true);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    fetchingMore,
    setFetchingMore,
  ] = useState(false);

  const [
    markingRead,
    setMarkingRead,
  ] = useState(false);

  useEffect(() => {
    dispatch(
      clearUnreadCount(),
    );

    void fetchNotifications(
      1,
      true,
    );
  }, [dispatch]);

  const fetchFollowRequests =
    useCallback(
      async () => {
        try {
          const response =
            await api.get(
              "/api/users/follow-requests",
            );

          if (
            response.data
              ?.success
          ) {
            setFollowRequests(
              response.data
                .data || [],
            );
          }
        } catch (error) {
          console.error(
            "Failed to fetch follow requests:",
            error,
          );
        }
      },
      [],
    );

  const fetchNotifications =
    useCallback(
      async (
        pageNumber: number,
        reset = false,
      ) => {
        if (pageNumber === 1) {
          if (!reset) {
            setLoading(
              true,
            );
          }

          await fetchFollowRequests();
        } else {
          setFetchingMore(
            true,
          );
        }

        try {
          const response =
            await api.get(
              `/api/notifications?page=${pageNumber}&limit=${API_PAGE_SIZE}`,
            );

          if (
            response.data
              ?.success
          ) {
            const incoming =
              response.data
                .data || [];

            setNotifications(
              (previous) =>
                pageNumber === 1
                  ? incoming
                  : [
                      ...previous,
                      ...incoming,
                    ],
            );

            setUnreadCount(
              response.data
                .unreadCount ||
                0,
            );

            setHasMore(
              Boolean(
                response.data
                  .pagination
                  ?.hasMore,
              ),
            );
          }
        } catch (error) {
          console.error(
            "Failed to fetch notifications:",
            error,
          );

          showToast("error", "Notifications Error", "Failed to load notifications.");
        } finally {
          setLoading(
            false,
          );
          setFetchingMore(
            false,
          );
          setRefreshing(
            false,
          );
        }
      },
      [
        fetchFollowRequests,
        showToast,
      ],
    );

  const groupedNotifications =
    useMemo(
      () =>
        groupNotifications(
          notifications,
        ),
      [notifications],
    );

  const categorized =
    useMemo(
      () =>
        categorizeNotifications(
          groupedNotifications,
        ),
      [groupedNotifications],
    );

  const sections =
    useMemo<NotificationSection[]>(
      () => {
        const result: NotificationSection[] =
          [];

        if (
          categorized.today
            .length
        ) {
          result.push({
            title:
              "TODAY",
            data:
              categorized.today,
          });
        }

        if (
          categorized.thisWeek
            .length
        ) {
          result.push({
            title:
              "THIS WEEK",
            data:
              categorized.thisWeek,
          });
        }

        if (
          categorized.earlier
            .length
        ) {
          result.push({
            title:
              "EARLIER",
            data:
              categorized.earlier,
          });
        }

        return result;
      },
      [categorized],
    );

  const handleRefresh =
    useCallback(
      async () => {
        setRefreshing(
          true,
        );
        setPage(1);

        await fetchNotifications(
          1,
          false,
        );
      },
      [fetchNotifications],
    );

  const handleLoadMore =
    useCallback(
      async () => {
        if (
          loading ||
          fetchingMore ||
          !hasMore
        ) {
          return;
        }

        const nextPage =
          page + 1;

        setPage(
          nextPage,
        );

        await fetchNotifications(
          nextPage,
          false,
        );
      },
      [
        fetchNotifications,
        fetchingMore,
        hasMore,
        loading,
        page,
      ],
    );

  const handleMarkAllRead =
    async () => {
      if (
        unreadCount ===
        0 ||
        markingRead
      ) {
        return;
      }

      setMarkingRead(
        true,
      );

      try {
        await api.put(
          "/api/notifications/read-all",
        );

        setNotifications(
          (
            previous,
          ) =>
            previous.map(
              (
                notification,
              ) => ({
                ...notification,
                read: true,
              }),
            ),
        );

        setUnreadCount(
          0,
        );

        dispatch(
          clearUnreadCount(),
        );
      } catch (error) {
        console.error(
          "Failed to mark all notifications as read:",
          error,
        );

        showToast("error", "Failed", "Could not mark notifications as read.");
      } finally {
        setMarkingRead(
          false,
        );
      }
    };

  const handleMarkOneRead =
    async (
      id: string,
    ) => {
      try {
        await api.put(
          `/api/notifications/${id}/read`,
        );

        setNotifications(
          (
            previous,
          ) =>
            previous.map(
              (
                notification,
              ) =>
                notification._id ===
                id
                  ? {
                      ...notification,
                      read: true,
                    }
                  : notification,
            ),
        );

        setUnreadCount(
          (
            count,
          ) =>
            Math.max(
              0,
              count - 1,
            ),
        );
      } catch (error) {
        console.error(
          "Failed to mark notification as read:",
          error,
        );
      }
    };

  const handleDelete =
    async (
      id: string,
    ) => {
      try {
        await api.delete(
          `/api/notifications/${id}`,
        );

        const removed =
          notifications.find(
            (
              notification,
            ) =>
              notification._id ===
              id,
          );

        setNotifications(
          (
            previous,
          ) =>
            previous.filter(
              (
                notification,
              ) =>
                notification._id !==
                id,
            ),
        );

        if (
          removed &&
          !removed.read
        ) {
          setUnreadCount(
            (
              count,
            ) =>
              Math.max(
                0,
                count - 1,
              ),
          );
        }
      } catch (error) {
        console.error(
          "Failed to delete notification:",
          error,
        );

        showToast("error", "Delete Failed", "Could not delete this notification.");
      }
    };

  const handleNotificationPress =
    async (
      group: GroupedNotification,
    ) => {
      if (
        !group.read
      ) {
        await Promise.all(
          (
            group.ids ||
            [group._id]
          ).map(
            (id) =>
              api
                .put(
                  `/api/notifications/${id}/read`,
                )
                .catch(
                  () => null,
                ),
          ),
        );

        const ids =
          group.ids ||
          [group._id];

        setNotifications(
          (
            previous,
          ) =>
            previous.map(
              (
                notification,
              ) =>
                ids.includes(
                  notification._id,
                )
                  ? {
                      ...notification,
                      read: true,
                    }
                  : notification,
            ),
        );

        setUnreadCount(
          (
            count,
          ) =>
            Math.max(
              0,
              count -
                ids.filter(
                  (
                    id,
                  ) =>
                    notifications.some(
                      (
                        notification,
                      ) =>
                        notification._id ===
                          id &&
                        !notification.read,
                    ),
                ).length,
            ),
        );
      }

      const senderId =
        group.sender?._id ||
        group.senders?.[0]?._id;

      if (senderId) {
        router.push(
          `/app/profile/${senderId}`,
        );
      } else if (
        group.post?._id
      ) {
        router.push(
          `/app/post/${group.post._id}`,
        );
      }
    };

  const handleAcceptRequest =
    async (
      requestId: string,
    ) => {
      try {
        await api.post(
          `/api/users/follow-requests/${requestId}/accept`,
        );

        setFollowRequests(
          (
            previous,
          ) =>
            previous.filter(
              (
                request,
              ) =>
                request._id !==
                requestId,
            ),
        );
      } catch (error) {
        console.error(
          "Failed to accept request:",
          error,
        );

        showToast("error", "Failed", "Could not accept the follow request.");
      }
    };

  const handleDeclineRequest =
    async (
      requestId: string,
    ) => {
      try {
        await api.post(
          `/api/users/follow-requests/${requestId}/decline`,
        );

        setFollowRequests(
          (
            previous,
          ) =>
            previous.filter(
              (
                request,
              ) =>
                request._id !==
                requestId,
            ),
        );
      } catch (error) {
        console.error(
          "Failed to decline request:",
          error,
        );

        showToast("error", "Failed", "Could not decline the follow request.");
      }
    };

  const renderNotification =
    ({
      item,
      index,
    }: {
      item: GroupedNotification;
      index: number;
    }) => {
      const senders =
        item.senders || [];

      const primarySender =
        senders[0] ||
        item.sender;

      const Icon =
        getNotificationIcon(
          item.type,
        );

      const iconColor =
        getNotificationIconColor(
          item.type,
        );

      const isUnread =
        !item.read;

      const thumbnail =
        item.post?.media?.[0]
          ?.url;

      return (
        <Pressable
          onPress={() =>
            void handleNotificationPress(
              item,
            )
          }
          style={[
            styles.notificationRow,
            isUnread &&
              styles.unreadRow,
          ]}
        >
          <View
            style={
              styles.senderContainer
            }
          >
            {senders.length >
            1 ? (
              <View
                style={
                  styles.multiAvatar
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
                      ?.username?.charAt(
                        0,
                      ) || "U"
                  }
                  style={
                    styles.avatarSmall
                  }
                />

                <View
                  style={
                    styles.avatarSmallTop
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
                        ?.username?.charAt(
                          0,
                        ) || "U"
                    }
                    style={
                      styles.avatarTiny
                    }
                  />
                </View>
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
                    ?.username?.charAt(
                      0,
                    ) || "U"
                }
                style={
                  styles.avatar
                }
              />
            )}

            <View
              style={
                styles.typeBadge
              }
            >
              <Icon
                size={11}
                color={
                  iconColor
                }
                strokeWidth={2.5}
                fill={
                  item.type ===
                  "like"
                    ? iconColor
                    : "none"
                }
              />
            </View>
          </View>

          <View
            style={
              styles.notificationContent
            }
          >
            <Text
              style={
                styles.notificationText
              }
              numberOfLines={3}
            >
              {getGroupedMessage(
                item,
              )}
            </Text>

            <Text
              style={
                styles.timeText
              }
            >
              {timeAgo(
                item.createdAt,
              )}
            </Text>

            {item.type ===
              "story_reply" &&
              item.message ? (
              <Text
                style={
                  styles.replyText
                }
                numberOfLines={1}
              >
                "{item.message}"
              </Text>
            ) : null}
          </View>

          <View
            style={
              styles.rightActions
            }
          >
            {thumbnail ? (
              <Image
                source={{
                  uri: thumbnail,
                }}
                style={
                  styles.thumbnail
                }
              />
            ) : null}

            {isUnread ? (
              <Pressable
                onPress={() =>
                  void handleMarkOneRead(
                    item._id,
                  )
                }
                hitSlop={10}
                style={
                  styles.unreadDot
                }
              />
            ) : null}

            <Pressable
              onPress={() =>
                void handleDelete(
                  item._id,
                )
              }
              hitSlop={8}
              style={
                styles.deleteButton
              }
            >
              <Trash2
                size={16}
                color="#94a3b8"
              />
            </Pressable>
          </View>
        </Pressable>
      );
    };

  const renderSection =
    ({
      item,
    }: {
      item: NotificationSection;
    }) => (
      <View>
        <Text
          style={
            styles.sectionTitle
          }
        >
          {item.title}
        </Text>

        {item.data.map(
          (
            notification,
            index,
          ) =>
            (
              renderNotification({
                item: notification,
                index,
              })
            ),
        )}
      </View>
    );

  const empty =
    !loading &&
    groupedNotifications.length ===
      0 &&
    followRequests.length ===
      0;

  if (loading) {
    return (
      <View
        style={
          styles.loadingScreen
        }
      >
        <ActivityIndicator
          size="large"
          color="#a855f7"
        />
      </View>
    );
  }

  return (
    <View
      style={
        styles.screen
      }
    >
      <View
        style={
          styles.header
        }
      >
        <View
          style={
            styles.headerLeft
          }
        >
          <Bell
            size={24}
            color="#a855f7"
          />

          <Text
            style={
              styles.headerTitle
            }
          >
            Notifications
          </Text>

          {unreadCount >
          0 ? (
            <View
              style={
                styles.unreadCountBadge
              }
            >
              <Text
                style={
                  styles.unreadCountText
                }
              >
                {unreadCount} new
              </Text>
            </View>
          ) : null}
        </View>

        {unreadCount >
        0 ? (
          <Pressable
            onPress={() =>
              void handleMarkAllRead()
            }
            disabled={
              markingRead
            }
            style={
              styles.markAllButton
            }
          >
            {markingRead ? (
              <ActivityIndicator
                size="small"
                color="#a855f7"
              />
            ) : (
              <>
                <CheckCheck
                  size={16}
                  color="#a855f7"
                />
                <Text
                  style={
                    styles.markAllText
                  }
                >
                  Mark all
                </Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={[
          ...(followRequests.length >
          0
            ? [
                {
                  kind:
                    "requests" as const,
                },
              ]
            : []),
          ...sections.map(
            (
              section,
            ) => ({
              kind:
                "section" as const,
              section,
            }),
          ),
        ]}
        keyExtractor={(
          item,
          index,
        ) =>
          item.kind ===
          "requests"
            ? "follow-requests"
            : `section-${item.section.title}-${index}`}
        renderItem={({
          item,
        }) => {
          if (
            item.kind ===
            "requests"
          ) {
            return (
              <View
                style={
                  styles.requestContainer
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  FOLLOW REQUESTS (
                  {
                    followRequests.length
                  }
                  )
                </Text>

                {followRequests.map(
                  (
                    request,
                  ) => (
                    <View
                      key={
                        request._id
                      }
                      style={
                        styles.requestRow
                      }
                    >
                      <Pressable
                        onPress={() =>
                          router.push(
                            `/app/profile/${request._id}`,
                          )
                        }
                        style={
                          styles.requestUser
                        }
                      >
                        <Avatar
                          src={
                            request.profilePicture ||
                            request.avatar
                          }
                          fallback={
                            request.username?.charAt(
                              0,
                            ) ||
                            "U"
                          }
                          style={
                            styles.avatar
                          }
                        />

                        <View
                          style={
                            styles.requestUserText
                          }
                        >
                          <Text
                            style={
                              styles.username
                            }
                            numberOfLines={
                              1
                            }
                          >
                            @
                            {
                              request.username
                            }
                          </Text>

                          <Text
                            style={
                              styles.requestSubtitle
                            }
                            numberOfLines={
                              1
                            }
                          >
                            {request.fullName ||
                              "Requested to follow you"}
                          </Text>
                        </View>
                      </Pressable>

                      <View
                        style={
                          styles.requestActions
                        }
                      >
                        <Pressable
                          onPress={() =>
                            void handleAcceptRequest(
                              request._id,
                            )
                          }
                          style={
                            styles.confirmButton
                          }
                        >
                          <Text
                            style={
                              styles.confirmText
                            }
                          >
                            Confirm
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() =>
                            void handleDeclineRequest(
                              request._id,
                            )
                          }
                          style={
                            styles.declineButton
                          }
                        >
                          <Text
                            style={
                              styles.declineText
                            }
                          >
                            Delete
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ),
                )}
              </View>
            );
          }

          return renderSection({
            item: item.section,
          });
        }}
        ListEmptyComponent={
          empty ? (
            <View
              style={
                styles.emptyState
              }
            >
              <View
                style={
                  styles.emptyIcon
                }
              >
                <Bell
                  size={32}
                  color="#64748b"
                />
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No notifications yet
              </Text>

              <Text
                style={
                  styles.emptyDescription
                }
              >
                When someone follows you,
                likes your posts, or mentions
                you, you'll see it here.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={
          styles.listContent
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              handleRefresh
            }
            tintColor="#a855f7"
          />
        }
        onEndReached={
          handleLoadMore
        }
        onEndReachedThreshold={
          0.5
        }
        ListFooterComponent={
          fetchingMore ? (
            <View
              style={
                styles.footerLoader
              }
            >
              <ActivityIndicator
                size="small"
                color="#a855f7"
              />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        "#f8fafc",
    },

    loadingScreen: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#f8fafc",
    },

    header: {
      minHeight: 64,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      backgroundColor:
        "#f8fafc",
      borderBottomWidth: 1,
      borderBottomColor:
        "#e2e8f0",
    },

    headerLeft: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
      flex: 1,
      minWidth: 0,
    },

    headerTitle: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight:
        "800",
      color: "#0f172a",
    },

    unreadCountBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor:
        "rgba(168,85,247,0.12)",
    },

    unreadCountText: {
      fontSize: 11,
      lineHeight: 15,
      fontWeight:
        "700",
      color: "#a855f7",
    },

    markAllButton: {
      minHeight: 36,
      paddingHorizontal: 10,
      borderRadius: 999,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 5,
      backgroundColor:
        "rgba(168,85,247,0.10)",
    },

    markAllText: {
      fontSize: 12,
      fontWeight:
        "700",
      color: "#a855f7",
    },

    listContent: {
      paddingBottom: 32,
    },

    sectionTitle: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      fontSize: 11,
      lineHeight: 16,
      letterSpacing: 1,
      fontWeight:
        "800",
      color: "#64748b",
    },

    notificationRow: {
      minHeight: 76,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 12,
      backgroundColor:
        "transparent",
      borderBottomWidth: 1,
      borderBottomColor:
        "rgba(226,232,240,0.65)",
    },

    unreadRow: {
      backgroundColor:
        "rgba(168,85,247,0.045)",
    },

    senderContainer: {
      width: 48,
      height: 48,
      position:
        "relative",
      flexShrink: 0,
    },

    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },

    avatarSmall: {
      width: 34,
      height: 34,
      borderRadius: 17,
    },

    avatarTiny: {
      width: 26,
      height: 26,
      borderRadius: 13,
    },

    multiAvatar: {
      width: 48,
      height: 48,
      position:
        "relative",
    },

    avatarSmallTop: {
      position:
        "absolute",
      top: 0,
      right: 0,
      width: 29,
      height: 29,
      borderRadius: 15,
      borderWidth: 2,
      borderColor:
        "#f8fafc",
      overflow:
        "hidden",
    },

    typeBadge: {
      position:
        "absolute",
      right: -2,
      bottom: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#18181b",
      borderWidth: 2,
      borderColor:
        "#f8fafc",
    },

    notificationContent: {
      flex: 1,
      minWidth: 0,
      justifyContent:
        "center",
    },

    notificationText: {
      fontSize: 14,
      lineHeight: 19,
      color: "#0f172a",
    },

    timeText: {
      marginTop: 3,
      fontSize: 11,
      lineHeight: 15,
      color: "#64748b",
    },

    replyText: {
      marginTop: 3,
      fontSize: 11,
      lineHeight: 15,
      fontStyle:
        "italic",
      color: "#64748b",
    },

    rightActions: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
      flexShrink: 0,
    },

    thumbnail: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor:
        "#e2e8f0",
    },

    unreadDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor:
        "#a855f7",
    },

    deleteButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    requestContainer: {
      paddingBottom: 4,
    },

    requestRow: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor:
        "rgba(226,232,240,0.65)",
    },

    requestUser: {
      flex: 1,
      minWidth: 0,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 12,
    },

    requestUserText: {
      flex: 1,
      minWidth: 0,
    },

    username: {
      fontSize: 14,
      lineHeight: 19,
      fontWeight:
        "700",
      color: "#0f172a",
    },

    requestSubtitle: {
      marginTop: 2,
      fontSize: 11,
      lineHeight: 15,
      color: "#64748b",
    },

    requestActions: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    confirmButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor:
        "#a855f7",
    },

    confirmText: {
      fontSize: 11,
      fontWeight:
        "800",
      color: "#ffffff",
    },

    declineButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    declineText: {
      fontSize: 11,
      fontWeight:
        "800",
      color: "#0f172a",
    },

    emptyState: {
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 28,
      paddingVertical: 100,
    },

    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      marginBottom: 16,
    },

    emptyTitle: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight:
        "800",
      color: "#0f172a",
    },

    emptyDescription: {
      marginTop: 6,
      maxWidth: 320,
      fontSize: 12,
      lineHeight: 18,
      color: "#64748b",
      textAlign:
        "center",
    },

    footerLoader: {
      paddingVertical: 20,
      alignItems:
        "center",
      justifyContent:
        "center",
    },
  });
