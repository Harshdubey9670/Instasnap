import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Archive,
  BadgeCheck,
  Bookmark,
  Grid,
  Heart,
  Link as LinkIcon,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Pin,
  PlaySquare,
  Send,
  Settings,
  Sparkles,
  Tag,
  type LucideIcon,
} from "lucide-react-native";
import {
  router,

  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { Video, ResizeMode } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";

import api from "../../services/api";
import type { RootState } from "../../store/store";
import { useTheme } from "../../contexts/ThemeContext";
import { useToast } from "../../components/ui/Toast";
import { resolveImageSource } from "../../components/ui/Avatar";
import { EditProfileModal } from "../../components/profile/EditProfileModal";
import { FollowButton } from "../../components/profile/FollowButton";
import { UserOptionsModal } from "../../components/profile/UserOptionsModal";
import { StoryHighlightsRow } from "../../components/profile/StoryHighlightsRow";
import { trackEvent } from "../../utils/analytics";

type ProfileTab = "posts" | "reels" | "tagged" | "saved" | "archive";

interface ProfileMusic {
  title?: string;
}

interface ProfileUser {
  _id: string;
  username?: string;
  fullName?: string;
  avatar?: string;
  profilePicture?: string;
  bio?: string;
  website?: string;
  pronouns?: string;
  category?: string;
  isVerified?: boolean;
  isPrivate?: boolean;
  followers?: unknown[];
  following?: unknown[];
  music?: ProfileMusic;
  [key: string]: unknown;
}

interface PostMedia {
  url?: string;
  type?: string;
}

interface ProfilePost {
  _id: string;
  media?: PostMedia[];
  isPinned?: boolean;
  likes?: unknown[];
  comments?: unknown[];
  settings?: {
    hideLikes?: boolean;
  };
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
}

interface ConversationResponse {
  success?: boolean;
  data?: {
    _id?: string;
  };
}

interface TabDefinition {
  id: ProfileTab;
  label: string;
  icon: LucideIcon;
}

interface SmallActionProps {
  label: string;
  onPress: () => void;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  disabled?: boolean;
}

const PROFILE_SCROLL_KEY = "profile_scroll_pos";

const firstParam = (
  value: string | string[] | undefined,
): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const entityId = (value: unknown): string | undefined => {
  if (typeof value === "string" || typeof value === "number") {
    return value.toString();
  }

  if (value && typeof value === "object") {
    const id = (value as { _id?: unknown })._id;
    if (typeof id === "string" || typeof id === "number") {
      return id.toString();
    }
  }

  return undefined;
};

const includesId = (
  values: unknown[] | undefined,
  targetId: string,
): boolean =>
  Array.isArray(values) &&
  values.some((value) => entityId(value) === targetId);

const SmallAction = ({
  label,
  onPress,
  backgroundColor,
  borderColor,
  textColor,
  disabled = false,
}: SmallActionProps) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.smallAction,
      { backgroundColor, borderColor },
      pressed && !disabled && styles.pressed,
      disabled && styles.disabled,
    ]}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <Text style={[styles.smallActionText, { color: textColor }]}>
      {label}
    </Text>
  </Pressable>
);

export default function ProfilePage() {
  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();
  const routeUserId = firstParam(params.id);
  const authUser = useSelector(
    (state: RootState) => state.auth.user,
  );
  const { showToast } = useToast();
  const { effectiveTheme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const authUserId = authUser?._id?.toString();
  const targetUserId = routeUserId || authUserId;

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isNavigatingToChat, setIsNavigatingToChat] = useState(false);
  const [avatarFailedProxy, setAvatarFailedProxy] = useState(false);

  useEffect(() => {
    setAvatarFailedProxy(false);
  }, [profile?.avatar, profile?.profilePicture]);

  const listRef = useRef<FlatList<ProfilePost>>(null);
  const currentScrollOffset = useRef(0);
  const restoredScrollFor = useRef<string | undefined>(undefined);

  const darkMode = effectiveTheme === "dark";
  const colors = useMemo(
    () => ({
      background: darkMode ? "#0a0510" : "#f8fafc",
      surface: darkMode ? "#130a1c" : "#ffffff",
      surfaceHover: darkMode ? "#1e112c" : "#f1f5f9",
      textPrimary: darkMode ? "#f8fafc" : "#0f172a",
      textSecondary: darkMode ? "#94a3b8" : "#64748b",
      border: darkMode ? "#2d1b3b" : "#e2e8f0",
      primary: "#a855f7",
    }),
    [darkMode],
  );

  const compact = screenWidth < 700;
  const pageWidth = Math.min(screenWidth, 896);
  const horizontalPadding = compact ? 8 : 16;
  const gridGap = compact ? 2 : 12;
  const postSize = Math.max(
    92,
    (pageWidth - horizontalPadding * 2 - gridGap * 2) / 3,
  );

  const fetchProfile = useCallback(async () => {
    if (!targetUserId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await api.get<ApiResponse<ProfileUser>>(
        `/api/users/${targetUserId}`,
      );

      if (response.data.success && response.data.data) {
        const profileData = response.data.data;
        setProfile(profileData);

        if (profileData._id.toString() !== authUserId) {
          trackEvent("profile_visit", profileData._id, {
            username: profileData.username,
          });
        }
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
      showToast("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  }, [authUserId, showToast, targetUserId]);

  const fetchPosts = useCallback(async () => {
    if (!targetUserId) {
      setPosts([]);
      setLoadingPosts(false);
      return;
    }

    setLoadingPosts(true);

    try {
      let endpoint =
        `/api/posts/user/${targetUserId}?status=${
          activeTab === "archive" ? "archived" : "published"
        }`;

      if (activeTab === "saved") {
        endpoint = "/api/users/saved-posts";
      }

      const response = await api.get<ApiResponse<
        ProfilePost[] | { posts?: ProfilePost[] }
      >>(endpoint);

      if (response.data.success) {
        const responseData = response.data.data;
        const fetchedPosts = Array.isArray(responseData)
          ? responseData
          : responseData?.posts || [];

        setPosts(fetchedPosts);
      }
    } catch (error) {
      console.error("Failed to load posts for profile tab", error);
    } finally {
      setLoadingPosts(false);
    }
  }, [activeTab, targetUserId]);

  useFocusEffect(
    useCallback(() => {
      void fetchProfile();
      void fetchPosts();

      const postCreatedSubscription = DeviceEventEmitter.addListener(
        "postCreated",
        () => {
          void fetchPosts();
        },
      );

      return () => {
        postCreatedSubscription.remove();
      };
    }, [fetchPosts, fetchProfile]),
  );

  useEffect(() => {
    if (
      !targetUserId ||
      restoredScrollFor.current === targetUserId
    ) {
      return;
    }

    restoredScrollFor.current = targetUserId;

    const restorePosition = async () => {
      const savedPosition = await AsyncStorage.getItem(
        `${PROFILE_SCROLL_KEY}:${targetUserId}`,
      );
      const offset = Number(savedPosition);

      if (Number.isFinite(offset) && offset > 0) {
        setTimeout(() => {
          listRef.current?.scrollToOffset({
            offset,
            animated: false,
          });
        }, 250);
      }
    };

    void restorePosition();
  }, [targetUserId]);

  const handleChat = useCallback(async () => {
    if (!profile || isNavigatingToChat) {
      return;
    }

    setIsNavigatingToChat(true);

    try {
      const response = await api.post<ConversationResponse>(
        "/api/conversations",
        { userId: profile._id },
      );

      const conversationId = response.data.data?._id;

      if (response.data.success && conversationId) {
        router.push(`/app/chat/${conversationId}`);
      }
    } catch (error) {
      console.error(error);
      showToast("error", "Error", "Failed to start conversation");
    } finally {
      setIsNavigatingToChat(false);
    }
  }, [isNavigatingToChat, profile, showToast]);

  const handleProfileUpdated = useCallback(
    (updatedData: Partial<ProfileUser>) => {
      setProfile((current) =>
        current ? { ...current, ...updatedData } : current,
      );
    },
    [],
  );

  const handleOpenPost = useCallback(
    async (postId: string) => {
      if (targetUserId) {
        await AsyncStorage.setItem(
          `${PROFILE_SCROLL_KEY}:${targetUserId}`,
          currentScrollOffset.current.toString(),
        );
      }

      router.push(`/app/post/${postId}`);
    },
    [targetUserId],
  );

  const openWebsite = useCallback(async (website: string) => {
    const normalized = /^https?:\/\//i.test(website)
      ? website
      : `https://${website}`;

    if (await Linking.canOpenURL(normalized)) {
      await Linking.openURL(normalized);
    }
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingProfile}>
          <View style={styles.loadingAvatar} />
          <View style={styles.loadingDetails}>
            <View style={[styles.loadingLine, styles.loadingLineShort]} />
            <View style={styles.loadingStats}>
              <View style={styles.loadingStat} />
              <View style={styles.loadingStat} />
              <View style={styles.loadingStat} />
            </View>
            <View style={styles.loadingLine} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>Profile not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = profile._id.toString() === authUserId;
  const isFollowing = includesId(
    authUser?.following,
    profile._id.toString(),
  );
  const isLocked = Boolean(
    profile.isPrivate && !isOwner && !isFollowing,
  );

  const tabs: TabDefinition[] = [
    { id: "posts", label: "POSTS", icon: Grid },
    { id: "reels", label: "REELS", icon: PlaySquare },
    { id: "tagged", label: "TAGGED", icon: Tag },
  ];

  if (isOwner) {
    tabs.push(
      { id: "saved", label: "SAVED", icon: Bookmark },
      { id: "archive", label: "ARCHIVE", icon: Archive },
    );
  }

  const displayedPosts = posts.filter((post) =>
    activeTab === "reels"
      ? post.media?.[0]?.type === "video"
      : true,
  );

  const updateFollowerCount = ({
    isFollowing: nextIsFollowing,
  }: {
    isFollowing: boolean;
    isRequested: boolean;
  }) => {
    if (!authUserId) {
      return;
    }

    setProfile((current) => {
      if (!current) {
        return current;
      }

      const currentFollowers = current.followers || [];
      const exists = includesId(currentFollowers, authUserId);
      let nextFollowers = [...currentFollowers];

      if (nextIsFollowing && !exists) {
        nextFollowers.push(authUserId);
      } else if (!nextIsFollowing) {
        nextFollowers = nextFollowers.filter(
          (value) => entityId(value) !== authUserId,
        );
      }

      return { ...current, followers: nextFollowers };
    });
  };

  const profileHeader = (
    <View style={styles.profileHeaderContainer}>
      <View
        style={[
          styles.profileHeader,
          compact && styles.profileHeaderCompact,
        ]}
      >
        <View style={styles.avatarColumn}>
          {profile.music ? (
            <View style={styles.musicBadge}>
              <Music2 size={14} color="#38bdf8" />
              <Text numberOfLines={1} style={styles.musicText}>
                {profile.music.title || "Let Me Love You"}
              </Text>
            </View>
          ) : null}

          <View style={styles.profileAvatar}>
            {profile.avatar || profile.profilePicture ? (
              <Image
                source={
                  resolveImageSource(
                    profile.avatar || profile.profilePicture,
                    avatarFailedProxy,
                  ) || undefined
                }
                style={styles.profileAvatarImage}
                resizeMode="cover"
                onError={() => {
                  if (!avatarFailedProxy) {
                    setAvatarFailedProxy(true);
                  }
                }}
              />
            ) : (
              <View style={[styles.profileAvatarFallback, { backgroundColor: colors.surfaceHover }]}>
                <Text style={[styles.profileAvatarLetter, { color: colors.textPrimary }]}>
                  {profile.username?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            styles.profileDetails,
            compact && styles.profileDetailsCompact,
          ]}
        >
          <View
            style={[
              styles.usernameActions,
              compact && styles.usernameActionsCompact,
            ]}
          >
            <View style={styles.usernameRow}>
              <Text
                numberOfLines={1}
                style={[styles.profileUsername, { color: colors.textPrimary }]}
              >
                {profile.username || "User"}
              </Text>
              {profile.isVerified ? (
                <BadgeCheck size={20} color="#3b82f6" fill="#3b82f6" />
              ) : null}
              {profile.isPrivate ? (
                <Lock size={16} color={colors.textSecondary} />
              ) : null}
            </View>

            <View style={styles.actionsRow}>
              {isOwner ? (
                <>
                  <SmallAction
                    label="Edit profile"
                    onPress={() => setIsEditModalOpen(true)}
                    backgroundColor={colors.surface}
                    borderColor={colors.border}
                    textColor={colors.textPrimary}
                  />
                  <SmallAction
                    label="View archive"
                    onPress={() => router.push("/app/archive")}
                    backgroundColor={colors.surface}
                    borderColor={colors.border}
                    textColor={colors.textPrimary}
                  />
                  <Pressable
                    onPress={() => router.push("/app/settings")}
                    style={[styles.iconButton, { borderColor: colors.border, borderWidth: 1, borderRadius: 9, backgroundColor: colors.surface }]}
                    accessibilityRole="button"
                    accessibilityLabel="Open settings"
                  >
                    <Settings size={18} color={colors.textPrimary} />
                  </Pressable>
                </>
              ) : (
                <>
                  <FollowButton
                    userId={profile._id}
                    targetUser={profile}
                    onToggle={updateFollowerCount}
                  />
                  <SmallAction
                    label="Message"
                    onPress={() => void handleChat()}
                    backgroundColor={colors.surface}
                    borderColor={colors.border}
                    textColor={colors.textPrimary}
                    disabled={isNavigatingToChat}
                  />
                  <Pressable
                    onPress={() => setIsOptionsModalOpen(true)}
                    style={[styles.iconButton, { borderColor: colors.border, borderWidth: 1, borderRadius: 9, backgroundColor: colors.surface }]}
                    accessibilityRole="button"
                    accessibilityLabel="Open profile options"
                  >
                    <MoreHorizontal size={20} color={colors.textPrimary} />
                  </Pressable>
                </>
              )}
            </View>
          </View>

          <View
            style={[
              styles.statsRow,
              { borderColor: colors.border },
            ]}
          >
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.textPrimary }]}>{posts.length} </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>posts</Text>
            </View>
            <Pressable
              onPress={() =>
                router.push(`/app/followers?userId=${profile._id}` as any)
              }
              style={styles.statItem}
            >
              <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
                {profile.followers?.length || 0}{" "}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>followers</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push(`/app/following?userId=${profile._id}` as any)
              }
              style={styles.statItem}
            >
              <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
                {profile.following?.length || 0}{" "}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>following</Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.bioSection,
              compact && styles.bioSectionCompact,
            ]}
          >
            <Text style={[styles.fullName, { color: colors.textPrimary }]}>
              {profile.fullName || profile.username}
              {profile.pronouns ? (
                <Text style={[styles.pronouns, { color: colors.textSecondary }]}>
                  {`  ${profile.pronouns}`}
                </Text>
              ) : null}
            </Text>
            {profile.category ? (
              <Text style={[styles.category, { color: colors.textSecondary }]}>{profile.category}</Text>
            ) : null}
            {profile.bio ? (
              <Text style={[styles.bio, { color: colors.textPrimary }]}>{profile.bio}</Text>
            ) : null}
            {profile.website ? (
              <Pressable
                onPress={() => void openWebsite(profile.website || "")}
                style={styles.websiteRow}
              >
                <LinkIcon size={14} color="#38bdf8" />
                <Text numberOfLines={1} style={styles.websiteText}>
                  @{profile.website.replace(/^https?:\/\//, "")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <StoryHighlightsRow
        userId={profile._id}
        isOwnProfile={isOwner}
      />

      {isLocked ? (
        <View style={[styles.lockedProfile, { borderColor: colors.border }]}>
          <View style={[styles.lockedIcon, { backgroundColor: colors.surfaceHover }]}>
            <Lock size={30} color={colors.textSecondary} />
          </View>
          <Text style={[styles.lockedTitle, { color: colors.textPrimary }]}>This account is private</Text>
          <Text style={[styles.lockedDescription, { color: colors.textSecondary }]}>Follow this account to see their photos and videos.</Text>
        </View>
      ) : (
        <View style={[styles.tabs, { borderColor: colors.border }]}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;

            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tab,
                  {
                    borderTopColor: selected
                      ? colors.textPrimary
                      : "transparent",
                  },
                ]}
              >
                <Icon
                  size={16}
                  color={selected ? colors.textPrimary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: selected ? colors.textPrimary : colors.textSecondary },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderPost = ({ item }: { item: ProfilePost }) => {
    const media = item.media?.[0] || (item.mediaUrl ? { url: item.mediaUrl, type: item.mediaType || "image" } : undefined);
    const resolvedMediaSource = resolveImageSource(media?.url);

    return (
      <Pressable
        onPress={() => void handleOpenPost(item._id)}
        style={[
          styles.postCell,
          {
            width: postSize,
            height: postSize,
            marginRight: gridGap,
            marginBottom: gridGap,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Open post"
      >
        {media?.type === "video" && media.url ? (
          <View style={styles.postMedia}>
            <Image
              source={resolveImageSource(media.url.replace(/\.[^/.]+$/, ".jpg")) || { uri: media.url }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
            <View style={styles.mediaBadge}>
              <PlaySquare size={14} color="#ffffff" />
            </View>
          </View>
        ) : resolvedMediaSource ? (
          <Image
            source={resolvedMediaSource}
            style={styles.postMedia}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noMedia}>
            <Text style={styles.noMediaText}>No media</Text>
          </View>
        )}

        {item.isPinned ? (
          <View style={styles.mediaBadge}>
            <Pin size={14} color="#ffffff" fill="#ffffff" />
          </View>
        ) : item.media && item.media.length > 1 ? (
          <View style={styles.mediaBadge}>
            <Grid size={14} color="#ffffff" />
          </View>
        ) : null}

        <View style={styles.postStats}>
          <View style={styles.postStat}>
            <Heart size={14} color="#ffffff" fill="#ffffff" />
            <Text style={styles.postStatText}>
              {item.settings?.hideLikes ? "-" : item.likes?.length || 0}
            </Text>
          </View>
          <View style={styles.postStat}>
            <MessageCircle size={14} color="#ffffff" fill="#ffffff" />
            <Text style={styles.postStatText}>{item.comments?.length || 0}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.page, { backgroundColor: colors.background }]}>
        <FlatList
          ref={listRef}
          data={isLocked || loadingPosts ? [] : displayedPosts}
          keyExtractor={(item) => item._id}
          renderItem={renderPost}
          numColumns={3}
          ListHeaderComponent={profileHeader}
          columnWrapperStyle={styles.postRow}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: horizontalPadding },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(event) => {
            currentScrollOffset.current =
              event.nativeEvent.contentOffset.y;
          }}
          ListEmptyComponent={
            !isLocked ? (
              loadingPosts ? (
                <View style={styles.postsLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <View style={styles.noPosts}>
                  <View style={styles.noPostsIconCircle}>
                    <Grid size={40} color={colors.textSecondary} />
                  </View>
                  <Text style={[styles.noPostsTitle, { color: colors.textPrimary }]}>No posts yet</Text>
                  <Text style={[styles.noPostsSubtitle, { color: colors.textSecondary }]}>
                    When you share photos and reels, they'll appear on your profile.
                  </Text>
                </View>
              )
            ) : null
          }
          ListFooterComponent={<View style={styles.listFooter} />}
        />

        <Pressable
          onPress={() => router.push("/app/chat")}
          style={styles.floatingFab}
          accessibilityRole="button"
          accessibilityLabel="AI Assistant"
        >
          <Sparkles size={24} color="#ffffff" />
        </Pressable>

        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={profile}
          onProfileUpdated={handleProfileUpdated}
        />

        <UserOptionsModal
          isOpen={isOptionsModalOpen}
          onClose={() => setIsOptionsModalOpen(false)}
          user={profile}
          onActionComplete={() => undefined}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  page: { flex: 1, width: "100%", maxWidth: 896, alignSelf: "center" },
  listContent: { paddingTop: 22 },
  profileHeaderContainer: { width: "100%" },
  profileHeader: { flexDirection: "row", alignItems: "flex-start", gap: 48, paddingHorizontal: 12, paddingBottom: 26 },
  profileHeaderCompact: { flexDirection: "column", alignItems: "center", gap: 14, paddingHorizontal: 12, paddingBottom: 16 },
  avatarColumn: { alignItems: "center", flexShrink: 0 },
  musicBadge: { maxWidth: 150, minHeight: 27, marginBottom: 8, paddingHorizontal: 11, borderRadius: 99, backgroundColor: "rgba(38,38,38,0.94)", borderWidth: 1, borderColor: "#404040", flexDirection: "row", alignItems: "center", gap: 6 },
  musicText: { flexShrink: 1, color: "#e5e5e5", fontSize: 11, fontWeight: "700" },
  profileAvatar: { width: 128, height: 128, borderRadius: 64, borderWidth: 2, borderColor: "#262626", backgroundColor: "#171717", overflow: "hidden", alignItems: "center", justifyContent: "center", shadowColor: "#000000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 10 },
  profileAvatarImage: { width: "100%", height: "100%" },
  profileAvatarFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  profileAvatarLetter: { fontSize: 42, fontWeight: "800" },
  profileDetails: { flex: 1, minWidth: 0, alignItems: "flex-start" },
  profileDetailsCompact: { width: "100%", alignItems: "center" },
  usernameActions: { width: "100%", marginBottom: 16, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12 },
  usernameActionsCompact: { flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 },
  usernameRow: { minWidth: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  profileUsername: { maxWidth: 250, fontSize: 22, fontWeight: "800" },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 8 },
  smallAction: { minHeight: 35, paddingHorizontal: 14, borderWidth: 1, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  smallActionText: { fontSize: 13, fontWeight: "700" },
  iconButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  statsRow: { width: "100%", marginVertical: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-around", borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  statItem: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  statNumber: { fontSize: 15, fontWeight: "800" },
  statLabel: { fontSize: 14, fontWeight: "500" },
  bioSection: { width: "100%", alignItems: "flex-start", gap: 4 },
  bioSectionCompact: { alignItems: "center", paddingHorizontal: 16, marginBottom: 16 },
  fullName: { fontSize: 16, fontWeight: "800", textAlign: "center" },
  pronouns: { fontWeight: "400" },
  category: { fontSize: 13, fontWeight: "600" },
  bio: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  websiteRow: { marginTop: 3, maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: 5 },
  websiteText: { maxWidth: 280, color: "#38bdf8", fontSize: 13, fontWeight: "700" },
  tabs: { minHeight: 55, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "stretch", justifyContent: "center", gap: 18 },
  tab: { minWidth: 48, paddingHorizontal: 8, borderTopWidth: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  tabText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  lockedProfile: { minHeight: 230, borderTopWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", padding: 24 },
  lockedIcon: { width: 64, height: 64, marginBottom: 14, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  lockedTitle: { fontSize: 17, fontWeight: "800" },
  lockedDescription: { marginTop: 6, maxWidth: 310, fontSize: 13, lineHeight: 19, textAlign: "center" },
  postRow: { justifyContent: "flex-start" },
  postCell: { position: "relative", backgroundColor: "#171717", overflow: "hidden" },
  postMedia: { width: "100%", height: "100%" },
  noMedia: { flex: 1, backgroundColor: "#262626", alignItems: "center", justifyContent: "center" },
  noMediaText: { color: "#a3a3a3", fontSize: 12 },
  mediaBadge: { position: "absolute", top: 7, right: 7, width: 25, height: 25, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  postStats: { position: "absolute", left: 0, right: 0, bottom: 0, minHeight: 32, paddingHorizontal: 8, backgroundColor: "rgba(0,0,0,0.50)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  postStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  postStatText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  postsLoading: { minHeight: 230, alignItems: "center", justifyContent: "center" },
  noPosts: { minHeight: 220, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 32 },
  noPostsIconCircle: { width: 68, height: 68, borderRadius: 34, borderWidth: 1.5, borderColor: "#333333", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  noPostsTitle: { fontSize: 17, fontWeight: "700" },
  noPostsSubtitle: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  listFooter: { height: 110 },
  floatingFab: { position: "absolute", right: 20, bottom: 24, width: 54, height: 54, borderRadius: 27, backgroundColor: "#a855f7", alignItems: "center", justifyContent: "center", shadowColor: "#a855f7", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 10 },
  loadingProfile: { width: "100%", maxWidth: 896, alignSelf: "center", padding: 24, flexDirection: "row", alignItems: "center", gap: 40 },
  loadingAvatar: { width: 138, height: 138, borderRadius: 69, backgroundColor: "#262626" },
  loadingDetails: { flex: 1, gap: 16 },
  loadingLine: { width: "70%", height: 15, borderRadius: 8, backgroundColor: "#262626" },
  loadingLineShort: { width: "35%", height: 28 },
  loadingStats: { flexDirection: "row", gap: 24 },
  loadingStat: { width: 64, height: 15, borderRadius: 8, backgroundColor: "#262626" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 16 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
});
