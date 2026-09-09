import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
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
  Clock,
  Flame,
  Hash,
  Heart,
  MessageCircle,
} from "lucide-react-native";

import api from "../../../src/services/api";
import { trackEvent } from "../../../src/utils/analytics";

type User = {
  _id?: string;
  username?: string;
  profilePicture?: string;
  avatar?: string;
};

type Post = {
  _id: string;
  caption?: string;
  media?: Array<{
    url?: string;
    type?: string;
  }>;
  user?: User;
  likes?: unknown[];
  likesCount?: number;
  commentsCount?: number;
};

type HashtagResponse = {
  posts: Post[];
  pagination: {
    hasMore: boolean;
    total: number;
  };
  coverMedia?: string | null;
  relatedHashtags?: string[];
};

type TabType =
  | "top"
  | "recent";

export default function HashtagScreen() {
  const params =
    useLocalSearchParams<{
      tag?: string | string[];
    }>();

  const tag =
    Array.isArray(params.tag)
      ? params.tag[0]
      : params.tag || "";

  const [
    posts,
    setPosts,
  ] = useState<Post[]>([]);

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
    loadingMore,
    setLoadingMore,
  ] = useState(false);

  const [
    total,
    setTotal,
  ] = useState(0);

  const [
    activeTab,
    setActiveTab,
  ] = useState<TabType>(
    "top",
  );

  const [
    coverMedia,
    setCoverMedia,
  ] = useState<
    string | null
  >(null);

  const [
    relatedHashtags,
    setRelatedHashtags,
  ] = useState<string[]>(
    [],
  );

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const loadingRef =
    useRef(false);

  const hasMoreRef =
    useRef(true);

  const fetchPosts =
    useCallback(
      async (
        pageNum: number,
        currentTab: TabType,
        reset = false,
      ) => {
        if (!tag) {
          setLoading(false);
          return;
        }

        if (loadingRef.current) {
          return;
        }

        loadingRef.current =
          true;

        try {
          if (
            pageNum === 1
          ) {
            if (!reset) {
              setLoading(true);
            }
          } else {
            setLoadingMore(
              true,
            );
          }

          const response =
            await api.get(
              `/api/posts/hashtag/${encodeURIComponent(
                tag,
              )}?tab=${currentTab}&page=${pageNum}&limit=15`,
            );

          if (
            response.data
              ?.success
          ) {
            const data =
              response.data
                .data as HashtagResponse;

            const nextPosts =
              data.posts || [];

            setPosts(
              (previous) =>
                reset
                  ? nextPosts
                  : [
                      ...previous,
                      ...nextPosts,
                    ],
            );

            const nextHasMore =
              Boolean(
                data.pagination
                  ?.hasMore,
              );

            setHasMore(
              nextHasMore,
            );

            hasMoreRef.current =
              nextHasMore;

            setTotal(
              data.pagination
                ?.total || 0,
            );

            if (reset) {
              trackEvent(
                "hashtag_visit",
                null,
                {
                  tag,
                  total:
                    data.pagination
                      ?.total || 0,
                },
              );

              if (
                data.coverMedia !==
                undefined
              ) {
                setCoverMedia(
                  data.coverMedia ||
                    null,
                );
              }

              if (
                data.relatedHashtags !==
                undefined
              ) {
                setRelatedHashtags(
                  data.relatedHashtags ||
                    [],
                );
              }
            }
          }
        } catch (error) {
          console.error(
            "Failed to fetch hashtag posts:",
            error,
          );
        } finally {
          setLoading(
            false,
          );
          setLoadingMore(
            false,
          );
          loadingRef.current =
            false;
        }
      },
      [tag],
    );

  useEffect(() => {
    setPage(1);
    setPosts([]);
    setHasMore(true);
    hasMoreRef.current =
      true;

    void fetchPosts(
      1,
      activeTab,
      true,
    );
  }, [
    tag,
    activeTab,
    fetchPosts,
  ]);

  const handleLoadMore =
    useCallback(() => {
      if (
        loadingRef.current ||
        loadingMore ||
        !hasMoreRef.current
      ) {
        return;
      }

      const nextPage =
        page + 1;

      setPage(
        nextPage,
      );

      void fetchPosts(
        nextPage,
        activeTab,
        false,
      );
    }, [
      page,
      activeTab,
      fetchPosts,
      loadingMore,
    ]);

  const handleRefresh =
    useCallback(
      async () => {
        if (
          loadingRef.current
        ) {
          return;
        }

        setRefreshing(
          true,
        );
        setPage(1);
        setPosts([]);
        setHasMore(true);
        hasMoreRef.current =
          true;

        await fetchPosts(
          1,
          activeTab,
          true,
        );

        setRefreshing(
          false,
        );
      },
      [
        activeTab,
        fetchPosts,
      ],
    );

  const renderPost =
    useCallback(
      ({
        item,
      }: {
        item: Post;
      }) => {
        const mediaUrl =
          item.media?.[0]
            ?.url;

        if (!mediaUrl) {
          return null;
        }

        const likes =
          item.likesCount !==
          undefined
            ? item.likesCount
            : item.likes
                ?.length || 0;

        const comments =
          item.commentsCount ||
          0;

        return (
          <Pressable
            onPress={() => {
              if (
                item.user?._id
              ) {
                router.push(
                  `/app/profile/${item.user._id}`,
                );
              }
            }}
            style={
              styles.postCard
            }
          >
            <Image
              source={{
                uri: mediaUrl,
              }}
              style={
                styles.postImage
              }
              resizeMode="cover"
            />

            <View
              style={
                styles.postOverlay
              }
            >
              <View
                style={
                  styles.authorPill
                }
              >
                <Image
                  source={{
                    uri:
                      item.user
                        ?.profilePicture ||
                      item.user
                        ?.avatar ||
                      "https://i.pravatar.cc/150",
                  }}
                  style={
                    styles.authorAvatar
                  }
                />

                <Text
                  numberOfLines={
                    1
                  }
                  style={
                    styles.authorName
                  }
                >
                  {item.user
                    ?.username ||
                    "user"}
                </Text>
              </View>

              <View
                style={
                  styles.stats
                }
              >
                <View
                  style={
                    styles.stat
                  }
                >
                  <Heart
                    size={
                      16
                    }
                    color="#ffffff"
                    fill="#ffffff"
                  />
                  <Text
                    style={
                      styles.statText
                    }
                  >
                    {likes}
                  </Text>
                </View>

                <View
                  style={
                    styles.stat
                  }
                >
                  <MessageCircle
                    size={
                      16
                    }
                    color="#ffffff"
                    fill="#ffffff"
                  />
                  <Text
                    style={
                      styles.statText
                    }
                  >
                    {comments}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        );
      },
      [],
    );

  const keyExtractor =
    useCallback(
      (item: Post) =>
        item._id,
      [],
    );

  if (!tag) {
    return (
      <View
        style={
          styles.centerScreen
        }
      >
        <Hash
          size={52}
          color="#a855f7"
        />

        <Text
          style={
            styles.emptyTitle
          }
        >
          Hashtag not found
        </Text>

        <Pressable
          onPress={() =>
            router.back()
          }
          style={
            styles.backButton
          }
        >
          <ArrowLeft
            size={18}
            color="#ffffff"
          />

          <Text
            style={
              styles.backButtonText
            }
          >
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={
        styles.screen
      }
    >
      {/* Hero */}
      <View
        style={
          styles.hero
        }
      >
        {coverMedia ? (
          <>
            <Image
              source={{
                uri: coverMedia,
              }}
              style={
                styles.coverImage
              }
              blurRadius={
                2
              }
            />

            <View
              style={
                styles.coverOverlay
              }
            />
          </>
        ) : (
          <View
            style={
              styles.coverGradient
            }
          />
        )}

        <Pressable
          onPress={() =>
            router.back()
          }
          style={
            styles.heroBackButton
          }
        >
          <ArrowLeft
            size={21}
            color="#ffffff"
          />
        </Pressable>

        <View
          style={
            styles.heroContent
          }
        >
          <View
            style={
              styles.hashtagIcon
            }
          >
            <Hash
              size={42}
              color="#ffffff"
              strokeWidth={
                2.4
              }
            />
          </View>

          <View
            style={
              styles.heroTextBlock
            }
          >
            <Text
              style={
                styles.heroTitle
              }
              numberOfLines={
                1
              }
            >
              #{tag}
            </Text>

            {!loading ? (
              <Text
                style={
                  styles.heroCount
                }
              >
                {total.toLocaleString()}{" "}
                posts
              </Text>
            ) : null}
          </View>
        </View>

        {!loading &&
        relatedHashtags.length >
          0 ? (
          <View
            style={
              styles.relatedSection
            }
          >
            <Text
              style={
                styles.relatedLabel
              }
            >
              Related:
            </Text>

            <FlatList
              horizontal
              data={
                relatedHashtags
              }
              keyExtractor={(
                item,
              ) =>
                item
              }
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.relatedList
              }
              renderItem={({
                item,
              }) => (
                <Pressable
                  onPress={() =>
                    router.push(
                      `/app/hashtag/${item}`,
                    )
                  }
                  style={
                    styles.relatedChip
                  }
                >
                  <Text
                    style={
                      styles.relatedChipText
                    }
                  >
                    #{item}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        ) : null}
      </View>

      {/* Tabs */}
      <View
        style={
          styles.tabBar
        }
      >
        <Pressable
          onPress={() =>
            setActiveTab(
              "top",
            )
          }
          style={[
            styles.tab,
            activeTab ===
              "top" &&
              styles.activeTab,
          ]}
        >
          <Flame
            size={17}
            color={
              activeTab ===
              "top"
                ? "#a855f7"
                : "#64748b"
            }
          />

          <Text
            style={[
              styles.tabText,
              activeTab ===
                "top" &&
                styles.activeTabText,
            ]}
          >
            Top Posts
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            setActiveTab(
              "recent",
            )
          }
          style={[
            styles.tab,
            activeTab ===
              "recent" &&
              styles.activeTab,
          ]}
        >
          <Clock
            size={17}
            color={
              activeTab ===
              "recent"
                ? "#a855f7"
                : "#64748b"
            }
          />

          <Text
            style={[
              styles.tabText,
              activeTab ===
                "recent" &&
                styles.activeTabText,
            ]}
          >
            Recent
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {loading ? (
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color="#a855f7"
          />
        </View>
      ) : posts.length ===
        0 ? (
        <View
          style={
            styles.emptyContainer
          }
        >
          <View
            style={
              styles.emptyIcon
            }
          >
            <Hash
              size={42}
              color="#64748b"
            />
          </View>

          <Text
            style={
              styles.emptyTitle
            }
          >
            No posts yet
          </Text>

          <Text
            style={
              styles.emptyDescription
            }
          >
            Be the first to use #
            {tag} in your caption!
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={
            keyExtractor
          }
          renderItem={
            renderPost
          }
          numColumns={2}
          columnWrapperStyle={
            styles.columnWrapper
          }
          contentContainerStyle={
            styles.gridContent
          }
          showsVerticalScrollIndicator={
            false
          }
          refreshing={
            refreshing
          }
          onRefresh={
            handleRefresh
          }
          onEndReached={
            handleLoadMore
          }
          onEndReachedThreshold={
            0.65
          }
          ListFooterComponent={
            loadingMore ? (
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
            ) : !hasMore &&
              posts.length > 0 ? (
              <View
                style={
                  styles.endMessage
                }
              >
                <Text
                  style={
                    styles.endMessageText
                  }
                >
                  You've seen all #
                  {tag} posts! 🏷️
                </Text>
              </View>
            ) : null
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

    centerScreen: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 24,
      backgroundColor:
        "#f8fafc",
    },

    hero: {
      height: 310,
      position:
        "relative",
      overflow:
        "hidden",
      backgroundColor:
        "#151021",
    },

    coverImage: {
      position:
        "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: "100%",
      height: "100%",
      opacity: 0.7,
    },

    coverOverlay: {
      position:
        "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor:
        "rgba(15,23,42,0.58)",
    },

    coverGradient: {
      position:
        "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor:
        "#6d28d9",
      opacity: 0.28,
    },

    heroBackButton: {
      position:
        "absolute",
      top: 48,
      left: 16,
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(15,23,42,0.60)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.15)",
    },

    heroContent: {
      position:
        "absolute",
      left: 20,
      right: 20,
      bottom: 72,
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    hashtagIcon: {
      width: 78,
      height: 78,
      borderRadius: 39,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#a855f7",
      borderWidth: 4,
      borderColor:
        "rgba(248,250,252,0.9)",
      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.22,
      shadowRadius: 10,
      elevation: 7,
    },

    heroTextBlock: {
      flex: 1,
      marginLeft: 16,
    },

    heroTitle: {
      color:
        "#ffffff",
      fontSize: 34,
      fontWeight:
        "900",
    },

    heroCount: {
      marginTop: 3,
      color:
        "rgba(255,255,255,0.75)",
      fontSize: 15,
      fontWeight:
        "600",
    },

    relatedSection: {
      position:
        "absolute",
      left: 16,
      right: 0,
      bottom: 16,
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    relatedLabel: {
      color:
        "rgba(255,255,255,0.72)",
      fontSize: 12,
      fontWeight:
        "700",
      marginRight: 8,
    },

    relatedList: {
      paddingRight: 16,
      gap: 7,
    },

    relatedChip: {
      paddingHorizontal: 13,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor:
        "rgba(255,255,255,0.14)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.20)",
    },

    relatedChipText: {
      color:
        "#ffffff",
      fontSize: 11,
      fontWeight:
        "700",
    },

    tabBar: {
      height: 58,
      flexDirection:
        "row",
      alignItems:
        "flex-end",
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor:
        "#e2e8f0",
      backgroundColor:
        "#f8fafc",
    },

    tab: {
      height: 58,
      minWidth: 120,
      paddingHorizontal: 12,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 7,
      borderBottomWidth: 2,
      borderBottomColor:
        "transparent",
    },

    activeTab: {
      borderBottomColor:
        "#a855f7",
    },

    tabText: {
      color:
        "#64748b",
      fontSize: 13,
      fontWeight:
        "700",
    },

    activeTabText: {
      color:
        "#a855f7",
    },

    loadingContainer: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    emptyContainer: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 28,
    },

    emptyIcon: {
      width: 82,
      height: 82,
      borderRadius: 41,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#eef2f7",
      marginBottom: 17,
    },

    emptyTitle: {
      color:
        "#0f172a",
      fontSize: 20,
      fontWeight:
        "800",
      textAlign:
        "center",
    },

    emptyDescription: {
      marginTop: 6,
      color:
        "#64748b",
      fontSize: 14,
      lineHeight: 21,
      textAlign:
        "center",
    },

    gridContent: {
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: 30,
    },

    columnWrapper: {
      gap: 8,
    },

    postCard: {
      flex: 1,
      minWidth: 0,
      marginBottom: 8,
      borderRadius: 16,
      overflow:
        "hidden",
      backgroundColor:
        "#e2e8f0",
      minHeight: 190,
    },

    postImage: {
      width: "100%",
      aspectRatio: 0.78,
      backgroundColor:
        "#e2e8f0",
    },

    postOverlay: {
      position:
        "absolute",
      left: 8,
      right: 8,
      bottom: 8,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    authorPill: {
      maxWidth: "58%",
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingLeft: 3,
      paddingRight: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor:
        "rgba(0,0,0,0.48)",
    },

    authorAvatar: {
      width: 21,
      height: 21,
      borderRadius: 11,
      backgroundColor:
        "#334155",
    },

    authorName: {
      marginLeft: 5,
      color:
        "#ffffff",
      fontSize: 9,
      fontWeight:
        "700",
      flexShrink: 1,
    },

    stats: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
    },

    stat: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor:
        "rgba(0,0,0,0.45)",
    },

    statText: {
      color:
        "#ffffff",
      fontSize: 9,
      fontWeight:
        "800",
    },

    footerLoader: {
      paddingVertical: 20,
      alignItems:
        "center",
    },

    endMessage: {
      paddingVertical: 25,
      alignItems:
        "center",
    },

    endMessageText: {
      color:
        "#64748b",
      fontSize: 12,
      fontWeight:
        "600",
      textAlign:
        "center",
    },

    backButton: {
      marginTop: 20,
      paddingHorizontal: 18,
      minHeight: 44,
      borderRadius: 13,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 7,
      backgroundColor:
        "#a855f7",
    },

    backButtonText: {
      color:
        "#ffffff",
      fontSize: 13,
      fontWeight:
        "800",
    },
  });