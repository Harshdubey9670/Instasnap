import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { MoreHorizontal } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "../../contexts/ThemeContext";
import { Avatar } from "../ui/Avatar";

interface PostUser {
  _id?: string;
  username?: string;
  profilePicture?: string;
  avatar?: string;
}

interface PostHeaderProps {
  user?: PostUser | null;
  location?: string;
  onShowOptions: () => void;
}

export const PostHeader = ({
  user,
  location,
  onShowOptions,
}: PostHeaderProps) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  const openProfile = () => {
    if (!user?._id) return;
    router.push(`/app/profile/${user._id}` as any);
  };

  const usernameColor = isDark ? "#ffffff" : "#0f172a";
  const locationColor = isDark ? "#94a3b8" : "#64748b";
  const dotsColor = isDark ? "#ffffff" : "#64748b";
  const gapBg = isDark ? "#0a0510" : "#ffffff";

  return (
    <View style={[styles.container, { backgroundColor: gapBg }]}>
      <Pressable
        onPress={openProfile}
        style={styles.userButton}
        accessibilityRole="button"
        accessibilityLabel={`Open ${user?.username || "user"} profile`}
      >
        {/* Gradient avatar ring */}
        <LinearGradient
          colors={["#a855f7", "#ec4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarGradientRing}
        >
          <View style={[styles.avatarGap, { backgroundColor: gapBg }]}>
            <Avatar
              src={user?.profilePicture || user?.avatar}
              alt={user?.username || "User"}
              size="sm"
              fallback={user?.username?.charAt(0)?.toUpperCase() || "U"}
            />
          </View>
        </LinearGradient>

        <View style={styles.userInfo}>
          <Text
            style={[styles.username, { color: usernameColor }]}
            numberOfLines={1}
          >
            {user?.username || "Unknown user"}
          </Text>

          {location ? (
            <Text
              style={[styles.location, { color: locationColor }]}
              numberOfLines={1}
            >
              {location}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <Pressable
        onPress={onShowOptions}
        style={styles.optionsButton}
        accessibilityRole="button"
        accessibilityLabel="Post options"
        hitSlop={8}
      >
        <MoreHorizontal size={22} color={dotsColor} strokeWidth={2} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  avatarGradientRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarGap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  username: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700",
  },
  location: {
    marginTop: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  optionsButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
});

export default PostHeader;