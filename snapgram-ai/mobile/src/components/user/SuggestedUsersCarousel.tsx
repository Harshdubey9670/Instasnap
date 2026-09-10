import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";

import type { RootState } from "../../store/store";
import { useTheme } from "../../contexts/ThemeContext";
import { Avatar } from "../ui/Avatar";
import api from "../../services/api";
import { updateFollowing, updateSentFollowRequests } from "../../store/authSlice";

interface SuggestedUser {
  _id: string;
  username?: string;
  category?: string;
  profilePicture?: string;
  avatar?: string;
  isPrivate?: boolean;
}

export const SuggestedUsersCarousel = () => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchUsers = async () => {
      try {
        const response = await api.get("/api/users/suggested?limit=10");
        if (mounted && response.data?.success) {
          setUsers(response.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch suggested users", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void fetchUsers();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading || users.length === 0) {
    return null;
  }

  const textColor = isDark ? "#ffffff" : "#0f172a";
  const seeAllColor = isDark ? "#c084fc" : "#a855f7";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>
          Suggested for you
        </Text>

        <Pressable
          onPress={() => router.push("/app/explore")}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={[styles.seeAll, { color: seeAllColor }]}>
            See all
          </Text>
        </Pressable>
      </View>

      {/* Cards List */}
      <FlatList
        data={users}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <SuggestedUserCard user={item} isDark={isDark} />
        )}
      />
    </View>
  );
};

const SuggestedUserCard = ({
  user,
  isDark,
}: {
  user: SuggestedUser;
  isDark: boolean;
}) => {
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state: RootState) => state.auth);

  const [isLoading, setIsLoading] = useState(false);
  const [localFollowing, setLocalFollowing] = useState<boolean | null>(null);
  const [localRequested, setLocalRequested] = useState<boolean | null>(null);

  const reduxIsFollowing = Boolean(
    authUser?.following?.some((id: any) => {
      const target = typeof id === "string" ? id : id?._id || id;
      return String(target) === String(user._id);
    }),
  );

  const reduxIsRequested = Boolean(
    authUser?.sentFollowRequests?.some((id: any) => {
      const target = typeof id === "string" ? id : id?._id || id;
      return String(target) === String(user._id);
    }),
  );

  const isFollowing = localFollowing !== null ? localFollowing : reduxIsFollowing;
  const isRequested = localRequested !== null ? localRequested : reduxIsRequested;

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "user_follow_updated",
      (event: { userId: string; isFollowing: boolean; isRequested: boolean }) => {
        if (String(event.userId) === String(user._id)) {
          setLocalFollowing(event.isFollowing);
          setLocalRequested(event.isRequested);
        }
      },
    );
    return () => sub.remove();
  }, [user._id]);

  const handleToggleFollow = async () => {
    if (isLoading) return;
    setIsLoading(true);

    const wasFollowing = isFollowing;
    const wasRequested = isRequested;

    try {
      let response;
      if (wasFollowing) {
        response = await api.delete(`/api/users/${user._id}/follow`);
      } else if (wasRequested) {
        response = await api.delete(
          `/api/users/follow-requests/${user._id}/cancel`,
        );
      } else {
        response = await api.post(`/api/users/${user._id}/follow`);
      }

      if (response?.data?.success) {
        const nextStatus = response.data.status;
        if (nextStatus === "requested") {
          setLocalFollowing(false);
          setLocalRequested(true);
          const updated = [...(authUser?.sentFollowRequests || []), user._id];
          dispatch(updateSentFollowRequests(updated));
          DeviceEventEmitter.emit("user_follow_updated", {
            userId: user._id,
            isFollowing: false,
            isRequested: true,
          });
        } else if (nextStatus === "following") {
          setLocalFollowing(true);
          setLocalRequested(false);
          if (response.data.data) {
            dispatch(updateFollowing(response.data.data));
          }
          DeviceEventEmitter.emit("user_follow_updated", {
            userId: user._id,
            isFollowing: true,
            isRequested: false,
          });
        } else {
          setLocalFollowing(false);
          setLocalRequested(false);
          if (response.data.data) {
            dispatch(updateFollowing(response.data.data));
          }
          if (wasRequested) {
            const updated = (authUser?.sentFollowRequests || []).filter(
              (id: any) => String(id) !== String(user._id),
            );
            dispatch(updateSentFollowRequests(updated));
          }
          DeviceEventEmitter.emit("user_follow_updated", {
            userId: user._id,
            isFollowing: false,
            isRequested: false,
          });
        }
      }
    } catch (error) {
      console.error("Failed to follow/unfollow user", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cardBg = isDark ? "#130a1c" : "#ffffff";
  const cardBorder = isDark ? "#2d1b3b" : "#e2e8f0";
  const usernameColor = isDark ? "#ffffff" : "#0f172a";
  const categoryColor = isDark ? "#94a3b8" : "#64748b";

  const userAvatar = user.profilePicture || user.avatar;
  const initial = user.username?.charAt(0)?.toUpperCase() || "U";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
        },
      ]}
    >
      <Pressable
        onPress={() => router.push(`/app/profile/${user._id}` as any)}
        style={styles.profileLink}
        accessibilityRole="button"
        accessibilityLabel={`View ${user.username || "user"} profile`}
      >
        <View style={styles.avatarWrapper}>
          {userAvatar ? (
            <Avatar
              src={userAvatar}
              alt={user.username}
              size="lg"
              style={styles.cardAvatar}
            />
          ) : (
            <View
              style={[
                styles.letterAvatar,
                {
                  backgroundColor: isDark ? "#381a52" : "#ede9fe",
                },
              ]}
            >
              <Text
                style={[
                  styles.letterText,
                  {
                    color: isDark ? "#ffffff" : "#7c3aed",
                  },
                ]}
              >
                {initial}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[styles.username, { color: usernameColor }]}
          numberOfLines={1}
        >
          {user.username}
        </Text>

        <Text
          style={[styles.category, { color: categoryColor }]}
          numberOfLines={1}
        >
          {user.category || "Suggested for you"}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleToggleFollow}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.followButton,
          isFollowing || isRequested
            ? [
                styles.followingButton,
                {
                  backgroundColor: isDark ? "#231533" : "#f1f5f9",
                  borderColor: isDark ? "#3f245a" : "#cbd5e1",
                },
              ]
            : styles.primaryFollowButton,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          isFollowing ? "Following" : isRequested ? "Requested" : "Follow"
        }
      >
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={isFollowing || isRequested ? "#c084fc" : "#ffffff"}
          />
        ) : (
          <Text
            style={[
              styles.followButtonText,
              {
                color:
                  isFollowing || isRequested
                    ? isDark
                      ? "#c084fc"
                      : "#64748b"
                    : "#ffffff",
              },
            ]}
          >
            {isFollowing ? "Following" : isRequested ? "Requested" : "Follow"}
          </Text>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
  },
  seeAll: {
    fontSize: 13,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  separator: {
    width: 12,
  },
  card: {
    width: 154,
    minHeight: 196,
    padding: 14,
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  profileLink: {
    width: "100%",
    alignItems: "center",
  },
  avatarWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  cardAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 0,
  },
  letterAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  letterText: {
    fontSize: 26,
    fontWeight: "700",
  },
  username: {
    width: "100%",
    marginTop: 10,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
  },
  category: {
    width: "100%",
    marginTop: 2,
    marginBottom: 14,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "500",
  },
  followButton: {
    width: "100%",
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryFollowButton: {
    backgroundColor: "#a855f7",
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  followingButton: {
    borderWidth: 1,
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
});

export default SuggestedUsersCarousel;