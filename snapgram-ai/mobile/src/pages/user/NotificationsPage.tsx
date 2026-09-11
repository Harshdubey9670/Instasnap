import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  Bell,
  CheckCheck,
} from "lucide-react-native";
import {
  router,
} from "expo-router";
import { useDispatch } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  NotificationItem,
  type NotificationGroup,
  type NotificationType,
} from "../../components/notifications";
import { Avatar } from "../../components/ui/Avatar";
import { useTheme } from "../../contexts/ThemeContext";
import { clearUnreadCount } from "../../store/authSlice";
import api from "../../services/api";

interface NotificationSender {
  _id?: string;
  username?: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
}

interface NotificationPost {
  _id?: string;
  media?: Array<{
    url?: string;
  }>;
}

interface NotificationRecord {
  _id: string;
  type: NotificationType;
  createdAt: string;
  read?: boolean;
  message?: string;
  sender?: NotificationSender | string;
  post?: NotificationPost;
}

interface GroupedNotification {
  _id: string;
  type: NotificationType;
  createdAt: string;
  read?: boolean;
  message?: string;
  sender?: NotificationSender;
  senders: NotificationSender[];
  post?: NotificationPost;
  ids: string[];
}

interface FollowRequest {
  _id: string;
  username?: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
}

interface NotificationsResponse {
  success: boolean;
  data: NotificationRecord[];
  unreadCount?: number;
  pagination?: {
    hasMore?: boolean;
  };
}

interface FollowRequestsResponse {
  success: boolean;
  data: FollowRequest[];
}

type SectionName =
  | "Today"
  | "This Week"
  | "Earlier";

type ListItem =
  | {
      type: "section";
      key: string;
      title: string;
    }
  | {
      type: "follow-request";
      key: string;
      request: FollowRequest;
    }
  | {
      type: "notification";
      key: string;
      notification: GroupedNotification;
    };

const openProfile = (userId?: string) => {
  if (!userId) {
    return;
  }

  router.push(
    `/app/profile/${userId}`,
  );
};

const normalizeSender = (
  sender?: NotificationSender | string,
): NotificationSender | undefined => {
  if (!sender) {
    return undefined;
  }

  if (typeof sender === "string") {
    return {
      _id: sender,
    };
  }

  return sender;
};

const groupNotifications = (
  notifications: NotificationRecord[],
): GroupedNotification[] => {
  const grouped: GroupedNotification[] = [];

  notifications.forEach((notification) => {
    const sender = normalizeSender(
      notification.sender,
    );

    const canGroup =
      Boolean(notification.post?._id) &&
      [
        "like",
        "comment",
        "mention",
      ].includes(notification.type);

    const newGroup: GroupedNotification = {
      ...notification,
      sender,
      senders: sender ? [sender] : [],
      ids: [notification._id],
    };

    if (!canGroup) {
      grouped.push(newGroup);
      return;
    }

    const previousGroup =
      grouped[grouped.length - 1];

    const matchesPreviousGroup =
      previousGroup &&
      previousGroup.type === notification.type &&
      previousGroup.post?._id ===
        notification.post?._id;

    if (!matchesPreviousGroup) {
      grouped.push(newGroup);
      return;
    }

    if (
      sender &&
      !previousGroup.senders.some(
        (existingSender) =>
          existingSender._id === sender._id,
      )
    ) {
      previousGroup.senders.push(sender);
    }

    if (!notification.read) {
      previousGroup.read = false;
    }

    previousGroup.ids.push(notification._id);
  });

  return grouped;
};

const categorizeNotifications = (
  notifications: GroupedNotification[],
): Record<SectionName, GroupedNotification[]> => {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const sevenDays = 7 * oneDay;

  const result: Record<
    SectionName,
    GroupedNotification[]
  > = {
    Today: [],
    "This Week": [],
    Earlier: [],
  };

  notifications.forEach((notification) => {
    const createdAt = new Date(
      notification.createdAt,
    ).getTime();

    const age = now - createdAt;

    if (age <= oneDay) {
      result.Today.push(notification);
    } else if (age <= sevenDays) {
      result["This Week"].push(notification);
    } else {
      result.Earlier.push(notification);
    }
  });

  return result;
};

const stopPropagation = (event: unknown) => {
  if (
    event &&
    typeof event === "object" &&
    "stopPropagation" in event
  ) {
    const nativeEvent = event as {
      stopPropagation?: () => void;
    };

    nativeEvent.stopPropagation?.();
  }
};

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { effectiveTheme } = useTheme();

  const darkMode =
    effectiveTheme === "dark";

  const colors = useMemo(
    () => ({
      background: darkMode
        ? "#0a0510"
        : "#f8fafc",
      surface: darkMode
        ? "#130a1c"
        : "#ffffff",
      textPrimary: darkMode
        ? "#f8fafc"
        : "#0f172a",
      textSecondary: darkMode
        ? "#94a3b8"
        : "#64748b",
      border: darkMode
        ? "#2d1b3b"
        : "#e2e8f0",
      primary: "#a855f7",
      primaryDark: "#9333ea",
    }),
    [darkMode],
  );

  const [
    notifications,
    setNotifications,
  ] = useState<NotificationRecord[]>([]);

  const [
    followRequests,
    setFollowRequests,
  ] = useState<FollowRequest[]>([]);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] =
    useState(true);
  const [loading, setLoading] =
    useState(true);

  const [
    fetchingMore,
    setFetchingMore,
  ] = useState(false);

  const [
    markingRead,
    setMarkingRead,
  ] = useState(false);

  const loadingMoreRef = useRef(false);

  const fetchFollowRequests =
    useCallback(async () => {
      try {
        const response =
          await api.get<FollowRequestsResponse>(
            "/api/users/follow-requests",
          );

        if (response.data.success) {
          setFollowRequests(
            Array.isArray(response.data.data)
              ? response.data.data
              : [],
          );
        }
      } catch (error) {
        console.error(
          "Failed to fetch follow requests",
          error,
        );
      }
    }, []);

  const fetchNotifications = useCallback(
    async (pageNumber: number) => {
      if (pageNumber === 1) {
        setLoading(true);
        void fetchFollowRequests();
      } else {
        setFetchingMore(true);
      }

      try {
        const response =
          await api.get<NotificationsResponse>(
            `/api/notifications?page=${pageNumber}&limit=15`,
          );

        if (!response.data.success) {
          return;
        }

        const receivedNotifications =
          Array.isArray(response.data.data)
            ? response.data.data
            : [];

        setNotifications(
          (currentNotifications) =>
            pageNumber === 1
              ? receivedNotifications
              : [
                  ...currentNotifications,
                  ...receivedNotifications,
                ],
        );

        setUnreadCount(
          response.data.unreadCount ?? 0,
        );

        setHasMore(
          response.data.pagination?.hasMore ??
            false,
        );
      } catch (error) {
        console.error(
          "Failed to fetch notifications",
          error,
        );
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    },
    [fetchFollowRequests],
  );

  useEffect(() => {
    dispatch(clearUnreadCount());
    void fetchNotifications(1);
  }, [
    dispatch,
    fetchNotifications,
  ]);

  const handleLoadMore =
    useCallback(() => {
      if (
        loading ||
        fetchingMore ||
        loadingMoreRef.current ||
        !hasMore
      ) {
        return;
      }

      const nextPage = page + 1;

      loadingMoreRef.current = true;
      setPage(nextPage);

      void fetchNotifications(
        nextPage,
      ).finally(() => {
        loadingMoreRef.current = false;
      });
    }, [
      fetchingMore,
      fetchNotifications,
      hasMore,
      loading,
      page,
    ]);

  const handleAcceptRequest =
    useCallback(
      async (requestId: string) => {
        try {
          await api.post(
            `/api/users/follow-requests/${requestId}/accept`,
          );

          setFollowRequests(
            (currentRequests) =>
              currentRequests.filter(
                (request) =>
                  request._id !== requestId,
              ),
          );
        } catch (error) {
          console.error(
            "Failed to accept request",
            error,
          );
        }
      },
      [],
    );

  const handleDeclineRequest =
    useCallback(
      async (requestId: string) => {
        try {
          await api.post(
            `/api/users/follow-requests/${requestId}/decline`,
          );

          setFollowRequests(
            (currentRequests) =>
              currentRequests.filter(
                (request) =>
                  request._id !== requestId,
              ),
          );
        } catch (error) {
          console.error(
            "Failed to decline request",
            error,
          );
        }
      },
      [],
    );

  const handleMarkAllRead =
    useCallback(async () => {
      if (
        unreadCount === 0 ||
        markingRead
      ) {
        return;
      }

      setMarkingRead(true);

      try {
        await api.put(
          "/api/notifications/read-all",
        );

        setNotifications(
          (currentNotifications) =>
            currentNotifications.map(
              (notification) => ({
                ...notification,
                read: true,
              }),
            ),
        );

        setUnreadCount(0);
      } catch (error) {
        console.error(
          "Failed to mark notifications as read",
          error,
        );
      } finally {
        setMarkingRead(false);
      }
    }, [
      markingRead,
      unreadCount,
    ]);

  const handleMarkOneRead =
    useCallback(
      async (
        event: unknown,
        notificationId: string,
      ) => {
        stopPropagation(event);

        try {
          await api.put(
            `/api/notifications/${notificationId}/read`,
          );

          setNotifications(
            (currentNotifications) =>
              currentNotifications.map(
                (notification) =>
                  notification._id ===
                  notificationId
                    ? {
                        ...notification,
                        read: true,
                      }
                    : notification,
              ),
          );

          setUnreadCount(
            (currentCount) =>
              Math.max(
                0,
                currentCount - 1,
              ),
          );
        } catch (error) {
          console.error(
            "Failed to mark notification as read",
            error,
          );
        }
      },
      [],
    );

  const handleDelete = useCallback(
    async (
      event: unknown,
      notificationId: string,
    ) => {
      stopPropagation(event);

      try {
        await api.delete(
          `/api/notifications/${notificationId}`,
        );

        setNotifications(
          (currentNotifications) =>
            currentNotifications.filter(
              (notification) =>
                notification._id !==
                notificationId,
            ),
        );
      } catch (error) {
        console.error(
          "Failed to delete notification",
          error,
        );
      }
    },
    [],
  );

  const handleNotificationClick =
    useCallback(
      (group: NotificationGroup) => {
        const groupedNotification =
          group as NotificationGroup & {
            ids?: string[];
          };

        const idsToMark =
          groupedNotification.ids?.length
            ? groupedNotification.ids
            : [group._id];

        if (!group.read) {
          setNotifications(
            (currentNotifications) =>
              currentNotifications.map(
                (notification) =>
                  idsToMark.includes(
                    notification._id,
                  )
                    ? {
                        ...notification,
                        read: true,
                      }
                    : notification,
              ),
          );

          void Promise.all(
            idsToMark.map(
              (notificationId) =>
                api.put(
                  `/api/notifications/${notificationId}/read`,
                ),
            ),
          ).catch(() => {
            console.error(
              "Failed to mark notification as read",
            );
          });
        }

        openProfile(group.sender?._id);
      },
      [],
    );

  const groupedNotifications =
    useMemo(
      () =>
        groupNotifications(
          notifications,
        ),
      [notifications],
    );

  const categorizedNotifications =
    useMemo(
      () =>
        categorizeNotifications(
          groupedNotifications,
        ),
      [groupedNotifications],
    );

  const listItems =
    useMemo<ListItem[]>(() => {
      const items: ListItem[] = [];

      if (followRequests.length > 0) {
        items.push({
          type: "section",
          key: "follow-requests-section",
          title: `Follow Requests (${followRequests.length})`,
        });

        followRequests.forEach(
          (request) => {
            items.push({
              type: "follow-request",
              key: `follow-request-${request._id}`,
              request,
            });
          },
        );
      }

      (
        [
          "Today",
          "This Week",
          "Earlier",
        ] as SectionName[]
      ).forEach((sectionName) => {
        const sectionNotifications =
          categorizedNotifications[
            sectionName
          ];

        if (
          sectionNotifications.length === 0
        ) {
          return;
        }

        items.push({
          type: "section",
          key: `section-${sectionName}`,
          title: sectionName,
        });

        sectionNotifications.forEach(
          (notification) => {
            items.push({
              type: "notification",
              key: `notification-${notification._id}`,
              notification,
            });
          },
        );
      });

      return items;
    }, [
      categorizedNotifications,
      followRequests,
    ]);

  const renderItem = useCallback(
    ({
      item,
    }: {
      item: ListItem;
    }) => {
      if (item.type === "section") {
        return (
          <View
            style={[
              styles.sectionHeader,
              {
                backgroundColor:
                  colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              {item.title}
            </Text>
          </View>
        );
      }

      if (
        item.type ===
        "follow-request"
      ) {
        const { request } = item;

        return (
          <View
            style={[
              styles.followRequestRow,
              {
                borderColor:
                  colors.border,
              },
            ]}
          >
            <Pressable
              onPress={() =>
                openProfile(request._id)
              }
              style={({ pressed }) => [
                styles.requestProfile,
                pressed && styles.pressed,
              ]}
            >
              <Avatar
                src={
                  request.profilePicture ||
                  request.avatar
                }
                fallback={
                  request.username
                    ?.charAt(0)
                    .toUpperCase() ||
                  "U"
                }
                size="md"
              />

              <View
                style={
                  styles.requestText
                }
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.requestUsername,
                    {
                      color:
                        colors.textPrimary,
                    },
                  ]}
                >
                  @{request.username || "user"}
                </Text>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.requestName,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
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
                style={({ pressed }) => [
                  styles.confirmButton,
                  {
                    backgroundColor:
                      colors.primaryDark,
                  },
                  pressed &&
                    styles.buttonPressed,
                ]}
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
                style={({ pressed }) => [
                  styles.deleteButton,
                  {
                    backgroundColor:
                      colors.surface,
                    borderColor:
                      colors.border,
                  },
                  pressed &&
                    styles.buttonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.deleteText,
                    {
                      color:
                        colors.textPrimary,
                    },
                  ]}
                >
                  Delete
                </Text>
              </Pressable>
            </View>
          </View>
        );
      }

      return (
        <View
          style={[
            styles.notificationRow,
            {
              borderColor: colors.border,
            },
          ]}
        >
          <NotificationItem
            group={
              item.notification as NotificationGroup
            }
            handleNotificationClick={
              handleNotificationClick
            }
            handleMarkOneRead={
              handleMarkOneRead
            }
            handleDelete={handleDelete}
          />
        </View>
      );
    },
    [
      colors,
      handleAcceptRequest,
      handleDeclineRequest,
      handleDelete,
      handleMarkOneRead,
      handleNotificationClick,
    ],
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View
          style={styles.loadingState}
        >
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View
          style={[
            styles.emptyIcon,
            {
              backgroundColor:
                colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Bell
            size={32}
            color={colors.textSecondary}
          />
        </View>

        <Text
          style={[
            styles.emptyTitle,
            {
              color: colors.textPrimary,
            },
          ]}
        >
          No notifications yet
        </Text>

        <Text
          style={[
            styles.emptyDescription,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          When someone follows you, likes your
          posts, or mentions you, you&apos;ll
          see it here.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <View
        style={[
          styles.page,
          {
            backgroundColor:
              colors.background,
          },
        ]}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor:
                colors.background,
              borderColor: colors.border,
              paddingTop: (insets.top || 20) + 8,
            },
          ]}
        >
          <View
            style={
              styles.headerTitleRow
            }
          >
            {router.canGoBack() && (
              <Pressable
                onPress={() => {
                  if (router.canGoBack()) router.back();
                  else router.replace("/app");
                }}
                style={{ marginRight: 8, padding: 4 }}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <ArrowLeft size={22} color={colors.textPrimary} />
              </Pressable>
            )}
            <Text
              style={[
                styles.title,
                {
                  color:
                    colors.textPrimary,
                },
              ]}
            >
              Notifications
            </Text>

            {unreadCount > 0 ? (
              <View
                style={
                  styles.unreadBadge
                }
              >
                <Text
                  style={
                    styles.unreadBadgeText
                  }
                >
                  {unreadCount} new
                </Text>
              </View>
            ) : null}
          </View>

          {unreadCount > 0 ? (
            <Pressable
              onPress={() =>
                void handleMarkAllRead()
              }
              disabled={markingRead}
              style={({ pressed }) => [
                styles.markAllButton,
                pressed &&
                  styles.buttonPressed,
                markingRead &&
                  styles.disabled,
              ]}
            >
              {markingRead ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                />
              ) : (
                <CheckCheck
                  size={15}
                  color={colors.primary}
                />
              )}

              <Text
                style={[
                  styles.markAllText,
                  {
                    color:
                      colors.primary,
                  },
                ]}
              >
                Mark all read
              </Text>
            </Pressable>
          ) : null}
        </View>

        <FlatList
          data={listItems}
          keyExtractor={(item) =>
            item.key
          }
          renderItem={renderItem}
          ListEmptyComponent={
            renderEmptyState
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
                  color={colors.primary}
                />
              </View>
            ) : null
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 80 },
            listItems.length === 0 &&
              styles.emptyListContent,
          ]}
          onEndReached={
            handleLoadMore
          }
          onEndReachedThreshold={0.35}
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  page: {
    flex: 1,
    width: "100%",
    maxWidth: 576,
    alignSelf: "center",
  },

  header: {
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  headerTitleRow: {
    minWidth: 0,
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.35,
  },

  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor:
      "rgba(168,85,247,0.18)",
  },

  unreadBadgeText: {
    color: "#a855f7",
    fontSize: 12,
    fontWeight: "700",
  },

  markAllButton: {
    minHeight: 32,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor:
      "rgba(168,85,247,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  markAllText: {
    fontSize: 12,
    fontWeight: "700",
  },

  listContent: {
    paddingBottom: 96,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },

  followRequestRow: {
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  requestProfile: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  requestText: {
    minWidth: 0,
    flex: 1,
  },

  requestUsername: {
    fontSize: 14,
    fontWeight: "700",
  },

  requestName: {
    marginTop: 2,
    fontSize: 12,
  },

  requestActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  confirmButton: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  confirmText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },

  deleteButton: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth:
      StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteText: {
    fontSize: 12,
    fontWeight: "700",
  },

  notificationRow: {
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  loadingState: {
    flex: 1,
    minHeight: 360,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyState: {
    flex: 1,
    minHeight: 420,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 64,
    height: 64,
    marginBottom: 16,
    borderRadius: 32,
    borderWidth:
      StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 320,
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  footerLoader: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: {
    opacity: 0.78,
  },

  buttonPressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  disabled: {
    opacity: 0.5,
  },
});