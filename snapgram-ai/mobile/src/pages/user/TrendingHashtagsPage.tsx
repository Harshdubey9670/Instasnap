import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft, TrendingUp, Hash, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react-native";

import api from "../../services/api";
import { useTheme } from "../../contexts/ThemeContext";

const TrendingHashtagsPage = () => {
  const { effectiveTheme } = useTheme();
  const dark = effectiveTheme === "dark";
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const colors = {
    bg: dark ? "#0d0a14" : "#fafafa",
    text: dark ? "#f8fafc" : "#0f172a",
    textSecondary: dark ? "#94a3b8" : "#64748b",
    primary: "#a855f7",
    card: dark ? "#1a0d27" : "#fff",
    cardBorder: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    surface: dark ? "#1e112c" : "#f1f5f9",
  };

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await api.get("/api/posts/trending-hashtags?limit=30");
        if (res.data.success) setHashtags(res.data.data);
      } catch (e) {
        console.error("Failed to fetch trending hashtags", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const topThree = hashtags.slice(0, 3);
  const remaining = hashtags.slice(3);

  const renderTopCard = ({ item, index }: { item: any; index: number }) => {
    const gradient = ["rgba(168,85,247,0.8)", "rgba(236,72,153,0.8)", "rgba(99,102,241,0.8)"][index] || "rgba(168,85,247,0.6)";
    return (
      <Pressable
        style={[styles.topCard, { backgroundColor: dark ? "#1a0d27" : "#fff", borderColor: colors.cardBorder }]}
        onPress={() => router.push(`/hashtag/${item.tag}` as any)}
      >
        <View style={[styles.topCardBadge, { backgroundColor: gradient }]}>
          <Text style={styles.topCardBadgeText}>#{index + 1}</Text>
        </View>
        <View style={styles.topCardIconRow}>
          <Text style={[styles.topCardHash, { color: colors.primary }]}>#</Text>
        </View>
        <Text style={[styles.topCardTag, { color: colors.text }]}>#{item.tag}</Text>
        <Text style={[styles.topCardCount, { color: colors.textSecondary }]}>{formatNumber(item.postCount || 0)} posts</Text>
        {item.isRising !== undefined && (
          <View style={styles.trendBadge}>
            {item.isRising ? (
              <>
                <ArrowUpRight size={12} color="#22c55e" />
                <Text style={{ color: "#22c55e", fontSize: 11, fontWeight: "600" }}>Rising</Text>
              </>
            ) : (
              <>
                <ArrowDownRight size={12} color="#94a3b8" />
                <Text style={{ color: "#94a3b8", fontSize: 11 }}>Stable</Text>
              </>
            )}
          </View>
        )}
      </Pressable>
    );
  };

  const renderHashtagRow = ({ item, index }: { item: any; index: number }) => (
    <Pressable
      style={[styles.rowItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={() => router.push(`/hashtag/${item.tag}` as any)}
    >
      <View style={[styles.rankBadge, { backgroundColor: colors.surface }]}>
        <Text style={[styles.rankText, { color: colors.textSecondary }]}>{index + 4}</Text>
      </View>
      <View style={[styles.hashIcon, { backgroundColor: "rgba(168,85,247,0.1)" }]}>
        <Hash size={14} color={colors.primary} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowTag, { color: colors.text }]}>#{item.tag}</Text>
        <Text style={[styles.rowCount, { color: colors.textSecondary }]}>{formatNumber(item.postCount || 0)} posts</Text>
      </View>
      {item.isRising && <ArrowUpRight size={16} color="#22c55e" />}
      <Activity size={14} color={colors.textSecondary} />
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitle}>
          <View style={[styles.trendIconBox, { backgroundColor: colors.primary }]}>
            <TrendingUp size={18} color="#fff" />
          </View>
          <View>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Trending</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>What's happening right now</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : hashtags.length === 0 ? (
        <View style={styles.centered}>
          <Hash size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No trending hashtags yet</Text>
        </View>
      ) : (
        <FlatList
          data={remaining}
          keyExtractor={(item) => item.tag}
          renderItem={renderHashtagRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Top 3 cards in horizontal row */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🔥 Top Trending</Text>
              <FlatList
                data={topThree}
                keyExtractor={(item) => item.tag}
                renderItem={renderTopCard}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 16, marginBottom: 24 }}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>More Trending</Text>
            </>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  headerTitle: { flexDirection: "row", alignItems: "center", gap: 10 },
  trendIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 20, fontWeight: "700" },
  pageSubtitle: { fontSize: 12, marginTop: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 14, marginTop: 12 },
  listContent: { paddingHorizontal: 16, paddingBottom: 80 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 14 },
  // Top 3 cards
  topCard: {
    width: 150, borderRadius: 20, padding: 16, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  topCardBadge: {
    position: "absolute", top: 12, right: 12,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  topCardBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  topCardIconRow: { marginBottom: 8, marginTop: 4 },
  topCardHash: { fontSize: 28, fontWeight: "900" },
  topCardTag: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  topCardCount: { fontSize: 11, marginBottom: 8 },
  trendBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  // Row items
  rowItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8,
  },
  rankBadge: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 12, fontWeight: "700" },
  hashIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowInfo: { flex: 1 },
  rowTag: { fontSize: 14, fontWeight: "700" },
  rowCount: { fontSize: 12, marginTop: 1 },
});

export default TrendingHashtagsPage;
