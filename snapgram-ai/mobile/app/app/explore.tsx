import React, {
  memo,
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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  ArrowLeft,
  Clock,
  Compass,
  Hash,
  Heart,
  Loader2,
  MessageCircle,
  Search,
  TrendingUp,
  Video,
  X,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/contexts/ThemeContext";

import api from "../../src/services/api";
import {
  Avatar,
} from "../../src/components/ui/Avatar";
import {
  trackEvent,
} from "../../src/utils/analytics";
import {
  fetchWithCache,
  prefetch,
} from "../../src/utils/cache";
import {
  cn,
} from "../../src/utils/cn";
import PopularCreatorsCarousel from "../../src/components/user/PopularCreatorsCarousel";

type User = {
  _id: string;
  username?: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
};

type ExplorePost = {
  _id: string;
  caption?: string;
  media?: Array<{
    url?: string;
    type?: string;
  }>;
  likes?: any[];
  comments?: any[];
  user?: User;
};

type SearchResult = {
  users: User[];
  posts: ExplorePost[];
  stories: any[];
  hashtags: Array<{
    _id: string;
    tag: string;
    postCount?: number;
  }>;
};

type Suggestions = {
  popularUsers: User[];
  trendingTags: Array<{
    tag: string;
  }>;
};

type RecentSearch = {
  _id: string;
  type: string;
  query: string;
  username?: string;
  fullName?: string;
  avatar?: string;
  tag?: string;
};

const NewMediaCard = memo(
  ({
    post,
  }: {
    post: ExplorePost;
  }) => {
    const mediaUrl =
      post.media?.[0]?.url;

    if (!mediaUrl) {
      return null;
    }

    const userId =
      post.user?._id;

    return (
      <Pressable
        onPress={() => {
          if (userId) {
            trackEvent(
              "recommendation_click",
              post._id,
              {
                source:
                  "explore_newest",
              },
            );

            router.push(
              `/app/profile/${userId}` as any,
            );
          }
        }}
        onPressIn={() => {
          if (userId) {
            void prefetch(
              `/api/users/${userId}`,
              () =>
                api.get(
                  `/api/users/${userId}`,
                ),
            );
          }
        }}
        style={
          styles.newMediaCard
        }
      >
        <Image
          source={{
            uri: mediaUrl,
          }}
          style={
            styles.newMediaImage
          }
        />

        <View
          style={
            styles.newMediaOverlay
          }
        >
          <View
            style={
              styles.newMediaLikes
            }
          >
            <Heart
              size={14}
              color="#ffffff"
              fill="#ffffff"
            />

            <Text
              style={
                styles.newMediaLikesText
              }
            >
              {
                post.likes
                  ?.length || 0
              }
            </Text>
          </View>

          <Avatar
            src={
              post.user
                ?.profilePicture ||
              post.user
                ?.avatar
            }
            fallback={
              post.user?.username?.charAt(
                0,
              )
            }
            size="sm"
          />
        </View>
      </Pressable>
    );
  },
);

const ExploreGridCard = memo(
  ({
    post,
    index,
  }: {
    post: ExplorePost;
    index: number;
  }) => {
    const [
      isPressed,
      setIsPressed,
    ] = useState(false);

    const mediaUrl =
      post.media?.[0]?.url;

    if (!mediaUrl) {
      return null;
    }

    const userId =
      post.user?._id;

    return (
      <Pressable
        onPress={() => {
          if (userId) {
            trackEvent(
              "recommendation_click",
              post._id,
              {
                source:
                  "explore_grid",
              },
            );

            router.push(
              `/app/profile/${userId}` as any,
            );
          }
        }}
        onPressIn={() => {
          setIsPressed(
            true,
          );

          if (userId) {
            void prefetch(
              `/api/users/${userId}`,
              () =>
                api.get(
                  `/api/users/${userId}`,
                ),
            );
          }
        }}
        onPressOut={() =>
          setIsPressed(
            false,
          )
        }
        style={
          styles.gridCard
        }
      >
        <Image
          source={{
            uri: mediaUrl,
          }}
          style={
            styles.gridImage
          }
        />

        {isPressed ? (
          <View
            style={
              styles.gridOverlay
            }
          >
            <View
              style={
                styles.gridStats
              }
            >
              <View
                style={
                  styles.gridStat
                }
              >
                <Heart
                  size={19}
                  color="#ffffff"
                  fill="#ffffff"
                />

                <Text
                  style={
                    styles.gridStatText
                  }
                >
                  {
                    post.likes
                      ?.length ||
                    0
                  }
                </Text>
              </View>

              <View
                style={
                  styles.gridStat
                }
              >
                <MessageCircle
                  size={19}
                  color="#ffffff"
                  fill="#ffffff"
                />

                <Text
                  style={
                    styles.gridStatText
                  }
                >
                  {
                    post.comments
                      ?.length ||
                    0
                  }
                </Text>
              </View>
            </View>

            <View
              style={
                styles.gridUser
              }
            >
              <Avatar
                src={
                  post.user
                    ?.profilePicture ||
                  post.user
                    ?.avatar
                }
                fallback={
                  post.user
                    ?.username
                    ?.charAt(0)
                }
                size="sm"
              />

              <Text
                style={
                  styles.gridUsername
                }
                numberOfLines={
                  1
                }
              >
                {post.user
                  ?.username ||
                  "user"}
              </Text>
            </View>
          </View>
        ) : null}
      </Pressable>
    );
  },
);

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  const bgBase       = isDark ? "#0a0510" : "#f8fafc";
  const searchBg     = isDark ? "#18122b" : "#ffffff";
  const searchBorder = isDark ? "#2d1f4a" : "#e2e8f0";
  const textPrimary  = isDark ? "#f8fafc" : "#0f172a";
  const textSecond   = isDark ? "#94a3b8" : "#64748b";

  const params =
    useLocalSearchParams<{
      q?: string;
    }>();

  const initialQuery =
    typeof params.q ===
    "string"
      ? params.q
      : "";

  const [
    query,
    setQuery,
  ] = useState(
    initialQuery,
  );

  const [
    debouncedQuery,
    setDebouncedQuery,
  ] = useState(
    initialQuery,
  );

  const [
    isSearchActive,
    setIsSearchActive,
  ] = useState(
    initialQuery.length >
      0,
  );

  const [
    searchTab,
    setSearchTab,
  ] = useState<
    "all" | "users" | "posts" | "reels" | "hashtags"
  >("all");

  const [
    searchResults,
    setSearchResults,
  ] =
    useState<SearchResult>({
      users: [],
      posts: [],
      stories: [],
      hashtags: [],
    });

  const [
    searchLoading,
    setSearchLoading,
  ] = useState(
    false,
  );

  const [
    searchSuggestions,
    setSearchSuggestions,
  ] =
    useState<Suggestions>({
      popularUsers: [],
      trendingTags: [],
    });

  const [
    recentSearches,
    setRecentSearches,
  ] = useState<
    RecentSearch[]
  >([]);

  const [
    posts,
    setPosts,
  ] = useState<
    ExplorePost[]
  >([]);

  const [
    newestMedia,
    setNewestMedia,
  ] = useState<
    ExplorePost[]
  >([]);

  const [
    suggestedReels,
    setSuggestedReels,
  ] = useState<
    ExplorePost[]
  >([]);

  const [
    explorePageNum,
    setExplorePageNum,
  ] = useState(1);

  const [
    exploreHasMore,
    setExploreHasMore,
  ] = useState(true);

  const [
    exploreLoading,
    setExploreLoading,
  ] = useState(true);

  const [
    isLoadingMore,
    setIsLoadingMore,
  ] = useState(false);

  useEffect(() => {
    const timer =
      setTimeout(
        () =>
          setDebouncedQuery(
            query,
          ),
        300,
      );

    return () =>
      clearTimeout(
        timer,
      );
  }, [
    query,
  ]);

  useEffect(() => {
    const loadSearchMeta =
      async () => {
        try {
          const [
            suggestionResponse,
            historyResponse,
          ] =
            await Promise.all([
              api.get(
                "/api/search/suggestions",
              ),
              api.get(
                "/api/search/history",
              ),
            ]);

          if (
            suggestionResponse
              .data
              ?.success
          ) {
            setSearchSuggestions(
              suggestionResponse
                .data
                .data,
            );
          }

          if (
            historyResponse
              .data
              ?.success
          ) {
            setRecentSearches(
              historyResponse
                .data
                .data || [],
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Failed to load search metadata:",
            error,
          );
        }
      };

    void loadSearchMeta();
  }, []);

  const fetchExplorePosts =
    useCallback(
      async (
        pageNum: number,
        reset = false,
      ) => {
        try {
          if (
            pageNum === 1
          ) {
            setExploreLoading(
              true,
            );
          } else {
            setIsLoadingMore(
              true,
            );
          }

          const response =
            await fetchWithCache(
              `/api/posts/explore?page=${pageNum}&limit=18`,
              () =>
                api.get(
                  `/api/posts/explore?page=${pageNum}&limit=18`,
                ),
            );

          if (
            response.data
              ?.success
          ) {
            const payload =
              response.data
                .data;

            const nextPosts =
              payload
                ?.posts || [];

            setPosts(
              (
                previous,
              ) =>
                reset
                  ? nextPosts
                  : [
                      ...previous,
                      ...nextPosts,
                    ],
            );

            if (
              reset
            ) {
              setNewestMedia(
                payload
                  ?.newestMedia ||
                  [],
              );

              setSuggestedReels(
                payload
                  ?.suggestedReels ||
                  [],
              );
            }

            setExploreHasMore(
              Boolean(
                response.data
                  ?.pagination
                  ?.hasMore,
              ),
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Explore fetch error:",
            error,
          );
        } finally {
          setExploreLoading(
            false,
          );
          setIsLoadingMore(
            false,
          );
        }
      },
      [],
    );

  useEffect(() => {
    if (
      !isSearchActive
    ) {
      setExplorePageNum(
        1,
      );

      void fetchExplorePosts(
        1,
        true,
      );
    }
  }, [
    isSearchActive,
    fetchExplorePosts,
  ]);

  const loadMoreExplore =
    useCallback(() => {
      if (
        exploreLoading ||
        isLoadingMore ||
        !exploreHasMore
      ) {
        return;
      }

      const next =
        explorePageNum +
        1;

      setExplorePageNum(
        next,
      );

      void fetchExplorePosts(
        next,
        false,
      );
    }, [
      exploreHasMore,
      exploreLoading,
      explorePageNum,
      fetchExplorePosts,
      isLoadingMore,
    ]);

  useEffect(() => {
    if (
      !isSearchActive
    ) {
      return;
    }

    if (
      debouncedQuery.trim()
        .length ===
      0
    ) {
      setSearchResults({
        users: [],
        posts: [],
        stories: [],
        hashtags: [],
      });

      return;
    }

    const search =
      async () => {
        try {
          setSearchLoading(
            true,
          );

          const searchParams =
            new URLSearchParams();

          searchParams.set(
            "q",
            debouncedQuery,
          );

          searchParams.set(
            "type",
            searchTab,
          );

          searchParams.set(
            "limit",
            "15",
          );

          const response =
            await api.get(
              `/api/search/advanced?${searchParams.toString()}`,
            );

          if (
            response.data
              ?.success
          ) {
            setSearchResults(
              response.data
                .data,
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Search error:",
            error,
          );
        } finally {
          setSearchLoading(
            false,
          );
        }
      };

    void search();
  }, [
    debouncedQuery,
    isSearchActive,
    searchTab,
  ]);

  const handleSelectSuggestion =
    async (
      type: string,
      data: any,
    ) => {
      try {
        let payload: any = {
          type,
        };

        if (
          type ===
          "user"
        ) {
          payload = {
            type,
            query:
              data.username,
            refId:
              data._id,
            username:
              data.username,
            fullName:
              data.fullName,
            avatar:
              data.profilePicture,
          };
        } else if (
          type ===
          "hashtag"
        ) {
          payload = {
            type,
            query:
              data.tag,
            tag:
              data.tag,
          };
        } else {
          payload = {
            type,
            query:
              data,
          };
        }

        const response =
          await api.post(
            "/api/search/history",
            payload,
          );

        if (
          response.data
            ?.success
        ) {
          setRecentSearches(
            response.data
              .data || [],
          );
        }
      } catch (
        error
      ) {
        console.error(
          "Failed to save search history:",
          error,
        );
      }

      if (
        type ===
        "user"
      ) {
        router.push(
          `/app/profile/${data._id}` as any,
        );

        return;
      }

      if (
        type ===
        "hashtag"
      ) {
        router.push(
          `/app/hashtag/${data.tag}` as any,
        );

        return;
      }

      setQuery(
        typeof data ===
          "string"
          ? data
          : data.query ||
              "",
      );

      setIsSearchActive(
        true,
      );
    };

  const removeRecent =
    async (
      id: string,
    ) => {
      setRecentSearches(
        (
          previous,
        ) =>
          previous.filter(
            (
              item,
            ) =>
              item._id !==
              id,
          ),
      );

      try {
        await api.delete(
          `/api/search/history/${id}`,
        );
      } catch (
        error
      ) {
        console.error(
          "Failed to remove recent search:",
          error,
        );
      }
    };

  const clearAllRecent =
    async () => {
      setRecentSearches(
        [],
      );

      try {
        await api.delete(
          "/api/search/history",
        );
      } catch (
        error
      ) {
        console.error(
          "Failed to clear search history:",
          error,
        );
      }
    };

  const noSearchResults =
    useMemo(() => {
      return Object.values(
        searchResults,
      ).every(
        (
          value,
        ) =>
          Array.isArray(
            value,
          ) &&
          value.length ===
            0,
      );
    }, [
      searchResults,
    ]);

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: bgBase },
      ]}
    >
      {/* Search header */}
      <View
        style={[
          styles.searchHeader,
          {
            paddingTop: (insets.top || 20) + 8,
            backgroundColor: bgBase,
          },
        ]}
      >
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: searchBg,
              borderColor: searchBorder,
            },
          ]}
        >
          {isSearchActive ? (
            <Pressable
              onPress={() => {
                setQuery("");
                setIsSearchActive(false);
              }}
              style={{ marginRight: 6, padding: 2 }}
              accessibilityRole="button"
              accessibilityLabel="Cancel search"
            >
              <ArrowLeft
                size={19}
                color={textPrimary}
              />
            </Pressable>
          ) : (
            <Search
              size={19}
              color={textSecond}
            />
          )}

          <TextInput
            value={
              query
            }
            onFocus={() =>
              setIsSearchActive(
                true,
              )
            }
            onChangeText={
              setQuery
            }
            placeholder="Search users, posts, reels, hashtags..."
            placeholderTextColor="#94a3b8"
            style={[
              styles.searchInput,
              { color: textPrimary },
            ]}
            autoCapitalize="none"
            autoCorrect={
              false
            }
          />

          {(
            query ||
            isSearchActive
          ) ? (
            <Pressable
              onPress={() => {
                setQuery(
                  "",
                );
                setIsSearchActive(
                  false,
                );
                setSearchResults({
                  users: [],
                  posts: [],
                  stories: [],
                  hashtags:
                    [],
                });
              }}
              style={
                styles.clearButton
              }
            >
              <X
                size={16}
                color="#64748b"
              />
            </Pressable>
          ) : null}
        </View>

        {isSearchActive &&
        query.length >
          0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.filterContent
            }
          >
            {[
              "all",
              "users",
              "posts",
              "reels",
              "hashtags",
            ].map(
              (
                tab,
              ) => {
                const active =
                  searchTab ===
                  tab;

                return (
                  <Pressable
                    key={
                      tab
                    }
                    onPress={() =>
                      setSearchTab(
                        tab as any,
                      )
                    }
                    style={[
                      styles.filterChip,
                      active &&
                        styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active &&
                          styles.filterTextActive,
                      ]}
                    >
                      {tab}
                    </Text>
                  </Pressable>
                );
              },
            )}
          </ScrollView>
        ) : null}
      </View>

      <ScrollView
        style={
          styles.scrollView
        }
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 80 },
        ]}
        showsVerticalScrollIndicator={
          false
        }
        onMomentumScrollEnd={({
          nativeEvent,
        }) => {
          const distanceFromBottom =
            nativeEvent
              .contentSize
              .height -
            (
              nativeEvent
                .contentOffset
                .y +
              nativeEvent
                .layoutMeasurement
                .height
            );

          if (
            distanceFromBottom <
            500
          ) {
            loadMoreExplore();
          }
        }}
      >
        <View
          style={
            styles.centerColumn
          }
        >
          {isSearchActive ? (
            <View
              style={
                styles.searchMode
              }
            >
              {debouncedQuery.trim()
                .length ===
              0 ? (
                <>
                  {recentSearches.length >
                  0 ? (
                    <View
                      style={
                        styles.searchSection
                      }
                    >
                      <View
                        style={
                          styles.sectionHeader
                        }
                      >
                        <Text
                          style={
                            styles.sectionHeading
                          }
                        >
                          Recent Searches
                        </Text>

                        <Pressable
                          onPress={() =>
                            void clearAllRecent()
                          }
                        >
                          <Text
                            style={
                              styles.clearAll
                            }
                          >
                            Clear all
                          </Text>
                        </Pressable>
                      </View>

                      {recentSearches
                        .slice(
                          0,
                          5,
                        )
                        .map(
                          (
                            item,
                          ) => (
                            <Pressable
                              key={
                                item._id
                              }
                              onPress={() =>
                                void handleSelectSuggestion(
                                  item.type,
                                  item.type ===
                                    "user"
                                    ? item
                                    : item.query,
                                )
                              }
                              style={
                                styles.recentRow
                              }
                            >
                              <View
                                style={
                                  styles.recentIcon
                                }
                              >
                                {item.type ===
                                "hashtag" ? (
                                  <Hash
                                    size={
                                      19
                                    }
                                    color="#64748b"
                                  />
                                ) : item.avatar ? (
                                  <Image
                                    source={{
                                      uri:
                                        item.avatar,
                                    }}
                                    style={
                                      styles.recentAvatar
                                    }
                                  />
                                ) : (
                                  <Clock
                                    size={
                                      18
                                    }
                                    color="#64748b"
                                  />
                                )}
                              </View>

                              <Text
                                style={
                                  styles.recentQuery
                                }
                                numberOfLines={
                                  1
                                }
                              >
                                {
                                  item.query
                                }
                              </Text>

                              <Pressable
                                onPress={() =>
                                  void removeRecent(
                                    item._id,
                                  )
                                }
                                style={
                                  styles.removeRecent
                                }
                              >
                                <X
                                  size={
                                    17
                                  }
                                  color="#64748b"
                                />
                              </Pressable>
                            </Pressable>
                          ),
                        )}
                    </View>
                  ) : null}

                  {searchSuggestions
                    .popularUsers
                    .length >
                  0 ? (
                    <View
                      style={
                        styles.searchSection
                      }
                    >
                      <Text
                        style={
                          styles.sectionHeading
                        }
                      >
                        Suggested Users
                      </Text>

                      {searchSuggestions.popularUsers.map(
                        (
                          user,
                        ) => (
                          <Pressable
                            key={
                              user._id
                            }
                            onPress={() =>
                              void handleSelectSuggestion(
                                "user",
                                user,
                              )
                            }
                            style={
                              styles.suggestionRow
                            }
                          >
                            <Avatar
                              src={
                                user.profilePicture ||
                                user.avatar
                              }
                              fallback={user.username?.charAt(
                                0,
                              )}
                              size="sm"
                            />

                            <View
                              style={
                                styles.suggestionCopy
                              }
                            >
                              <Text
                                style={
                                  styles.suggestionUsername
                                }
                              >
                                {
                                  user.username
                                }
                              </Text>

                              <Text
                                style={
                                  styles.suggestionFullName
                                }
                              >
                                {
                                  user.fullName
                                }
                              </Text>
                            </View>
                          </Pressable>
                        ),
                      )}
                    </View>
                  ) : null}

                  {searchSuggestions
                    .trendingTags
                    .length >
                  0 ? (
                    <View
                      style={
                        styles.searchSection
                      }
                    >
                      <Text
                        style={
                          styles.sectionHeading
                        }
                      >
                        Trending Hashtags
                      </Text>

                      <View
                        style={
                          styles.tags
                        }
                      >
                        {searchSuggestions.trendingTags.map(
                          (
                            tag,
                          ) => (
                            <Pressable
                              key={
                                tag.tag
                              }
                              onPress={() =>
                                void handleSelectSuggestion(
                                  "hashtag",
                                  tag,
                                )
                              }
                              style={
                                styles.tagChip
                              }
                            >
                              <TrendingUp
                                size={
                                  14
                                }
                                color="#a855f7"
                              />

                              <Text
                                style={
                                  styles.tagText
                                }
                              >
                                #
                                {
                                  tag.tag
                                }
                              </Text>
                            </Pressable>
                          ),
                        )}
                      </View>
                    </View>
                  ) : null}
                </>
              ) : searchLoading ? (
                <View
                  style={
                    styles.loader
                  }
                >
                  <ActivityIndicator
                    size="large"
                    color="#a855f7"
                  />
                </View>
              ) : (
                <View
                  style={
                    styles.searchSection
                  }
                >
                  {(searchTab ===
                    "all" ||
                    searchTab ===
                      "users") &&
                  searchResults.users
                    .length >
                    0 ? (
                    <View
                      style={
                        styles.resultSection
                      }
                    >
                      {searchTab ===
                      "all" ? (
                        <Text
                          style={
                            styles.sectionHeading
                          }
                        >
                          Users
                        </Text>
                      ) : null}

                      {searchResults.users.map(
                        (
                          user,
                        ) => (
                          <Pressable
                            key={
                              user._id
                            }
                            onPress={() =>
                              router.push(
                                `/app/profile/${user._id}` as any,
                              )
                            }
                            style={
                              styles.suggestionRow
                            }
                          >
                            <Avatar
                              src={
                                user.profilePicture ||
                                user.avatar
                              }
                              fallback={user.username?.charAt(
                                0,
                              )}
                              size="sm"
                            />

                            <View
                              style={
                                styles.suggestionCopy
                              }
                            >
                              <Text
                                style={
                                  styles.suggestionUsername
                                }
                              >
                                {
                                  user.username
                                }
                              </Text>

                              <Text
                                style={
                                  styles.suggestionFullName
                                }
                              >
                                {
                                  user.fullName
                                }
                              </Text>
                            </View>
                          </Pressable>
                        ),
                      )}
                    </View>
                  ) : null}

                  {(searchTab ===
                    "all" ||
                    searchTab ===
                      "hashtags") &&
                  searchResults.hashtags
                    .length >
                    0 ? (
                    <View
                      style={
                        styles.resultSection
                      }
                    >
                      {searchTab ===
                      "all" ? (
                        <Text
                          style={
                            styles.sectionHeading
                          }
                        >
                          Hashtags
                        </Text>
                      ) : null}

                      {searchResults.hashtags.map(
                        (
                          hashtag,
                        ) => (
                          <Pressable
                            key={
                              hashtag._id
                            }
                            onPress={() =>
                              router.push(
                                `/app/hashtag/${hashtag.tag}` as any,
                              )
                            }
                            style={
                              styles.suggestionRow
                            }
                          >
                            <View
                              style={
                                styles.hashtagIcon
                              }
                            >
                              <Hash
                                size={
                                  22
                                }
                                color="#64748b"
                              />
                            </View>

                            <View
                              style={
                                styles.suggestionCopy
                              }
                            >
                              <Text
                                style={
                                  styles.suggestionUsername
                                }
                              >
                                #
                                {
                                  hashtag.tag
                                }
                              </Text>

                              <Text
                                style={
                                  styles.suggestionFullName
                                }
                              >
                                {
                                  hashtag.postCount ||
                                  0
                                }{" "}
                                posts
                              </Text>
                            </View>
                          </Pressable>
                        ),
                      )}
                    </View>
                  ) : null}

                  {noSearchResults ? (
                    <View
                      style={
                        styles.noResults
                      }
                    >
                      <Search
                        size={45}
                        color="#94a3b8"
                      />

                      <Text
                        style={
                          styles.noResultsTitle
                        }
                      >
                        No results found
                      </Text>

                      <Text
                        style={
                          styles.noResultsText
                        }
                      >
                        No results found for "
                        {
                          query
                        }
                        "
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          ) : (
            <>
              {/* Popular creators */}
              <View
                style={
                  styles.popularCreators
                }
              >
                <PopularCreatorsCarousel />
              </View>

              {/* Newest */}
              {!exploreLoading &&
              newestMedia.length >
                0 ? (
                <View
                  style={
                    styles.section
                  }
                >
                  <View
                    style={
                      styles.headingRow
                    }
                  >
                    <Clock
                      size={19}
                      color="#a855f7"
                    />

                    <Text
                      style={
                        styles.heading
                      }
                    >
                      Newest Drops
                    </Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={
                      false
                    }
                    contentContainerStyle={
                      styles.horizontalCards
                    }
                  >
                    {newestMedia.map(
                      (
                        post,
                      ) => (
                        <NewMediaCard
                          key={
                            post._id
                          }
                          post={
                            post
                          }
                        />
                      ),
                    )}
                  </ScrollView>
                </View>
              ) : null}

              {/* Suggested reels */}
              {!exploreLoading &&
              suggestedReels.length >
                0 ? (
                <View
                  style={[
                    styles.section,
                    styles.sectionBorder,
                  ]}
                >
                  <View
                    style={
                      styles.headingRow
                    }
                  >
                    <Video
                      size={19}
                      color="#a855f7"
                    />

                    <Text
                      style={
                        styles.heading
                      }
                    >
                      Suggested Reels
                    </Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={
                      false
                    }
                    contentContainerStyle={
                      styles.horizontalCards
                    }
                  >
                    {suggestedReels.map(
                      (
                        post,
                      ) => (
                        <NewMediaCard
                          key={
                            post._id
                          }
                          post={
                            post
                          }
                        />
                      ),
                    )}
                  </ScrollView>
                </View>
              ) : null}

              {/* Discover */}
              <View
                style={
                  styles.discoverHeader
                }
              >
                <Compass
                  size={19}
                  color="#a855f7"
                />

                <Text
                  style={
                    styles.heading
                  }
                >
                  Discover
                </Text>
              </View>

              {/* Native grid */}
              <View
                style={
                  styles.grid
                }
              >
                {posts.map(
                  (
                    post,
                    index,
                  ) => (
                    <ExploreGridCard
                      key={
                        `${post._id}-${index}`
                      }
                      post={
                        post
                      }
                      index={
                        index
                      }
                    />
                  ),
                )}
              </View>

              {exploreLoading ? (
                <View
                  style={
                    styles.loader
                  }
                >
                  <ActivityIndicator
                    size="large"
                    color="#a855f7"
                  />
                </View>
              ) : null}

              {isLoadingMore ? (
                <View
                  style={
                    styles.loaderSmall
                  }
                >
                  <ActivityIndicator
                    size="small"
                    color="#a855f7"
                  />
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
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

    searchHeader: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
      backgroundColor:
        "#f8fafc",
    },

    searchBar: {
      minHeight: 46,
      borderRadius: 15,
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingHorizontal: 14,
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    searchInput: {
      flex: 1,
      marginHorizontal: 9,
      color:
        "#0f172a",
      fontSize: 13,
    },

    clearButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#f1f5f9",
    },

    filterContent: {
      gap: 8,
      paddingTop: 10,
      paddingBottom: 3,
    },

    filterChip: {
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    filterChipActive: {
      backgroundColor:
        "#a855f7",
      borderColor:
        "#a855f7",
    },

    filterText: {
      color:
        "#64748b",
      fontSize: 11,
      fontWeight:
        "700",
      textTransform:
        "capitalize",
    },

    filterTextActive: {
      color:
        "#ffffff",
    },

    scrollView: {
      flex: 1,
    },

    content: {
      paddingBottom: 35,
    },

    centerColumn: {
      width: "100%",
      maxWidth: 900,
      alignSelf:
        "center",
      paddingHorizontal: 14,
    },

    popularCreators: {
      marginBottom: 5,
    },

    section: {
      marginTop: 17,
      marginBottom: 5,
    },

    sectionBorder: {
      borderTopWidth: 1,
      borderTopColor:
        "#e2e8f0",
      paddingTop: 18,
    },

    headingRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
      marginBottom: 12,
    },

    heading: {
      color:
        "#0f172a",
      fontSize: 18,
      fontWeight:
        "800",
    },

    horizontalCards: {
      gap: 10,
      paddingBottom: 8,
    },

    newMediaCard: {
      width: 132,
      height: 172,
      borderRadius: 17,
      overflow:
        "hidden",
      backgroundColor:
        "#e2e8f0",
      position:
        "relative",
    },

    newMediaImage: {
      width: "100%",
      height: "100%",
    },

    newMediaOverlay: {
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

    newMediaLikes: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    newMediaLikesText: {
      color:
        "#ffffff",
      fontSize: 10,
      fontWeight:
        "800",
    },

    gridCard: {
      width: "48.5%",
      aspectRatio: 0.78,
      marginBottom: 8,
      borderRadius: 12,
      overflow:
        "hidden",
      backgroundColor:
        "#e2e8f0",
      position:
        "relative",
    },

    gridImage: {
      width: "100%",
      height: "100%",
    },

    gridOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(0,0,0,0.50)",
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 10,
    },

    gridStats: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 24,
    },

    gridStat: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
    },

    gridStatText: {
      color:
        "#ffffff",
      fontSize: 12,
      fontWeight:
        "900",
    },

    gridUser: {
      marginTop: 16,
      maxWidth: "85%",
      minHeight: 30,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 15,
      backgroundColor:
        "rgba(255,255,255,0.20)",
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
    },

    gridUsername: {
      flexShrink: 1,
      color:
        "#ffffff",
      fontSize: 10,
      fontWeight:
        "700",
    },

    discoverHeader: {
      borderTopWidth: 1,
      borderTopColor:
        "#e2e8f0",
      marginTop: 18,
      paddingTop: 18,
      paddingBottom: 12,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
    },

    grid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      justifyContent:
        "space-between",
    },

    loader: {
      minHeight: 150,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    loaderSmall: {
      paddingVertical: 18,
      alignItems:
        "center",
    },

    searchMode: {
      paddingBottom: 20,
    },

    searchSection: {
      marginTop: 14,
    },

    resultSection: {
      marginBottom: 20,
    },

    sectionHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 8,
    },

    sectionHeading: {
      color:
        "#64748b",
      fontSize: 11,
      fontWeight:
        "900",
      textTransform:
        "uppercase",
      letterSpacing:
        0.8,
      marginBottom: 9,
    },

    clearAll: {
      color:
        "#a855f7",
      fontSize: 11,
      fontWeight:
        "800",
    },

    recentRow: {
      minHeight: 54,
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingHorizontal: 7,
      borderRadius: 13,
    },

    recentIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      overflow:
        "hidden",
    },

    recentAvatar: {
      width: 40,
      height: 40,
    },

    recentQuery: {
      flex: 1,
      marginLeft: 11,
      color:
        "#0f172a",
      fontSize: 13,
      fontWeight:
        "700",
    },

    removeRecent: {
      width: 36,
      height: 36,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    suggestionRow: {
      minHeight: 62,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 11,
      paddingHorizontal: 7,
      borderRadius: 13,
    },

    suggestionCopy: {
      flex: 1,
    },

    suggestionUsername: {
      color:
        "#0f172a",
      fontSize: 13,
      fontWeight:
        "800",
    },

    suggestionFullName: {
      marginTop: 2,
      color:
        "#64748b",
      fontSize: 11,
    },

    tags: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 8,
    },

    tagChip: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    tagText: {
      color:
        "#0f172a",
      fontSize: 11,
      fontWeight:
        "700",
    },

    hashtagIcon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    noResults: {
      minHeight: 250,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 30,
    },

    noResultsTitle: {
      marginTop: 14,
      color:
        "#0f172a",
      fontSize: 17,
      fontWeight:
        "800",
    },

    noResultsText: {
      marginTop: 5,
      color:
        "#64748b",
      fontSize: 12,
      textAlign:
        "center",
    },
  });