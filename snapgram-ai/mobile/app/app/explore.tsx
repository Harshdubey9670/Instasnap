import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Clock,
  Compass,
  Flame,
  Hash,
  Heart,
  MessageCircle,
  Search,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/contexts/ThemeContext";

import api from "../../src/services/api";
import { Avatar } from "../../src/components/ui/Avatar";
import { trackEvent } from "../../src/utils/analytics";
import { fetchWithCache, prefetch } from "../../src/utils/cache";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  isLiked?: boolean;
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

// --- Discover 2-Column Grid Card ---
const MobileDiscoverGridCard = memo(
  ({
    post,
    index,
    isDark,
  }: {
    post: ExplorePost;
    index: number;
    isDark: boolean;
  }) => {
    const [isLiked, setIsLiked] = useState(Boolean(post.isLiked));
    const [likesCount, setLikesCount] = useState(post.likes?.length || 0);

    const mediaUrl = post.media?.[0]?.url;
    if (!mediaUrl) return null;

    const userId = post.user?._id;

    const handlePress = () => {
      if (userId) {
        trackEvent("recommendation_click", post._id, {
          source: "explore_native_grid",
        });
        router.push(`/app/profile/${userId}` as any);
      }
    };

    const toggleLike = () => {
      setIsLiked((prev) => !prev);
      setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    };

    return (
      <Pressable
        onPress={handlePress}
        style={[
          styles.gridCard,
          {
            backgroundColor: isDark ? "#1E1210" : "#FFFFFF",
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.05)",
          },
        ]}
      >
        <Image source={{ uri: mediaUrl }} style={styles.gridImage} />
        <LinearGradient
          colors={["transparent", "rgba(0, 0, 0, 0.65)"]}
          style={styles.gridGradientOverlay}
        />

        {/* Top-right heart button */}
        <Pressable
          onPress={toggleLike}
          style={styles.gridHeartButton}
          hitSlop={8}
        >
          <Heart
            size={14}
            color={isLiked ? "#FF6B35" : "#ffffff"}
            fill={isLiked ? "#FF6B35" : "transparent"}
          />
        </Pressable>

        {/* Bottom card creator & likes */}
        <View style={styles.gridInfoRow}>
          <View style={styles.gridAuthorWrap}>
            <Avatar
              src={post.user?.profilePicture || post.user?.avatar}
              fallback={post.user?.username?.charAt(0) || "U"}
              size="xs"
            />
            <Text style={styles.gridAuthorName} numberOfLines={1}>
              {post.user?.username || "creator"}
            </Text>
          </View>

          <View style={styles.gridLikesBadge}>
            <Heart size={10} color="#ffffff" fill="#ffffff" />
            <Text style={styles.gridLikesText}>
              {likesCount > 999
                ? `${(likesCount / 1000).toFixed(1)}k`
                : likesCount}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }
);

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  // Warm color palette matching approved reference
  const bgBase = isDark ? "#140A08" : "#F5F0EB";
  const cardBg = isDark ? "#1E1210" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(0, 0, 0, 0.05)";
  const searchBg = isDark ? "#1E1210" : "#FFFFFF";
  const searchBorder = isDark
    ? "rgba(255, 255, 255, 0.12)"
    : "rgba(0, 0, 0, 0.07)";
  const textPrimary = isDark ? "#F5F0EB" : "#1A1A1A";
  const textSecond = isDark ? "rgba(245, 240, 235, 0.6)" : "#8C7A70";

  const params = useLocalSearchParams<{ q?: string }>();
  const initialQuery = typeof params.q === "string" ? params.q : "";

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isSearchActive, setIsSearchActive] = useState(
    initialQuery.length > 0
  );
  const [searchTab, setSearchTab] = useState<
    "all" | "users" | "posts" | "hashtags"
  >("all");
  const [searchResults, setSearchResults] = useState<SearchResult>({
    users: [],
    posts: [],
    stories: [],
    hashtags: [],
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<Suggestions>({
    popularUsers: [],
    trendingTags: [],
  });
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Explore grid state
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const [explorePageNum, setExplorePageNum] = useState(1);
  const [exploreHasMore, setExploreHasMore] = useState(true);
  const [exploreLoading, setExploreLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Category chips
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = [
    "All",
    "Travel",
    "Food",
    "Lifestyle",
    "Music",
    "Art",
    "Sports",
    "Pets",
  ];

  // Spotlight creator state
  const [isSpotlightFollowed, setIsSpotlightFollowed] = useState(false);

  // Trending Topics list
  const trendingTopics = [
    { rank: "1", tag: "#SpringVibes", posts: "32.4K posts", category: "Trending" },
    { rank: "2", tag: "#TravelDiary", posts: "28.1K posts", category: "Travel" },
    { rank: "3", tag: "#CafeHopping", posts: "16.2K posts", category: "Food" },
  ];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Load Search Meta
  useEffect(() => {
    const loadSearchMeta = async () => {
      try {
        const [suggestionResponse, historyResponse] = await Promise.all([
          api.get("/api/search/suggestions"),
          api.get("/api/search/history"),
        ]);

        if (suggestionResponse.data?.success) {
          setSearchSuggestions(suggestionResponse.data.data);
        }
        if (historyResponse.data?.success) {
          setRecentSearches(historyResponse.data.data || []);
        }
      } catch (error) {
        console.error("Failed to load search metadata:", error);
      }
    };

    void loadSearchMeta();
  }, []);

  // Fetch explore posts
  const fetchExplorePosts = useCallback(
    async (pageNum: number, reset = false) => {
      try {
        if (pageNum === 1) {
          setExploreLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const response = await fetchWithCache(
          `/api/posts/explore?page=${pageNum}&limit=18`,
          () => api.get(`/api/posts/explore?page=${pageNum}&limit=18`)
        );

        if (response.data?.success) {
          const payload = response.data.data;
          const nextPosts = payload?.posts || [];

          setPosts((prev) => (reset ? nextPosts : [...prev, ...nextPosts]));
          setExploreHasMore(Boolean(response.data?.pagination?.hasMore));
        }
      } catch (error) {
        console.error("Explore fetch error:", error);
      } finally {
        setExploreLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!isSearchActive) {
      setExplorePageNum(1);
      void fetchExplorePosts(1, true);
    }
  }, [isSearchActive, fetchExplorePosts]);

  const loadMoreExplore = useCallback(() => {
    if (exploreLoading || isLoadingMore || !exploreHasMore) return;
    const next = explorePageNum + 1;
    setExplorePageNum(next);
    void fetchExplorePosts(next, false);
  }, [exploreHasMore, exploreLoading, explorePageNum, fetchExplorePosts, isLoadingMore]);

  // Search API execution
  useEffect(() => {
    if (!isSearchActive) return;
    if (debouncedQuery.trim().length === 0) {
      setSearchResults({
        users: [],
        posts: [],
        stories: [],
        hashtags: [],
      });
      return;
    }

    let isStale = false;
    setSearchLoading(true);

    const paramsQuery = new URLSearchParams({
      q: debouncedQuery,
      type: searchTab,
      limit: "15",
    });

    api
      .get(`/api/search/advanced?${paramsQuery.toString()}`)
      .then((res) => {
        if (isStale) return;
        if (res.data?.success) {
          setSearchResults(res.data.data);
        }
      })
      .catch((err) => {
        if (!isStale) console.error(err);
      })
      .finally(() => {
        if (!isStale) setSearchLoading(false);
      });

    return () => {
      isStale = true;
    };
  }, [debouncedQuery, searchTab, isSearchActive]);

  const handleSelectSuggestion = async (type: string, data: any) => {
    try {
      let payload: any = { type };
      if (type === "user") {
        payload = {
          type,
          query: data.username,
          refId: data._id,
          username: data.username,
          fullName: data.fullName,
          avatar: data.profilePicture || data.avatar,
        };
      } else if (type === "hashtag") {
        payload = { type, query: data.tag, tag: data.tag };
      } else {
        payload = { type: "text", query: data };
      }

      const res = await api.post("/api/search/history", payload);
      if (res.data?.success) setRecentSearches(res.data.data);
    } catch (e) {
      console.error(e);
    }

    if (type === "user") router.push(`/app/profile/${data._id}` as any);
    else if (type === "hashtag")
      router.push(`/app/hashtag/${data.tag.replace("#", "")}` as any);
    else setQuery(data);
  };

  const removeRecent = async (id: string) => {
    setRecentSearches((prev) => prev.filter((r) => r._id !== id));
    try {
      await api.delete(`/api/search/history/${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllRecent = async () => {
    setRecentSearches([]);
    try {
      await api.delete("/api/search/history");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: bgBase }]}>
      {/* ── Top Search Header ── */}
      <View
        style={[
          styles.searchHeader,
          {
            paddingTop: (insets.top || 16) + 6,
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
              style={styles.searchIconBtn}
            >
              <ArrowLeft size={18} color={textPrimary} />
            </Pressable>
          ) : (
            <Search size={18} color={textSecond} />
          )}

          <TextInput
            value={query}
            onFocus={() => setIsSearchActive(true)}
            onChangeText={setQuery}
            placeholder="Search creators, tags, places..."
            placeholderTextColor={textSecond}
            style={[styles.searchInput, { color: textPrimary }]}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {query.length > 0 && (
            <Pressable
              onPress={() => {
                setQuery("");
                setSearchResults({
                  users: [],
                  posts: [],
                  stories: [],
                  hashtags: [],
                });
              }}
              style={styles.clearButton}
            >
              <X size={15} color={textSecond} />
            </Pressable>
          )}
        </View>

        {/* Filter chips during active search */}
        {isSearchActive && query.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabsContent}
          >
            {["all", "users", "posts", "hashtags"].map((tab) => {
              const active = searchTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setSearchTab(tab as any)}
                  style={[
                    styles.searchFilterChip,
                    active
                      ? styles.searchFilterChipActive
                      : {
                          backgroundColor: cardBg,
                          borderColor: cardBorder,
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.searchFilterText,
                      active
                        ? styles.searchFilterTextActive
                        : { color: textSecond },
                    ]}
                  >
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ── Main Explore Screen Body ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 70 },
        ]}
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={({ nativeEvent }) => {
          const distanceFromBottom =
            nativeEvent.contentSize.height -
            (nativeEvent.contentOffset.y + nativeEvent.layoutMeasurement.height);
          if (distanceFromBottom < 400) {
            loadMoreExplore();
          }
        }}
      >
        {isSearchActive ? (
          /* ── Search Overlay Mode ── */
          <View style={styles.searchContainer}>
            {debouncedQuery.trim().length === 0 ? (
              <>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <View style={styles.searchSection}>
                    <View style={styles.sectionHeaderRow}>
                      <Text
                        style={[
                          styles.searchSectionHeading,
                          { color: textSecond },
                        ]}
                      >
                        Recent Searches
                      </Text>
                      <Pressable onPress={() => void clearAllRecent()}>
                        <Text style={styles.clearAllBtnText}>Clear all</Text>
                      </Pressable>
                    </View>

                    <View
                      style={[
                        styles.cardWrapper,
                        {
                          backgroundColor: cardBg,
                          borderColor: cardBorder,
                        },
                      ]}
                    >
                      {recentSearches.slice(0, 5).map((item) => (
                        <Pressable
                          key={item._id}
                          onPress={() =>
                            void handleSelectSuggestion(
                              item.type,
                              item.type === "user" ? item : item.query
                            )
                          }
                          style={styles.recentItemRow}
                        >
                          <View style={styles.recentItemLeft}>
                            {item.type === "hashtag" ? (
                              <View style={styles.recentHashIcon}>
                                <Hash size={14} color="#FF6B35" />
                              </View>
                            ) : item.avatar ? (
                              <Image
                                source={{ uri: item.avatar }}
                                style={styles.recentAvatarImg}
                              />
                            ) : (
                              <Clock size={16} color={textSecond} />
                            )}
                            <Text
                              style={[
                                styles.recentQueryText,
                                { color: textPrimary },
                              ]}
                              numberOfLines={1}
                            >
                              {item.query}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => void removeRecent(item._id)}
                            hitSlop={8}
                          >
                            <X size={15} color={textSecond} />
                          </Pressable>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* Suggested Creators */}
                {searchSuggestions.popularUsers.length > 0 && (
                  <View style={styles.searchSection}>
                    <Text
                      style={[
                        styles.searchSectionHeading,
                        { color: textSecond },
                      ]}
                    >
                      Suggested Creators
                    </Text>
                    <View
                      style={[
                        styles.cardWrapper,
                        {
                          backgroundColor: cardBg,
                          borderColor: cardBorder,
                        },
                      ]}
                    >
                      {searchSuggestions.popularUsers.slice(0, 4).map((u) => (
                        <Pressable
                          key={u._id}
                          onPress={() =>
                            void handleSelectSuggestion("user", u)
                          }
                          style={styles.suggestedUserRow}
                        >
                          <Avatar
                            src={u.profilePicture || u.avatar}
                            fallback={u.username?.charAt(0) || "U"}
                            size="sm"
                          />
                          <View style={styles.suggestedUserMeta}>
                            <Text
                              style={[
                                styles.suggestedUsername,
                                { color: textPrimary },
                              ]}
                              numberOfLines={1}
                            >
                              {u.username}
                            </Text>
                            <Text
                              style={[
                                styles.suggestedFullName,
                                { color: textSecond },
                              ]}
                              numberOfLines={1}
                            >
                              {u.fullName || "NUVYELO Creator"}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </>
            ) : searchLoading ? (
              <View style={styles.loaderCenter}>
                <ActivityIndicator size="large" color="#FF6B35" />
              </View>
            ) : (
              /* Search Query Results */
              <View style={styles.resultsContainer}>
                {(searchTab === "all" || searchTab === "users") &&
                  searchResults.users?.length > 0 && (
                    <View
                      style={[
                        styles.cardWrapper,
                        {
                          backgroundColor: cardBg,
                          borderColor: cardBorder,
                        },
                      ]}
                    >
                      {searchResults.users.map((u) => (
                        <Pressable
                          key={u._id}
                          onPress={() =>
                            router.push(`/app/profile/${u._id}` as any)
                          }
                          style={styles.suggestedUserRow}
                        >
                          <Avatar
                            src={u.profilePicture || u.avatar}
                            fallback={u.username?.charAt(0) || "U"}
                            size="md"
                          />
                          <View style={styles.suggestedUserMeta}>
                            <Text
                              style={[
                                styles.suggestedUsername,
                                { color: textPrimary },
                              ]}
                            >
                              {u.username}
                            </Text>
                            <Text
                              style={[
                                styles.suggestedFullName,
                                { color: textSecond },
                              ]}
                            >
                              {u.fullName}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )}

                {(searchTab === "all" || searchTab === "hashtags") &&
                  searchResults.hashtags?.length > 0 && (
                    <View
                      style={[
                        styles.cardWrapper,
                        {
                          backgroundColor: cardBg,
                          borderColor: cardBorder,
                        },
                      ]}
                    >
                      {searchResults.hashtags.map((h) => (
                        <Pressable
                          key={h._id}
                          onPress={() =>
                            router.push(
                              `/app/hashtag/${h.tag.replace("#", "")}` as any
                            )
                          }
                          style={styles.hashtagResultRow}
                        >
                          <View style={styles.recentHashIcon}>
                            <Hash size={16} color="#FF6B35" />
                          </View>
                          <View style={styles.suggestedUserMeta}>
                            <Text
                              style={[
                                styles.suggestedUsername,
                                { color: textPrimary },
                              ]}
                            >
                              #{h.tag}
                            </Text>
                            <Text
                              style={[
                                styles.suggestedFullName,
                                { color: textSecond },
                              ]}
                            >
                              {h.postCount || 100} posts
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )}
              </View>
            )}
          </View>
        ) : (
          /* ── Default Explore Feed (Center Phone Redesign) ── */
          <View style={styles.exploreFeed}>
            {/* 1. Category Chips Horizontal Row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={styles.categoryChipWrap}
                  >
                    {isActive ? (
                      <LinearGradient
                        colors={["#FF6B35", "#FF8C42"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.categoryChipActiveGradient}
                      >
                        <Text style={styles.categoryChipTextActive}>{cat}</Text>
                      </LinearGradient>
                    ) : (
                      <View
                        style={[
                          styles.categoryChipInactive,
                          {
                            backgroundColor: cardBg,
                            borderColor: cardBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryChipTextInactive,
                            { color: textSecond },
                          ]}
                        >
                          {cat}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* 2. Trending Topics Section */}
            <View style={styles.trendingSection}>
              <View
                style={[
                  styles.trendingCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                  },
                ]}
              >
                <View style={styles.trendingCardHeader}>
                  <View style={styles.trendingTitleRow}>
                    <View style={styles.flameIconBox}>
                      <Flame size={15} color="#FF6B35" fill="#FF6B35" />
                    </View>
                    <Text
                      style={[
                        styles.trendingCardTitle,
                        { color: textPrimary },
                      ]}
                    >
                      Trending Topics
                    </Text>
                  </View>
                  <Text style={styles.trendingBadgeSub}>Updated hourly</Text>
                </View>

                <View style={styles.trendingList}>
                  {trendingTopics.map((topic, i) => (
                    <Pressable
                      key={topic.tag}
                      onPress={() =>
                        router.push(
                          `/app/hashtag/${topic.tag.replace("#", "")}` as any
                        )
                      }
                      style={[
                        styles.trendingItem,
                        i < trendingTopics.length - 1 && [
                          styles.trendingItemDivider,
                          {
                            borderBottomColor: isDark
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(0,0,0,0.04)",
                          },
                        ],
                      ]}
                    >
                      <View style={styles.trendingRankBox}>
                        <Text style={styles.trendingRankText}>
                          {topic.rank}
                        </Text>
                      </View>
                      <View style={styles.trendingTopicMeta}>
                        <Text
                          style={[
                            styles.trendingTagText,
                            { color: textPrimary },
                          ]}
                        >
                          {topic.tag}
                        </Text>
                        <Text
                          style={[
                            styles.trendingCategoryText,
                            { color: textSecond },
                          ]}
                        >
                          {topic.category} • {topic.posts}
                        </Text>
                      </View>
                      <TrendingUp size={15} color="#FF6B35" />
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* 3. Featured Creator Spotlight Card */}
            <View style={styles.featuredSection}>
              <View
                style={[
                  styles.featuredCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                  },
                ]}
              >
                {/* Spotlight Badge */}
                <View style={styles.spotlightBadge}>
                  <Zap size={11} color="#FF6B35" fill="#FF6B35" />
                  <Text style={styles.spotlightBadgeText}>
                    Featured Creator
                  </Text>
                </View>

                {/* Creator Details Row */}
                <View style={styles.spotlightCreatorRow}>
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
                    }}
                    style={styles.spotlightAvatar}
                  />
                  <View style={styles.spotlightCreatorInfo}>
                    <View style={styles.spotlightNameRow}>
                      <Text
                        style={[
                          styles.spotlightName,
                          { color: textPrimary },
                        ]}
                      >
                        Minji
                      </Text>
                      <View style={styles.spotlightCategoryChip}>
                        <Text style={styles.spotlightCategoryText}>
                          Lifestyle
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.spotlightHandle,
                        { color: textSecond },
                      ]}
                    >
                      @minji • 142k followers
                    </Text>
                    <Text
                      style={[
                        styles.spotlightBio,
                        { color: textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      Capturing daily serenity & aesthetics ✨
                    </Text>
                  </View>
                </View>

                {/* Follow Button */}
                <Pressable
                  onPress={() =>
                    setIsSpotlightFollowed((prev) => !prev)
                  }
                  style={styles.spotlightFollowBtnWrap}
                >
                  {isSpotlightFollowed ? (
                    <View
                      style={[
                        styles.spotlightFollowedBtn,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.1)"
                            : "#F5F0EB",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.spotlightFollowedBtnText,
                          { color: textPrimary },
                        ]}
                      >
                        Following
                      </Text>
                    </View>
                  ) : (
                    <LinearGradient
                      colors={["#FF6B35", "#FF8C42"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.spotlightFollowBtnGradient}
                    >
                      <Text style={styles.spotlightFollowBtnText}>Follow</Text>
                    </LinearGradient>
                  )}
                </Pressable>
              </View>
            </View>

            {/* 4. Discover Heading */}
            <View style={styles.discoverHeaderRow}>
              <View style={styles.discoverHeaderLeft}>
                <Compass size={17} color="#FF6B35" />
                <Text
                  style={[
                    styles.discoverSectionTitle,
                    { color: textPrimary },
                  ]}
                >
                  Discover
                </Text>
              </View>
              <Text
                style={[
                  styles.discoverMomentsCount,
                  { color: textSecond },
                ]}
              >
                {posts.length} moments
              </Text>
            </View>

            {/* 5. Discover 2-Column Grid */}
            <View style={styles.discoverGrid}>
              {posts.map((post, idx) => (
                <MobileDiscoverGridCard
                  key={`${post._id || idx}`}
                  post={post}
                  index={idx}
                  isDark={isDark}
                />
              ))}
            </View>

            {/* Loading Indicator */}
            {exploreLoading && (
              <View style={styles.loaderCenter}>
                <ActivityIndicator size="large" color="#FF6B35" />
              </View>
            )}

            {isLoadingMore && (
              <View style={styles.smallLoaderWrap}>
                <ActivityIndicator size="small" color="#FF6B35" />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchBar: {
    height: 48,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIconBtn: {
    marginRight: 6,
    padding: 2,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  filterTabsContent: {
    gap: 8,
    paddingTop: 10,
    paddingBottom: 4,
  },
  searchFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  searchFilterChipActive: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
  },
  searchFilterText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  searchFilterTextActive: {
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchSection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  searchSectionHeading: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  clearAllBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF6B35",
  },
  cardWrapper: {
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  recentItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  recentItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  recentHashIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFEBE3",
    alignItems: "center",
    justifyContent: "center",
  },
  recentAvatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  recentQueryText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  suggestedUserRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 12,
  },
  hashtagResultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 12,
  },
  suggestedUserMeta: {
    flex: 1,
  },
  suggestedUsername: {
    fontSize: 13,
    fontWeight: "700",
  },
  suggestedFullName: {
    fontSize: 11,
    marginTop: 1,
  },
  resultsContainer: {
    gap: 12,
  },
  exploreFeed: {
    gap: 16,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  categoryChipWrap: {
    borderRadius: 20,
    overflow: "hidden",
  },
  categoryChipActiveGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  categoryChipInactive: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipTextInactive: {
    fontSize: 13,
    fontWeight: "600",
  },
  trendingSection: {
    paddingHorizontal: 16,
  },
  trendingCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  trendingCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  trendingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  flameIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#FFEBE3",
    alignItems: "center",
    justifyContent: "center",
  },
  trendingCardTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  trendingBadgeSub: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FF6B35",
  },
  trendingList: {
    gap: 0,
  },
  trendingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  trendingItemDivider: {
    borderBottomWidth: 1,
  },
  trendingRankBox: {
    width: 24,
    alignItems: "center",
  },
  trendingRankText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FF6B35",
  },
  trendingTopicMeta: {
    flex: 1,
    marginLeft: 8,
  },
  trendingTagText: {
    fontSize: 13,
    fontWeight: "700",
  },
  trendingCategoryText: {
    fontSize: 11,
    marginTop: 2,
  },
  featuredSection: {
    paddingHorizontal: 16,
  },
  featuredCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  spotlightBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "#FFEBE3",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  spotlightBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FF6B35",
  },
  spotlightCreatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  spotlightAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: "#FF6B35",
  },
  spotlightCreatorInfo: {
    flex: 1,
  },
  spotlightNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  spotlightName: {
    fontSize: 15,
    fontWeight: "800",
  },
  spotlightCategoryChip: {
    backgroundColor: "rgba(255, 107, 53, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  spotlightCategoryText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FF6B35",
  },
  spotlightHandle: {
    fontSize: 11,
    marginTop: 1,
  },
  spotlightBio: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 3,
  },
  spotlightFollowBtnWrap: {
    borderRadius: 16,
    overflow: "hidden",
  },
  spotlightFollowBtnGradient: {
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  spotlightFollowBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  spotlightFollowedBtn: {
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  spotlightFollowedBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  discoverHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 4,
  },
  discoverHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  discoverSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  discoverMomentsCount: {
    fontSize: 12,
    fontWeight: "500",
  },
  discoverGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  gridCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    aspectRatio: 0.78,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gridGradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },
  gridHeartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  gridInfoRow: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gridAuthorWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
    marginRight: 6,
  },
  gridAuthorName: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
  },
  gridLikesBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  gridLikesText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  loaderCenter: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  smallLoaderWrap: {
    paddingVertical: 12,
    alignItems: "center",
  },
});