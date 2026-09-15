import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  Search,
  X,
  Heart,
  MessageCircle,
  TrendingUp,
  Hash,
  Compass,
  Clock,
  Video,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../../services/api";
import { resolveImageSource } from "../../components/ui/Avatar";
import { useTheme } from "../../contexts/ThemeContext";
import { getColors, primary } from "../../theme/colors";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 24) / 3;

export default function ExplorePage() {
  const insets = useSafeAreaInsets();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";
  const colors = getColors(isDark);
  const accent = primary[500];
  const s = createStyles(colors, isDark);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchTab, setSearchTab] = useState<"all" | "users" | "posts" | "reels" | "hashtags">("all");
  const [searchResults, setSearchResults] = useState<{
    users: any[];
    posts: any[];
    stories: any[];
    hashtags: any[];
  }>({ users: [], posts: [], stories: [], hashtags: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<{
    popularUsers: any[];
    trendingTags: any[];
  }>({ popularUsers: [], trendingTags: [] });
  const [recentSearches, setRecentSearches] = useState<any[]>([]);

  // Explore Grid State
  const [posts, setPosts] = useState<any[]>([]);
  const [newestMedia, setNewestMedia] = useState<any[]>([]);
  const [suggestedReels, setSuggestedReels] = useState<any[]>([]);
  const [explorePageNum, setExplorePageNum] = useState(1);
  const [exploreHasMore, setExploreHasMore] = useState(true);
  const [exploreLoading, setExploreLoading] = useState(true);

  // Suggestions & History
  useEffect(() => {
    api
      .get("/api/search/suggestions")
      .then((res) => {
        if (res.data.success) setSearchSuggestions(res.data.data);
      })
      .catch(() => {});

    api
      .get("/api/search/history")
      .then((res) => {
        if (res.data.success) setRecentSearches(res.data.data);
      })
      .catch(() => {});
  }, []);

  // Fetch Explore
  const fetchExplorePosts = useCallback(async (pageNum: number, reset = false) => {
    try {
      if (pageNum === 1) setExploreLoading(true);
      const res = await api.get(`/api/posts/explore?page=${pageNum}&limit=18`);
      if (res.data.success) {
        setPosts((prev) => (reset ? res.data.data.posts : [...prev, ...res.data.data.posts]));
        if (reset) {
          setNewestMedia(res.data.data.newestMedia || []);
          setSuggestedReels(res.data.data.suggestedReels || []);
        }
        setExploreHasMore(res.data.pagination?.hasMore || false);
      }
    } catch (e) {
      console.error("Explore fetch error", e);
    } finally {
      setExploreLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSearchActive) {
      fetchExplorePosts(1, true);
    }
  }, [isSearchActive, fetchExplorePosts]);

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Search API Call
  useEffect(() => {
    if (!isSearchActive) return;
    if (debouncedQuery.trim().length === 0) {
      setSearchResults({ users: [], posts: [], stories: [], hashtags: [] });
      return;
    }

    setSearchLoading(true);
    const params = new URLSearchParams({ q: debouncedQuery, type: searchTab, limit: "15" });

    api
      .get(`/api/search/advanced?${params.toString()}`)
      .then((res) => {
        if (res.data.success) {
          setSearchResults(res.data.data);
        }
      })
      .catch(console.error)
      .finally(() => setSearchLoading(false));
  }, [debouncedQuery, searchTab, isSearchActive]);

  const handleSelectSuggestion = async (type: string, data: any) => {
    try {
      let payload: any = { type };
      if (type === "user") {
        payload.query = data.username;
        payload.refId = data._id;
        payload.username = data.username;
        payload.fullName = data.fullName;
        payload.avatar = data.profilePicture;
      } else if (type === "hashtag") {
        payload.query = data.tag;
        payload.tag = data.tag;
      } else {
        payload.query = data;
        payload.type = "text";
      }
      const res = await api.post("/api/search/history", payload);
      if (res.data.success) setRecentSearches(res.data.data);
    } catch (err) {}

    if (type === "user") router.push(`/app/profile/${data._id}` as any);
    else if (type === "hashtag") router.push(`/app/hashtag/${data.tag}` as any);
    else setQuery(data);
  };

  const removeRecent = async (id: string) => {
    setRecentSearches((prev) => prev.filter((r) => r._id !== id));
    try {
      await api.delete(`/api/search/history/${id}`);
    } catch (err) {}
  };

  const clearAllRecent = async () => {
    setRecentSearches([]);
    try {
      await api.delete("/api/search/history");
    } catch (err) {}
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Search Header */}
      <View style={[s.header, { paddingTop: (insets.top || 20) + 8 }]}>
        <View style={s.searchBar}>
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
              <ArrowLeft size={18} color={colors.textSecondary} />
            </Pressable>
          ) : (
            <Search size={18} color={colors.textSecondary} />
          )}
          <TextInput
            style={s.searchInput}
            value={query}
            onFocus={() => setIsSearchActive(true)}
            onChangeText={setQuery}
            placeholder="Search users, posts, reels, hashtags..."
            placeholderTextColor={colors.textSecondary}
          />
          {(query.length > 0 || isSearchActive) && (
            <Pressable
              onPress={() => {
                setQuery("");
                setIsSearchActive(false);
              }}
              style={s.clearBtn}
            >
              <X size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Filter Chips if typing */}
        {isSearchActive && query.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
            {(["all", "users", "posts", "reels", "hashtags"] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setSearchTab(tab)}
                style={[s.chip, searchTab === tab && s.chipActive]}
              >
                <Text style={[s.chipText, searchTab === tab && s.chipTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Main Body */}
      {isSearchActive ? (
        <ScrollView
          style={s.searchBody}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 80 }}
          keyboardShouldPersistTaps="handled"
        >
          {debouncedQuery.trim().length === 0 ? (
            <View style={s.suggestionsContainer}>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <View style={s.section}>
                  <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>Recent Searches</Text>
                    <Pressable onPress={clearAllRecent}>
                      <Text style={s.clearAllText}>Clear all</Text>
                    </Pressable>
                  </View>
                  {recentSearches.slice(0, 5).map((r) => (
                    <Pressable
                      key={r._id || Math.random().toString()}
                      onPress={() => handleSelectSuggestion(r.type, r)}
                      style={s.suggestionRow}
                    >
                      <View style={s.suggestionLeft}>
                        <View style={s.suggestionIcon}>
                          {r.type === "hashtag" ? (
                            <Hash size={16} color={colors.textSecondary} />
                          ) : r.avatar ? (
                            <Image source={{ uri: r.avatar }} style={s.avatarMini} />
                          ) : (
                            <Clock size={16} color={colors.textSecondary} />
                          )}
                        </View>
                        <Text style={s.suggestionText}>{r.query}</Text>
                      </View>
                      <Pressable onPress={() => removeRecent(r._id)}>
                        <X size={16} color={colors.textSecondary} />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Popular Users */}
              {searchSuggestions.popularUsers?.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Suggested Users</Text>
                  {searchSuggestions.popularUsers.map((u) => (
                    <Pressable
                      key={u._id}
                      onPress={() => handleSelectSuggestion("user", u)}
                      style={s.suggestionRow}
                    >
                      <Image
                        source={{ uri: u.profilePicture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" }}
                        style={s.avatarUser}
                      />
                      <View>
                        <Text style={s.userUsername}>{u.username}</Text>
                        <Text style={s.userFullname}>{u.fullName}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Trending Hashtags */}
              {searchSuggestions.trendingTags?.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Trending Hashtags</Text>
                  <View style={s.tagWrap}>
                    {searchSuggestions.trendingTags.map((tag) => (
                      <Pressable
                        key={tag.tag}
                        onPress={() => handleSelectSuggestion("hashtag", tag)}
                        style={s.tagPill}
                      >
                        <TrendingUp size={12} color={accent} />
                        <Text style={s.tagText}>#{tag.tag}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : searchLoading ? (
            <View style={s.loadingContainer}>
              <ActivityIndicator size="large" color={accent} />
            </View>
          ) : (
            <View style={s.resultsContainer}>
              {/* Users */}
              {(searchTab === "all" || searchTab === "users") && searchResults.users?.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Users</Text>
                  {searchResults.users.map((u) => (
                    <Pressable
                      key={u._id}
                      onPress={() => router.push(`/app/profile/${u._id}` as any)}
                      style={s.suggestionRow}
                    >
                      <Image
                        source={{ uri: u.profilePicture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" }}
                        style={s.avatarUser}
                      />
                      <View>
                        <Text style={s.userUsername}>{u.username}</Text>
                        <Text style={s.userFullname}>{u.fullName}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Hashtags */}
              {(searchTab === "all" || searchTab === "hashtags") && searchResults.hashtags?.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Hashtags</Text>
                  {searchResults.hashtags.map((h) => (
                    <Pressable
                      key={h._id || h.tag}
                      onPress={() => router.push(`/app/hashtag/${h.tag}` as any)}
                      style={s.suggestionRow}
                    >
                      <View style={s.suggestionIcon}>
                        <Hash size={16} color={accent} />
                      </View>
                      <View>
                        <Text style={s.userUsername}>#{h.tag}</Text>
                        <Text style={s.userFullname}>{h.postCount || 0} posts</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={s.exploreBody}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 80 }}
        >
          {/* Newest Drops Carousel */}
          {newestMedia.length > 0 && (
            <View style={s.carouselSection}>
              <View style={s.carouselTitleRow}>
                <Clock size={16} color={accent} />
                <Text style={s.carouselTitle}>Newest Drops</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.horizontalCardsList}>
                {newestMedia.map((post) => (
                  <Pressable
                    key={post._id}
                    onPress={() => router.push(`/app/post/${post._id}` as any)}
                    style={s.dropCard}
                  >
                    <Image
                      source={resolveImageSource(post.media?.[0]?.url) || { uri: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500" }}
                      style={s.dropCardImg}
                    />
                    <View style={s.dropCardFooter}>
                      <View style={s.likesRow}>
                        <Heart size={12} color="#fff" fill="#fff" />
                        <Text style={s.likesText}>{post.likes?.length || 0}</Text>
                      </View>
                      <Image
                        source={resolveImageSource(post.user?.profilePicture || post.user?.avatar) || { uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" }}
                        style={s.dropAvatar}
                      />
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Suggested Reels */}
          {suggestedReels.length > 0 && (
            <View style={s.carouselSection}>
              <View style={s.carouselTitleRow}>
                <Video size={16} color={accent} />
                <Text style={s.carouselTitle}>Suggested Reels</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.horizontalCardsList}>
                {suggestedReels.map((post) => (
                  <Pressable
                    key={post._id}
                    onPress={() => router.push(`/app/post/${post._id}` as any)}
                    style={s.dropCard}
                  >
                    <Image
                      source={resolveImageSource(post.media?.[0]?.url) || { uri: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500" }}
                      style={s.dropCardImg}
                    />
                    <View style={s.dropCardFooter}>
                      <View style={s.likesRow}>
                        <Heart size={12} color="#fff" fill="#fff" />
                        <Text style={s.likesText}>{post.likes?.length || 0}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Discover Header */}
          <View style={s.discoverHeader}>
            <Compass size={18} color={accent} />
            <Text style={s.discoverTitle}>Discover</Text>
          </View>

          {/* Grid of Posts */}
          <View style={s.gridContainer}>
            {posts.map((post) => (
              <Pressable
                key={post._id}
                onPress={() => router.push(`/app/post/${post._id}` as any)}
                style={s.gridItem}
              >
                <Image
                  source={resolveImageSource(post.media?.[0]?.url) || { uri: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500" }}
                  style={s.gridImg}
                />
              </Pressable>
            ))}
          </View>

          {exploreLoading && (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator size="small" color={accent} />
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof getColors>, isDark: boolean) => {
  const accent = primary[500];
  const divider = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgBase },
    header: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.bgSurface,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 42,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    searchInput: { flex: 1, color: colors.textPrimary, fontSize: 13 },
    clearBtn: { padding: 4 },
    chipRow: { marginTop: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      marginRight: 6,
    },
    chipActive: { backgroundColor: accent, borderColor: accent },
    chipText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
    chipTextActive: { color: "#fff" },
    searchBody: { flex: 1, paddingHorizontal: 12, paddingTop: 10 },
    suggestionsContainer: { gap: 16 },
    section: { marginBottom: 16 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    sectionTitle: { fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
    clearAllText: { fontSize: 12, color: accent, fontWeight: "600" },
    suggestionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: divider,
    },
    suggestionLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    suggestionIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.bgSurface,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarMini: { width: 34, height: 34, borderRadius: 17 },
    avatarUser: { width: 44, height: 44, borderRadius: 22, marginRight: 10 },
    suggestionText: { color: colors.textPrimary, fontSize: 13, fontWeight: "600" },
    userUsername: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
    userFullname: { color: colors.textSecondary, fontSize: 11, marginTop: 1 },
    tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
    tagPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },
    tagText: { color: colors.textPrimary, fontSize: 12, fontWeight: "600" },
    loadingContainer: { padding: 40, alignItems: "center" },
    resultsContainer: { gap: 16 },
    exploreBody: { flex: 1 },
    carouselSection: { marginTop: 14 },
    carouselTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, marginBottom: 8 },
    carouselTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
    horizontalCardsList: { paddingHorizontal: 12, gap: 10 },
    dropCard: { width: 110, height: 160, borderRadius: 14, overflow: "hidden", backgroundColor: colors.bgSurface },
    dropCardImg: { width: "100%", height: "100%", resizeMode: "cover" },
    dropCardFooter: {
      position: "absolute",
      bottom: 6,
      left: 6,
      right: 6,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    likesRow: { flexDirection: "row", alignItems: "center", gap: 3 },
    likesText: { color: "#fff", fontSize: 10, fontWeight: "700" },
    dropAvatar: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: "#fff" },
    discoverHeader: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, marginTop: 20, marginBottom: 10 },
    discoverTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: "800" },
    gridContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4, gap: 4 },
    gridItem: { width: ITEM_WIDTH, height: ITEM_WIDTH, borderRadius: 6, overflow: "hidden", backgroundColor: colors.bgSurface },
    gridImg: { width: "100%", height: "100%", resizeMode: "cover" },
  });
};
