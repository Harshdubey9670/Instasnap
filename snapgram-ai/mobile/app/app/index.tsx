import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  useSelector,
} from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type {
  RootState,
} from "../../src/store/store";
import { useTheme } from "../../src/contexts/ThemeContext";

import {
  StoriesRow,
  type StoryGroup,
} from "../../src/components/feed/StoriesRow";

import {
  StoryViewer,
} from "../../src/components/feed/StoryViewer";

import {
  PostCard,
  type Post as FeedPost,
} from "../../src/components/feed/PostCard";

import {
  FeedSkeleton,
} from "../../src/components/feed/FeedSkeleton";

import {
  SuggestedUsersCarousel,
} from "../../src/components/user/SuggestedUsersCarousel";

import {
  getActiveStreams,
} from "../../src/services/liveService";

import api from "../../src/services/api";

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  const {
    user: authUser,
  } = useSelector(
    (state: RootState) =>
      state.auth,
  );

  const [
    posts,
    setPosts,
  ] = useState<
    FeedPost[]
  >([]);

  const [
    stories,
    setStories,
  ] = useState<
    StoryGroup[]
  >([]);

  const [
    liveStreams,
    setLiveStreams,
  ] = useState<
    any[]
  >([]);

  const [
    activeStoryIndex,
    setActiveStoryIndex,
  ] = useState<
    number | null
  >(null);

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    hasMore,
    setHasMore,
  ] = useState(true);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isFetchingMore,
    setIsFetchingMore,
  ] = useState(false);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    loadingMoreError,
    setLoadingMoreError,
  ] = useState(false);

  const [
    isInitialFetchDone,
    setIsInitialFetchDone,
  ] = useState(false);

  const mutedUserIds =
    useMemo(() => {
      return (
        authUser?.mutedUsers ||
        []
      )
        .map(
          (id: any) =>
            (
              typeof id ===
              "string"
                ? id
                : id?._id || id
            )?.toString(),
        )
        .filter(Boolean);
    }, [
      authUser?.mutedUsers,
    ]);

  const activeStories =
    useMemo(() => {
      return stories.filter(
        (
          group,
        ) => {
          const userId =
            typeof group?.user === "string"
              ? group.user
              : group?.user?._id;

          if (!userId) {
            return false;
          }

          return !mutedUserIds.includes(
            userId.toString(),
          );
        },
      );
    }, [
      stories,
      mutedUserIds,
    ]);

  const fetchData =
    useCallback(
      async (
        pageNum = 1,
        isRefresh = false,
      ) => {
        try {
          setLoadingMoreError(
            false,
          );

          if (
            pageNum === 1 &&
            !isRefresh
          ) {
            setIsLoading(
              true,
            );
          }

          if (
            pageNum > 1
          ) {
            setIsFetchingMore(
              true,
            );
          }

          const [
            postsRes,
            storiesRes,
            liveRes,
          ] =
            await Promise.all([
              api.get(
                `/api/posts/feed?page=${pageNum}&limit=5`,
              ),

              pageNum === 1
                ? api.get(
                    "/api/stories",
                  )
                : Promise.resolve(
                    null,
                  ),

              pageNum === 1
                ? getActiveStreams()
                : Promise.resolve(
                    null,
                  ),
            ]);

          if (
            storiesRes
          ) {
            setStories(
              storiesRes.data
                ?.data || [],
            );
          }

          if (
            liveRes
          ) {
            setLiveStreams(
              liveRes.data ||
                [],
            );
          }

          const newPosts =
            postsRes.data
              ?.data || [];

          const pagination =
            postsRes.data
              ?.pagination;

          setHasMore(
            Boolean(
              pagination?.hasMore,
            ),
          );

          if (
            isRefresh ||
            pageNum === 1
          ) {
            setPosts(
              newPosts,
            );
          } else {
            setPosts(
              (
                previous,
              ) => [
                ...previous,
                ...newPosts,
              ],
            );
          }

          setIsInitialFetchDone(
            true,
          );
        } catch (
          error
        ) {
          console.error(
            "Failed to fetch feed:",
            error,
          );

          if (
            pageNum >
            1
          ) {
            setLoadingMoreError(
              true,
            );
          }
        } finally {
          setIsLoading(
            false,
          );

          setIsFetchingMore(
            false,
          );

          setIsRefreshing(
            false,
          );
        }
      },
      [],
    );

  useEffect(() => {
    void fetchData(
      page,
    );
  }, [
    page,
    fetchData,
  ]);

  const handleRefresh =
    useCallback(
      async () => {
        if (
          isRefreshing
        ) {
          return;
        }

        setIsRefreshing(
          true,
        );

        setPage(1);

        await fetchData(
          1,
          true,
        );
      },
      [
        fetchData,
        isRefreshing,
      ],
    );

  const handleLoadMore =
    useCallback(() => {
      if (
        isLoading ||
        isFetchingMore ||
        !hasMore
      ) {
        return;
      }

      setPage(
        (
          previousPage,
        ) =>
          previousPage +
          1,
      );
    }, [
      hasMore,
      isFetchingMore,
      isLoading,
    ]);

  const renderPost =
    useCallback(
      (
        post: FeedPost,
        index: number,
      ) => {
        return (
          <View
            key={`${post._id}-${index}`}
            style={
              styles.postWrapper
            }
          >
            <PostCard
              post={post}
            />
          </View>
        );
      },
      [],
    );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            isDark ? "#0a0510" : "#f8fafc",
        },
      ]}
    >
      <ScrollView
        style={
          styles.scrollView
        }
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop:
              56 + insets.top,
            paddingBottom:
              72 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              isRefreshing
            }
            onRefresh={
              handleRefresh
            }
            tintColor="#a855f7"
            colors={["#a855f7"]}
          />
        }
        onMomentumScrollEnd={(
          event,
        ) => {
          const {
            layoutMeasurement,
            contentOffset,
            contentSize,
          } =
            event.nativeEvent;

          const distanceFromBottom =
            contentSize.height -
            (
              contentOffset.y +
              layoutMeasurement.height
            );

          if (
            distanceFromBottom <
              500
          ) {
            handleLoadMore();
          }
        }}
      >
        <View
          style={
            styles.feedColumn
          }
        >
          {isRefreshing ? (
            <View
              style={
                styles.refreshIndicator
              }
            >
              <ActivityIndicator
                size="small"
                color="#a855f7"
              />
            </View>
          ) : null}

          {/* Stories */}
          <View
            style={
              styles.storiesContainer
            }
          >
            <StoriesRow
              stories={
                activeStories
              }
              liveStreams={
                liveStreams
              }
              isLoading={
                isLoading &&
                page === 1
              }
              onStoryClick={(
                index: number,
              ) =>
                setActiveStoryIndex(
                  index,
                )
              }
            />
          </View>

          {/* Story Viewer */}
          {activeStoryIndex !==
          null ? (
            <StoryViewer
              stories={
                activeStories
              }
              initialUserIndex={
                activeStoryIndex
              }
              onClose={() =>
                setActiveStoryIndex(
                  null,
                )
              }
            />
          ) : null}

          {/* Suggested Users */}
          <SuggestedUsersCarousel />

          {/* Feed */}
          <View
            style={
              styles.postsContainer
            }
          >
            {isLoading &&
            page === 1 ? (
              <FeedSkeleton />
            ) : (
              <>
                {posts.map(
                  (
                    post,
                    index,
                  ) =>
                    renderPost(
                      post,
                      index,
                    ),
                )}

                {/* Empty state */}
                {!isLoading &&
                posts.length ===
                  0 ? (
                  <View
                    style={
                      styles.emptyState
                    }
                  >
                    <Text
                      style={[
                        styles.emptyTitle,
                        {
                          color:
                            isDark ? "#ffffff" : "#0f172a",
                        },
                      ]}
                    >
                      Welcome to InstaSnap AI
                    </Text>

                    <Text
                      style={[
                        styles.emptyDescription,
                        {
                          color:
                            isDark ? "#94a3b8" : "#64748b",
                        },
                      ]}
                    >
                      When you follow people, you'll see their photos and videos here.
                    </Text>
                  </View>
                ) : null}

                {/* Loading more */}
                {isFetchingMore ? (
                  <View
                    style={
                      styles.loadingMore
                    }
                  >
                    <ActivityIndicator
                      size="small"
                      color="#a855f7"
                    />
                  </View>
                ) : null}

                {/* Loading more error */}
                {loadingMoreError ? (
                  <View
                    style={
                      styles.loadMoreError
                    }
                  >
                    <Text
                      style={
                        styles.loadMoreErrorText
                      }
                    >
                      Unable to load more posts.
                    </Text>
                  </View>
                ) : null}

                {/* End of feed */}
                {!hasMore &&
                posts.length >
                  0 ? (
                  <View
                    style={
                      styles.endOfFeed
                    }
                  >
                    <Text
                      style={[
                        styles.endTitle,
                        {
                          color:
                            isDark ? "#94a3b8" : "#64748b",
                        },
                      ]}
                    >
                      You've caught up!
                    </Text>

                    <Text
                      style={[
                        styles.endDescription,
                        {
                          color:
                            isDark ? "#64748b" : "#94a3b8",
                        },
                      ]}
                    >
                      You've seen all new posts.
                    </Text>
                  </View>
                ) : null}
              </>
            )}
          </View>

          {!isInitialFetchDone &&
          !isLoading ? (
            <View
              style={
                styles.secondaryLoader
              }
            >
              <ActivityIndicator
                size="small"
                color="#a855f7"
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#f8fafc",
    },

    scrollView: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,
      paddingBottom: 30,
    },

    feedColumn: {
      width: "100%",
      maxWidth: 650,
      alignSelf:
        "center",
    },

    refreshIndicator: {
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingVertical: 8,
    },

    storiesContainer: {
      marginBottom: 6,
    },

    postsContainer: {
      paddingHorizontal: 8,
    },

    postWrapper: {
      marginBottom: 14,
    },

    emptyState: {
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 28,
      paddingVertical: 70,
    },

    emptyTitle: {
      marginBottom: 8,
      color:
        "#0f172a",
      fontSize: 19,
      lineHeight: 25,
      fontWeight:
        "800",
      textAlign:
        "center",
    },

    emptyDescription: {
      color:
        "#64748b",
      fontSize: 13,
      lineHeight: 20,
      textAlign:
        "center",
      maxWidth: 340,
    },

    loadingMore: {
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingVertical: 18,
    },

    loadMoreError: {
      alignItems:
        "center",
      paddingVertical: 12,
    },

    loadMoreErrorText: {
      color:
        "#ef4444",
      fontSize: 11,
    },

    endOfFeed: {
      alignItems:
        "center",
      paddingVertical: 28,
    },

    endTitle: {
      color:
        "#64748b",
      fontSize: 13,
      fontWeight:
        "700",
    },

    endDescription: {
      marginTop: 3,
      color:
        "#94a3b8",
      fontSize: 10,
    },

    secondaryLoader: {
      alignItems:
        "center",
      paddingVertical: 10,
    },
  });