// FILE: mobile/app/app/following.tsx

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Search, Users, X } from "lucide-react-native";
import { useSelector } from "react-redux";

import api from "../../src/services/api";
import { useToast } from "../../src/components/ui/Toast";
import { Avatar } from "../../src/components/ui/Avatar";
import { FollowButton } from "../../src/components/profile/FollowButton";
import type { RootState } from "../../src/store/store";

type UserItem = {
  _id: string;
  username: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
};

export default function FollowingScreen() {
  const { id, userId } = useLocalSearchParams<{ id?: string; userId?: string }>();
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const { toast } = useToast();

  const targetUserId = typeof id === "string" ? id : typeof userId === "string" ? userId : authUser?._id;

  const [following, setFollowing] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const requestIdRef = useRef(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  const fetchFollowing = useCallback(
    async (
      pageNum: number,
      searchQuery: string,
      reset = false,
    ) => {
      if (!targetUserId) {
        setFollowing([]);
        setLoading(false);
        return;
      }

      const requestId = ++requestIdRef.current;

      try {
        if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const res = await api.get(
          `/api/users/${targetUserId}/following`,
          {
            params: {
              page: pageNum,
              limit: 15,
              search: searchQuery,
            },
          },
        );

        if (requestId !== requestIdRef.current) {
          return;
        }

        if (res.data?.success) {
          const nextUsers: UserItem[] =
            Array.isArray(res.data.data)
              ? res.data.data
              : [];

          setFollowing((previous) =>
            reset
              ? nextUsers
              : [...previous, ...nextUsers],
          );

          setHasMore(
            Boolean(res.data?.pagination?.hasMore),
          );
        }
      } catch {
        if (requestId === requestIdRef.current) {
          toast({
            variant: "error",
            title: "Error",
            description: "Failed to load following list.",
          });
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [targetUserId, toast],
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);

    void fetchFollowing(
      1,
      debouncedSearch,
      true,
    );
  }, [debouncedSearch, fetchFollowing]);

  const loadMore = () => {
    if (
      loading ||
      loadingMore ||
      !hasMore
    ) {
      return;
    }

    const nextPage = page + 1;
    setPage(nextPage);

    void fetchFollowing(
      nextPage,
      debouncedSearch,
      false,
    );
  };

  const renderItem = ({
    item,
  }: {
    item: UserItem;
  }) => {
    return (
      <View style={styles.userRow}>
        <Pressable
          style={styles.userMain}
          onPress={() =>
            router.push(
              `/app/profile/${item._id}`,
            )
          }
        >
          <View style={styles.avatarRing}>
            <Avatar
              src={
                item.profilePicture ||
                item.avatar
              }
              fallback={
                item.username
                  ?.charAt(0)
                  .toUpperCase() || "U"
              }
              style={styles.avatar}
            />
          </View>

          <View style={styles.userText}>
            <Text
              style={styles.username}
              numberOfLines={1}
            >
              {item.username}
            </Text>

            {!!item.fullName && (
              <Text
                style={styles.fullName}
                numberOfLines={1}
              >
                {item.fullName}
              </Text>
            )}
          </View>
        </Pressable>

        {authUser?._id &&
          String(authUser._id) !==
            String(item._id) && (
            <View style={styles.followWrap}>
              <FollowButton
                userId={item._id}
              />
            </View>
          )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <ArrowLeft
            size={24}
            color="#0f172a"
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Following
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchWrap}>
        <Search
          size={20}
          color="#64748b"
          style={styles.searchIcon}
        />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search following..."
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />

        {!!search && (
          <Pressable
            onPress={() => setSearch("")}
            style={styles.clearButton}
          >
            <X
              size={18}
              color="#64748b"
            />
          </Pressable>
        )}
      </View>

      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#a855f7"
          />
        </View>
      ) : following.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Users
              size={32}
              color="#64748b"
            />
          </View>

          <Text style={styles.emptyTitle}>
            No users found
          </Text>

          <Text style={styles.emptyDescription}>
            {debouncedSearch
              ? "Try a different search term."
              : "This account is not following anyone yet."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={following}
          keyExtractor={(item) =>
            String(item._id)
          }
          renderItem={renderItem}
          contentContainerStyle={
            styles.listContent
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator
                  size="small"
                  color="#a855f7"
                />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  header: {
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },

  headerSpacer: {
    width: 40,
  },

  searchWrap: {
    marginHorizontal: 16,
    marginVertical: 16,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "center",
  },

  searchIcon: {
    position: "absolute",
    left: 14,
  },

  searchInput: {
    flex: 1,
    paddingLeft: 46,
    paddingRight: 46,
    fontSize: 14,
    color: "#0f172a",
  },

  clearButton: {
    position: "absolute",
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },

  userRow: {
    minHeight: 74,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  userMain: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    backgroundColor: "#a855f7",
    marginRight: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#ffffff",
  },

  userText: {
    flex: 1,
    minWidth: 0,
  },

  username: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },

  fullName: {
    marginTop: 3,
    fontSize: 13,
    color: "#64748b",
  },

  followWrap: {
    marginLeft: 8,
    maxWidth: 120,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#eef2f7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },

  emptyDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#64748b",
    textAlign: "center",
  },
});