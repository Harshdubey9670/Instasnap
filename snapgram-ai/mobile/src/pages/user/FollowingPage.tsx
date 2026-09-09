import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ArrowLeft,
  Search,
  Users,
  X,
} from "lucide-react-native";
import {
  router,

  useLocalSearchParams,
} from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector } from "react-redux";

import api from "../../services/api";
import type { RootState } from "../../store/store";
import { useTheme } from "../../contexts/ThemeContext";
import { Avatar } from "../../components/ui/Avatar";
import { FollowButton } from "../../components/profile/FollowButton";
import { useToast } from "../../components/ui/Toast";

interface FollowingUser {
  _id: string;
  username?: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
}

interface FollowingResponse {
  success: boolean;
  data: FollowingUser[];
  pagination?: {
    hasMore?: boolean;
  };
}

const firstParam = (
  value: string | string[] | undefined,
): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export default function FollowingPage() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    userId?: string | string[];
  }>();
  const authUser = useSelector(
    (state: RootState) => state.auth.user,
  );
  const targetUserId = firstParam(params.id) || firstParam(params.userId) || authUser?._id;
  const { toast } = useToast();
  const { effectiveTheme } = useTheme();

  const [following, setFollowing] =
    useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] =
    useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);

  const darkMode = effectiveTheme === "dark";
  const background = darkMode ? "#0a0510" : "#f8fafc";
  const surface = darkMode ? "#130a1c" : "#ffffff";
  const surfaceHover = darkMode ? "#1e112c" : "#f1f5f9";
  const textPrimary = darkMode ? "#f8fafc" : "#0f172a";
  const textSecondary = darkMode ? "#94a3b8" : "#64748b";
  const border = darkMode ? "#2d1b3b" : "#e2e8f0";
  const authUserId = authUser?._id?.toString();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  const fetchFollowing = useCallback(
    async (
      pageNumber: number,
      searchQuery: string,
      reset = false,
    ) => {
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      const requestId = ++requestIdRef.current;

      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await api.get<FollowingResponse>(
          `/api/users/${targetUserId}/following`,
          {
            params: {
              page: pageNumber,
              limit: 15,
              search: searchQuery,
            },
          },
        );

        if (
          response.data.success &&
          (pageNumber !== 1 || requestId === requestIdRef.current)
        ) {
          const received = Array.isArray(response.data.data)
            ? response.data.data
            : [];

          setFollowing((current) =>
            reset ? received : [...current, ...received],
          );
          setHasMore(response.data.pagination?.hasMore ?? false);
        }
      } catch {
        toast({
          variant: "error",
          title: "Error",
          description: "Failed to load following list",
        });
      } finally {
        if (pageNumber === 1) {
          setLoading(false);
        } else {
          setLoadingMore(false);
          loadingMoreRef.current = false;
        }
      }
    },
    [targetUserId, toast],
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    void fetchFollowing(1, debouncedSearch, true);
  }, [debouncedSearch, fetchFollowing]);

  const handleLoadMore = useCallback(() => {
    if (
      loading ||
      loadingMore ||
      loadingMoreRef.current ||
      !hasMore
    ) {
      return;
    }

    const nextPage = page + 1;
    loadingMoreRef.current = true;
    setPage(nextPage);
    void fetchFollowing(nextPage, debouncedSearch, false);
  }, [
    debouncedSearch,
    fetchFollowing,
    hasMore,
    loading,
    loadingMore,
    page,
  ]);

  const renderFollowing = useCallback(
    ({ item }: { item: FollowingUser }) => (
      <View style={[styles.row, { borderColor: border }]}>
        <Pressable
          onPress={() =>
            router.push(`/app/profile/${item._id}`)
          }
          style={({ pressed }) => [
            styles.profileLink,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.username || "user"} profile`}
        >
          <LinearGradient
            colors={["#ec4899", "#a855f7", "#facc15"]}
            style={styles.avatarRing}
          >
            <View style={[styles.avatarBorder, { borderColor: surface }]}>
              <Avatar
                src={item.profilePicture || item.avatar}
                fallback={item.username?.charAt(0).toUpperCase() || "U"}
                size="md"
              />
            </View>
          </LinearGradient>

          <View style={styles.userText}>
            <Text
              numberOfLines={1}
              style={[styles.username, { color: textPrimary }]}
            >
              {item.username || "User"}
            </Text>
            {item.fullName ? (
              <Text
                numberOfLines={1}
                style={[styles.fullName, { color: textSecondary }]}
              >
                {item.fullName}
              </Text>
            ) : null}
          </View>
        </Pressable>

        {authUserId !== item._id.toString() ? (
          <View style={styles.followButton}>
            <FollowButton userId={item._id} targetUser={item} />
          </View>
        ) : null}
      </View>
    ),
    [
      authUserId,
      border,
      surface,
      textPrimary,
      textSecondary,
    ],
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]}>
      <View style={[styles.page, { backgroundColor: background }]}>
        <View
          style={[
            styles.header,
            { backgroundColor: surface, borderColor: border },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={24} color={textSecondary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Following</Text>
          <View style={styles.headerButton} />
        </View>

        <View
          style={[
            styles.searchContainer,
            { backgroundColor: surface, borderColor: border },
          ]}
        >
          <Search size={20} color={textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search following..."
            placeholderTextColor={textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.searchInput, { color: textPrimary }]}
          />
          {search ? (
            <Pressable
              onPress={() => setSearch("")}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={10}
            >
              <X size={18} color={textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#a855f7" />
          </View>
        ) : (
          <FlatList
            data={following}
            keyExtractor={(item) => item._id}
            renderItem={renderFollowing}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.35}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.listContent,
              following.length === 0 && styles.emptyList,
            ]}
            ListEmptyComponent={
              <View
                style={[
                  styles.emptyState,
                  { backgroundColor: surface, borderColor: border },
                ]}
              >
                <View
                  style={[
                    styles.emptyIcon,
                    { backgroundColor: surfaceHover },
                  ]}
                >
                  <Users size={32} color={textSecondary} />
                </View>
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>No users found</Text>
                <Text style={[styles.emptyDescription, { color: textSecondary }]}>
                  {debouncedSearch
                    ? "Try a different search term."
                    : "This account is not following anyone yet."}
                </Text>
              </View>
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#a855f7" />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  page: { flex: 1, width: "100%", maxWidth: 672, alignSelf: "center", paddingHorizontal: 16 },
  header: { height: 58, marginTop: 8, marginBottom: 18, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12 },
  headerButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800" },
  searchContainer: { height: 50, marginBottom: 18, paddingHorizontal: 14, borderWidth: 1, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  searchInput: { flex: 1, height: "100%", fontSize: 15 },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingBottom: 96, borderRadius: 16, overflow: "hidden" },
  emptyList: { flexGrow: 1 },
  row: { minHeight: 72, paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", gap: 10 },
  profileLink: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 12 },
  avatarRing: { width: 52, height: 52, borderRadius: 26, padding: 2, alignItems: "center", justifyContent: "center" },
  avatarBorder: { width: "100%", height: "100%", borderRadius: 24, borderWidth: 2, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  userText: { flex: 1, minWidth: 0 },
  username: { fontSize: 14, fontWeight: "700" },
  fullName: { marginTop: 2, fontSize: 13 },
  followButton: { marginLeft: 8 },
  emptyState: { flex: 1, minHeight: 350, padding: 24, borderWidth: 1, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  emptyIcon: { width: 64, height: 64, marginBottom: 14, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 19, fontWeight: "700", textAlign: "center" },
  emptyDescription: { marginTop: 7, fontSize: 14, lineHeight: 20, textAlign: "center" },
  footerLoader: { paddingVertical: 18, alignItems: "center" },
  pressed: { opacity: 0.72 },
});
