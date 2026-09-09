// FILE: mobile/app/app/followers.tsx

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
import { Button } from "../../src/components/ui/Button";
import type { RootState } from "../../src/store/store";

type UserItem = {
  _id: string;
  username: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
};

export default function FollowersScreen() {
  const { id, userId } = useLocalSearchParams<{ id?: string; userId?: string }>();
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const { toast } = useToast();

  const targetUserId = typeof id === "string" ? id : typeof userId === "string" ? userId : authUser?._id;
  const isOwner =
    !!authUser?._id &&
    !!targetUserId &&
    String(authUser._id) === String(targetUserId);

  const [followers, setFollowers] = useState<UserItem[]>([]);
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

  const fetchFollowers = useCallback(
    async (
      pageNum: number,
      searchQuery: string,
      reset = false,
    ) => {
      if (!targetUserId) {
        setFollowers([]);
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
          `/api/users/${targetUserId}/followers`,
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

          setFollowers((previous) =>
            reset ? nextUsers : [...previous, ...nextUsers],
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
            description: "Failed to load followers.",
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

    void fetchFollowers(
      1,
      debouncedSearch,
      true,
    );
  }, [debouncedSearch, fetchFollowers]);

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

    void fetchFollowers(
      nextPage,
      debouncedSearch,
      false,
    );
  };

  const handleRemoveFollower = async (
    followerId: string,
  ) => {
    try {
      const res = await api.delete(
        `/api/users/followers/${followerId}`,
      );

      if (res.data?.success) {
        setFollowers((previous) =>
          previous.filter(
            (item) => item._id !== followerId,
          ),
        );

        toast({
          variant: "success",
          title: "Success",
          description: "Follower removed.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "error",
        title: "Error",
        description:
          error?.response?.data?.message ||
          "Could not remove follower.",
      });
    }
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

        {isOwner && (
          <Button
            variant="ghost"
            size="sm"
            onPress={() =>
              void handleRemoveFollower(
                item._id,
              )
            }
            textStyle={styles.removeText}
          >
            Remove
          </Button>
        )}
      </View>
    );
  };

  if (!targetUserId) {
    return (
      <View style={styles.screen}>
        <View style={styles.emptyContainer}>
          <Users
            size={42}
            color="#64748b"
          />
          <Text style={styles.emptyTitle}>
            Followers unavailable
          </Text>
        </View>
      </View>
    );
  }

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
          Followers
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
          placeholder="Search followers..."
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
      ) : followers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Users
              size={32}
              color="#64748b"
            />
          </View>

          <Text style={styles.emptyTitle}>
            No followers found
          </Text>

          <Text style={styles.emptyDescription}>
            {debouncedSearch
              ? "Try a different search term."
              : "When people follow this account, they'll show up here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={followers}
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
    backgroundColor: "#f8fafc",
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

  removeText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
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