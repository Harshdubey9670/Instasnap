import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSelector } from "react-redux";

import { StoriesRow } from "../../components/feed/StoriesRow";
import { StoryViewer } from "../../components/feed/StoryViewer";
import { PostCard } from "../../components/feed/PostCard";
import { FeedSkeleton } from "../../components/feed/FeedSkeleton";
import { getActiveStreams } from "../../services/liveService";
import api from "../../services/api";
import { useTheme } from "../../contexts/ThemeContext";
import type { RootState } from "../../store/store";
import { getColors, primary } from "../../theme/colors";

const FeedPage = () => {
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const { effectiveTheme } = useTheme();
  const dark = effectiveTheme === "dark";

  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const colors = getColors(dark);

  const feedColors = {
    bg: colors.bgBase,                                         // dark: #0a0510  light: #f8fafc
    text: colors.textPrimary,
    textSecondary: colors.textSecondary,
    primary: primary[500],
    divider: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
  };

  const mutedUserIds = (authUser?.mutedUsers || []).map(
    (id: any) => (typeof id === "string" ? id : id?._id || id)?.toString()
  );
  const activeStories = stories.filter(
    (group: any) => group?.user?._id && !mutedUserIds.includes(group.user._id.toString())
  );

  const fetchData = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum === 1 && !isRefresh) setIsLoading(true);
      if (pageNum > 1) setIsFetchingMore(true);

      const [postsRes, storiesRes, liveRes] = await Promise.all([
        api.get(`/api/posts/feed?page=${pageNum}&limit=5`),
        pageNum === 1 ? api.get("/api/stories") : Promise.resolve(null),
        pageNum === 1 ? getActiveStreams() : Promise.resolve(null),
      ]);

      if (storiesRes) setStories(storiesRes.data.data);
      if (liveRes) setLiveStreams(liveRes.data);

      const newPosts = postsRes.data.data;
      setHasMore(postsRes.data.pagination.hasMore);

      if (isRefresh || pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const handleLoadMore = () => {
    if (!isFetchingMore && hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setPage(1);
    fetchData(1, true);
  };

  const renderHeader = () => (
    <View>
      {/* Stories Row */}
      <StoriesRow
        stories={activeStories}
        liveStreams={liveStreams}
        isLoading={isLoading && page === 1}
        onStoryClick={(index: number) => setActiveStoryIndex(index)}
      />
    </View>
  );

  const renderFooter = () => {
    if (isFetchingMore) {
      return (
        <View style={styles.loadMoreContainer}>
          <ActivityIndicator size="small" color={feedColors.primary} />
        </View>
      );
    }
    if (!hasMore && posts.length > 0) {
      return (
        <View style={styles.endOfFeed}>
          <Text style={[styles.endText, { color: feedColors.textSecondary }]}>You've caught up!</Text>
          <Text style={[styles.endSubtext, { color: feedColors.textSecondary }]}>You've seen all new posts.</Text>
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (isLoading) return <FeedSkeleton />;
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyTitle, { color: feedColors.text }]}>Welcome to InstaSnap AI</Text>
        <Text style={[styles.emptySubtext, { color: feedColors.textSecondary }]}>
          When you follow people, you'll see their photos and videos here.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: feedColors.bg }]}>
      {activeStoryIndex !== null && (
        <StoryViewer
          stories={activeStories}
          initialUserIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
        />
      )}

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={feedColors.primary}
            colors={[feedColors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  listContent: { paddingBottom: 80, paddingHorizontal: 0 },
  loadMoreContainer: { alignItems: "center", paddingVertical: 16 },
  endOfFeed: { alignItems: "center", paddingVertical: 32 },
  endText: { fontSize: 14, fontWeight: "600" },
  endSubtext: { fontSize: 12, marginTop: 4 },
  emptyContainer: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: "center", lineHeight: 22 },
});

export default FeedPage;
