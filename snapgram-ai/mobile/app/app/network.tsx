import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  ArrowLeft,
  UserPlus,
  Users,
  MessageCircle,
  Sparkles,
  MapPin,
  Star,
} from "lucide-react-native";
import {
  useDispatch,
  useSelector,
} from "react-redux";

import api from "../../src/services/api";
import { useToast } from "../../src/components/ui/Toast";
import {
  updateFollowing,
} from "../../src/store/authSlice";
import { Avatar } from "../../src/components/ui/Avatar";

type NetworkUser = {
  _id: string;
  username?: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
  mutualCount?: number;
};

type TabId =
  | "followers"
  | "following"
  | "quickadd"
  | "mutuals";

const TABS: Array<{
  id: TabId;
  label: string;
  highlight?: boolean;
}> = [
  {
    id: "followers",
    label: "Friends",
  },
  {
    id: "following",
    label: "Following",
  },
  {
    id: "quickadd",
    label: "⚡ Quick Add",
    highlight: true,
  },
  {
    id: "mutuals",
    label: "Mutual Friends",
  },
];

export default function NetworkScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const routeId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  const {
    user: authUser,
  } = useSelector(
    (state: any) =>
      state.auth,
  );

  const dispatch =
    useDispatch();

  const { toast } =
    useToast();

  const isOwner =
    !routeId ||
    routeId ===
      authUser?._id;

  const targetUserId =
    routeId ||
    authUser?._id;

  const [
    activeTab,
    setActiveTab,
  ] = useState<TabId>(
    "followers",
  );

  const [
    users,
    setUsers,
  ] = useState<
    NetworkUser[]
  >([]);

  const [
    quickAddList,
    setQuickAddList,
  ] = useState<
    NetworkUser[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    isNavigating,
    setIsNavigating,
  ] = useState(false);

  const [
    addingUserId,
    setAddingUserId,
  ] = useState<
    string | null
  >(null);

  const fetchNetworkData =
    useCallback(
      async () => {
        setLoading(true);

        try {
          if (
            activeTab ===
            "followers"
          ) {
            if (!targetUserId) {
              setUsers([]);
              return;
            }

            const response =
              await api.get(
                `/api/users/${targetUserId}/followers`,
              );

            if (
              response.data
                ?.success
            ) {
              setUsers(
                response.data
                  .data || [],
              );
            }
          }

          if (
            activeTab ===
            "following"
          ) {
            if (!targetUserId) {
              setUsers([]);
              return;
            }

            const response =
              await api.get(
                `/api/users/${targetUserId}/following`,
              );

            if (
              response.data
                ?.success
            ) {
              setUsers(
                response.data
                  .data || [],
              );
            }
          }

          if (
            activeTab ===
            "mutuals"
          ) {
            if (!targetUserId) {
              setUsers([]);
              return;
            }

            const response =
              await api.get(
                `/api/users/${targetUserId}/mutual-followers`,
              );

            if (
              response.data
                ?.success
            ) {
              setUsers(
                response.data
                  .data || [],
              );
            }
          }

          if (
            activeTab ===
            "quickadd"
          ) {
            const response =
              await api.get(
                "/api/users/recommendations/quick-add",
              );

            if (
              response.data
                ?.success
            ) {
              setQuickAddList(
                response.data
                  .data || [],
              );
            }
          }
        } catch (error) {
          console.error(
            "Network fetch failed:",
            error,
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [
        activeTab,
        targetUserId,
      ],
    );

  useEffect(() => {
    void fetchNetworkData();
  }, [
    fetchNetworkData,
  ]);

  const handleChat =
    async (
      userId: string,
    ) => {
      if (
        isNavigating
      ) {
        return;
      }

      setIsNavigating(
        true,
      );

      try {
        const response =
          await api.post(
            "/api/conversations",
            {
              userId,
            },
          );

        if (
          response.data
            ?.success &&
          response.data
            ?.data?._id
        ) {
          router.push(
            `/app/chat/${response.data.data._id}`,
          );
        }
      } catch (error) {
        console.error(
          "Failed to start conversation:",
          error,
        );

        toast({
          variant:
            "error",
          title:
            "Error",
          description:
            "Failed to start conversation",
        });
      } finally {
        setIsNavigating(
          false,
        );
      }
    };

  const handleQuickAdd =
    async (
      userId: string,
    ) => {
      if (
        addingUserId
      ) {
        return;
      }

      setAddingUserId(
        userId,
      );

      try {
        const response =
          await api.post(
            `/api/users/${userId}/follow`,
          );

        if (
          response.data
            ?.success &&
          response.data
            ?.data
        ) {
          dispatch(
            updateFollowing(
              response.data
                .data,
            ),
          );
        }

        toast({
          variant:
            "success",
          title:
            "Friend Request Sent!",
          description:
            "Added user to your Snapchat network.",
        });

        setQuickAddList(
          (
            previous,
          ) =>
            previous.filter(
              (
                item,
              ) =>
                item._id !==
                userId,
            ),
        );
      } catch (error) {
        console.error(
          "Failed to add friend:",
          error,
        );

        toast({
          variant:
            "error",
          title:
            "Failed to add friend",
          description:
            "Please try again.",
        });
      } finally {
        setAddingUserId(
          null,
        );
      }
    };

  const openProfile =
    (userId: string) => {
      router.push(
        `/app/profile/${userId}`,
      );
    };

  const renderNetworkUser =
    ({
      item,
    }: {
      item: NetworkUser;
    }) => (
      <View
        style={
          styles.userCard
        }
      >
        <Pressable
          onPress={() =>
            openProfile(
              item._id,
            )
          }
          style={
            styles.userInfo
          }
        >
          <Avatar
            src={
              item.profilePicture ||
              item.avatar
            }
            fallback={
              item.username?.charAt(
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
              styles.userText
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
              @{item.username ||
                "user"}
            </Text>

            <Text
              style={
                styles.fullName
              }
              numberOfLines={
                1
              }
            >
              {item.fullName ||
                "InstaSnap User"}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() =>
            void handleChat(
              item._id,
            )
          }
          disabled={
            isNavigating
          }
          style={
            styles.chatButton
          }
        >
          <MessageCircle
            size={15}
            color="#a855f7"
          />

          <Text
            style={
              styles.chatButtonText
            }
          >
            Chat / Snap
          </Text>
        </Pressable>
      </View>
    );

  const renderQuickAdd =
    ({
      item,
    }: {
      item: NetworkUser;
    }) => {
      const adding =
        addingUserId ===
        item._id;

      return (
        <View
          style={
            styles.quickCard
          }
        >
          <Pressable
            onPress={() =>
              openProfile(
                item._id,
              )
            }
            style={
              styles.quickUser
            }
          >
            <Avatar
              src={
                item.profilePicture ||
                item.avatar
              }
              fallback={
                item.username?.charAt(
                  0,
                ) ||
                "U"
              }
              style={
                styles.quickAvatar
              }
            />

            <View
              style={
                styles.userText
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
                @{item.username ||
                  "user"}
              </Text>

              <Text
                style={
                  styles.fullName
                }
                numberOfLines={
                  1
                }
              >
                {item.fullName ||
                  "Suggested Creator"}
              </Text>

              <View
                style={
                  styles.mutualRow
                }
              >
                <Sparkles
                  size={12}
                  color="#a855f7"
                />

                <Text
                  style={
                    styles.mutualText
                  }
                >
                  {item.mutualCount ||
                    3}{" "}
                  Mutual Friends
                </Text>
              </View>
            </View>
          </Pressable>

          <Pressable
            onPress={() =>
              void handleQuickAdd(
                item._id,
              )
            }
            disabled={
              Boolean(
                addingUserId,
              )
            }
            style={[
              styles.addButton,
              adding &&
                styles.addButtonDisabled,
            ]}
          >
            {adding ? (
              <ActivityIndicator
                size="small"
                color="#ffffff"
              />
            ) : (
              <>
                <UserPlus
                  size={15}
                  color="#ffffff"
                />

                <Text
                  style={
                    styles.addButtonText
                  }
                >
                  Add
                </Text>
              </>
            )}
          </Pressable>
        </View>
      );
    };

  const data =
    activeTab ===
    "quickadd"
      ? quickAddList
      : users;

  const emptyMessage =
    activeTab ===
    "quickadd"
      ? "No new recommendations right now."
      : activeTab ===
          "mutuals"
        ? "No mutual friends found."
        : activeTab ===
            "following"
          ? "Not following anyone yet."
          : "No friends found.";

  return (
    <View
      style={
        styles.screen
      }
    >
      {/* Header */}
      <View
        style={
          styles.header
        }
      >
        <Pressable
          onPress={() =>
            router.back()
          }
          style={
            styles.headerButton
          }
        >
          <ArrowLeft
            size={22}
            color="#0f172a"
          />
        </Pressable>

        <Text
          style={
            styles.headerTitle
          }
        >
          Friends & Network
        </Text>

        <View
          style={
            styles.headerSpacer
          }
        />
      </View>

      {/* Tabs */}
      <View
        style={
          styles.tabWrapper
        }
      >
        <FlatList
          horizontal
          data={TABS}
          keyExtractor={(
            item,
          ) => item.id}
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.tabs
          }
          renderItem={({
            item,
          }) => {
            const active =
              activeTab ===
              item.id;

            return (
              <Pressable
                onPress={() =>
                  setActiveTab(
                    item.id,
                  )
                }
                style={[
                  styles.tab,
                  active &&
                    (item.highlight
                      ? styles.highlightTab
                      : styles.activeTab),
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    active &&
                      styles.activeTabText,
                  ]}
                >
                  {
                    item.label
                  }
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Content Heading */}
      <View
        style={
          styles.sectionHeader
        }
      >
        {activeTab ===
        "quickadd" ? (
          <>
            <View
              style={
                styles.sectionTitleRow
              }
            >
              <UserPlus
                size={19}
                color="#a855f7"
              />

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Snapchat Quick Add
              </Text>
            </View>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Based on mutual friends &
              interests
            </Text>
          </>
        ) : (
          <>
            <View
              style={
                styles.sectionTitleRow
              }
            >
              <Users
                size={19}
                color="#a855f7"
              />

              <Text
                style={
                  styles.sectionTitle
                }
              >
                {activeTab ===
                "following"
                  ? "Following"
                  : activeTab ===
                      "mutuals"
                    ? "Mutual Friends"
                    : isOwner
                      ? "Your Friends"
                      : "Friends"}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View
          style={
            styles.loading
          }
        >
          <ActivityIndicator
            size="large"
            color="#a855f7"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading friends network...
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(
            item,
          ) => item._id}
          renderItem={
            activeTab ===
            "quickadd"
              ? renderQuickAdd
              : renderNetworkUser
          }
          contentContainerStyle={[
            styles.listContent,
            data.length ===
              0 &&
              styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={
            false
          }
          refreshing={
            loading
          }
          onRefresh={() =>
            void fetchNetworkData()
          }
          ListEmptyComponent={
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
                {activeTab ===
                "quickadd" ? (
                  <UserPlus
                    size={
                      30
                    }
                    color="#94a3b8"
                  />
                ) : (
                  <Users
                    size={
                      30
                    }
                    color="#94a3b8"
                  />
                )}
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Nothing here yet
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                {emptyMessage}
              </Text>
            </View>
          }
        />
      )}
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

    header: {
      minHeight: 64,
      paddingHorizontal: 16,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      backgroundColor:
        "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor:
        "#e2e8f0",
    },

    headerButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    headerSpacer: {
      width: 42,
      height: 42,
    },

    headerTitle: {
      flex: 1,
      textAlign:
        "center",
      color:
        "#a855f7",
      fontSize: 19,
      fontWeight:
        "800",
    },

    tabWrapper: {
      backgroundColor:
        "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor:
        "#e2e8f0",
    },

    tabs: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 7,
    },

    tab: {
      paddingHorizontal: 15,
      paddingVertical: 9,
      borderRadius: 12,
      backgroundColor:
        "#f1f5f9",
    },

    activeTab: {
      backgroundColor:
        "rgba(168,85,247,0.10)",
      borderWidth: 1,
      borderColor:
        "rgba(168,85,247,0.28)",
    },

    highlightTab: {
      backgroundColor:
        "#a855f7",
    },

    tabText: {
      color:
        "#64748b",
      fontSize: 12,
      fontWeight:
        "700",
    },

    activeTabText: {
      color:
        "#a855f7",
    },

    sectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 10,
    },

    sectionTitleRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
    },

    sectionTitle: {
      color:
        "#0f172a",
      fontSize: 17,
      fontWeight:
        "800",
    },

    sectionSubtitle: {
      marginTop: 4,
      marginLeft: 26,
      color:
        "#64748b",
      fontSize: 11,
    },

    listContent: {
      paddingHorizontal: 14,
      paddingBottom: 30,
    },

    emptyListContent: {
      flexGrow: 1,
    },

    loading: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingBottom: 100,
    },

    loadingText: {
      marginTop: 10,
      color:
        "#64748b",
      fontSize: 13,
    },

    userCard: {
      minHeight: 76,
      marginBottom: 9,
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderRadius: 18,
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    userInfo: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
      minWidth: 0,
    },

    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 2,
      borderColor:
        "#c084fc",
    },

    quickCard: {
      minHeight: 92,
      marginBottom: 10,
      paddingHorizontal: 13,
      paddingVertical: 12,
      borderRadius: 18,
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    quickUser: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
      minWidth: 0,
    },

    quickAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 2,
      borderColor:
        "#a855f7",
    },

    userText: {
      flex: 1,
      minWidth: 0,
      marginLeft: 11,
    },

    username: {
      color:
        "#0f172a",
      fontSize: 13,
      fontWeight:
        "800",
    },

    fullName: {
      marginTop: 2,
      color:
        "#64748b",
      fontSize: 11,
    },

    mutualRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
      marginTop: 4,
    },

    mutualText: {
      color:
        "#a855f7",
      fontSize: 9,
      fontWeight:
        "700",
    },

    chatButton: {
      minHeight: 36,
      paddingHorizontal: 10,
      borderRadius: 11,
      borderWidth: 1,
      borderColor:
        "rgba(168,85,247,0.28)",
      backgroundColor:
        "rgba(168,85,247,0.06)",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 5,
      marginLeft: 8,
    },

    chatButtonText: {
      color:
        "#a855f7",
      fontSize: 10,
      fontWeight:
        "800",
    },

    addButton: {
      minWidth: 66,
      minHeight: 38,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor:
        "#a855f7",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 5,
      marginLeft: 8,
    },

    addButtonDisabled: {
      opacity: 0.65,
    },

    addButtonText: {
      color:
        "#ffffff",
      fontSize: 11,
      fontWeight:
        "800",
    },

    emptyState: {
      flex: 1,
      minHeight: 280,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 30,
    },

    emptyIcon: {
      width: 70,
      height: 70,
      borderRadius: 35,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#eef2f7",
      marginBottom: 13,
    },

    emptyTitle: {
      color:
        "#0f172a",
      fontSize: 17,
      fontWeight:
        "800",
    },

    emptyText: {
      marginTop: 5,
      color:
        "#64748b",
      fontSize: 13,
      lineHeight: 19,
      textAlign:
        "center",
    },
  });