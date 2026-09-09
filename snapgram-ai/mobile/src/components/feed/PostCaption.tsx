import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { useTheme } from "../../contexts/ThemeContext";
import { RenderCaption } from "../../utils/renderCaption";

interface PostCaptionProps {
  post: {
    _id: string;
    caption?: string;
    createdAt?: string;
    settings?: {
      hideLikes?: boolean;
      commentsEnabled?: boolean;
    };
    user?: {
      username?: string;
    };
  };
  likesCount: number;
  commentsCount: number;
  onShowLikes: () => void;
}

export const PostCaption = ({
  post,
  likesCount,
  commentsCount,
  onShowLikes,
}: PostCaptionProps) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  const commentsEnabled = post.settings?.commentsEnabled !== false;

  const handleOpenPost = () => {
    router.push(`/app/post/${post._id}` as any);
  };

  const formattedDate = new Date(
    post.createdAt || Date.now(),
  ).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });

  const textColor = isDark ? "#ffffff" : "#0f172a";
  const captionColor = isDark ? "#f1f5f9" : "#1e293b";
  const mutedColor = isDark ? "#94a3b8" : "#64748b";
  const timeColor = isDark ? "#64748b" : "#94a3b8";
  const bgBase = isDark ? "#0a0510" : "#ffffff";

  return (
    <View style={[styles.container, { backgroundColor: bgBase }]}>
      {/* Likes Count */}
      {post.settings?.hideLikes ? (
        <Text style={[styles.likedByOthers, { color: mutedColor }]}>
          Liked by others
        </Text>
      ) : (
        <Pressable
          onPress={() => {
            if (likesCount > 0) {
              onShowLikes();
            }
          }}
          disabled={likesCount <= 0}
          accessibilityRole="button"
          accessibilityLabel={`${likesCount} ${
            likesCount === 1 ? "like" : "likes"
          }`}
          hitSlop={4}
        >
          <Text style={[styles.likes, { color: textColor }]}>
            {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}
          </Text>
        </Pressable>
      )}

      {/* Caption Row */}
      {Boolean(post.caption || post.user?.username) && (
        <View style={styles.captionRow}>
          <Text style={[styles.username, { color: textColor }]}>
            {post.user?.username || ""}
          </Text>

          <Text style={{ color: captionColor }}>
            <RenderCaption caption={post.caption} />
          </Text>
        </View>
      )}

      {/* View Comments Link */}
      {commentsEnabled && (
        <Pressable
          onPress={handleOpenPost}
          style={styles.commentsLink}
          accessibilityRole="link"
          hitSlop={4}
        >
          <Text style={[styles.commentsText, { color: mutedColor }]}>
            {commentsCount > 0
              ? `View all ${commentsCount} comments`
              : "View full post & details"}
          </Text>
        </Pressable>
      )}

      {/* Timestamp */}
      <Text style={[styles.timestamp, { color: timeColor }]}>
        {formattedDate.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  likedByOthers: {
    marginBottom: 4,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
  },
  likes: {
    marginBottom: 4,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  captionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginTop: 2,
  },
  username: {
    marginRight: 6,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
  commentsLink: {
    marginTop: 5,
    marginBottom: 3,
  },
  commentsText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  timestamp: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.6,
    fontWeight: "600",
  },
});

export default PostCaption;