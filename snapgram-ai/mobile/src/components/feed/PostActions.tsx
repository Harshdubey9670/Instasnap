import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Send,
} from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface PostActionsProps {
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
  onComment: () => void;
  onShare: () => void;
  commentsEnabled?: boolean;
  sharingEnabled?: boolean;
  controls?: unknown;
  isCarousel?: boolean;
}

export const PostActions = ({
  isLiked,
  isSaved,
  onLike,
  onSave,
  onComment,
  onShare,
  commentsEnabled,
  sharingEnabled,
  isCarousel = false,
}: PostActionsProps) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  const likeScale = useRef(new Animated.Value(1)).current;
  const saveScale = useRef(new Animated.Value(1)).current;

  const animatePress = (value: Animated.Value) => {
    Animated.sequence([
      Animated.spring(value, {
        toValue: 0.82,
        friction: 6,
        tension: 160,
        useNativeDriver: true,
      }),
      Animated.spring(value, {
        toValue: 1,
        friction: 6,
        tension: 160,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLike = () => {
    animatePress(likeScale);
    onLike();
  };

  const handleSave = () => {
    animatePress(saveScale);
    onSave();
  };

  const iconColor = isDark ? "#ffffff" : "#0f172a";
  const bgBase = isDark ? "#0a0510" : "#ffffff";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bgBase,
          paddingTop: isCarousel ? 6 : 12,
          paddingBottom: isCarousel ? 6 : 8,
        },
      ]}
    >
      <View style={styles.row}>
        {/* Left Action Buttons: Like, Comment, Share */}
        <View style={styles.leftGroup}>
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <Pressable
              onPress={handleLike}
              style={styles.button}
              accessibilityRole="button"
              accessibilityLabel={isLiked ? "Unlike post" : "Like post"}
              hitSlop={6}
            >
              <Heart
                size={26}
                color={isLiked ? "#ef4444" : iconColor}
                fill={isLiked ? "#ef4444" : "none"}
                strokeWidth={2}
              />
            </Pressable>
          </Animated.View>

          {commentsEnabled !== false && (
            <Pressable
              onPress={onComment}
              style={styles.button}
              accessibilityRole="button"
              accessibilityLabel="Comment on post"
              hitSlop={6}
            >
              <MessageCircle size={26} color={iconColor} strokeWidth={2} />
            </Pressable>
          )}

          {sharingEnabled !== false && (
            <Pressable
              onPress={onShare}
              style={styles.button}
              accessibilityRole="button"
              accessibilityLabel="Share post"
              hitSlop={6}
            >
              <Send size={26} color={iconColor} strokeWidth={2} />
            </Pressable>
          )}
        </View>

        {/* Right Action Button: Bookmark */}
        <Animated.View style={{ transform: [{ scale: saveScale }] }}>
          <Pressable
            onPress={handleSave}
            style={styles.button}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? "Remove bookmark" : "Bookmark post"}
            hitSlop={6}
          >
            <Bookmark
              size={26}
              color={isSaved ? "#a855f7" : iconColor}
              fill={isSaved ? "#a855f7" : "none"}
              strokeWidth={2}
            />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  button: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default PostActions;