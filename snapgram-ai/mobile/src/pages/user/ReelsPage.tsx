import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSelector } from "react-redux";
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Volume2,
  VolumeX,
  Music2,
  Film,
} from "lucide-react-native";
import api from "../../services/api";
import { Avatar } from "../../components/ui/Avatar";
import { useTheme } from "../../contexts/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const DOUBLE_TAP_DELAY = 300;

interface ReelItemProps {
  reel: any;
  isActive: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
}

const ReelItem = ({ reel, isActive, isMuted, onMuteToggle }: ReelItemProps) => {
  const authUser = useSelector((s: any) => s.auth?.user);

  const [liked, setLiked] = useState(
    reel.likes?.some((id: any) => id === authUser?._id || id?._id === authUser?._id) || false
  );
  const [likesCount, setLikesCount] = useState<number>(reel.likes?.length ?? 0);
  const [showHeart, setShowHeart] = useState(false);

  const lastTap = useRef<number>(0);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      if (!liked) {
        triggerLike();
      }
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
    lastTap.current = now;
  };

  const triggerLike = async () => {
    setLiked(true);
    setLikesCount((c: number) => c + 1);
    try {
      await api.put(`/api/reels/${reel._id}/like`);
    } catch {
      setLiked(false);
      setLikesCount((c: number) => c - 1);
    }
  };

  const handleLikePress = async () => {
    if (liked) {
      setLiked(false);
      setLikesCount((c: number) => c - 1);
      try {
        await api.put(`/api/reels/${reel._id}/like`);
      } catch {
        setLiked(true);
        setLikesCount((c: number) => c + 1);
      }
    } else {
      triggerLike();
    }
  };

  return (
    <Pressable style={styles.reelContainer} onPress={handleDoubleTap}>
      {/* Video Placeholder Box / Preview */}
      <View style={styles.videoBox}>
        <Film size={64} color="rgba(244, 63, 94, 0.4)" />
        <Text style={styles.videoNotice}>Reel Video Feed</Text>
      </View>

      {/* Heart Pop Overlay */}
      {showHeart && (
        <View style={styles.heartOverlay} pointerEvents="none">
          <Heart size={80} color="#fff" fill="#fff" />
        </View>
      )}

      {/* Right Sidebar Actions */}
      <View style={styles.sidebar}>
        <Pressable style={styles.sideAction} onPress={() => router.push(`/app/profile/${reel.user?._id}` as any)}>
          <View style={styles.avatarBorder}>
            <Avatar src={reel.user?.profilePicture || reel.user?.avatar} size="md" />
          </View>
          <View style={styles.followPill}>
            <Plus size={10} color="#fff" />
          </View>
        </Pressable>

        <Pressable style={styles.sideAction} onPress={handleLikePress}>
          <Heart size={28} color={liked ? "#ef4444" : "#fff"} fill={liked ? "#ef4444" : "transparent"} />
          <Text style={styles.sideText}>{likesCount}</Text>
        </Pressable>

        <Pressable style={styles.sideAction} onPress={() => router.push(`/app/post/${reel._id}` as any)}>
          <MessageCircle size={26} color="#fff" />
          <Text style={styles.sideText}>{reel.comments?.length ?? 0}</Text>
        </Pressable>

        <Pressable style={styles.sideAction}>
          <Share2 size={26} color="#fff" />
        </Pressable>

        <Pressable style={styles.sideAction} onPress={onMuteToggle}>
          {isMuted ? <VolumeX size={22} color="#fff" /> : <Volume2 size={22} color="#fff" />}
        </Pressable>
      </View>

      {/* Bottom Info Overlay */}
      <View style={styles.bottomInfo} pointerEvents="box-none">
        <Pressable onPress={() => router.push(`/app/profile/${reel.user?._id}` as any)}>
          <Text style={styles.username}>@{reel.user?.username || "creator"}</Text>
        </Pressable>

        {reel.caption ? (
          <Text style={styles.caption} numberOfLines={2}>
            {reel.caption}
          </Text>
        ) : null}

        <View style={styles.audioRow}>
          <Music2 size={12} color="#fff" />
          <Text style={styles.audioText} numberOfLines={1}>
            {reel.music?.title ? `${reel.music.title} · ${reel.music.artist}` : "Original Audio"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default function ReelsPage() {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    fetchReels(1);
  }, []);

  const fetchReels = async (pageNum: number) => {
    try {
      if (pageNum === 1) setLoading(true);
      const res = await api.get(`/api/reels?page=${pageNum}&limit=10`);
      if (res.data.success) {
        const data = res.data.data?.reels || res.data.data || [];
        setReels((prev) => (pageNum === 1 ? data : [...prev, ...data]));
        setHasMore(data.length >= 10);
      }
    } catch (e) {
      console.error("Failed to load reels", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((p) => {
        const next = p + 1;
        fetchReels(next);
        return next;
      });
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveReelIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
  }).current;

  if (loading && reels.length === 0) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#f43f5e" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={reels}
        keyExtractor={(item) => item._id || String(Math.random())}
        renderItem={({ item, index }) => (
          <ReelItem
            reel={item}
            isActive={index === activeReelIndex}
            isMuted={isMuted}
            onMuteToggle={() => setIsMuted((m) => !m)}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        getItemLayout={(_, index) => ({ length: SCREEN_HEIGHT, offset: SCREEN_HEIGHT * index, index })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#000" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000" },
  reelContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#000",
    position: "relative",
  },
  videoBox: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0b0f19",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  videoNotice: { color: "#64748b", fontSize: 13, fontWeight: "600" },
  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebar: {
    position: "absolute",
    right: 12,
    bottom: 120,
    alignItems: "center",
    gap: 20,
  },
  sideAction: { alignItems: "center", gap: 4 },
  sideText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  avatarBorder: {
    padding: 2,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#fff",
  },
  followPill: {
    position: "absolute",
    bottom: -4,
    backgroundColor: "#f43f5e",
    borderRadius: 10,
    padding: 2,
  },
  bottomInfo: {
    position: "absolute",
    left: 16,
    right: 80,
    bottom: 40,
    gap: 6,
  },
  username: { color: "#fff", fontSize: 14, fontWeight: "800" },
  caption: { color: "#f8fafc", fontSize: 12, lineHeight: 18 },
  audioRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  audioText: { color: "#94a3b8", fontSize: 11 },
});
