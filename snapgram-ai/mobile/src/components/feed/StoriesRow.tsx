import React, { useRef, useEffect } from "react";
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector } from "react-redux";

import type { RootState } from "../../store/store";
import { useTheme } from "../../contexts/ThemeContext";
import { Avatar } from "../ui/Avatar";

interface StoryViewerInfo {
  _id?: string;
}

interface StoryItem {
  _id?: string;
  viewers?: Array<string | StoryViewerInfo>;
  media?: Array<{
    url?: string;
    type?: string;
  }>;
}

export interface StoryGroup {
  user:
    | string
    | {
        _id?: string;
        username?: string;
        profilePicture?: string;
        avatar?: string;
      };
  stories: StoryItem[];
  [key: string]: any;
}

interface LiveStream {
  _id: string;
  host: {
    username?: string;
    profilePicture?: string;
    avatar?: string;
  };
}

interface StoriesRowProps {
  stories?: StoryGroup[];
  liveStreams?: LiveStream[];
  isLoading?: boolean;
  onStoryClick?: (index: number) => void;
}

interface StoryCardData {
  key: string;
  type: "mine" | "live" | "story";
  groupIndex?: number;
  username?: string;
  image?: string;
  hasStory?: boolean;
  allSeen?: boolean;
  live?: boolean;
  onPress: () => void;
}

export const StoriesRow = ({
  stories = [],
  liveStreams = [],
  isLoading = false,
  onStoryClick,
}: StoriesRowProps) => {
  const authUser = useSelector((state: RootState) => state.auth.user);
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  if (isLoading) {
    return <StoriesSkeleton isDark={isDark} />;
  }

  const authUserId = getUserId(authUser);

  const myStoryIndex = stories.findIndex(
    (story) => getUserId(story.user) === authUserId,
  );

  const myStoryGroup = myStoryIndex !== -1 ? stories[myStoryIndex] : null;

  const myAllSeen = myStoryGroup
    ? areAllStoriesSeen(myStoryGroup.stories, authUserId)
    : false;

  const friendStories = stories.filter(
    (story) => getUserId(story.user) !== authUserId,
  );

  const handleOwnStory = () => {
    if (myStoryGroup && onStoryClick) {
      onStoryClick(myStoryIndex);
      return;
    }
    router.push("/app/story/create");
  };

  const storyCards = buildStoryCards(
    myStoryGroup,
    myStoryIndex,
    myAllSeen,
    liveStreams,
    friendStories,
    stories,
    onStoryClick,
    handleOwnStory,
    authUserId,
  );

  return (
    <View style={[styles.wrapper, { backgroundColor: isDark ? "#0a0510" : "#ffffff" }]}>
      <FlatList
        data={storyCards}
        keyExtractor={(item) => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={StorySeparator}
        renderItem={({ item }) => (
          <StoryCard data={item} isDark={isDark} />
        )}
        snapToAlignment="start"
        decelerationRate="fast"
      />
    </View>
  );
};

const buildStoryCards = (
  myStoryGroup: StoryGroup | null,
  myStoryIndex: number,
  myAllSeen: boolean,
  liveStreams: LiveStream[],
  friendStories: StoryGroup[],
  allStories: StoryGroup[],
  onStoryClick: ((index: number) => void) | undefined,
  handleOwnStory: () => void,
  authUserId?: string,
): StoryCardData[] => {
  const cards: StoryCardData[] = [];

  const myUser =
    myStoryGroup?.user && typeof myStoryGroup.user === "object"
      ? myStoryGroup.user
      : undefined;

  // "Your story" card
  cards.push({
    key: "my-story",
    type: "mine",
    groupIndex: myStoryIndex >= 0 ? myStoryIndex : undefined,
    username: "Your story",
    image: myUser?.profilePicture || myUser?.avatar,
    hasStory: Boolean(myStoryGroup && myStoryGroup.stories.length > 0),
    allSeen: myAllSeen,
    onPress: handleOwnStory,
  });

  // Active live streams
  liveStreams.forEach((stream) => {
    cards.push({
      key: `live-${stream._id}`,
      type: "live",
      username: stream.host?.username || "Live",
      image: stream.host?.profilePicture || stream.host?.avatar || "https://i.pravatar.cc/150",
      live: true,
      onPress: () => router.push(`/app/live/${stream._id}` as any),
    });
  });

  // Friend stories
  friendStories.forEach((storyGroup) => {
    const originalIndex = allStories.indexOf(storyGroup);
    const user =
      typeof storyGroup.user === "object" ? storyGroup.user : undefined;

    const allSeen = areAllStoriesSeen(storyGroup.stories, authUserId);

    cards.push({
      key: `story-${getUserId(storyGroup.user)}`,
      type: "story",
      groupIndex: originalIndex,
      username: user?.username || "User",
      image: user?.profilePicture || user?.avatar,
      allSeen,
      hasStory: true,
      onPress: () => onStoryClick?.(originalIndex),
    });
  });

  return cards;
};

const StoryCard = ({
  data,
  isDark,
}: {
  data: StoryCardData;
  isDark: boolean;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      friction: 7,
      tension: 180,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 180,
    }).start();
  };

  const textColor = isDark ? "#ffffff" : "#0f172a";
  const myTextColor = isDark ? "#94a3b8" : "#64748b";
  const gapColor = isDark ? "#0a0510" : "#ffffff";

  // 1. Live stream item
  if (data.type === "live") {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={data.onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.storyItem}
          accessibilityRole="button"
          accessibilityLabel={`${data.username} is live`}
        >
          <View style={styles.liveRing}>
            <View style={[styles.avatarInner, { backgroundColor: gapColor, borderColor: gapColor }]}>
              <Avatar
                src={data.image}
                alt={data.username}
                size="lg"
                fallback={data.username?.charAt(0)?.toUpperCase() || "U"}
              />
            </View>
          </View>

          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>

          <Text style={[styles.username, { color: textColor }]} numberOfLines={1}>
            {data.username}
          </Text>
        </Pressable>
      </Animated.View>
    );
  }

  // 2. "Your story" item
  if (data.type === "mine") {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={data.onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.storyItem}
          accessibilityRole="button"
          accessibilityLabel="Your story"
        >
          <View
            style={[
              styles.ownStoryCircle,
              {
                borderColor: isDark ? "#2a173d" : "#e2e8f0",
                backgroundColor: gapColor,
              },
            ]}
          >
            <Avatar
              src={data.image}
              alt="Your story"
              size="lg"
              fallback="U"
            />

            {/* Purple circular + badge */}
            <Pressable
              onPress={() => router.push("/app/story/create")}
              style={[
                styles.addButton,
                { borderColor: gapColor },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Upload story"
            >
              <Plus size={13} color="#ffffff" strokeWidth={3} />
            </Pressable>
          </View>

          <Text style={[styles.username, { color: myTextColor }]} numberOfLines={1}>
            Your story
          </Text>
        </Pressable>
      </Animated.View>
    );
  }

  // 3. Friend story item with vibrant gradient ring
  const isSeen = data.allSeen;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={data.onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.storyItem}
        accessibilityRole="button"
        accessibilityLabel={`${data.username}'s story`}
      >
        {isSeen ? (
          // Seen story has subtle border
          <View
            style={[
              styles.seenStoryRing,
              {
                borderColor: isDark ? "#3f3050" : "#cbd5e1",
              },
            ]}
          >
            <View style={[styles.gapRing, { backgroundColor: gapColor }]}>
              <Avatar
                src={data.image}
                alt={data.username || "Story"}
                size="lg"
                fallback={data.username?.charAt(0)?.toUpperCase() || "U"}
              />
            </View>
          </View>
        ) : (
          // Unseen story has vibrant gradient ring
          <LinearGradient
            colors={["#a855f7", "#ec4899", "#f43f5e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientRing}
          >
            <View style={[styles.gapRing, { backgroundColor: gapColor }]}>
              <Avatar
                src={data.image}
                alt={data.username || "Story"}
                size="lg"
                fallback={data.username?.charAt(0)?.toUpperCase() || "U"}
              />
            </View>
          </LinearGradient>
        )}

        <Text style={[styles.username, { color: textColor }]} numberOfLines={1}>
          {data.username}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const StoriesSkeleton = ({ isDark }: { isDark: boolean }) => {
  const data = [1, 2, 3, 4, 5];
  return (
    <View style={[styles.wrapper, { backgroundColor: isDark ? "#0a0510" : "#ffffff" }]}>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={StorySeparator}
        renderItem={() => <SkeletonStoryCard isDark={isDark} />}
      />
    </View>
  );
};

const SkeletonStoryCard = ({ isDark }: { isDark: boolean }) => {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={styles.storyItem}>
      <Animated.View
        style={[
          styles.skeletonCircle,
          {
            opacity,
            backgroundColor: isDark ? "#1f132b" : "#e2e8f0",
          },
        ]}
      />
      <Animated.View
        style={[
          styles.skeletonName,
          {
            opacity,
            backgroundColor: isDark ? "#1f132b" : "#e2e8f0",
          },
        ]}
      />
    </View>
  );
};

const StorySeparator = () => <View style={styles.separator} />;

const areAllStoriesSeen = (
  stories: StoryItem[],
  authUserId?: string,
): boolean => {
  if (!stories.length || !authUserId) {
    return false;
  }
  return stories.every(
    (story) =>
      story.viewers?.some((viewer) => getViewerId(viewer) === authUserId) ??
      false,
  );
};

const getViewerId = (
  viewer: string | StoryViewerInfo,
): string | undefined => {
  if (typeof viewer === "string") return viewer;
  return viewer?._id;
};

const getUserId = (
  user: string | { _id?: string } | null | undefined,
): string | undefined => {
  if (!user) return undefined;
  if (typeof user === "string") return user;
  return user._id;
};

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 10,
  },
  listContent: {
    paddingHorizontal: 12,
    alignItems: "center",
  },
  separator: {
    width: 14,
  },
  storyItem: {
    width: 80,
    alignItems: "center",
    position: "relative",
  },
  ownStoryCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  addButton: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#a855f7",
    borderWidth: 2.5,
    zIndex: 10,
  },
  gradientRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  seenStoryRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  gapRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  liveRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    padding: 2.5,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  liveBadge: {
    position: "absolute",
    top: 58,
    alignSelf: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#ef4444",
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  liveBadgeText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "900",
  },
  username: {
    width: 78,
    marginTop: 6,
    fontSize: 12,
    lineHeight: 15,
    textAlign: "center",
    fontWeight: "600",
  },
  skeletonCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  skeletonName: {
    width: 52,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
});

export default StoriesRow;