import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  GestureResponderEvent,
  Image,
  PanResponder,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bell,
  Bookmark,
  Flame,
  Heart,
  MessageCircle,
  Plus,
  Search,
  Zap,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import type { RootState } from "../../src/store/store";
import { useTheme } from "../../src/contexts/ThemeContext";
import {
  StoryViewer,
} from "../../src/components/feed/StoryViewer";
import type { StoryGroup } from "../../src/components/feed/StoriesRow";
import api from "../../src/services/api";
import { getApiBaseUrl } from "../../src/config/env";

const API_BASE = getApiBaseUrl();

function getMediaUrl(url?: string): string {
  if (!url) return "";
  if (url.includes("cloudinary.com") || url.includes("unsplash.com")) {
    return `${API_BASE}/api/proxy/image?url=${encodeURIComponent(url)}`;
  }
  return url;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"For You" | "Following" | "Trending">(
    "For You"
  );
  const tabs = ["For You", "Following", "Trending"] as const;

  const panResponder = useMemo(() => {
    let triggered = false;

    const handleSwipeAction = (dx: number) => {
      if (triggered) return;
      if (dx < -55) {
        triggered = true;
        router.push("/app/chat" as any);
      } else if (dx > 55) {
        triggered = true;
        router.push("/app/camera" as any);
      }
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const isHorizontal =
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        const hasSignificantDistance = Math.abs(gestureState.dx) > 20;
        return isHorizontal && hasSignificantDistance;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontal =
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        const hasSignificantDistance = Math.abs(gestureState.dx) > 20;
        return isHorizontal && hasSignificantDistance;
      },
      onPanResponderGrant: () => {
        triggered = false;
      },
      onPanResponderMove: (_, gestureState) => {
        if (!triggered) {
          if (gestureState.dx < -65) {
            triggered = true;
            router.push("/app/chat" as any);
          } else if (gestureState.dx > 65) {
            triggered = true;
            router.push("/app/camera" as any);
          }
        }
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, gestureState) => {
        handleSwipeAction(gestureState.dx);
      },
      onPanResponderTerminate: (_, gestureState) => {
        handleSwipeAction(gestureState.dx);
      },
    });
  }, [router]);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeHandledRef = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: GestureResponderEvent) => {
    touchStartRef.current = {
      x: e.nativeEvent.pageX,
      y: e.nativeEvent.pageY,
    };
    swipeHandledRef.current = false;
  }, []);

  const handleTouchMove = useCallback(
    (e: GestureResponderEvent) => {
      if (!touchStartRef.current || swipeHandledRef.current) return;
      const dx = e.nativeEvent.pageX - touchStartRef.current.x;
      const dy = e.nativeEvent.pageY - touchStartRef.current.y;

      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        swipeHandledRef.current = true;
        touchStartRef.current = null;
        if (dx < 0) {
          router.push("/app/chat" as any);
        } else {
          router.push("/app/camera" as any);
        }
      }
    },
    [router]
  );

  const handleTouchEnd = useCallback(
    (e: GestureResponderEvent) => {
      if (!touchStartRef.current || swipeHandledRef.current) return;
      const dx = e.nativeEvent.pageX - touchStartRef.current.x;
      const dy = e.nativeEvent.pageY - touchStartRef.current.y;

      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        swipeHandledRef.current = true;
        touchStartRef.current = null;
        if (dx < 0) {
          router.push("/app/chat" as any);
        } else {
          router.push("/app/camera" as any);
        }
      }
      touchStartRef.current = null;
    },
    [router]
  );

  const { user: authUser } = useSelector((state: RootState) => state.auth);

  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const mutedUserIds = useMemo(() => {
    return (authUser?.mutedUsers || []).map((id: any) =>
      (typeof id === "string" ? id : id?._id || id)?.toString()
    );
  }, [authUser?.mutedUsers]);

  const activeStories = useMemo(() => {
    return stories.filter((group) => {
      const u = typeof group.user === "object" && group.user !== null ? group.user : null;
      const uId = u?._id || (typeof group.user === "string" ? group.user : null);
      return Boolean(uId && !mutedUserIds.includes(uId.toString()));
    });
  }, [stories, mutedUserIds]);

  // Curated Fallbacks matching reference image
  const fallbackHero = {
    title: "Golden Afternoons",
    subtitle: "Finding beauty in the simple things.",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=80",
    author: {
      username: "hyepark",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    },
    likes: 12400,
    comments: 289,
    timeAgo: "2h ago",
  };

  const fallbackGridPosts = [
    {
      id: "fg1",
      title: "Spring Vibes",
      author: {
        username: "minji",
        avatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      },
      image:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80",
      likes: 8200,
      comments: 142,
    },
    {
      id: "fg2",
      title: "Chasing Sunsets",
      author: {
        username: "lucas",
        avatar:
          "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80",
      },
      image:
        "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop&q=80",
      likes: 15000,
      comments: 320,
    },
    {
      id: "fg3",
      title: "Music Heals",
      author: {
        username: "seoyeon",
        avatar:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
      },
      image:
        "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&auto=format&fit=crop&q=80",
      likes: 11000,
      comments: 98,
    },
    {
      id: "fg4",
      title: "Little Happiness",
      author: {
        username: "hyepark",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      },
      image:
        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80",
      likes: 6400,
      comments: 76,
    },
  ];

  const fetchData = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      try {
        if (pageNum === 1 && !isRefresh) setIsLoading(true);
        if (pageNum > 1) setIsFetchingMore(true);

        const tabParam = activeTab === "For You" ? "forYou" : activeTab.toLowerCase();
        const [postsRes, storiesRes] = await Promise.all([
          api.get(`/api/posts/feed?page=${pageNum}&limit=10&tab=${tabParam}`),
          pageNum === 1 ? api.get("/api/stories") : Promise.resolve(null),
        ]);

        if (storiesRes?.data?.data) {
          setStories(storiesRes.data.data);
        }

        const newPosts = postsRes?.data?.data || [];
        setHasMore(Boolean(postsRes?.data?.pagination?.hasMore));

        if (isRefresh || pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
        }
      } catch (err) {
        console.error("Failed to load feed:", err);
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
        setIsRefreshing(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    setPage(1);
    void fetchData(1, true);
  }, [activeTab]);

  useEffect(() => {
    if (page > 1) {
      void fetchData(page);
    }
  }, [page, fetchData]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setPage(1);
    await fetchData(1, true);
  }, [fetchData, isRefreshing]);

  const handleLoadMore = useCallback(() => {
    if (isLoading || isFetchingMore || !hasMore) return;
    setPage((prev) => prev + 1);
  }, [hasMore, isFetchingMore, isLoading]);

  // Top featured hero post
  const heroPost = useMemo(() => {
    if (posts && posts.length > 0) {
      const p = posts[0];
      const mediaItem = p.media?.[0];
      let imageUrl = mediaItem?.url || p.image || fallbackHero.image;
      if (mediaItem?.type === "video" || (typeof imageUrl === "string" && imageUrl.endsWith(".mp4"))) {
        imageUrl = imageUrl.replace(/\.mp4(\?.*)?$/i, ".jpg");
      }

      return {
        id: p._id,
        title: p.caption ? (p.caption.length > 25 ? p.caption.slice(0, 25) + "..." : p.caption) : "Golden Afternoons",
        image: getMediaUrl(imageUrl),
        author: {
          username: p.user?.username || "creator",
          avatar: getMediaUrl(p.user?.profilePicture || p.user?.avatar || fallbackHero.author.avatar),
        },
        likes: p.likes?.length || p.likesCount || 12400,
        comments: p.comments?.length || p.commentsCount || 289,
        rawPost: p,
      };
    }
    return {
      ...fallbackHero,
      image: getMediaUrl(fallbackHero.image),
      author: {
        ...fallbackHero.author,
        avatar: getMediaUrl(fallbackHero.author.avatar),
      },
    };
  }, [posts]);

  // 2-column grid posts
  const gridPosts = useMemo(() => {
    if (posts && posts.length > 1) {
      return posts.slice(1).map((p, idx) => {
        const mediaItem = p.media?.[0];
        let imageUrl = mediaItem?.url || p.image || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80";
        if (mediaItem?.type === "video" || (typeof imageUrl === "string" && imageUrl.endsWith(".mp4"))) {
          imageUrl = imageUrl.replace(/\.mp4(\?.*)?$/i, ".jpg");
        }

        return {
          id: p._id || `m-gp-${idx}`,
          title: p.caption ? (p.caption.length > 20 ? p.caption.slice(0, 20) + "..." : p.caption) : (idx % 2 === 0 ? "Spring Vibes" : "Chasing Sunsets"),
          author: {
            username: p.user?.username || "creator",
            avatar: getMediaUrl(p.user?.profilePicture || p.user?.avatar || fallbackHero.author.avatar),
          },
          image: getMediaUrl(imageUrl),
          likes: p.likes?.length || p.likesCount || (idx % 2 === 0 ? 8200 : 15000),
          comments: p.comments?.length || p.commentsCount || (idx % 2 === 0 ? 142 : 320),
          rawPost: p,
        };
      });
    }
    return fallbackGridPosts.map((gp) => ({
      ...gp,
      image: getMediaUrl(gp.image),
      author: {
        ...gp.author,
        avatar: getMediaUrl(gp.author.avatar),
      },
    }));
  }, [posts]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#120907" : "#F5F0EB" },
      ]}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      {...panResponder.panHandlers}
    >
      {/* ── Top Header Bar (Matching Reference) ── */}
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: Math.max(insets.top, 36) + 4,
            backgroundColor: isDark ? "rgba(18,9,7,0.95)" : "rgba(245,240,235,0.95)",
            borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "#EBE3D9",
          },
        ]}
      >
        <View style={styles.brandRow}>
          <Image
            source={require("../../assets/nuvyelo-emblem.png")}
            style={styles.logoBadgeImage}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.brandTitle,
              { color: isDark ? "#F5F0EB" : "#1A1A1A" },
            ]}
          >
            NUVYELO
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push("/app/explore" as any)}
            style={styles.headerIconButton}
            hitSlop={8}
          >
            <Search size={22} color={isDark ? "#F5F0EB" : "#1A1A1A"} strokeWidth={2} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/app/notifications" as any)}
            style={styles.headerIconButton}
            hitSlop={8}
          >
            <Bell size={22} color={isDark ? "#F5F0EB" : "#1A1A1A"} strokeWidth={2} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>
      </View>

      {/* ── Scrollable Feed Area ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FF6B35"
            colors={["#FF6B35"]}
          />
        }
        onMomentumScrollEnd={(event) => {
          const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
          const distanceFromBottom =
            contentSize.height - (contentOffset.y + layoutMeasurement.height);
          if (distanceFromBottom < 400) {
            handleLoadMore();
          }
        }}
      >
        {/* ── Stories Row ── */}
        <View style={styles.storiesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesContainer}
          >
            {/* Your Story */}
            <Pressable
              onPress={() => router.push("/app/create-story" as any)}
              style={styles.storyItem}
            >
              <View style={styles.addStoryRing}>
                <View style={styles.addStoryInner}>
                  <Plus size={16} color="#FFFFFF" strokeWidth={3} />
                </View>
              </View>
              <Text
                style={[
                  styles.storyUsername,
                  { color: isDark ? "#A8A29E" : "#78716C" },
                ]}
              >
                Your Story
              </Text>
            </Pressable>

            {/* Friends Stories */}
            {(activeStories && activeStories.length > 0
              ? activeStories
              : [
                  { user: { username: "minji" } },
                  { user: { username: "lucas" } },
                  { user: { username: "seoyeon" } },
                ]
            ).map((group: any, index: number) => {
              const u = typeof group.user === "object" && group.user !== null ? group.user : null;
              const username = u?.username || (typeof group.user === "string" ? group.user : `user-${index}`);
              const avatar =
                u?.profilePicture ||
                u?.avatar ||
                fallbackHero.author.avatar;

              return (
                <Pressable
                  key={index}
                  onPress={() => setActiveStoryIndex(index)}
                  style={styles.storyItem}
                >
                  <LinearGradient
                    colors={["#FF6B35", "#FF8C5A", "#FFB347"]}
                    style={styles.storyGradientRing}
                  >
                    <View
                      style={[
                        styles.storyAvatarWrap,
                        { borderColor: isDark ? "#120907" : "#FFFFFF" },
                      ]}
                    >
                      <Image source={{ uri: getMediaUrl(avatar) }} style={styles.storyAvatar} />
                    </View>
                  </LinearGradient>
                  <Text
                    style={[
                      styles.storyUsername,
                      { color: isDark ? "#F5F0EB" : "#1A1A1A" },
                    ]}
                    numberOfLines={1}
                  >
                    {username}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Large Hero Featured Moment Card (Matching Reference Design) ── */}
        <Pressable
          onPress={() => {
            const id = (heroPost as any).rawPost?._id || (heroPost as any).id;
            if (id) router.push({ pathname: "/app/post-detail", params: { id } } as any);
          }}
          style={styles.heroCardWrapper}
        >
          <Image source={{ uri: heroPost.image }} style={styles.heroImage} />
          <LinearGradient
            colors={["rgba(0,0,0,0.15)", "transparent", "rgba(0,0,0,0.45)", "rgba(0,0,0,0.88)"]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Top Options Menu */}
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }} />
            <View style={styles.heroMoreDots}>
              <View style={styles.moreDot} />
              <View style={styles.moreDot} />
              <View style={styles.moreDot} />
            </View>
          </View>

          {/* Bottom Card Info */}
          <View style={styles.heroBottomRow}>
            <Text style={styles.heroTitle}>{heroPost.title}</Text>
            
            <View style={styles.heroCreatorRow}>
              <View style={styles.heroCreatorLeft}>
                <Image
                  source={{ uri: heroPost.author.avatar }}
                  style={styles.heroAvatar}
                />
                <Text style={styles.heroCreatorName}>
                  @{heroPost.author.username} • 2h ago
                </Text>
              </View>
              <View style={styles.heroCreatorMoreDots}>
                <View style={styles.moreDotSmall} />
                <View style={styles.moreDotSmall} />
                <View style={styles.moreDotSmall} />
              </View>
            </View>

            {/* Engagement Counters */}
            <View style={styles.heroEngagementRow}>
              <View style={styles.heroPill}>
                <Heart size={14} color="#FF4D4D" fill="#FF4D4D" />
                <Text style={styles.heroPillText}>
                  {heroPost.likes >= 1000
                    ? `${(heroPost.likes / 1000).toFixed(heroPost.likes % 1000 === 0 ? 0 : 1)}K`
                    : heroPost.likes}
                </Text>
              </View>
              <View style={styles.heroPill}>
                <MessageCircle size={14} color="#FFFFFF" />
                <Text style={styles.heroPillText}>{heroPost.comments}</Text>
              </View>
              <View style={styles.heroBookmarkBtn}>
                <Bookmark size={14} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </Pressable>

        {/* ── Feed Filter Tabs ── */}
        <View
          style={[
            styles.tabsRow,
            { borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "#EBE3D9" },
          ]}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={styles.tabButton}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    {
                      color: isActive
                        ? isDark
                          ? "#F5F0EB"
                          : "#1A1A1A"
                        : isDark
                        ? "#78716C"
                        : "#A8A29E",
                      fontWeight: isActive ? "800" : "600",
                    },
                  ]}
                >
                  {tab}
                </Text>
                {isActive && <View style={styles.tabActiveBar} />}
              </Pressable>
            );
          })}
        </View>

        {/* ── 2-Column Card Grid (Matching Reference Design) ── */}
        <View style={styles.gridContainer}>
          {gridPosts.map((post: any, idx: number) => (
            <Pressable
              key={post.id || idx}
              onPress={() => {
                const id = post.rawPost?._id || post.id;
                if (id) {
                  router.push({ pathname: "/app/post-detail", params: { id } } as any);
                }
              }}
              style={[
                styles.gridCard,
                {
                  backgroundColor: isDark ? "#1E1210" : "#FFFFFF",
                  borderColor: isDark ? "rgba(255,255,255,0.06)" : "#EBE3D9",
                },
              ]}
            >
              <Image source={{ uri: post.image }} style={styles.gridThumbnail} />

              {/* Engagement Stats */}
              <View style={styles.gridEngagementRow}>
                <View style={styles.gridStat}>
                  <Heart size={12} color="#FF4D4D" fill="#FF4D4D" />
                  <Text
                    style={[
                      styles.gridStatText,
                      { color: isDark ? "#A8A29E" : "#78716C" },
                    ]}
                  >
                    {post.likes >= 1000
                      ? `${(post.likes / 1000).toFixed(post.likes % 1000 === 0 ? 0 : 1)}K`
                      : post.likes}
                  </Text>
                </View>
                <View style={styles.gridStat}>
                  <MessageCircle size={12} color={isDark ? "#A8A29E" : "#78716C"} />
                  <Text
                    style={[
                      styles.gridStatText,
                      { color: isDark ? "#A8A29E" : "#78716C" },
                    ]}
                  >
                    {post.comments}
                  </Text>
                </View>
                <Bookmark size={13} color={isDark ? "#A8A29E" : "#78716C"} />
              </View>

              {/* Creator details */}
              <View style={styles.gridCreatorRow}>
                <Image
                  source={{ uri: post.author.avatar }}
                  style={styles.gridAvatar}
                />
                <View style={styles.gridCreatorTextCol}>
                  <Text
                    style={[
                      styles.gridTitle,
                      { color: isDark ? "#F5F0EB" : "#1A1A1A" },
                    ]}
                    numberOfLines={1}
                  >
                    {post.title}
                  </Text>
                  <Text
                    style={[
                      styles.gridUsername,
                      { color: isDark ? "#78716C" : "#A8A29E" },
                    ]}
                    numberOfLines={1}
                  >
                    @{post.author.username}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Loading More Spinner */}
        {isFetchingMore && (
          <View style={styles.loadingMoreWrapper}>
            <ActivityIndicator size="small" color="#FF6B35" />
          </View>
        )}

        {/* End of Feed Message */}
        {!hasMore && (
          <View style={styles.endOfFeedSection}>
            <Text
              style={[
                styles.endOfFeedText,
                { color: isDark ? "#78716C" : "#A8A29E" },
              ]}
            >
              You're all caught up with your circle's moments ✨
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Story Viewer Modal */}
      {activeStoryIndex !== null && (
        <StoryViewer
          stories={activeStories}
          initialUserIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
        />
      )}
    </View>
  );
}

const CARD_WIDTH = (SCREEN_WIDTH - 32 - 12) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    zIndex: 20,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBadgeImage: {
    width: 28,
    height: 28,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconButton: {
    padding: 4,
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#FF6B35",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 12,
  },
  storiesSection: {
    marginBottom: 12,
  },
  storiesContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  storyItem: {
    alignItems: "center",
    gap: 4,
  },
  addStoryRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(255, 107, 53, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  addStoryInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
  },
  storyGradientRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  storyAvatarWrap: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    borderWidth: 2,
    overflow: "hidden",
  },
  storyAvatar: {
    width: "100%",
    height: "100%",
  },
  storyUsername: {
    fontSize: 10,
    fontWeight: "600",
    maxWidth: 60,
  },
  heroCardWrapper: {
    marginHorizontal: 16,
    height: 320,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 14,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroTopRow: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  heroMoreDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  moreDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },
  heroBottomRow: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroCreatorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  heroCreatorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroCreatorMoreDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    padding: 4,
  },
  moreDotSmall: {
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  heroAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  heroCreatorName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  heroEngagementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  heroPillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  heroBookmarkBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    gap: 20,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  tabButton: {
    paddingBottom: 8,
    position: "relative",
  },
  tabButtonText: {
    fontSize: 14,
  },
  tabActiveBar: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: "#FF6B35",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  gridCard: {
    width: CARD_WIDTH,
    borderRadius: 20,
    borderWidth: 1,
    padding: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  gridThumbnail: {
    width: "100%",
    height: CARD_WIDTH * 0.9,
    borderRadius: 14,
    backgroundColor: "#FAF6F0",
  },
  gridEngagementRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 2,
  },
  gridStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  gridStatText: {
    fontSize: 10,
    fontWeight: "700",
  },
  gridCreatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 2,
    paddingTop: 2,
  },
  gridAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  gridCreatorTextCol: {
    flex: 1,
    justifyContent: "center",
  },
  gridTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    lineHeight: 14,
  },
  gridUsername: {
    fontSize: 10,
    lineHeight: 12,
  },
  loadingMoreWrapper: {
    paddingVertical: 16,
    alignItems: "center",
  },
  endOfFeedSection: {
    paddingVertical: 24,
    alignItems: "center",
  },
  endOfFeedText: {
    fontSize: 11,
  },
});