
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  Archive,
  ArchiveRestore,
  BadgeCheck,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  Heart,
  MapPin,
  MoreHorizontal,
  Send,
  Share2,
  Smile,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react-native";
import {
  Video,
  ResizeMode,
} from "expo-av";
import * as Clipboard from "expo-clipboard";
import {
  useSelector,
} from "react-redux";

import api from "../../src/services/api";
import {
  useToast,
} from "../../src/components/ui/Toast";
import {
  Avatar,
} from "../../src/components/ui/Avatar";
import {
  Button,
} from "../../src/components/ui/Button";
import type {
  RootState,
} from "../../src/store/store";

type MediaItem = {
  url?: string;
  type?: string;
};

type PostUser = {
  _id?: string;
  username?: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
  isVerified?: boolean;
  [key: string]: any;
};

type CommentUser = {
  _id?: string;
  username?: string;
  profilePicture?: string;
  avatar?: string;
};

type CommentItem = {
  _id: string;
  text?: string;
  user?: CommentUser;
};

type Post = {
  _id: string;
  user?: PostUser | string;
  caption?: string;
  location?: string;
  status?: string;
  isLiked?: boolean;
  isSaved?: boolean;
  likesCount?: number;
  likes?: Array<string | { _id: string }>;
  media?: MediaItem[];
  mediaUrl?: string;
  mediaType?: string;
};

type EditPost = {
  _id: string;
  caption?: string;
  location?: string;
};

type RouteParams = {
  id?: string;
  source?: string;
  userId?: string;
};

const EMOJIS = [
  "❤️",
  "😂",
  "😮",
  "😢",
  "🔥",
  "👍",
  "😍",
  "👏",
  "🎉",
  "✨",
  "💯",
  "🥰",
];

export default function PostDetailScreen() {
  const params =
    useLocalSearchParams<RouteParams>();

  const targetPostId =
    typeof params.id === "string"
      ? params.id
      : "";

  const originSource =
    typeof params.source === "string"
      ? params.source
      : "explore";

  const originUserId =
    typeof params.userId === "string"
      ? params.userId
      : undefined;

  const {
    user: authUser,
  } = useSelector(
    (state: RootState) =>
      state.auth,
  );

  const { showToast } =
    useToast();

  const [
    targetPost,
    setTargetPost,
  ] = useState<Post | null>(
    null,
  );

  const [
    targetLoading,
    setTargetLoading,
  ] = useState(true);

  const [
    feedPosts,
    setFeedPosts,
  ] = useState<Post[]>([]);

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    hasMore,
    setHasMore,
  ] = useState(true);

  const [
    feedLoading,
    setFeedLoading,
  ] = useState(false);

  const [
    editingPost,
    setEditingPost,
  ] = useState<EditPost | null>(
    null,
  );

  const [
    editCaption,
    setEditCaption,
  ] = useState("");

  const [
    editLocation,
    setEditLocation,
  ] = useState("");

  const [
    isUpdatingPost,
    setIsUpdatingPost,
  ] = useState(false);

  const [
    sharePost,
    setSharePost,
  ] = useState<Post | null>(
    null,
  );

  const [
    copiedLink,
    setCopiedLink,
  ] = useState(false);

  const [
    shareLoading,
    setShareLoading,
  ] = useState(false);

  const [
    emojiTarget,
    setEmojiTarget,
  ] = useState<string | null>(
    null,
  );

  const prefetchedCacheRef =
    useRef<
      Record<
        number,
        Post[]
      >
    >({});

  const [
    isLoadingTargetError,
    setIsLoadingTargetError,
  ] = useState(false);

  const fetchTargetPost =
    useCallback(
      async () => {
        if (!targetPostId) {
          setTargetLoading(false);
          return;
        }

        try {
          setTargetLoading(
            true,
          );
          setIsLoadingTargetError(
            false,
          );

          const response =
            await api.get(
              `/api/posts/${targetPostId}`,
            );

          if (
            response.data
              ?.success
          ) {
            setTargetPost(
              response.data
                .data,
            );
          }
        } catch (error) {
          console.error(
            "Failed to load post:",
            error,
          );

          setIsLoadingTargetError(
            true,
          );

          showToast("error", "Error", "Failed to load post details.");
        } finally {
          setTargetLoading(
            false,
          );
        }
      },
      [
        showToast,
        targetPostId,
      ],
    );

  const fetchMorePosts =
    useCallback(
      async (
        pageNumber: number,
        reset = false,
      ) => {
        try {
          setFeedLoading(
            true,
          );

          let endpoint =
            "/api/posts/explore";

          if (
            originSource ===
              "profile" &&
            originUserId
          ) {
            endpoint = `/api/posts/user/${originUserId}`;
          } else if (
            originSource ===
            "feed"
          ) {
            endpoint =
              "/api/posts/feed";
          }

          let fetched: Post[] =
            prefetchedCacheRef.current[
              pageNumber
            ] || [];

          if (
            !prefetchedCacheRef.current[
              pageNumber
            ]
          ) {
            const response =
              await api.get(
                endpoint,
                {
                  params: {
                    page:
                      pageNumber,
                    limit: 6,
                  },
                },
              );

            if (
              response.data
                ?.success
            ) {
              fetched =
                response.data
                  ?.data
                  ?.posts ||
                response.data
                  ?.data ||
                [];
            }
          }

          const filtered =
            fetched.filter(
              (post) =>
                post._id !==
                targetPostId,
            );

          setFeedPosts(
            (previous) =>
              reset
                ? filtered
                : [
                    ...previous,
                    ...filtered,
                  ],
          );

          if (
            fetched.length <
            6
          ) {
            setHasMore(
              false,
            );
          }

          /*
           * Prefetch the next page.
           * We deliberately use the same endpoint contract as the
           * original web page.
           */
          const nextPage =
            pageNumber + 1;

          if (
            !prefetchedCacheRef
              .current[
              nextPage
            ]
          ) {
            try {
              const nextResponse =
                await api.get(
                  endpoint,
                  {
                    params: {
                      page:
                        nextPage,
                      limit: 6,
                    },
                  },
                );

              if (
                nextResponse
                  .data
                  ?.success
              ) {
                prefetchedCacheRef.current[
                  nextPage
                ] =
                  nextResponse
                    .data
                    ?.data
                    ?.posts ||
                  nextResponse
                    .data
                    ?.data ||
                  [];
              }
            } catch {
              // Prefetch failure must not block the current page.
            }
          }
        } catch (error) {
          console.error(
            "Failed to load related posts:",
            error,
          );
        } finally {
          setFeedLoading(
            false,
          );
        }
      },
      [
        originSource,
        originUserId,
        targetPostId,
      ],
    );

  useEffect(() => {
    setFeedPosts([]);
    setPage(1);
    setHasMore(true);
    prefetchedCacheRef.current =
      {};

    void fetchTargetPost();
    void fetchMorePosts(
      1,
      true,
    );
  }, [
    targetPostId,
    originSource,
    originUserId,
    fetchTargetPost,
    fetchMorePosts,
  ]);

  const loadMore =
    useCallback(
      async () => {
        if (
          feedLoading ||
          !hasMore
        ) {
          return;
        }

        const nextPage =
          page + 1;

        setPage(
          nextPage,
        );

        await fetchMorePosts(
          nextPage,
          false,
        );
      },
      [
        feedLoading,
        fetchMorePosts,
        hasMore,
        page,
      ],
    );

  const handleToggleArchive =
    async (
      postItem: Post,
    ) => {
      try {
        const response =
          await api.put(
            `/api/posts/${postItem._id}/archive`,
          );

        if (
          response.data
            ?.success
        ) {
          const nextStatus =
            response.data
              ?.data
              ?.status;

          const archived =
            nextStatus ===
            "archived";

          showToast("success", "");

          if (
            targetPost?._id ===
            postItem._id
          ) {
            setTargetPost(
              (
                previous,
              ) =>
                previous
                  ? {
                      ...previous,
                      status:
                        nextStatus,
                    }
                  : previous,
            );
          }

          setFeedPosts(
            (previous) =>
              previous.map(
                (
                  post,
                ) =>
                  post._id ===
                  postItem._id
                    ? {
                        ...post,
                        status:
                          nextStatus,
                      }
                    : post,
              ),
          );
        }
      } catch {
        showToast("error", "Failed to archive post");
      }
    };

  const handleDeletePost =
    async (
      postId: string,
    ) => {
      Alert.alert(
        "Delete Post",
        "Are you sure you want to permanently delete this post?",
        [
          {
            text: "Cancel",
            style:
              "cancel",
          },
          {
            text: "Delete",
            style:
              "destructive",
            onPress:
              async () => {
                try {
                  const response =
                    await api.delete(
                      `/api/posts/${postId}`,
                    );

                  if (
                    response.data
                      ?.success
                  ) {
                    showToast("success", "Post Deleted", "Removed from Database, Feed, and Profile.");

                    if (
                      targetPost?._id ===
                      postId
                    ) {
                      router.back();
                    } else {
                      setFeedPosts(
                        (
                          previous,
                        ) =>
                          previous.filter(
                            (
                              post,
                            ) =>
                              post._id !==
                              postId,
                          ),
                      );
                    }
                  }
                } catch {
                  showToast("error", "Delete Failed");
                }
              },
          },
        ],
      );
    };

  const openEdit =
    (post: Post) => {
      setEditingPost(
        post,
      );
      setEditCaption(
        post.caption ||
          "",
      );
      setEditLocation(
        post.location ||
          "",
      );
    };

  const handleSaveEdit =
    async () => {
      if (
        !editingPost
      ) {
        return;
      }

      setIsUpdatingPost(
        true,
      );

      try {
        const response =
          await api.put(
            `/api/posts/${editingPost._id}`,
            {
              caption:
                editCaption,
              location:
                editLocation,
            },
          );

        if (
          response.data
            ?.success
        ) {
          const updated =
            response.data
              ?.data;

          showToast("success", "Post Updated");

          if (
            targetPost?._id ===
            editingPost._id
          ) {
            setTargetPost(
              (
                previous,
              ) =>
                previous
                  ? {
                      ...previous,
                      caption:
                        updated.caption,
                      location:
                        updated.location,
                    }
                  : previous,
            );
          }

          setFeedPosts(
            (previous) =>
              previous.map(
                (
                  post,
                ) =>
                  post._id ===
                  editingPost._id
                    ? {
                        ...post,
                        caption:
                          updated.caption,
                        location:
                          updated.location,
                      }
                    : post,
              ),
          );

          setEditingPost(
            null,
          );
        }
      } catch {
        showToast("error", "Failed to update post");
      } finally {
        setIsUpdatingPost(
          false,
        );
      }
    };

  const handleCopyLink =
    async (
      post: Post,
    ) => {
      const link =
        `https://snapgram.ai/app/post/${post._id}`;

      try {
        await Clipboard.setStringAsync(
          link,
        );

        setCopiedLink(
          true,
        );

        showToast("success", "Link Copied");

        setTimeout(
          () =>
            setCopiedLink(
              false,
            ),
          2000,
        );
      } catch {
        showToast("error", "Copy Failed");
      }
    };

  const handleNativeShare =
    async (
      post: Post,
    ) => {
      try {
        setShareLoading(
          true,
        );

        await Share.share(
          {
            message:
              `Check out this post on SnapGram: https://snapgram.ai/app/post/${post._id}`,
            url: `https://snapgram.ai/app/post/${post._id}`,
          },
        );
      } catch (error) {
        console.error(
          "Share failed:",
          error,
        );
      } finally {
        setShareLoading(
          false,
        );
      }
    };

  const handleSendToChat =
    () => {
      setSharePost(
        null,
      );

      router.push(
        "/app/chat",
      );

      showToast("info", "Select chat partner", "Send this post from Direct Chat.");
    };

  const openEmojiPicker =
    (
      postId: string,
    ) => {
      setEmojiTarget(
        (current) =>
          current ===
          postId
            ? null
            : postId,
      );
    };

  if (
    targetLoading
  ) {
    return (
      <View
        style={
          styles.loadingScreen
        }
      >
        <ActivityIndicator
          size="large"
          color="#a855f7"
        />
      </View>
    );
  }

  if (
    isLoadingTargetError ||
    !targetPost
  ) {
    return (
      <View
        style={
          styles.errorScreen
        }
      >
        <Text
          style={
            styles.errorTitle
          }
        >
          Post not found
        </Text>

        <Text
          style={
            styles.errorDescription
          }
        >
          This post could not be loaded
          or may have been removed.
        </Text>

        <Button
          variant="gradient"
          onPress={() =>
            router.back()
          }
        >
          Go Back
        </Button>
      </View>
    );
  }

  const allPosts =
    [
      targetPost,
      ...feedPosts,
    ];

  return (
    <View
      style={
        styles.screen
      }
    >
      <FlatList
        data={
          allPosts
        }
        keyExtractor={(
          item,
          index,
        ) =>
          `${item._id}-${index}`
        }
        renderItem={({
          item,
          index,
        }) => (
          <View>
            {index ===
              1 && (
              <View
                style={
                  styles.moreHeader
                }
              >
                <View
                  style={
                    styles.moreTitleRow
                  }
                >
                  <Sparkles
                    size={19}
                    color="#a855f7"
                  />

                  <Text
                    style={
                      styles.moreTitle
                    }
                  >
                    More from{" "}
                    {originSource ===
                    "profile"
                      ? "this Creator"
                      : "Feed"}
                  </Text>
                </View>

                <Text
                  style={
                    styles.moreDescription
                  }
                >
                  Keep scrolling to view
                  more posts without going
                  back.
                </Text>
              </View>
            )}

            <PostCard
              post={item}
              authUser={
                authUser
              }
              isMain={
                index === 0
              }
              onArchive={
                handleToggleArchive
              }
              onDelete={
                handleDeletePost
              }
              onEdit={
                openEdit
              }
              onShare={
                setSharePost
              }
              onEmoji={
                openEmojiPicker
              }
              emojiOpen={
                emojiTarget ===
                item._id
              }
            />
          </View>
        )}
        onEndReached={
          loadMore
        }
        onEndReachedThreshold={
          0.6
        }
        ListHeaderComponent={
          <View
            style={
              styles.header
            }
          >
            <Pressable
              onPress={() =>
                router.back()
              }
              style={
                styles.backButton
              }
              hitSlop={8}
            >
              <ChevronLeft
                size={23}
                color="#0f172a"
              />
            </Pressable>

            <Text
              style={
                styles.headerTitle
              }
            >
              {originSource ===
              "profile"
                ? "Profile Posts"
                : "Explore Post"}
            </Text>

            <View
              style={
                styles.headerSpacer
              }
            />
          </View>
        }
        ListFooterComponent={
          feedLoading ? (
            <View
              style={
                styles.footerLoader
              }
            >
              <ActivityIndicator
                size="small"
                color="#a855f7"
              />
            </View>
          ) : !hasMore &&
            feedPosts.length >
              0 ? (
            <View
              style={
                styles.endMessage
              }
            >
              <Text
                style={
                  styles.endMessageText
                }
              >
                You've reached the end.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={
          styles.listContent
        }
        showsVerticalScrollIndicator={
          false
        }
      />

      {editingPost ? (
        <EditPostModal
          caption={
            editCaption
          }
          location={
            editLocation
          }
          saving={
            isUpdatingPost
          }
          onChangeCaption={
            setEditCaption
          }
          onChangeLocation={
            setEditLocation
          }
          onClose={() =>
            setEditingPost(
              null,
            )
          }
          onSave={() =>
            void handleSaveEdit()
          }
        />
      ) : null}

      {sharePost ? (
        <ShareModal
          post={sharePost}
          copied={
            copiedLink
          }
          loading={
            shareLoading
          }
          onClose={() =>
            setSharePost(
              null,
            )
          }
          onCopy={() =>
            void handleCopyLink(
              sharePost,
            )
          }
          onNativeShare={() =>
            void handleNativeShare(
              sharePost,
            )
          }
          onSendToChat={
            handleSendToChat
          }
        />
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Post Card                                                                  */
/* -------------------------------------------------------------------------- */

interface PostCardProps {
  post: Post;
  authUser: any;
  isMain: boolean;
  onArchive: (
    post: Post,
  ) => void;
  onDelete: (
    id: string,
  ) => void;
  onEdit: (
    post: Post,
  ) => void;
  onShare: (
    post: Post,
  ) => void;
  onEmoji: (
    id: string,
  ) => void;
  emojiOpen: boolean;
}

function PostCard({
  post,
  authUser,
  isMain,
  onArchive,
  onDelete,
  onEdit,
  onShare,
  onEmoji,
  emojiOpen,
}: PostCardProps) {
  const { toast } =
    useToast();

  const user =
    typeof post.user ===
    "object"
      ? post.user
      : null;

  const isOwner =
    Boolean(
      authUser?._id &&
        (authUser._id ===
          user?._id ||
          authUser._id ===
            post.user),
    );

  const isArchived =
    post.status ===
    "archived";

  const [
    liked,
    setLiked,
  ] = useState(
    Boolean(
      post.isLiked,
    ),
  );

  const [
    likesCount,
    setLikesCount,
  ] = useState(
    post.likesCount ??
      post.likes?.length ??
      0,
  );

  const [
    saved,
    setSaved,
  ] = useState(
    Boolean(
      post.isSaved,
    ),
  );

  const [
    comments,
    setComments,
  ] = useState<
    CommentItem[]
  >([]);

  const [
    newComment,
    setNewComment,
  ] = useState("");

  const [
    activeMediaIndex,
    setActiveMediaIndex,
  ] = useState(0);

  const [
    showMenu,
    setShowMenu,
  ] = useState(false);

  const mediaList =
    post.media &&
    post.media.length >
      0
      ? post.media
      : [
          {
            url:
              post.mediaUrl,
            type:
              post.mediaType ||
              "image",
          },
        ];

  useEffect(() => {
    const fetchComments =
      async () => {
        try {
          const response =
            await api.get(
              `/api/posts/${post._id}/comments`,
            );

          if (
            response.data
              ?.success
          ) {
            setComments(
              response.data
                .data || [],
            );
          }
        } catch {
          // Keep the post usable when comments fail.
        }
      };

    void fetchComments();
  }, [post._id]);

  const handleLike =
    async () => {
      const nextLiked =
        !liked;

      setLiked(
        nextLiked,
      );

      setLikesCount(
        (current) =>
          nextLiked
            ? current + 1
            : Math.max(
                0,
                current - 1,
              ),
      );

      try {
        await api.post(
          `/api/posts/${post._id}/like`,
        );
      } catch {
        setLiked(
          !nextLiked,
        );

        setLikesCount(
          (current) =>
            nextLiked
              ? Math.max(
                  0,
                  current - 1,
                )
              : current + 1,
        );
      }
    };

  const handleSave =
    async () => {
      const nextSaved =
        !saved;

      setSaved(
        nextSaved,
      );

      try {
        await api.post(
          `/api/posts/${post._id}/save`,
        );

        toast({
          variant:
            "success",
          title:
            nextSaved
              ? "Saved to Bookmarks"
              : "Removed from Bookmarks",
        });
      } catch {
        setSaved(
          !nextSaved,
        );
      }
    };

  const handleAddComment =
    async () => {
      const text =
        newComment.trim();

      if (!text) {
        return;
      }

      setNewComment(
        "",
      );

      try {
        const response =
          await api.post(
            `/api/posts/${post._id}/comments`,
            {
              text,
            },
          );

        if (
          response.data
            ?.success
        ) {
          setComments(
            (
              previous,
            ) => [
              response.data
                .data,
              ...previous,
            ],
          );
        }
      } catch {
        toast({
          variant:
            "error",
          title:
            "Failed to add comment",
        });

        setNewComment(
          text,
        );
      }
    };

  return (
    <View
      style={[
        styles.postCard,
        isMain &&
          styles.mainPostCard,
      ]}
    >
      {/* Author Header */}
      <View
        style={
          styles.authorHeader
        }
      >
        <Pressable
          onPress={() => {
            if (user?._id) {
              router.push(
                `/app/profile/${user._id}`,
              );
            }
          }}
          style={
            styles.authorLink
          }
        >
          <Avatar
            src={
              user?.profilePicture ||
              user?.avatar
            }
            fallback={
              user?.username?.charAt(
                0,
              ) || "U"
            }
            style={
              styles.authorAvatar
            }
          />

          <View
            style={
              styles.authorText
            }
          >
            <View
              style={
                styles.usernameRow
              }
            >
              <Text
                style={
                  styles.username
                }
              >
                @
                {user?.username ||
                  "user"}
              </Text>

              {user?.isVerified ? (
                <BadgeCheck
                  size={15}
                  color="#3b82f6"
                  fill="#dbeafe"
                />
              ) : null}
            </View>

            {post.location ? (
              <View
                style={
                  styles.locationRow
                }
              >
                <MapPin
                  size={12}
                  color="#a855f7"
                />

                <Text
                  style={
                    styles.locationText
                  }
                  numberOfLines={
                    1
                  }
                >
                  {
                    post.location
                  }
                </Text>
              </View>
            ) : null}
          </View>
        </Pressable>

        <View
          style={
            styles.menuContainer
          }
        >
          <Pressable
            onPress={() =>
              setShowMenu(
                (value) =>
                  !value,
              )
            }
            style={
              styles.iconButton
            }
          >
            <MoreHorizontal
              size={22}
              color="#64748b"
            />
          </Pressable>

          {showMenu ? (
            <View
              style={
                styles.menu
              }
            >
              {isOwner ? (
                <>
                  <Pressable
                    onPress={() => {
                      onEdit(
                        post,
                      );
                      setShowMenu(
                        false,
                      );
                    }}
                    style={
                      styles.menuItem
                    }
                  >
                    <Edit3
                      size={16}
                      color="#0f172a"
                    />
                    <Text
                      style={
                        styles.menuText
                      }
                    >
                      Edit Post
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      onArchive(
                        post,
                      );
                      setShowMenu(
                        false,
                      );
                    }}
                    style={
                      styles.menuItem
                    }
                  >
                    {isArchived ? (
                      <ArchiveRestore
                        size={16}
                        color="#f59e0b"
                      />
                    ) : (
                      <Archive
                        size={16}
                        color="#f59e0b"
                      />
                    )}

                    <Text
                      style={
                        styles.menuText
                      }
                    >
                      {isArchived
                        ? "Unarchive"
                        : "Archive"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setShowMenu(
                        false,
                      );
                      onDelete(
                        post._id,
                      );
                    }}
                    style={
                      styles.menuItem
                    }
                  >
                    <Trash2
                      size={16}
                      color="#ef4444"
                    />

                    <Text
                      style={[
                        styles.menuText,
                        {
                          color:
                            "#ef4444",
                        },
                      ]}
                    >
                      Delete Post
                    </Text>
                  </Pressable>
                </>
              ) : null}

              <Pressable
                onPress={() => {
                  onShare(
                    post,
                  );
                  setShowMenu(
                    false,
                  );
                }}
                style={
                  styles.menuItem
                }
              >
                <Share2
                  size={16}
                  color="#0f172a"
                />

                <Text
                  style={
                    styles.menuText
                  }
                >
                  Share Post
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      {/* Media */}
      <View
        style={
          styles.mediaContainer
        }
      >
        {mediaList[
          activeMediaIndex
        ]?.type ===
        "video" ? (
          <PostVideo
            src={
              mediaList[
                activeMediaIndex
              ]?.url
            }
          />
        ) : (
          <Image
            source={{
              uri:
                mediaList[
                  activeMediaIndex
                ]?.url ||
                "",
            }}
            resizeMode="contain"
            style={
              styles.mediaImage
            }
          />
        )}

        {mediaList.length >
        1 ? (
          <>
            {activeMediaIndex >
            0 ? (
              <Pressable
                onPress={() =>
                  setActiveMediaIndex(
                    (
                      current,
                    ) =>
                      current -
                      1,
                  )
                }
                style={[
                  styles.mediaArrow,
                  styles.leftArrow,
                ]}
              >
                <ChevronLeft
                  size={22}
                  color="#ffffff"
                />
              </Pressable>
            ) : null}

            {activeMediaIndex <
            mediaList.length -
              1 ? (
              <Pressable
                onPress={() =>
                  setActiveMediaIndex(
                    (
                      current,
                    ) =>
                      current +
                      1,
                  )
                }
                style={[
                  styles.mediaArrow,
                  styles.rightArrow,
                ]}
              >
                <ChevronRight
                  size={22}
                  color="#ffffff"
                />
              </Pressable>
            ) : null}

            <View
              style={
                styles.mediaIndicator
              }
            >
              <Text
                style={
                  styles.mediaIndicatorText
                }
              >
                {activeMediaIndex +
                  1}
                /
                {
                  mediaList.length
                }
              </Text>
            </View>
          </>
        ) : null}
      </View>

      {/* Actions */}
      <View
        style={
          styles.actions
        }
      >
        <View
          style={
            styles.actionLeft
          }
        >
          <Pressable
            onPress={() =>
              void handleLike()
            }
            style={
              styles.actionButton
            }
          >
            <Heart
              size={25}
              color={
                liked
                  ? "#ef4444"
                  : "#0f172a"
              }
              fill={
                liked
                  ? "#ef4444"
                  : "transparent"
              }
            />
          </Pressable>

          <Pressable
            onPress={() =>
              onShare(
                post,
              )
            }
            style={
              styles.actionButton
            }
          >
            <Share2
              size={24}
              color="#0f172a"
            />
          </Pressable>
        </View>

        <Pressable
          onPress={() =>
            void handleSave()
          }
          style={
            styles.actionButton
          }
        >
          <Bookmark
            size={25}
            color={
              saved
                ? "#a855f7"
                : "#0f172a"
            }
            fill={
              saved
                ? "#a855f7"
                : "transparent"
            }
          />
        </Pressable>
      </View>

      <Text
        style={
          styles.likesText
        }
      >
        {likesCount} Likes
      </Text>

      {/* Caption */}
      {post.caption ? (
        <View
          style={
            styles.captionRow
          }
        >
          <Text
            style={
              styles.captionUsername
            }
          >
            @{user?.username}
          </Text>

          <Text
            style={
              styles.captionText
            }
          >
            {post.caption}
          </Text>
        </View>
      ) : null}

      {/* Comments */}
      <View
        style={
          styles.commentsContainer
        }
      >
        {comments.map(
          (
            comment,
          ) => (
            <View
              key={
                comment._id
              }
              style={
                styles.commentRow
              }
            >
              <Avatar
                src={
                  comment.user
                    ?.profilePicture ||
                  comment.user
                    ?.avatar
                }
                fallback={
                  comment.user
                    ?.username?.charAt(
                      0,
                    ) || "U"
                }
                style={
                  styles.commentAvatar
                }
              />

              <View
                style={
                  styles.commentBubble
                }
              >
                <Text
                  style={
                    styles.commentUsername
                  }
                >
                  @
                  {
                    comment
                      .user
                      ?.username
                  }
                </Text>

                <Text
                  style={
                    styles.commentText
                  }
                >
                  {comment.text ||
                    ""}
                </Text>
              </View>
            </View>
          ),
        )}
      </View>

      {/* Comment Input */}
      <View
        style={
          styles.commentComposer
        }
      >
        <Pressable
          onPress={() =>
            onEmoji(
              post._id,
            )
          }
          style={
            styles.emojiButton
          }
        >
          <Smile
            size={20}
            color="#64748b"
          />
        </Pressable>

        <TextInput
          value={
            newComment
          }
          onChangeText={
            setNewComment
          }
          placeholder="Add a comment..."
          placeholderTextColor="#94a3b8"
          style={
            styles.commentInput
          }
          returnKeyType="send"
          onSubmitEditing={() =>
            void handleAddComment()
          }
        />

        <Pressable
          onPress={() =>
            void handleAddComment()
          }
          disabled={
            !newComment.trim()
          }
          style={[
            styles.postCommentButton,
            !newComment.trim() &&
              styles.disabledButton,
          ]}
        >
          <Text
            style={
              styles.postCommentText
            }
          >
            Post
          </Text>
        </Pressable>
      </View>

      {emojiOpen ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.emojiPicker
          }
          keyboardShouldPersistTaps="handled"
        >
          {EMOJIS.map(
            (emoji) => (
              <Pressable
                key={emoji}
                onPress={() => {
                  setNewComment(
                    (
                      current,
                    ) =>
                      current +
                      emoji,
                  );
                }}
                style={
                  styles.emojiItem
                }
              >
                <Text
                  style={
                    styles.emojiText
                  }
                >
                  {emoji}
                </Text>
              </Pressable>
            ),
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Video Player                                                               */
/* -------------------------------------------------------------------------- */

function PostVideo({
  src,
}: {
  src?: string;
}) {
  const [
    muted,
    setMuted,
  ] = useState(true);

  const videoRef =
    useRef<Video | null>(
      null,
    );

  if (!src) {
    return (
      <View
        style={
          styles.videoPlaceholder
        }
      >
        <Text
          style={
            styles.videoPlaceholderText
          }
        >
          Video unavailable
        </Text>
      </View>
    );
  }

  return (
    <View
      style={
        styles.videoWrapper
      }
    >
      <Video
        ref={videoRef}
        source={{
          uri: src,
        }}
        style={
          styles.mediaImage
        }
        resizeMode={
          ResizeMode.CONTAIN
        }
        shouldPlay
        isLooping
        isMuted={
          muted
        }
        useNativeControls
      />

      <Pressable
        onPress={() =>
          setMuted(
            (value) =>
              !value,
          )
        }
        style={
          styles.videoMuteButton
        }
      >
        {muted ? (
          <VolumeX
            size={18}
            color="#ffffff"
          />
        ) : (
          <Volume2
            size={18}
            color="#34d399"
          />
        )}
      </Pressable>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Edit Modal                                                                 */
/* -------------------------------------------------------------------------- */

interface EditPostModalProps {
  caption: string;
  location: string;
  saving: boolean;
  onChangeCaption: (
    value: string,
  ) => void;
  onChangeLocation: (
    value: string,
  ) => void;
  onClose: () => void;
  onSave: () => void;
}

function EditPostModal({
  caption,
  location,
  saving,
  onChangeCaption,
  onChangeLocation,
  onClose,
  onSave,
}: EditPostModalProps) {
  return (
    <View
      style={
        styles.modalOverlay
      }
    >
      <View
        style={
          styles.modalCard
        }
      >
        <View
          style={
            styles.modalHeader
          }
        >
          <View
            style={
              styles.modalTitleRow
            }
          >
            <Edit3
              size={19}
              color="#a855f7"
            />

            <Text
              style={
                styles.modalTitle
              }
            >
              Edit Post
            </Text>
          </View>

          <Pressable
            onPress={
              onClose
            }
          >
            <X
              size={21}
              color="#64748b"
            />
          </Pressable>
        </View>

        <View
          style={
            styles.formGroup
          }
        >
          <Text
            style={
              styles.label
            }
          >
            Caption
          </Text>

          <TextInput
            value={
              caption
            }
            onChangeText={
              onChangeCaption
            }
            multiline
            textAlignVertical="top"
            placeholder="Write your caption..."
            placeholderTextColor="#94a3b8"
            style={[
              styles.multilineInput,
              styles.captionEditInput,
            ]}
          />
        </View>

        <View
          style={
            styles.formGroup
          }
        >
          <Text
            style={
              styles.label
            }
          >
            Location
          </Text>

          <TextInput
            value={
              location
            }
            onChangeText={
              onChangeLocation
            }
            placeholder="e.g. San Francisco, CA"
            placeholderTextColor="#94a3b8"
            style={
              styles.textInput
            }
          />
        </View>

        <View
          style={
            styles.modalButtonRow
          }
        >
          <Button
            variant="ghost"
            onPress={
              onClose
            }
            style={
              styles.modalButton
            }
          >
            Cancel
          </Button>

          <Button
            variant="gradient"
            isLoading={
              saving
            }
            onPress={
              onSave
            }
            style={
              styles.modalButton
            }
          >
            Save Changes
          </Button>
        </View>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Share Modal                                                                */
/* -------------------------------------------------------------------------- */

interface ShareModalProps {
  post: Post;
  copied: boolean;
  loading: boolean;
  onClose: () => void;
  onCopy: () => void;
  onNativeShare: () => void;
  onSendToChat: () => void;
}

function ShareModal({
  post,
  copied,
  loading,
  onClose,
  onCopy,
  onNativeShare,
  onSendToChat,
}: ShareModalProps) {
  return (
    <View
      style={
        styles.modalOverlay
      }
    >
      <View
        style={
          styles.shareCard
        }
      >
        <Text
          style={
            styles.shareTitle
          }
        >
          Share Post
        </Text>

        <View
          style={
            styles.sharePreview
          }
        >
          <Image
            source={{
              uri:
                post.media?.[0]
                  ?.url ||
                post.mediaUrl ||
                "",
            }}
            style={
              styles.sharePreviewImage
            }
            resizeMode="cover"
          />

          <View
            style={
              styles.sharePreviewText
            }
          >
            <Text
              style={
                styles.sharePreviewUsername
              }
            >
              @
              {typeof post.user ===
              "object"
                ? post.user
                    ?.username
                : "user"}
            </Text>

            <Text
              style={
                styles.sharePreviewCaption
              }
              numberOfLines={
                2
              }
            >
              {post.caption ||
                "SnapGram post"}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={
            onCopy
          }
          style={
            styles.shareButton
          }
        >
          {copied ? (
            <Check
              size={18}
              color="#34d399"
            />
          ) : (
            <Copy
              size={18}
              color="#ffffff"
            />
          )}

          <Text
            style={
              styles.shareButtonText
            }
          >
            {copied
              ? "Copied Link"
              : "Copy Direct Link"}
          </Text>
        </Pressable>

        <Pressable
          onPress={
            onNativeShare
          }
          disabled={
            loading
          }
          style={[
            styles.shareButton,
            styles.nativeShareButton,
          ]}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color="#ffffff"
            />
          ) : (
            <Share2
              size={18}
              color="#ffffff"
            />
          )}

          <Text
            style={
              styles.shareButtonText
            }
          >
            Share with Device
          </Text>
        </Pressable>

        <Pressable
          onPress={
            onSendToChat
          }
          style={[
            styles.shareButton,
            styles.chatShareButton,
          ]}
        >
          <Send
            size={18}
            color="#ffffff"
          />

          <Text
            style={
              styles.shareButtonText
            }
          >
            Send in Direct Chat
          </Text>
        </Pressable>

        <Pressable
          onPress={
            onClose
          }
          style={
            styles.cancelShareButton
          }
        >
          <Text
            style={
              styles.cancelShareText
            }
          >
            Cancel
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        "#f8fafc",
    },

    loadingScreen: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#f8fafc",
    },

    errorScreen: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 24,
      backgroundColor:
        "#f8fafc",
    },

    errorTitle: {
      fontSize: 20,
      fontWeight:
        "800",
      color: "#0f172a",
      marginBottom: 8,
    },

    errorDescription: {
      maxWidth: 320,
      fontSize: 14,
      lineHeight: 21,
      textAlign:
        "center",
      color: "#64748b",
      marginBottom: 20,
    },

    listContent: {
      paddingBottom: 40,
    },

    header: {
      minHeight: 60,
      paddingHorizontal: 12,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      backgroundColor:
        "rgba(248,250,252,0.96)",
      borderBottomWidth: 1,
      borderBottomColor:
        "#e2e8f0",
      marginBottom: 8,
    },

    backButton: {
      width: 42,
      height: 42,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 21,
    },

    headerSpacer: {
      width: 42,
      height: 42,
    },

    headerTitle: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight:
        "900",
      color: "#a855f7",
    },

    moreHeader: {
      marginTop: 14,
      marginHorizontal: 16,
      marginBottom: 14,
      paddingTop: 18,
      borderTopWidth: 1,
      borderTopColor:
        "#e2e8f0",
    },

    moreTitleRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    moreTitle: {
      flex: 1,
      fontSize: 18,
      lineHeight: 23,
      fontWeight:
        "800",
      color: "#0f172a",
    },

    moreDescription: {
      marginTop: 5,
      fontSize: 12,
      lineHeight: 18,
      color: "#64748b",
    },

    postCard: {
      marginHorizontal: 10,
      marginBottom: 18,
      overflow:
        "visible",
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "rgba(226,232,240,0.9)",
      borderRadius: 24,
      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity:
        0.06,
      shadowRadius:
        20,
      elevation: 3,
    },

    mainPostCard: {
      borderColor:
        "rgba(168,85,247,0.38)",
      borderWidth: 1.5,
    },

    authorHeader: {
      minHeight: 70,
      paddingHorizontal: 13,
      paddingVertical: 10,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      borderBottomWidth: 1,
      borderBottomColor:
        "#eef2f7",
    },

    authorLink: {
      flex: 1,
      minWidth: 0,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 10,
    },

    authorAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor:
        "#c084fc",
    },

    authorText: {
      flex: 1,
      minWidth: 0,
    },

    usernameRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    username: {
      fontSize: 14,
      lineHeight: 19,
      fontWeight:
        "800",
      color: "#0f172a",
    },

    locationRow: {
      marginTop: 2,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 3,
    },

    locationText: {
      flex: 1,
      fontSize: 10,
      lineHeight: 14,
      color: "#64748b",
    },

    menuContainer: {
      position:
        "relative",
      zIndex: 30,
    },

    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    menu: {
      position:
        "absolute",
      right: 0,
      top: 42,
      minWidth: 180,
      padding: 6,
      borderRadius: 14,
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity:
        0.15,
      shadowRadius:
        20,
      elevation: 12,
      zIndex: 50,
    },

    menuItem: {
      minHeight: 42,
      paddingHorizontal: 10,
      borderRadius: 10,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 9,
    },

    menuText: {
      fontSize: 12,
      fontWeight:
        "700",
      color: "#0f172a",
    },

    mediaContainer: {
      width: "100%",
      aspectRatio: 4 / 5,
      backgroundColor:
        "#000000",
      alignItems:
        "center",
      justifyContent:
        "center",
      position:
        "relative",
      overflow:
        "hidden",
    },

    mediaImage: {
      width: "100%",
      height: "100%",
    },

    mediaArrow: {
      position:
        "absolute",
      top: "50%",
      marginTop: -20,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.55)",
    },

    leftArrow: {
      left: 10,
    },

    rightArrow: {
      right: 10,
    },

    mediaIndicator: {
      position:
        "absolute",
      top: 12,
      right: 12,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor:
        "rgba(0,0,0,0.55)",
    },

    mediaIndicatorText: {
      fontSize: 10,
      fontWeight:
        "800",
      color: "#ffffff",
    },

    videoWrapper: {
      width: "100%",
      height: "100%",
      position:
        "relative",
    },

    videoMuteButton: {
      position:
        "absolute",
      right: 12,
      bottom: 12,
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.60)",
    },

    videoPlaceholder: {
      flex: 1,
      width: "100%",
      height: "100%",
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#111827",
    },

    videoPlaceholderText: {
      color: "#ffffff",
      fontSize: 13,
    },

    actions: {
      paddingHorizontal: 14,
      paddingTop: 13,
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
    },

    actionLeft: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 13,
    },

    actionButton: {
      width: 36,
      height: 36,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    likesText: {
      paddingHorizontal: 14,
      marginTop: 1,
      fontSize: 13,
      lineHeight: 19,
      fontWeight:
        "800",
      color: "#0f172a",
    },

    captionRow: {
      paddingHorizontal: 14,
      marginTop: 7,
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      alignItems:
        "flex-start",
    },

    captionUsername: {
      marginRight: 5,
      fontSize: 13,
      lineHeight: 20,
      fontWeight:
        "800",
      color: "#0f172a",
    },

    captionText: {
      flex: 1,
      minWidth: 160,
      fontSize: 13,
      lineHeight: 20,
      color: "#0f172a",
    },

    commentsContainer: {
      paddingHorizontal: 14,
      paddingTop: 11,
      gap: 8,
    },

    commentRow: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      gap: 8,
    },

    commentAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
    },

    commentBubble: {
      flex: 1,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor:
        "#f8fafc",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    commentUsername: {
      fontSize: 11,
      lineHeight: 15,
      fontWeight:
        "800",
      color: "#0f172a",
      marginBottom: 2,
    },

    commentText: {
      fontSize: 11,
      lineHeight: 17,
      color: "#64748b",
    },

    commentComposer: {
      paddingHorizontal: 10,
      paddingVertical: 10,
      marginTop: 8,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
      borderTopWidth: 1,
      borderTopColor:
        "#eef2f7",
    },

    emojiButton: {
      width: 36,
      height: 36,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    commentInput: {
      flex: 1,
      minHeight: 36,
      maxHeight: 90,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor:
        "#f8fafc",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      color: "#0f172a",
      fontSize: 12,
    },

    postCommentButton: {
      paddingHorizontal: 8,
      minHeight: 36,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    disabledButton: {
      opacity: 0.4,
    },

    postCommentText: {
      fontSize: 12,
      fontWeight:
        "800",
      color: "#a855f7",
    },

    emojiPicker: {
      paddingHorizontal: 10,
      paddingBottom: 10,
      gap: 5,
    },

    emojiItem: {
      width: 38,
      height: 38,
      borderRadius: 11,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#f1f5f9",
    },

    emojiText: {
      fontSize: 20,
    },

    footerLoader: {
      paddingVertical: 25,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    endMessage: {
      paddingVertical: 28,
      alignItems:
        "center",
    },

    endMessageText: {
      fontSize: 12,
      fontWeight:
        "600",
      color: "#94a3b8",
    },

    modalOverlay: {
      position:
        "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      zIndex: 100,
      backgroundColor:
        "rgba(0,0,0,0.65)",
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 18,
    },

    modalCard: {
      width: "100%",
      maxWidth: 500,
      borderRadius: 24,
      padding: 20,
      backgroundColor:
        "#ffffff",
      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity:
        0.25,
      shadowRadius:
        30,
      elevation: 10,
    },

    modalHeader: {
      paddingBottom: 12,
      marginBottom: 4,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      borderBottomWidth: 1,
      borderBottomColor:
        "#e2e8f0",
    },

    modalTitleRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    modalTitle: {
      fontSize: 17,
      fontWeight:
        "800",
      color: "#0f172a",
    },

    formGroup: {
      marginTop: 15,
    },

    label: {
      marginBottom: 7,
      fontSize: 11,
      fontWeight:
        "700",
      color: "#64748b",
    },

    textInput: {
      minHeight: 46,
      paddingHorizontal: 13,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      backgroundColor:
        "#f8fafc",
      color: "#0f172a",
      fontSize: 13,
    },

    multilineInput: {
      paddingHorizontal: 13,
      paddingVertical: 11,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      backgroundColor:
        "#f8fafc",
      color: "#0f172a",
      fontSize: 13,
    },

    captionEditInput: {
      minHeight: 110,
    },

    modalButtonRow: {
      marginTop: 18,
      flexDirection:
        "row",
      gap: 10,
    },

    modalButton: {
      flex: 1,
    },

    shareCard: {
      width: "100%",
      maxWidth: 400,
      borderRadius: 24,
      padding: 20,
      backgroundColor:
        "#111827",
    },

    shareTitle: {
      textAlign:
        "center",
      fontSize: 18,
      fontWeight:
        "800",
      color: "#ffffff",
      marginBottom: 15,
    },

    sharePreview: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 16,
      borderRadius: 15,
      overflow:
        "hidden",
      backgroundColor:
        "#1f2937",
    },

    sharePreviewImage: {
      width: 70,
      height: 70,
      backgroundColor:
        "#000000",
    },

    sharePreviewText: {
      flex: 1,
      paddingHorizontal: 12,
    },

    sharePreviewUsername: {
      fontSize: 12,
      fontWeight:
        "800",
      color: "#ffffff",
    },

    sharePreviewCaption: {
      marginTop: 4,
      fontSize: 11,
      lineHeight: 16,
      color: "#9ca3af",
    },

    shareButton: {
      minHeight: 48,
      marginTop: 9,
      borderRadius: 14,
      backgroundColor:
        "#374151",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 8,
    },

    nativeShareButton: {
      backgroundColor:
        "#7c3aed",
    },

    chatShareButton: {
      backgroundColor:
        "#a855f7",
    },

    shareButtonText: {
      fontSize: 13,
      fontWeight:
        "800",
      color: "#ffffff",
    },

    cancelShareButton: {
      marginTop: 12,
      minHeight: 42,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    cancelShareText: {
      fontSize: 12,
      fontWeight:
        "700",
      color: "#9ca3af",
    },
  });
