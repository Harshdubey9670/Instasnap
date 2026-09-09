import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Hash, Heart, MessageCircle, Flame, Clock } from "lucide-react-native";

import api from "../../services/api";
import { useTheme } from "../../contexts/ThemeContext";

const HashtagPage = () => {
  const { tag } = useLocalSearchParams<{ tag?: string }>();
  const { effectiveTheme } = useTheme();
  const dark = effectiveTheme === "dark";

  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState("top");
  const [coverMedia, setCoverMedia] = useState<string | null>(null);
  const [relatedHashtags, setRelatedHashtags] = useState<any[]>([]);

  const colors = {
    bg: dark ? "#0d0a14" : "#fafafa",
    text: dark ? "#f8fafc" : "#0f172a",
    textSecondary: dark ? "#94a3b8" : "#64748b",
    primary: "#a855f7",
    card: dark ? "#1a0d27" : "#fff",
    cardBorder: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    tabActive: "#a855f7",
    tabBg: dark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.08)",
    surface: dark ? "#1e112c" : "#f1f5f9",
  };

  const fetchPosts = useCallback(async (pageNum: number, tab: string, reset = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      const res = await api.get(`/api/posts/hashtag/${tag}?tab=${tab}&page=${pageNum}&limit=15`);
      if (res.data.success) {
        const data = res.data.data;
        setPosts((prev) => (reset ? data.posts : [...prev, ...data.posts]));
        setHasMore(data.pagination.hasMore);
        setTotal(data.pagination.total);
        if (reset && data.coverMedia) setCoverMedia(data.coverMedia);
        if (reset && data.relatedHashtags) setRelatedHashtags(data.relatedHashtags);
      }
    } catch (e) {
      console.error("Failed to fetch hashtag posts", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tag]);

  useEffect(() => {
    setPage(1);
    fetchPosts(1, activeTab, true);
  }, [tag, activeTab, fetchPosts]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      const next = page + 1;
      setPage(next);
      fetchPosts(next, activeTab);
    }
  };

  const formatNum = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  const renderPost = ({ item }: { item: any }) => (
    <Pressable
      style={styles.postCell}
      onPress={() => router.push(`/post/${item._id}` as any)}
    >
      {item.media?.[0]?.url ? (
        <Image source={{ uri: item.media[0].url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} />
      )}
      <View style={styles.postOverlay}>
        <View style={styles.postStat}>
          <Heart size={10} color="#fff" fill="#fff" />
          <Text style={styles.postStatText}>{formatNum(item.likes?.length || 0)}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      {/* Hero Cover */}
      <View style={styles.hero}>
        {coverMedia ? (
          <Image source={{ uri: coverMedia }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(168,85,247,0.2)" }]} />
        )}
        <View style={styles.heroOverlay}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <ArrowLeft size={22} color="#fff" />
          </Pressable>
          <View style={styles.heroContent}>
            <View style={styles.hashIconCircle}>
              <Text style={styles.hashIconText}>#</Text>
            </View>
            <Text style={styles.heroTag}>#{tag}</Text>
            <Text style={styles.heroCount}>{formatNum(total)} posts</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: colors.cardBorder }]}>
        {["top", "recent"].map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, activeTab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(t)}
          >
            {t === "top" ? <Flame size={14} color={activeTab === t ? colors.primary : colors.textSecondary} /> : <Clock size={14} color={activeTab === t ? colors.primary : colors.textSecondary} />}
            <Text style={[styles.tabText, { color: activeTab === t ? colors.primary : colors.textSecondary }, activeTab === t && { fontWeight: "700" }]}>
              {t === "top" ? "Top" : "Recent"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Related hashtags */}
      {relatedHashtags.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relatedRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {relatedHashtags.map((h) => (
            <Pressable
              key={h.tag}
              style={[styles.relatedTag, { backgroundColor: colors.tabBg }]}
              onPress={() => router.push(`/hashtag/${h.tag}` as any)}
            >
              <Text style={[styles.relatedTagText, { color: colors.primary }]}>#{h.tag}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Posts Grid */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={renderPost}
          numColumns={3}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{ padding: 16 }} /> : null}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Hash size={40} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, marginTop: 8 }}>No posts found</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  hero: { height: 200, position: "relative" },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 16,
    justifyContent: "flex-end",
  },
  backBtn: { position: "absolute", top: 16, left: 16 },
  heroContent: { alignItems: "center", paddingBottom: 16 },
  hashIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#a855f7",
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  hashIconText: { color: "#fff", fontSize: 24, fontWeight: "900" },
  heroTag: { color: "#fff", fontSize: 22, fontWeight: "800" },
  heroCount: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 },
  tabRow: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  tabText: { fontSize: 14, fontWeight: "500" },
  relatedRow: { paddingVertical: 8, flexGrow: 0 },
  relatedTag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  relatedTagText: { fontSize: 12, fontWeight: "600" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  postCell: {
    flex: 1 / 3, aspectRatio: 1, position: "relative",
    margin: 1, overflow: "hidden",
  },
  postOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.35)", padding: 4,
    flexDirection: "row",
  },
  postStat: { flexDirection: "row", alignItems: "center", gap: 3 },
  postStatText: { color: "#fff", fontSize: 9, fontWeight: "700" },
});

export default HashtagPage;
