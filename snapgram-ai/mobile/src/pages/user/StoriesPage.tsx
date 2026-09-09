import React, { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { router } from "expo-router";
import {
  Sparkles, Plus, Eye, Heart, Send, Clock, Archive,
  Layers, Wand2, BarChart2, Flame,
} from "lucide-react-native";

import api from "../../services/api";
import { useToast } from "../../components/ui/Toast";
import { useTheme } from "../../contexts/ThemeContext";
import { StoryViewer } from "../../components/feed/StoryViewer";
import { Avatar } from "../../components/ui/Avatar";
import type { RootState } from "../../store/store";

const TABS = [
  { id: "feed", label: "Stories Feed", icon: Sparkles },
  { id: "archive", label: "Archive", icon: Archive },
];

const StoriesPage = () => {
  const { user: authUser } = useSelector((s: RootState) => s.auth);
  const { toast } = useToast();
  const { effectiveTheme } = useTheme();
  const dark = effectiveTheme === "dark";

  const [storyGroups, setStoryGroups] = useState<any[]>([]);
  const [archiveStories, setArchiveStories] = useState<any[]>([]);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("feed");

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [storiesRes, archiveRes] = await Promise.all([
          api.get("/api/stories"),
          api.get("/api/stories/archive").catch(() => null),
        ]);
        if (storiesRes.data.data) setStoryGroups(storiesRes.data.data);
        if (archiveRes?.data?.data) setArchiveStories(archiveRes.data.data);
      } catch (e) {
        console.error("Failed to fetch stories", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderStoryGroup = ({ item, index }: { item: any; index: number }) => {
    const isOwn = item.user?._id === authUser?._id;
    const hasUnviewed = item.stories?.some((s: any) => !s.viewers?.includes(authUser?._id));

    return (
      <Pressable
        style={[styles.storyGroupItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => setActiveGroupIndex(index)}
      >
        <View style={[styles.storyRing, hasUnviewed && styles.storyRingActive]}>
          <Avatar src={item.user?.profilePicture || item.user?.avatar} size="lg" />
        </View>
        <View style={styles.storyGroupInfo}>
          <Text style={[styles.storyGroupUser, { color: colors.text }]}>
            {isOwn ? "Your Story" : item.user?.username}
          </Text>
          <Text style={[styles.storyGroupTime, { color: colors.textSecondary }]}>
            {item.stories?.length || 0} stories
          </Text>
        </View>
        <View style={styles.storyGroupRight}>
          {item.stories?.some((s: any) => s.analytics?.views) && (
            <View style={styles.storyMeta}>
              <Eye size={12} color={colors.textSecondary} />
              <Text style={[styles.storyMetaText, { color: colors.textSecondary }]}>
                {item.stories.reduce((acc: number, s: any) => acc + (s.analytics?.views || 0), 0)}
              </Text>
            </View>
          )}
          {hasUnviewed && <View style={[styles.unviewedDot, { backgroundColor: colors.primary }]} />}
        </View>
      </Pressable>
    );
  };

  const renderArchiveItem = ({ item }: { item: any }) => (
    <Pressable style={[styles.archiveItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={[styles.archiveThumbnail, { backgroundColor: colors.surface }]}>
        <Archive size={24} color={colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.archiveDate, { color: colors.textSecondary }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <Text style={[styles.archiveCount, { color: colors.text }]}>{item.count || 1} stories</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Stories</Text>
        <Pressable
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/create-story" as any)}
        >
          <Plus size={18} color="#fff" />
          <Text style={styles.createBtnText}>Create</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.tabsRow} contentContainerStyle={styles.tabsContent}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <Pressable
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && { backgroundColor: colors.tabBg }]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Icon size={14} color={activeTab === tab.id ? colors.tabActive : colors.textSecondary} />
              <Text style={[styles.tabText, { color: activeTab === tab.id ? colors.tabActive : colors.textSecondary }, activeTab === tab.id && { fontWeight: "700" }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activeTab === "feed" ? (
        <>
          {activeGroupIndex !== null && (
            <StoryViewer
              stories={storyGroups}
              initialUserIndex={activeGroupIndex}
              onClose={() => setActiveGroupIndex(null)}
            />
          )}
          <FlatList
            data={storyGroups}
            keyExtractor={(item, i) => item.user?._id || String(i)}
            renderItem={renderStoryGroup}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Pressable
                style={[styles.createStoryCard, { backgroundColor: colors.card, borderColor: colors.primary }]}
                onPress={() => router.push("/create-story" as any)}
              >
                <View style={[styles.createStoryIcon, { backgroundColor: "rgba(168,85,247,0.1)" }]}>
                  <Plus size={28} color={colors.primary} />
                </View>
                <Text style={[styles.createStoryText, { color: colors.text }]}>Create Story</Text>
                <Text style={[styles.createStorySubtext, { color: colors.textSecondary }]}>
                  Share a moment with your followers
                </Text>
              </Pressable>
            }
            ListEmptyComponent={
              <View style={styles.centered}>
                <Sparkles size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No stories right now</Text>
              </View>
            }
          />
        </>
      ) : (
        <FlatList
          data={archiveStories}
          keyExtractor={(item, i) => item._id || String(i)}
          renderItem={renderArchiveItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Archive size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No archived stories</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  pageTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  createBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  createBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  tabsRow: { flexGrow: 0 },
  tabsContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 10 },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  tabText: { fontSize: 13 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, marginTop: 12 },
  listContent: { paddingHorizontal: 16, paddingBottom: 80 },
  createStoryCard: {
    borderWidth: 1.5, borderStyle: "dashed", borderRadius: 20,
    padding: 20, alignItems: "center", marginBottom: 16,
  },
  createStoryIcon: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  createStoryText: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  createStorySubtext: { fontSize: 12, textAlign: "center" },
  storyGroupItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8,
  },
  storyRing: {
    width: 58, height: 58, borderRadius: 29,
    borderWidth: 2, borderColor: "transparent", overflow: "hidden",
    alignItems: "center", justifyContent: "center",
  },
  storyRingActive: { borderColor: "#a855f7" },
  storyGroupInfo: { flex: 1 },
  storyGroupUser: { fontSize: 14, fontWeight: "700" },
  storyGroupTime: { fontSize: 12, marginTop: 2 },
  storyGroupRight: { alignItems: "center", gap: 4 },
  storyMeta: { flexDirection: "row", alignItems: "center", gap: 3 },
  storyMetaText: { fontSize: 11 },
  unviewedDot: { width: 8, height: 8, borderRadius: 4 },
  // Archive
  archiveItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8,
  },
  archiveThumbnail: {
    width: 56, height: 56, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  archiveDate: { fontSize: 12 },
  archiveCount: { fontSize: 14, fontWeight: "700", marginTop: 2 },
});

export default StoriesPage;
