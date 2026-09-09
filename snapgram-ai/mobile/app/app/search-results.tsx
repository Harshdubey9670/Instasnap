
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
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  BadgeCheck,
  Filter,
  Hash,
  Image as ImageIcon,
  Search,
  Users,
  X,
} from "lucide-react-native";
import { useToast } from "../../src/components/ui/Toast";
import { Avatar } from "../../src/components/ui/Avatar";
import api from "../../src/services/api";

type SearchTab =
  | "all"
  | "users"
  | "posts"
  | "reels"
  | "hashtags"
  | "locations"
  | "audio"
  | "stories";

type Filters = {
  location: string;
  date: string;
  mediaType: string;
  verified: boolean;
  sort: string;
};

type UserResult = {
  _id: string;
  username: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
  isVerified?: boolean;
};

type HashtagResult = {
  _id?: string;
  tag: string;
  count?: number;
};

type StoryResult = {
  _id: string;
  media?: {
    url: string;
  }[];
  user?: UserResult;
};

type SearchResults = {
  users: UserResult[];
  posts: any[];
  stories: StoryResult[];
  hashtags: HashtagResult[];
};

type PaginationState = {
  userHasMore: boolean;
  postHasMore: boolean;
  storyHasMore: boolean;
};

const TABS: SearchTab[] = [
  "all",
  "users",
  "posts",
  "reels",
  "hashtags",
  "locations",
  "audio",
  "stories",
];

const DEFAULT_FILTERS: Filters = {
  location: "",
  date: "all",
  mediaType: "all",
  verified: false,
  sort: "recent",
};

export default function SearchResultsScreen() {
  const params =
    useLocalSearchParams<{
      q?: string;
      type?: string;
      location?: string;
      date?: string;
      mediaType?: string;
      verified?: string;
      sort?: string;
    }>();

  const { showToast } = useToast();

  const query =
    typeof params.q === "string"
      ? params.q
      : "";

  const initialTab =
    typeof params.type === "string" &&
    TABS.includes(params.type as SearchTab)
      ? (params.type as SearchTab)
      : "all";

  const [
    activeTab,
    setActiveTab,
  ] = useState<SearchTab>(initialTab);

  const [
    results,
    setResults,
  ] = useState<SearchResults>({
    users: [],
    posts: [],
    stories: [],
    hashtags: [],
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingMore,
    setLoadingMore,
  ] = useState(false);

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    pagination,
    setPagination,
  ] = useState<PaginationState>({
    userHasMore: false,
    postHasMore: false,
    storyHasMore: false,
  });

  const [
    error,
    setError,
  ] = useState("");

  const [
    showFilters,
    setShowFilters,
  ] = useState(false);

  const [
    filters,
    setFilters,
  ] = useState<Filters>({
    location:
      typeof params.location === "string"
        ? params.location
        : "",
    date:
      typeof params.date === "string"
        ? params.date
        : "all",
    mediaType:
      typeof params.mediaType ===
      "string"
        ? params.mediaType
        : "all",
    verified:
      params.verified === "true",
    sort:
      typeof params.sort === "string"
        ? params.sort
        : "recent",
  });

  const fetchResults = useCallback(
    async (
      pageNum: number,
      reset = false,
      currentFilters = filters,
      currentTab = activeTab,
    ) => {
      try {
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const searchQuery =
          new URLSearchParams({
            q: query,
            type: currentTab,
            page: String(pageNum),
            limit: "15",
            location:
              currentFilters.location,
            date:
              currentFilters.date,
            mediaType:
              currentFilters.mediaType,
            verified:
              String(
                currentFilters.verified,
              ),
            sort:
              currentFilters.sort,
          });

        const response =
          await api.get(
            `/api/search/advanced?${searchQuery.toString()}`,
          );

        if (!response.data.success) {
          setError(
            response.data.message ||
              "Failed to load search results.",
          );
          return;
        }

        const data =
          response.data.data;

        const nextUsers =
          data.users || [];

        const nextPosts =
          data.posts || [];

        const nextStories =
          data.stories || [];

        const nextHashtags =
          data.hashtags || [];

        if (reset) {
          setResults({
            users:
              nextUsers,
            posts:
              nextPosts,
            stories:
              nextStories,
            hashtags:
              nextHashtags,
          });
        } else {
          setResults(
            (previous) => ({
              users: [
                ...previous.users,
                ...nextUsers,
              ],
              posts: [
                ...previous.posts,
                ...nextPosts,
              ],
              stories: [
                ...previous.stories,
                ...nextStories,
              ],
              hashtags: [
                ...previous.hashtags,
                ...nextHashtags,
              ],
            }),
          );
        }

        setPagination({
          userHasMore:
            Boolean(
              data.pagination
                ?.userHasMore,
            ),
          postHasMore:
            Boolean(
              data.pagination
                ?.postHasMore,
            ),
          storyHasMore:
            Boolean(
              data.pagination
                ?.storyHasMore,
            ),
        });

        setError("");
      } catch (requestError) {
        console.error(
          "Search failed:",
          requestError,
        );

        setError(
          "An error occurred while fetching search results. Please check your connection.",
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      query,
      activeTab,
      filters,
    ],
  );

  useEffect(() => {
    setPage(1);

    void fetchResults(
      1,
      true,
      filters,
      activeTab,
    );
  }, [
    query,
    activeTab,
    filters,
    fetchResults,
  ]);

  useEffect(() => {
    router.setParams({
      q: query,
      type: activeTab,
      ...(filters.location
        ? {
            location:
              filters.location,
          }
        : {}),
      ...(filters.date !== "all"
        ? {
            date:
              filters.date,
          }
        : {}),
      ...(filters.mediaType !== "all"
        ? {
            mediaType:
              filters.mediaType,
          }
        : {}),
      ...(filters.verified
        ? {
            verified: "true",
          }
        : {}),
      ...(filters.sort !== "recent"
        ? {
            sort:
              filters.sort,
          }
        : {}),
    });
  }, [
    query,
    activeTab,
    filters,
  ]);

  const canLoadMore =
    useMemo(() => {
      switch (activeTab) {
        case "users":
          return pagination.userHasMore;

        case "stories":
          return pagination.storyHasMore;

        case "hashtags":
          return false;

        case "posts":
        case "reels":
        case "locations":
        case "audio":
          return pagination.postHasMore;

        case "all":
        default:
          return (
            pagination.userHasMore ||
            pagination.postHasMore ||
            pagination.storyHasMore
          );
      }
    }, [
      activeTab,
      pagination,
    ]);

  const handleLoadMore =
    useCallback(() => {
      if (
        loading ||
        loadingMore ||
        !canLoadMore
      ) {
        return;
      }

      const nextPage =
        page + 1;

      setPage(nextPage);

      void fetchResults(
        nextPage,
        false,
        filters,
        activeTab,
      );
    }, [
      loading,
      loadingMore,
      canLoadMore,
      page,
      fetchResults,
      filters,
      activeTab,
    ]);

  const handleApplyFilters = (
    nextFilters: Filters,
  ) => {
    setFilters(
      nextFilters,
    );
    setPage(1);
    setShowFilters(false);
  };

  const resetFilters =
    () => {
      handleApplyFilters({
        ...DEFAULT_FILTERS,
      });
    };

  const handleTabChange =
    (
      tab: SearchTab,
    ) => {
      setActiveTab(tab);
      setPage(1);
    };

  const retrySearch =
    () => {
      setPage(1);
      void fetchResults(
        1,
        true,
        filters,
        activeTab,
      );
    };

  const renderUser = (
    user: UserResult,
  ) => (
    <Pressable
      key={user._id}
      onPress={() =>
        router.push(
          `/app/profile/${user._id}`,
        )
      }
      style={({ pressed }) => [
        styles.userCard,
        pressed &&
          styles.pressed,
      ]}
    >
      <Avatar
        src={
          user.profilePicture ||
          user.avatar
        }
        fallback={
          user.username?.charAt(
            0,
          ) || "U"
        }
        style={
          styles.userAvatar
        }
      />

      <View
        style={
          styles.userContent
        }
      >
        <View
          style={
            styles.usernameRow
          }
        >
          <Text
            style={
              styles.userName
            }
            numberOfLines={1}
          >
            {user.fullName ||
              user.username}
          </Text>

          {user.isVerified ? (
            <BadgeCheck
              size={16}
              color="#3b82f6"
            />
          ) : null}
        </View>

        <Text
          style={
            styles.username
          }
          numberOfLines={1}
        >
          @{user.username}
        </Text>
      </View>
    </Pressable>
  );

  const renderHashtag = (
    hashtag: HashtagResult,
    index: number,
  ) => (
    <Pressable
      key={
        hashtag._id ||
        `${hashtag.tag}-${index}`
      }
      onPress={() =>
        router.push(
          `/app/hashtag/${hashtag.tag}`,
        )
      }
      style={({ pressed }) => [
        styles.hashtagCard,
        pressed &&
          styles.pressed,
      ]}
    >
      <View
        style={
          styles.hashtagIcon
        }
      >
        <Hash
          size={24}
          color="#a855f7"
        />
      </View>

      <View
        style={
          styles.hashtagContent
        }
      >
        <Text
          style={
            styles.hashtagTitle
          }
        >
          #{hashtag.tag}
        </Text>

        <Text
          style={
            styles.hashtagCount
          }
        >
          {hashtag.count || 0} posts
        </Text>
      </View>
    </Pressable>
  );

  const renderStory = (
    story: StoryResult,
  ) => {
    const mediaUrl =
      story.media?.[0]
        ?.url;

    return (
      <Pressable
        key={story._id}
        onPress={() =>
          router.push(
            "/app/stories",
          )
        }
        style={({ pressed }) => [
          styles.storyCard,
          pressed &&
            styles.pressed,
        ]}
      >
        {mediaUrl ? (
          <ImagePreview
            uri={mediaUrl}
          />
        ) : (
          <View
            style={
              styles.storyFallback
            }
          >
            <ImageIcon
              size={28}
              color="#94a3b8"
            />
          </View>
        )}

        <View
          style={
            styles.storyGradient
          }
        />

        <View
          style={
            styles.storyInfo
          }
        >
          <Avatar
            src={
              story.user
                ?.profilePicture ||
              story.user
                ?.avatar
            }
            fallback={
              story.user?.username?.charAt(
                0,
              ) || "U"
            }
            style={
              styles.storyAvatar
            }
          />

          <Text
            style={
              styles.storyUsername
            }
            numberOfLines={1}
          >
            {story.user
              ?.username ||
              "user"}
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderPost =
    (
      post: any,
      index: number,
    ) => {
      const mediaUrl =
        post.media?.[0]
          ?.url ||
        post.mediaUrl;

      if (!mediaUrl) {
        return null;
      }

      return (
        <Pressable
          key={
            post._id ||
            `post-${index}`
          }
          onPress={() =>
            router.push(
              `/app/post/${post._id}`,
            )
          }
          style={({ pressed }) => [
            styles.postCard,
            pressed &&
              styles.pressed,
          ]}
        >
          <ImagePreview
            uri={mediaUrl}
          />

          <View
            style={
              styles.postOverlay
            }
          >
            <View
              style={
                styles.postStats
              }
            >
              <View
                style={
                  styles.stat
                }
              >
                <Text
                  style={
                    styles.statIcon
                  }
                >
                  ♥
                </Text>

                <Text
                  style={
                    styles.statText
                  }
                >
                  {post.likesCount ??
                    post.likes
                      ?.length ??
                    0}
                </Text>
              </View>

              <View
                style={
                  styles.stat
                }
              >
                <Text
                  style={
                    styles.statIcon
                  }
                >
                  💬
                </Text>

                <Text
                  style={
                    styles.statText
                  }
                >
                  {post.commentsCount ??
                    post.comments
                      ?.length ??
                    0}
                </Text>
              </View>
            </View>

            <View
              style={
                styles.postAuthor
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
                  post.user?.username?.charAt(
                    0,
                  ) || "U"
                }
                style={
                  styles.postAuthorAvatar
                }
              />

              <Text
                style={
                  styles.postAuthorText
                }
                numberOfLines={1}
              >
                @
                {post.user
                  ?.username ||
                  "user"}
              </Text>
            </View>
          </View>
        </Pressable>
      );
    };

  const renderEmptyTab =
    () => {
      let message =
        `No results found for "${query}"`;

      if (
        activeTab ===
        "users"
      ) {
        message = `No users found for "${query}"`;
      }

      if (
        activeTab ===
        "hashtags"
      ) {
        message = `No hashtags found for "${query}"`;
      }

      if (
        activeTab ===
        "stories"
      ) {
        message = `No active stories found for "${query}"`;
      }

      return (
        <View
          style={
            styles.emptyContainer
          }
        >
          <Search
            size={44}
            color="#94a3b8"
          />

          <Text
            style={
              styles.emptyTitle
            }
          >
            No results
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            {message}
          </Text>
        </View>
      );
    };

  const renderContent =
    () => {
      if (loading) {
        return (
          <View
            style={
              styles.loadingContainer
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
              Searching...
            </Text>
          </View>
        );
      }

      if (error) {
        return (
          <View
            style={
              styles.errorContainer
            }
          >
            <Text
              style={
                styles.errorTitle
              }
            >
              Search Failed
            </Text>

            <Text
              style={
                styles.errorText
              }
            >
              {error}
            </Text>

            <Pressable
              onPress={
                retrySearch
              }
              style={
                styles.retryButton
              }
            >
              <Text
                style={
                  styles.retryButtonText
                }
              >
                Try Again
              </Text>
            </Pressable>
          </View>
        );
      }

      if (
        activeTab ===
        "users"
      ) {
        return results.users
          .length > 0 ? (
          <View
            style={
              styles.section
            }
          >
            {results.users.map(
              renderUser,
            )}

            {loadingMore ? (
              <ActivityIndicator
                size="small"
                color="#a855f7"
                style={
                  styles.bottomLoader
                }
              />
            ) : null}
          </View>
        ) : (
          renderEmptyTab()
        );
      }

      if (
        activeTab ===
        "hashtags"
      ) {
        return results
          .hashtags.length >
          0 ? (
          <View
            style={
              styles.section
            }
          >
            {results.hashtags.map(
              renderHashtag,
            )}
          </View>
        ) : (
          renderEmptyTab()
        );
      }

      if (
        activeTab ===
        "stories"
      ) {
        return results.stories
          .length > 0 ? (
          <View
            style={
              styles.storyGrid
            }
          >
            {results.stories.map(
              renderStory,
            )}
          </View>
        ) : (
          renderEmptyTab()
        );
      }

      if (
        activeTab ===
          "posts" ||
        activeTab ===
          "reels" ||
        activeTab ===
          "locations" ||
        activeTab ===
          "audio"
      ) {
        return results
          .posts.length >
          0 ? (
          <View
            style={
              styles.postsGrid
            }
          >
            {results.posts.map(
              renderPost,
            )}
          </View>
        ) : (
          renderEmptyTab()
        );
      }

      /*
       * ALL TAB
       *
       * We deliberately preserve the API response categories
       * instead of assuming a specific backend ordering.
       */

      const hasAnyResults =
        results.users
          .length > 0 ||
        results.hashtags
          .length > 0 ||
        results.stories
          .length > 0 ||
        results.posts
          .length > 0;

      if (!hasAnyResults) {
        return renderEmptyTab();
      }

      return (
        <View
          style={
            styles.allContainer
          }
        >
          {results.users.length >
            0 ? (
            <View
              style={
                styles.section
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Accounts
              </Text>

              {results.users
                .slice(0, 8)
                .map(
                  renderUser,
                )}
            </View>
          ) : null}

          {results.hashtags
            .length > 0 ? (
            <View
              style={
                styles.section
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Hashtags
              </Text>

              {results.hashtags
                .slice(0, 8)
                .map(
                  renderHashtag,
                )}
            </View>
          ) : null}

          {results.stories
            .length > 0 ? (
            <View
              style={
                styles.section
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Stories
              </Text>

              <View
                style={
                  styles.storyGrid
                }
              >
                {results.stories
                  .slice(
                    0,
                    6,
                  )
                  .map(
                    renderStory,
                  )}
              </View>
            </View>
          ) : null}

          {results.posts
            .length > 0 ? (
            <View
              style={
                styles.section
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Posts
              </Text>

              <View
                style={
                  styles.postsGrid
                }
              >
                {results.posts
                  .slice(
                    0,
                    12,
                  )
                  .map(
                    renderPost,
                  )}
              </View>
            </View>
          ) : null}

          {loadingMore ? (
            <ActivityIndicator
              size="small"
              color="#a855f7"
              style={
                styles.bottomLoader
              }
            />
          ) : null}
        </View>
      );
    };

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
            styles.backButton
          }
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            ‹
          </Text>
        </Pressable>

        <View
          style={
            styles.headerSearch
          }
        >
          <Search
            size={18}
            color="#64748b"
          />

          <Text
            style={
              styles.headerQuery
            }
            numberOfLines={1}
          >
            {query ||
              "Search"}
          </Text>
        </View>

        <Pressable
          onPress={() =>
            setShowFilters(
              true,
            )
          }
          style={
            styles.filterButton
          }
        >
          <Filter
            size={19}
            color="#0f172a"
          />
        </Pressable>
      </View>

      {/* Search title */}
      <View
        style={
          styles.titleContainer
        }
      >
        <Text
          style={
            styles.title
          }
        >
          Results for "
          {query}"
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Explore matches across
          the platform
        </Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.tabsContainer
        }
      >
        {TABS.map(
          (
            tab,
          ) => {
            const selected =
              activeTab ===
              tab;

            return (
              <Pressable
                key={tab}
                onPress={() =>
                  handleTabChange(
                    tab,
                  )
                }
                style={[
                  styles.tab,
                  selected &&
                    styles.tabSelected,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    selected &&
                      styles.tabTextSelected,
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          },
        )}
      </ScrollView>

      {/* Main Results */}
      <ScrollView
        style={
          styles.resultsScroll
        }
        contentContainerStyle={
          styles.resultsContent
        }
        showsVerticalScrollIndicator={
          false
        }
        onScroll={(
          event,
        ) => {
          const {
            contentOffset,
            contentSize,
            layoutMeasurement,
          } =
            event.nativeEvent;

          const distanceFromBottom =
            contentSize.height -
            (contentOffset.y +
              layoutMeasurement.height);

          if (
            distanceFromBottom <
            500
          ) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={
          200
        }
      >
        {renderContent()}
      </ScrollView>

      {/* Filter Modal */}
      {showFilters ? (
        <FilterModal
          initialFilters={
            filters
          }
          onClose={() =>
            setShowFilters(
              false,
            )
          }
          onApply={
            handleApplyFilters
          }
          onReset={
            resetFilters
          }
        />
      ) : null}
    </View>
  );
}

function ImagePreview({
  uri,
}: {
  uri: string;
}) {
  return (
    <View
      style={
        styles.imagePreviewContainer
      }
    >
      <View
        style={
          styles.imagePlaceholder
        }
      >
        <ImageIcon
          size={26}
          color="#94a3b8"
        />
      </View>

      {uri ? (
        <RemoteImage uri={uri} />
      ) : null}
    </View>
  );
}

function RemoteImage({
  uri,
}: {
  uri: string;
}) {
  const {
    Image,
  } =
    require("react-native");

  return (
    <Image
      source={{
        uri,
      }}
      style={
        styles.remoteImage
      }
      resizeMode="cover"
    />
  );
}

function FilterModal({
  initialFilters,
  onClose,
  onApply,
  onReset,
}: {
  initialFilters: Filters;
  onClose: () => void;
  onApply: (
    filters: Filters,
  ) => void;
  onReset: () => void;
}) {
  const [
    localFilters,
    setLocalFilters,
  ] = useState<Filters>(
    initialFilters,
  );

  return (
    <View
      style={
        styles.modalOverlay
      }
    >
      <Pressable
        style={
          styles.modalBackdrop
        }
        onPress={onClose}
      />

      <View
        style={
          styles.filterSheet
        }
      >
        <View
          style={
            styles.sheetHandle
          }
        />

        <View
          style={
            styles.filterHeader
          }
        >
          <View
            style={
              styles.filterTitleRow
            }
          >
            <Filter
              size={20}
              color="#0f172a"
            />

            <Text
              style={
                styles.filterTitle
              }
            >
              Filters
            </Text>
          </View>

          <Pressable
            onPress={
              onClose
            }
            style={
              styles.closeButton
            }
          >
            <X
              size={20}
              color="#64748b"
            />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.filterContent
          }
        >
          {/* Sort */}
          <View
            style={
              styles.filterGroup
            }
          >
            <Text
              style={
                styles.filterLabel
              }
            >
              Sort By
            </Text>

            <View
              style={
                styles.twoColumn
              }
            >
              {[
                {
                  value:
                    "recent",
                  label:
                    "Recent",
                },
                {
                  value:
                    "popular",
                  label:
                    "Popular",
                },
              ].map(
                (option) => {
                  const selected =
                    localFilters.sort ===
                    option.value;

                  return (
                    <Pressable
                      key={
                        option.value
                      }
                      onPress={() =>
                        setLocalFilters(
                          (
                            previous,
                          ) => ({
                            ...previous,
                            sort:
                              option.value,
                          }),
                        )
                      }
                      style={[
                        styles.filterOption,
                        selected &&
                          styles.filterOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          selected &&
                            styles.filterOptionTextSelected,
                        ]}
                      >
                        {
                          option.label
                        }
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </View>
          </View>

          {/* Location */}
          <View
            style={
              styles.filterGroup
            }
          >
            <Text
              style={
                styles.filterLabel
              }
            >
              Location
            </Text>

            <TextInput
              value={
                localFilters.location
              }
              onChangeText={(
                value,
              ) =>
                setLocalFilters(
                  (
                    previous,
                  ) => ({
                    ...previous,
                    location:
                      value,
                  }),
                )
              }
              placeholder="e.g. New York"
              placeholderTextColor="#94a3b8"
              style={
                styles.filterInput
              }
            />
          </View>

          {/* Date */}
          <View
            style={
              styles.filterGroup
            }
          >
            <Text
              style={
                styles.filterLabel
              }
            >
              Date Posted
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.horizontalOptions
              }
            >
              {[
                {
                  value:
                    "all",
                  label:
                    "Any time",
                },
                {
                  value:
                    "today",
                  label:
                    "Today",
                },
                {
                  value:
                    "week",
                  label:
                    "This week",
                },
                {
                  value:
                    "month",
                  label:
                    "This month",
                },
                {
                  value:
                    "year",
                  label:
                    "This year",
                },
              ].map(
                (option) => {
                  const selected =
                    localFilters.date ===
                    option.value;

                  return (
                    <Pressable
                      key={
                        option.value
                      }
                      onPress={() =>
                        setLocalFilters(
                          (
                            previous,
                          ) => ({
                            ...previous,
                            date:
                              option.value,
                          }),
                        )
                      }
                      style={[
                        styles.smallOption,
                        selected &&
                          styles.smallOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.smallOptionText,
                          selected &&
                            styles.smallOptionTextSelected,
                        ]}
                      >
                        {
                          option.label
                        }
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </ScrollView>
          </View>

          {/* Media Type */}
          <View
            style={
              styles.filterGroup
            }
          >
            <Text
              style={
                styles.filterLabel
              }
            >
              Media Type
            </Text>

            <View
              style={
                styles.threeColumn
              }
            >
              {[
                "all",
                "image",
                "video",
              ].map(
                (type) => {
                  const selected =
                    localFilters.mediaType ===
                    type;

                  return (
                    <Pressable
                      key={type}
                      onPress={() =>
                        setLocalFilters(
                          (
                            previous,
                          ) => ({
                            ...previous,
                            mediaType:
                              type,
                          }),
                        )
                      }
                      style={[
                        styles.filterOption,
                        selected &&
                          styles.filterOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          selected &&
                            styles.filterOptionTextSelected,
                        ]}
                      >
                        {
                          type
                        }
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </View>
          </View>

          {/* Verified */}
          <View
            style={
              styles.verifiedRow
            }
          >
            <View
              style={
                styles.verifiedContent
              }
            >
              <Text
                style={
                  styles.filterLabel
                }
              >
                Verified Only
              </Text>

              <Text
                style={
                  styles.filterHint
                }
              >
                Show only verified
                users and posts
              </Text>
            </View>

            <Switch
              value={
                localFilters.verified
              }
              onValueChange={(
                value,
              ) =>
                setLocalFilters(
                  (
                    previous,
                  ) => ({
                    ...previous,
                    verified:
                      value,
                  }),
                )
              }
              trackColor={{
                false:
                  "#cbd5e1",
                true:
                  "#a855f7",
              }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Actions */}
          <View
            style={
              styles.filterActions
            }
          >
            <Pressable
              onPress={
                onReset
              }
              style={
                styles.resetButton
              }
            >
              <Text
                style={
                  styles.resetButtonText
                }
              >
                Reset
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                onApply(
                  localFilters,
                )
              }
              style={
                styles.applyButton
              }
            >
              <Text
                style={
                  styles.applyButtonText
                }
              >
                Apply Filters
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
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
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingHorizontal:
        16,
      paddingTop:
        12,
      paddingBottom:
        10,
      borderBottomWidth: 1,
      borderBottomColor:
        "#e2e8f0",
      backgroundColor:
        "#ffffff",
    },

    backButton: {
      width: 40,
      height: 40,
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 8,
    },

    backButtonText: {
      fontSize: 34,
      lineHeight: 34,
      color: "#0f172a",
      marginTop:
        -4,
    },

    headerSearch: {
      flex: 1,
      height: 40,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
      paddingHorizontal:
        12,
      borderRadius: 12,
      backgroundColor:
        "#f1f5f9",
    },

    headerQuery: {
      flex: 1,
      fontSize: 14,
      fontWeight:
        "500",
      color: "#0f172a",
    },

    filterButton: {
      width: 40,
      height: 40,
      marginLeft: 8,
      borderRadius: 12,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#f1f5f9",
    },

    titleContainer: {
      paddingHorizontal:
        20,
      paddingTop: 20,
      paddingBottom:
        14,
    },

    title: {
      fontSize: 23,
      lineHeight: 30,
      fontWeight:
        "700",
      color: "#0f172a",
    },

    subtitle: {
      marginTop: 5,
      fontSize: 14,
      lineHeight: 20,
      color: "#64748b",
    },

    tabsContainer: {
      paddingHorizontal:
        16,
      paddingBottom:
        10,
      gap: 8,
    },

    tab: {
      paddingHorizontal:
        15,
      paddingVertical:
        9,
      borderRadius: 999,
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    tabSelected: {
      backgroundColor:
        "#a855f7",
      borderColor:
        "#a855f7",
    },

    tabText: {
      fontSize: 13,
      fontWeight:
        "600",
      color: "#64748b",
      textTransform:
        "capitalize",
    },

    tabTextSelected: {
      color: "#ffffff",
    },

    resultsScroll: {
      flex: 1,
    },

    resultsContent: {
      paddingHorizontal:
        16,
      paddingTop: 8,
      paddingBottom:
        40,
    },

    allContainer: {
      gap: 24,
    },

    section: {
      gap: 10,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight:
        "700",
      color: "#0f172a",
      marginBottom: 2,
    },

    userCard: {
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#ffffff",
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      padding: 14,
      gap: 12,
    },

    userAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    userContent: {
      flex: 1,
      minWidth: 0,
    },

    usernameRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
    },

    userName: {
      flexShrink: 1,
      fontSize: 15,
      fontWeight:
        "700",
      color: "#0f172a",
    },

    username: {
      marginTop: 2,
      fontSize: 13,
      color: "#64748b",
    },

    hashtagCard: {
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#ffffff",
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      padding: 14,
      gap: 12,
    },

    hashtagIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#faf5ff",
    },

    hashtagContent: {
      flex: 1,
    },

    hashtagTitle: {
      fontSize: 15,
      fontWeight:
        "700",
      color: "#0f172a",
    },

    hashtagCount: {
      marginTop: 2,
      fontSize: 13,
      color: "#64748b",
    },

    storyGrid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 10,
    },

    storyCard: {
      width: "48%",
      aspectRatio:
        9 / 16,
      borderRadius: 18,
      overflow:
        "hidden",
      backgroundColor:
        "#0f172a",
      position:
        "relative",
    },

    storyFallback: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#e2e8f0",
    },

    storyGradient: {
      position:
        "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "45%",
      backgroundColor:
        "rgba(0,0,0,0.48)",
    },

    storyInfo: {
      position:
        "absolute",
      left: 10,
      right: 10,
      bottom: 10,
      alignItems:
        "flex-start",
    },

    storyAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 2,
      borderColor:
        "#a855f7",
      marginBottom: 5,
    },

    storyUsername: {
      maxWidth:
        "100%",
      fontSize: 12,
      fontWeight:
        "700",
      color: "#ffffff",
    },

    postsGrid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      justifyContent:
        "space-between",
      rowGap: 10,
    },

    postCard: {
      width: "48.5%",
      aspectRatio:
        0.78,
      borderRadius: 18,
      overflow:
        "hidden",
      backgroundColor:
        "#e2e8f0",
      position:
        "relative",
    },

    imagePreviewContainer: {
      flex: 1,
      position:
        "relative",
      overflow:
        "hidden",
      backgroundColor:
        "#e2e8f0",
    },

    imagePlaceholder: {
      ...StyleSheet.absoluteFillObject,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#e2e8f0",
    },

    remoteImage: {
      width: "100%",
      height: "100%",
    },

    postOverlay: {
      position:
        "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      padding: 10,
      backgroundColor:
        "rgba(0,0,0,0.35)",
    },

    postStats: {
      flexDirection:
        "row",
      gap: 12,
      marginBottom: 7,
    },

    stat: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    statIcon: {
      color: "#ffffff",
      fontSize: 14,
    },

    statText: {
      color: "#ffffff",
      fontSize: 11,
      fontWeight:
        "700",
    },

    postAuthor: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
    },

    postAuthorAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        "#ffffff",
    },

    postAuthorText: {
      flex: 1,
      color: "#ffffff",
      fontSize: 11,
      fontWeight:
        "700",
    },

    pressed: {
      opacity: 0.78,
    },

    loadingContainer: {
      paddingVertical:
        80,
      alignItems:
        "center",
    },

    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: "#64748b",
    },

    errorContainer: {
      paddingHorizontal:
        20,
      paddingVertical:
        70,
      alignItems:
        "center",
    },

    errorTitle: {
      fontSize: 19,
      fontWeight:
        "700",
      color: "#0f172a",
    },

    errorText: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 20,
      textAlign:
        "center",
      color: "#64748b",
    },

    retryButton: {
      marginTop: 18,
      paddingHorizontal:
        20,
      paddingVertical:
        11,
      borderRadius: 12,
      backgroundColor:
        "#a855f7",
    },

    retryButtonText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight:
        "700",
    },

    emptyContainer: {
      paddingVertical:
        80,
      alignItems:
        "center",
      paddingHorizontal:
        20,
    },

    emptyTitle: {
      marginTop: 14,
      fontSize: 19,
      fontWeight:
        "700",
      color: "#0f172a",
    },

    emptyText: {
      marginTop: 6,
      textAlign:
        "center",
      fontSize: 14,
      lineHeight: 20,
      color: "#64748b",
    },

    bottomLoader: {
      marginVertical: 20,
    },

    modalOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent:
        "flex-end",
      zIndex: 100,
    },

    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(0,0,0,0.55)",
    },

    filterSheet: {
      maxHeight:
        "88%",
      backgroundColor:
        "#ffffff",
      borderTopLeftRadius:
        28,
      borderTopRightRadius:
        28,
      paddingTop: 10,
      paddingHorizontal:
        18,
      paddingBottom:
        20,
    },

    sheetHandle: {
      alignSelf:
        "center",
      width: 44,
      height: 5,
      borderRadius: 999,
      backgroundColor:
        "#cbd5e1",
      marginBottom: 14,
    },

    filterHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingBottom:
        14,
      borderBottomWidth: 1,
      borderBottomColor:
        "#e2e8f0",
    },

    filterTitleRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    filterTitle: {
      fontSize: 19,
      fontWeight:
        "700",
      color: "#0f172a",
    },

    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#f1f5f9",
    },

    filterContent: {
      paddingTop:
        18,
      paddingBottom:
        20,
      gap: 20,
    },

    filterGroup: {
      gap: 10,
    },

    filterLabel: {
      fontSize: 14,
      fontWeight:
        "700",
      color: "#0f172a",
    },

    filterHint: {
      marginTop: 2,
      fontSize: 12,
      color: "#64748b",
    },

    twoColumn: {
      flexDirection:
        "row",
      gap: 10,
    },

    threeColumn: {
      flexDirection:
        "row",
      gap: 8,
    },

    filterOption: {
      flex: 1,
      minHeight: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      backgroundColor:
        "#ffffff",
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal:
        10,
    },

    filterOptionSelected: {
      backgroundColor:
        "#a855f7",
      borderColor:
        "#a855f7",
    },

    filterOptionText: {
      fontSize: 13,
      fontWeight:
        "600",
      color: "#475569",
      textTransform:
        "capitalize",
    },

    filterOptionTextSelected: {
      color: "#ffffff",
    },

    filterInput: {
      minHeight: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      backgroundColor:
        "#f8fafc",
      paddingHorizontal:
        14,
      fontSize: 14,
      color: "#0f172a",
    },

    horizontalOptions: {
      gap: 8,
    },

    smallOption: {
      paddingHorizontal:
        14,
      paddingVertical:
        9,
      borderRadius: 999,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      backgroundColor:
        "#ffffff",
    },

    smallOptionSelected: {
      backgroundColor:
        "#a855f7",
      borderColor:
        "#a855f7",
    },

    smallOptionText: {
      fontSize: 12,
      fontWeight:
        "600",
      color: "#64748b",
    },

    smallOptionTextSelected: {
      color: "#ffffff",
    },

    verifiedRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingVertical:
        4,
    },

    verifiedContent: {
      flex: 1,
      paddingRight: 12,
    },

    filterActions: {
      flexDirection:
        "row",
      gap: 10,
      paddingTop:
        8,
    },

    resetButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 14,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#f1f5f9",
    },

    resetButtonText: {
      fontSize: 14,
      fontWeight:
        "700",
      color: "#64748b",
    },

    applyButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 14,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#a855f7",
    },

    applyButtonText: {
      fontSize: 14,
      fontWeight:
        "700",
      color: "#ffffff",
    },
  });

