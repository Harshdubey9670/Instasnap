import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Search, X, Heart, MessageCircle, BadgeCheck, Compass, Filter,
} from "lucide-react-native";

import api from "../../services/api";
import { Avatar } from "../../components/ui/Avatar";
import { useTheme } from "../../contexts/ThemeContext";

const TABS = ["all", "users", "posts", "hashtags"];

const SearchResultsPage = () => {
  const params = useLocalSearchParams<{ q?: string; type?: string }>();
  const { effectiveTheme } = useTheme();
  const dark = effectiveTheme === "dark";

  const [query, setQuery] = useState(params.q || "");
  const [activeTab, setActiveTab] = useState(params.type || "all");
  const [results, setResults] = useState<{ users: any[]; posts: any[]; hashtags: any[] }>({
    users: [], posts: [], hashtags: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = {
    bg: dark ? "#0d0a14" : "#fafafa",
    text: dark ? "#f8fafc" : "#0f172a",
    textSecondary: dark ? "#94a3b8" : "#64748b",
    primary: "#a855f7",
    card: dark ? "#1a0d27" : "#ffffff",
    cardBorder: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    inputBg: dark ? "#1e112c" : "#f1f5f9",
    inputBorder: dark ? "#2d1b3b" : "#e2e8f0",
    tabActive: dark ? "#a855f7" : "#a855f7",
    tabBg: dark ? "rgba(168,85,247,0.1)" : "rgba(168,85,247,0.08)",
  };

  const fetchResults = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(
        `/api/search/advanced?q=${encodeURIComponent(query)}&type=${activeTab}&page=1&limit=20`
      );
      if (res.data.success) {
        const { users, posts, hashtags } = res.data.data;
        setResults({ users: users || [], posts: posts || [], hashtags: hashtags || [] });
      }
    } catch (e) {
      setError("An error occurred while fetching search results.");
    } finally {
      setLoading(false);
    }
  }, [query, activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => { if (query.trim()) fetchResults(); }, 400);
    return () => clearTimeout(timer);
  }, [fetchResults, query]);

  const renderUserItem = ({ item }: { item: any }) => (
    <Pressable
      style={[styles.userItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={() => router.push(`/app/profile/${item._id}` as any)}
    >
      <Avatar src={item.profilePicture || item.avatar} size="md" />
      <View style={styles.userInfo}>
        <View style={styles.usernameRow}>
          <Text style={[styles.userName, { color: colors.text }]}>{item.username}</Text>
          {item.isVerified && <BadgeCheck size={14} color={colors.primary} />}
        </View>
        <Text style={[styles.userFullName, { color: colors.textSecondary }]}>{item.fullName}</Text>
        {item.bio && (
          <Text style={[styles.userBio, { color: colors.textSecondary }]} numberOfLines={1}>{item.bio}</Text>
        )}
      </View>
    </Pressable>
  );

  const renderPostItem = ({ item }: { item: any }) => (
    <Pressable
      style={[styles.postGrid]}
      onPress={() => router.push(`/post/${item._id}` as any)}
    >
      {item.media?.[0]?.url ? (
        <Image source={{ uri: item.media[0].url }} style={styles.postImage} />
      ) : (
        <View style={[styles.postImage, { backgroundColor: colors.inputBg, alignItems: "center", justifyContent: "center" }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 10 }}>No image</Text>
        </View>
      )}
      <View style={styles.postOverlay}>
        <View style={styles.postStat}>
          <Heart size={12} color="#fff" fill="#fff" />
          <Text style={styles.postStatText}>{item.likes?.length || 0}</Text>
        </View>
        <View style={styles.postStat}>
          <MessageCircle size={12} color="#fff" />
          <Text style={styles.postStatText}>{item.comments?.length || 0}</Text>
        </View>
      </View>
    </Pressable>
  );

  const renderHashtagItem = ({ item }: { item: any }) => (
    <Pressable
      style={[styles.hashtagItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={() => router.push(`/hashtag/${item.name}` as any)}
    >
      <View style={[styles.hashtagIcon, { backgroundColor: colors.tabBg }]}>
        <Text style={[styles.hashSymbol, { color: colors.primary }]}>#</Text>
      </View>
      <View>
        <Text style={[styles.hashtagName, { color: colors.text }]}>#{item.name}</Text>
        <Text style={[styles.hashtagCount, { color: colors.textSecondary }]}>
          {item.postCount || 0} posts
        </Text>
      </View>
    </Pressable>
  );

  const getData = () => {
    if (activeTab === "users") return results.users;
    if (activeTab === "posts") return results.posts;
    if (activeTab === "hashtags") return results.hashtags;
    // all: combine
    return [...results.users.slice(0, 3), ...results.posts.slice(0, 6), ...results.hashtags.slice(0, 3)];
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    if (activeTab === "posts") return renderPostItem({ item });
    if (activeTab === "hashtags" || item.name) return renderHashtagItem({ item });
    if (activeTab === "users" || item.username) return renderUserItem({ item });
    return null;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
        <Search size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search users, posts, hashtags..."
          placeholderTextColor={colors.textSecondary}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <X size={18} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsRow}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              activeTab === tab && { backgroundColor: colors.tabBg },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? colors.tabActive : colors.textSecondary },
                activeTab === tab && { fontWeight: "700" },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Results */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.textSecondary }}>{error}</Text>
        </View>
      ) : !query.trim() ? (
        <View style={styles.centered}>
          <Compass size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Search for users, posts or hashtags</Text>
        </View>
      ) : (
        <FlatList
          data={getData()}
          keyExtractor={(item, index) => item._id || item.name || String(index)}
          renderItem={renderItem}
          numColumns={activeTab === "posts" ? 3 : 1}
          key={activeTab === "posts" ? "grid" : "list"}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{ color: colors.textSecondary }}>No results found for "{query}"</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  tabsRow: { flexGrow: 0 },
  tabsContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  tabText: { fontSize: 13 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center", marginTop: 12 },
  listContent: { paddingHorizontal: 16, paddingBottom: 80 },
  // User items
  userItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8,
  },
  userInfo: { flex: 1 },
  usernameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  userName: { fontSize: 14, fontWeight: "700" },
  userFullName: { fontSize: 13, marginTop: 1 },
  userBio: { fontSize: 12, marginTop: 2 },
  // Post grid
  postGrid: { flex: 1 / 3, aspectRatio: 1, margin: 1, position: "relative" },
  postImage: { width: "100%", height: "100%" },
  postOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    flexDirection: "row", padding: 4, gap: 8,
  },
  postStat: { flexDirection: "row", alignItems: "center", gap: 3 },
  postStatText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  // Hashtags
  hashtagItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8,
  },
  hashtagIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  hashSymbol: { fontSize: 18, fontWeight: "900" },
  hashtagName: { fontSize: 14, fontWeight: "700" },
  hashtagCount: { fontSize: 12, marginTop: 2 },
});

export default SearchResultsPage;
