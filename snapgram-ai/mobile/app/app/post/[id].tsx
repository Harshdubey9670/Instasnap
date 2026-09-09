import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
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
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  ShieldAlert,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react-native";
import {
  useSelector,
} from "react-redux";
import * as Clipboard from "expo-clipboard";

import API from "../../../src/services/api";
import {
  useToast,
} from "../../../src/components/ui/Toast";
import {
  Avatar,
} from "../../../src/components/ui/Avatar";

type User = {
  _id?: string;
  username?: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
  isVerified?: boolean;
};

type MediaItem = {
  url?: string;
  type?: string;
};

type Comment = {
  _id: string;
  text?: string;
  user?: User;
};

type Post = {
  _id: string;
  caption?: string;
  location?: string;
  status?: string;
  media?: MediaItem[];
  mediaUrl?: string;
  mediaType?: string;
  user?: User | string;
  isLiked?: boolean;
  isSaved?: boolean;
  likes?: unknown[];
  likesCount?: number;
  commentsCount?: number;
};

type EditState = {
  caption: string;
  location: string;
};

function getUserObject(
  user: Post["user"],
): User | null {
  return typeof user === "object"
    ? user
    : null;
}

function getUserId(
  user: Post["user"],
): string | undefined {
  return typeof user === "string"
    ? user
    : user?._id;
}

function buildMediaList(
  post: Post,
): MediaItem[] {
  if (
    post.media &&
    post.media.length > 0
  ) {
    return post.media;
  }

  if (post.mediaUrl) {
    return [
      {
        url: post.mediaUrl,
        type:
          post.mediaType ||
          "image",
      },
    ];
  }

  return [];
}

type InstagramPostCardProps = {
  post: Post;
  isMain: boolean;
  authUser: User | null;
  onArchive: (
    post: Post,
  ) => void;
  onDelete: (
    postId: string,
  ) => void;
  onEdit: (
    post: Post,
  ) => void;
  onShare: (
    post: Post,
  ) => void;
};

function InstagramPostCard({
  post,
  isMain,
  authUser,
  onArchive,
  onDelete,
  onEdit,
  onShare,
}: InstagramPostCardProps) {
  const { toast } =
    useToast();

  const [
    liked,
    setLiked,
  ] = useState(
    Boolean(post.isLiked),
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
    Boolean(post.isSaved),
  );

  const [
    activeMediaIndex,
    setActiveMediaIndex,
  ] = useState(0);

  const [
    comments,
    setComments,
  ] = useState<
    Comment[]
  >([]);

  const [
    newComment,
    setNewComment,
  ] = useState("");

  const [
    showMenu,
    setShowMenu,
  ] = useState(false);

  const [
    videoMuted,
    setVideoMuted,
  ] = useState(true);

  const [
    submittingComment,
    setSubmittingComment,
  ] = useState(false);

  const mediaList =
    buildMediaList(post);

  const postUser =
    getUserObject(
      post.user,
    );

  const isOwner =
    authUser?._id ===
      getUserId(post.user);

  const isArchived =
    post.status ===
    "archived";

  const fetchComments =
    useCallback(
      async () => {
        try {
          const response =
            await API.get(
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
          // Keep the post usable even if comments fail.
        }
      },
      [post._id],
    );

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  const handleLike =
    async () => {
      const nextLiked =
        !liked;

      setLiked(
        nextLiked,
      );

      setLikesCount(
        (previous) =>
          nextLiked
            ? previous + 1
            : Math.max(
                0,
                previous - 1,
              ),
      );

      try {
        await API.post(
          `/api/posts/${post._id}/like`,
        );
      } catch {
        setLiked(
          !nextLiked,
        );

        setLikesCount(
          (previous) =>
            nextLiked
              ? Math.max(
                  0,
                  previous - 1,
                )
              : previous + 1,
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
        await API.post(
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

      if (
        !text ||
        submittingComment
      ) {
        return;
      }

      setNewComment("");
      setSubmittingComment(
        true,
      );

      try {
        const response =
          await API.post(
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
            (previous) => [
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
          description:
            "Please try again.",
        });
      } finally {
        setSubmittingComment(
          false,
        );
      }
    };

  const movePrevious =
    () => {
      setActiveMediaIndex(
        (previous) =>
          Math.max(
            0,
            previous - 1,
          ),
      );
    };

  const moveNext =
    () => {
      setActiveMediaIndex(
        (previous) =>
          Math.min(
            mediaList.length -
              1,
            previous + 1,
          ),
      );
    };

  return (
    <View
      style={[
        styles.postCard,
        isMain &&
          styles.mainPostCard,
      ]}
    >
      {/* Header */}
      <View
        style={
          styles.postHeader
        }
      >
        <Pressable
          onPress={() => {
            if (
              postUser?._id
            ) {
              router.push(
                `/app/profile/${postUser._id}`,
              );
            }
          }}
          style={
            styles.authorRow
          }
        >
          <Avatar
            src={
              postUser?.profilePicture ||
              postUser?.avatar
            }
            fallback={
              postUser?.username?.charAt(
                0,
              ) || "U"
            }
            style={
              styles.headerAvatar
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
                numberOfLines={
                  1
                }
              >
                @
                {postUser
                  ?.username ||
                  "user"}
              </Text>

              {postUser?.isVerified ? (
                <View
                  style={
                    styles.verifiedBadge
                  }
                >
                  <Check
                    size={
                      9
                    }
                    color="#ffffff"
                    strokeWidth={
                      3
                    }
                  />
                </View>
              ) : null}
            </View>

            {post.location ? (
              <View
                style={
                  styles.locationRow
                }
              >
                <MapPin
                  size={
                    11
                  }
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

        <Pressable
          onPress={() =>
            setShowMenu(
              (previous) =>
                !previous,
            )
          }
          style={
            styles.iconButton
          }
        >
          <MoreHorizontal
            size={21}
            color="#64748b"
          />
        </Pressable>
      </View>

      {/* Native menu */}
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
                  size={
                    16
                  }
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
                    size={
                      16
                    }
                    color="#f59e0b"
                  />
                ) : (
                  <Archive
                    size={
                      16
                    }
                    color="#f59e0b"
                  />
                )}

                <Text
                  style={[
                    styles.menuText,
                    {
                      color:
                        "#f59e0b",
                    },
                  ]}
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
                  size={
                    16
                  }
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
              setShowMenu(
                false,
              );
              onShare(
                post,
              );
            }}
            style={
              styles.menuItem
            }
          >
            <Share2
              size={
                16
              }
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

      {/* Media */}
      <View
        style={
          styles.mediaContainer
        }
      >
        {mediaList.length >
        0 ? (
          mediaList[
            activeMediaIndex
          ]?.type ===
          "video" ? (
            <View
              style={
                styles.videoContainer
              }
            >
              <View
                style={
                  styles.videoPlaceholder
                }
              >
                <VolumeX
                  size={
                    34
                  }
                  color="#ffffff"
                />

                <Text
                  style={
                    styles.videoHint
                  }
                >
                  Video
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setVideoMuted(
                    (
                      previous,
                    ) =>
                      !previous,
                  )
                }
                style={
                  styles.videoMuteButton
                }
              >
                {videoMuted ? (
                  <VolumeX
                    size={
                      18
                    }
                    color="#ffffff"
                  />
                ) : (
                  <Volume2
                    size={
                      18
                    }
                    color="#4ade80"
                  />
                )}
              </Pressable>
            </View>
          ) : (
            <Image
              source={{
                uri:
                  mediaList[
                    activeMediaIndex
                  ]
                    ?.url,
              }}
              style={
                styles.postMedia
              }
              resizeMode="contain"
            />
          )
        ) : (
          <View
            style={
              styles.noMedia
            }
          >
            <Text
              style={
                styles.noMediaText
              }
            >
              Media unavailable
            </Text>
          </View>
        )}

        {mediaList.length >
        1 ? (
          <>
            {activeMediaIndex >
            0 ? (
              <Pressable
                onPress={
                  movePrevious
                }
                style={[
                  styles.carouselButton,
                  styles.carouselLeft,
                ]}
              >
                <ChevronLeft
                  size={
                    21
                  }
                  color="#ffffff"
                />
              </Pressable>
            ) : null}

            {activeMediaIndex <
            mediaList.length -
              1 ? (
              <Pressable
                onPress={
                  moveNext
                }
                style={[
                  styles.carouselButton,
                  styles.carouselRight,
                ]}
              >
                <ChevronRight
                  size={
                    21
                  }
                  color="#ffffff"
                />
              </Pressable>
            ) : null}

            <View
              style={
                styles.mediaCounter
              }
            >
              <Text
                style={
                  styles.mediaCounterText
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

      {/* Toolbar */}
      <View
        style={
          styles.content
        }
      >
        <View
          style={
            styles.toolbar
          }
        >
          <View
            style={
              styles.toolbarLeft
            }
          >
            <Pressable
              onPress={
                handleLike
              }
              style={
                styles.actionButton
              }
            >
              <Heart
                size={
                  24
                }
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
                size={
                  23
                }
                color="#0f172a"
              />
            </Pressable>
          </View>

          <Pressable
            onPress={
              handleSave
            }
            style={
              styles.actionButton
            }
          >
            <Bookmark
              size={
                24
              }
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

        {post.caption ? (
          <Text
            style={
              styles.caption
            }
          >
            <Text
              style={
                styles.captionUsername
              }
            >
              @
              {postUser
                ?.username ||
                "user"}{" "}
            </Text>
            {post.caption}
          </Text>
        ) : null}

        {/* Comments */}
        <View
          style={
            styles.commentsSection
          }
        >
          {comments.length >
          0 ? (
            comments.map(
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
                      comment
                        .user
                        ?.profilePicture ||
                      comment
                        .user
                        ?.avatar
                    }
                    fallback={
                      comment
                        .user
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
                      {comment
                        .user
                        ?.username ||
                        "user"}
                    </Text>

                    <Text
                      style={
                        styles.commentText
                      }
                    >
                      {
                        comment.text
                      }
                    </Text>
                  </View>
                </View>
              ),
            )
          ) : (
            <Text
              style={
                styles.noComments
              }
            >
              No comments yet.
            </Text>
          )}
        </View>

        {/* Comment Input */}
        <View
          style={
            styles.commentInputRow
          }
        >
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
              !newComment.trim() ||
              submittingComment
            }
            style={[
              styles.commentSendButton,
              (!newComment.trim() ||
                submittingComment) &&
                styles.disabledButton,
            ]}
          >
            {submittingComment ? (
              <ActivityIndicator
                size="small"
                color="#ffffff"
              />
            ) : (
              <Send
                size={
                  17
                }
                color="#ffffff"
              />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function PostDetailScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
      source?: string;
      userId?: string;
    }>();

  const targetPostId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id || "";

  const originSource =
    params.source ||
    "explore";

  const originUserId =
    params.userId;

  const {
    user: authUser,
  } = useSelector(
    (
      state: any,
    ) => state.auth,
  );

  const { toast } =
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
  ] = useState<Post[]>(
    [],
  );

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
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    editingPost,
    setEditingPost,
  ] = useState<Post | null>(
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

  const loadingMoreRef =
    useRef(false);

  const prefetchedCacheRef =
    useRef<
      Record<
        number,
        Post[]
      >
    >({});

  const getFeedEndpoint =
    useCallback(() => {
      if (
        originSource ===
          "profile" &&
        originUserId
      ) {
        return `/api/posts/user/${originUserId}`;
      }

      if (
        originSource ===
        "feed"
      ) {
        return "/api/posts/feed";
      }

      return "/api/posts/explore";
    }, [
      originSource,
      originUserId,
    ]);

  const fetchTargetPost =
    useCallback(
      async () => {
        if (
          !targetPostId
        ) {
          setTargetLoading(
            false,
          );
          return;
        }

        try {
          setTargetLoading(
            true,
          );

          const response =
            await API.get(
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
        } catch {
          toast({
            variant:
              "error",
            title:
              "Error",
            description:
              "Failed to load post details.",
          });
        } finally {
          setTargetLoading(
            false,
          );
        }
      },
      [
        targetPostId,
        toast,
      ],
    );

  const fetchMorePosts =
    useCallback(
      async (
        pageNum: number,
        reset = false,
      ) => {
        if (
          loadingMoreRef.current
        ) {
          return;
        }

        loadingMoreRef.current =
          true;

        try {
          setFeedLoading(
            true,
          );

          const endpoint =
            getFeedEndpoint();

          let fetched: Post[] =
            [];

          if (
            prefetchedCacheRef
              .current[
              pageNum
            ]
          ) {
            fetched =
              prefetchedCacheRef
                .current[
                pageNum
              ];

            delete prefetchedCacheRef
              .current[
              pageNum
            ];
          } else {
            const response =
              await API.get(
                endpoint,
                {
                  params: {
                    page:
                      pageNum,
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
                  .data
                  ?.posts ||
                response.data
                  .data ||
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

          if (
            fetched.length >=
            6
          ) {
            const nextPage =
              pageNum + 1;

            if (
              !prefetchedCacheRef
                .current[
                nextPage
              ]
            ) {
              try {
                const nextResponse =
                  await API.get(
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
                  nextResponse.data
                    ?.success
                ) {
                  prefetchedCacheRef
                    .current[
                    nextPage
                  ] =
                    nextResponse
                      .data
                      .data
                      ?.posts ||
                    nextResponse
                      .data
                      .data ||
                    [];
                }
              } catch {
                // Prefetch failure should never block normal scrolling.
              }
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
          loadingMoreRef.current =
            false;
        }
      },
      [
        getFeedEndpoint,
        targetPostId,
      ],
    );

  const reload =
    useCallback(
      async () => {
        setPage(1);
        setHasMore(true);
        setFeedPosts([]);
        prefetchedCacheRef.current =
          {};

        await Promise.all([
          fetchTargetPost(),
          fetchMorePosts(
            1,
            true,
          ),
        ]);
      },
      [
        fetchTargetPost,
        fetchMorePosts,
      ],
    );

  useEffect(() => {
    void reload();
  }, [
    reload,
  ]);

  const handleLoadMore =
    useCallback(() => {
      if (
        feedLoading ||
        !hasMore ||
        loadingMoreRef.current
      ) {
        return;
      }

      const nextPage =
        page + 1;

      setPage(
        nextPage,
      );

      void fetchMorePosts(
        nextPage,
        false,
      );
    }, [
      page,
      feedLoading,
      hasMore,
      fetchMorePosts,
    ]);

  const handleArchive =
    async (
      postItem: Post,
    ) => {
      try {
        const response =
          await API.put(
            `/api/posts/${postItem._id}/archive`,
          );

        if (
          response.data
            ?.success
        ) {
          const status =
            response.data
              .data
              .status;

          setTargetPost(
            (previous) =>
              previous &&
              previous._id ===
                postItem._id
                ? {
                    ...previous,
                    status,
                  }
                : previous,
          );

          setFeedPosts(
            (previous) =>
              previous.map(
                (post) =>
                  post._id ===
                  postItem._id
                    ? {
                        ...post,
                        status,
                      }
                    : post,
              ),
          );

          const archived =
            status ===
            "archived";

          toast({
            variant:
              "success",
            title:
              archived
                ? "Post Archived"
                : "Post Restored",
            description:
              archived
                ? "Moved post to your private Archive."
                : "Restored post to your Profile feed.",
          });
        }
      } catch {
        toast({
          variant:
            "error",
          title:
            "Failed to archive post",
        });
      }
    };

  const handleDelete =
    async (
      postId: string,
    ) => {
      try {
        const response =
          await API.delete(
            `/api/posts/${postId}`,
          );

        if (
          response.data
            ?.success
        ) {
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
                  (post) =>
                    post._id !==
                    postId,
                ),
            );
          }

          toast({
            variant:
              "success",
            title:
              "Post Deleted",
            description:
              "Removed from Database, Feed, and Profile.",
          });
        }
      } catch {
        toast({
          variant:
            "error",
          title:
            "Delete Failed",
        });
      }
    };

  const openEdit =
    (
      post: Post,
    ) => {
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

  const saveEdit =
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
          await API.put(
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
              .data;

          setTargetPost(
            (previous) =>
              previous &&
              previous._id ===
                editingPost._id
                ? {
                    ...previous,
                    caption:
                      updated.caption,
                    location:
                      updated.location,
                  }
                : previous,
          );

          setFeedPosts(
            (previous) =>
              previous.map(
                (post) =>
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

          toast({
            variant:
              "success",
            title:
              "Post Updated",
          });
        }
      } catch {
        toast({
          variant:
            "error",
          title:
            "Failed to update post",
        });
      } finally {
        setIsUpdatingPost(
          false,
        );
      }
    };

  const copyShareLink =
    async () => {
      if (
        !sharePost
      ) {
        return;
      }

      const shareUrl =
        `https://snapgram.ai/app/post/${sharePost._id}`;

      try {
        await Clipboard.setStringAsync(
          shareUrl,
        );

        setCopiedLink(
          true,
        );

        toast({
          variant:
            "success",
          title:
            "Link Copied",
          description:
            "Post link copied to clipboard.",
        });

        setTimeout(
          () =>
            setCopiedLink(
              false,
            ),
          2000,
        );
      } catch {
        toast({
          variant:
            "error",
          title:
            "Copy Failed",
        });
      }
    };

  const handleRefresh =
    async () => {
      setRefreshing(
        true,
      );

      await reload();

      setRefreshing(
        false,
      );
    };

  const renderHeader =
    () => (
      <View>
        <View
          style={
            styles.topHeader
          }
        >
          <Pressable
            onPress={() =>
              router.back()
            }
            style={
              styles.backButton
            }
          >
            <ChevronLeft
              size={
                23
              }
              color="#0f172a"
            />
          </Pressable>

          <Text
            style={
              styles.topHeaderTitle
            }
          >
            {originSource ===
            "profile"
              ? "Profile Posts Stream"
              : "Explore Post Stream"}
          </Text>

          <View
            style={
              styles.headerSpacer
            }
          />
        </View>

        {targetLoading ? (
          <View
            style={
              styles.loaderBlock
            }
          >
            <ActivityIndicator
              size="large"
              color="#a855f7"
            />
          </View>
        ) : targetPost ? (
          <InstagramPostCard
            post={
              targetPost
            }
            isMain={
              true
            }
            authUser={
              authUser
            }
            onArchive={
              handleArchive
            }
            onDelete={
              handleDelete
            }
            onEdit={
              openEdit
            }
            onShare={
              setSharePost
            }
          />
        ) : (
          <View
            style={
              styles.notFound
            }
          >
            <Text
              style={
                styles.notFoundText
              }
            >
              Post not found
            </Text>
          </View>
        )}

        <View
          style={
            styles.streamIntro
          }
        >
          <View
            style={
              styles.streamTitleRow
            }
          >
            <Sparkles
              size={
                19
              }
              color="#a855f7"
            />

            <Text
              style={
                styles.streamTitle
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
              styles.streamSubtitle
            }
          >
            Keep scrolling to view
            more posts without going
            back.
          </Text>
        </View>
      </View>
    );

  return (
    <View
      style={
        styles.screen
      }
    >
      <FlatList
        data={
          feedPosts
        }
        keyExtractor={(
          item,
        ) => item._id}
        renderItem={({
          item,
        }) => (
          <InstagramPostCard
            post={item}
            isMain={false}
            authUser={
              authUser
            }
            onArchive={
              handleArchive
            }
            onDelete={
              handleDelete
            }
            onEdit={
              openEdit
            }
            onShare={
              setSharePost
            }
          />
        )}
        ListHeaderComponent={
          renderHeader
        }
        ListFooterComponent={
          feedLoading ? (
            <View
              style={
                styles.loaderBlock
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
                You've caught up
                with this stream.
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
        onEndReached={
          handleLoadMore
        }
        onEndReachedThreshold={
          0.65
        }
        refreshing={
          refreshing
        }
        onRefresh={() =>
          void handleRefresh()
        }
      />

      {/* Edit modal */}
      <Modal
        visible={
          Boolean(
            editingPost,
          )
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setEditingPost(
            null,
          )
        }
      >
        <View
          style={
            styles.modalBackdrop
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
                  size={
                    18
                  }
                  color="#a855f7"
                />

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Edit Post Details
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setEditingPost(
                    null,
                  )
                }
                style={
                  styles.iconButton
                }
              >
                <X
                  size={
                    20
                  }
                  color="#64748b"
                />
              </Pressable>
            </View>

            <Text
              style={
                styles.fieldLabel
              }
            >
              Caption
            </Text>

            <TextInput
              value={
                editCaption
              }
              onChangeText={
                setEditCaption
              }
              multiline
              placeholder="Write a caption..."
              placeholderTextColor="#94a3b8"
              style={
                styles.captionInput
              }
            />

            <Text
              style={
                styles.fieldLabel
              }
            >
              Location Tag
            </Text>

            <TextInput
              value={
                editLocation
              }
              onChangeText={
                setEditLocation
              }
              placeholder="e.g. San Francisco, CA"
              placeholderTextColor="#94a3b8"
              style={
                styles.locationInput
              }
            />

            <View
              style={
                styles.modalActions
              }
            >
              <Pressable
                onPress={() =>
                  setEditingPost(
                    null,
                  )
                }
                style={
                  styles.cancelButton
                }
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  void saveEdit()
                }
                disabled={
                  isUpdatingPost
                }
                style={
                  styles.saveButton
                }
              >
                {isUpdatingPost ? (
                  <ActivityIndicator
                    color="#ffffff"
                  />
                ) : (
                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    Save Changes
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Share modal */}
      <Modal
        visible={
          Boolean(
            sharePost,
          )
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSharePost(
            null,
          )
        }
      >
        <View
          style={
            styles.modalBackdrop
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

            <Pressable
              onPress={() =>
                void copyShareLink()
              }
              style={
                styles.shareOption
              }
            >
              {copiedLink ? (
                <Check
                  size={
                    19
                  }
                  color="#22c55e"
                />
              ) : (
                <Copy
                  size={
                    19
                  }
                  color="#ffffff"
                />
              )}

              <Text
                style={
                  styles.shareOptionText
                }
              >
                {copiedLink
                  ? "Copied Link!"
                  : "Copy Direct Link"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setSharePost(
                  null,
                );

                router.push(
                  "/app/chat",
                );

                toast({
                  variant:
                    "info",
                  title:
                    "Select chat partner",
                  description:
                    "Choose a chat to share the post.",
                });
              }}
              style={
                styles.sharePrimary
              }
            >
              <Send
                size={
                  18
                }
                color="#ffffff"
              />

              <Text
                style={
                  styles.sharePrimaryText
                }
              >
                Send in Direct Chat
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                setSharePost(
                  null,
                )
              }
              style={
                styles.shareCancel
              }
            >
              <Text
                style={
                  styles.shareCancelText
                }
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        "#f8fafc",
    },

    listContent: {
      paddingBottom: 30,
    },

    topHeader: {
      minHeight: 62,
      paddingHorizontal: 14,
      backgroundColor:
        "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor:
        "#e2e8f0",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    topHeaderTitle: {
      flex: 1,
      textAlign:
        "center",
      color:
        "#a855f7",
      fontSize: 16,
      fontWeight:
        "800",
    },

    headerSpacer: {
      width: 42,
      height: 42,
    },

    loaderBlock: {
      paddingVertical: 28,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    notFound: {
      paddingVertical: 36,
      alignItems:
        "center",
    },

    notFoundText: {
      color:
        "#64748b",
      fontSize: 15,
      fontWeight:
        "600",
    },

    postCard: {
      marginHorizontal: 10,
      marginBottom: 14,
      overflow:
        "hidden",
      borderRadius: 22,
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.07,
      shadowRadius: 15,
      elevation: 3,
    },

    mainPostCard: {
      borderColor:
        "rgba(168,85,247,0.38)",
      borderWidth: 2,
    },

    postHeader: {
      minHeight: 66,
      paddingHorizontal: 14,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    authorRow: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
      minWidth: 0,
    },

    headerAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 1.5,
      borderColor:
        "#c084fc",
    },

    authorText: {
      flex: 1,
      marginLeft: 10,
      minWidth: 0,
    },

    usernameRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
    },

    username: {
      color:
        "#0f172a",
      fontSize: 13,
      fontWeight:
        "800",
    },

    verifiedBadge: {
      width: 15,
      height: 15,
      borderRadius: 8,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#3b82f6",
    },

    locationRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 2,
      gap: 3,
    },

    locationText: {
      color:
        "#64748b",
      fontSize: 10,
      flexShrink: 1,
    },

    iconButton: {
      width: 40,
      height: 40,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    menu: {
      position:
        "absolute",
      top: 58,
      right: 12,
      zIndex: 30,
      width: 190,
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
        height: 7,
      },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 10,
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
      color:
        "#0f172a",
      fontSize: 12,
      fontWeight:
        "700",
    },

    mediaContainer: {
      height: 430,
      backgroundColor:
        "#000000",
      position:
        "relative",
      overflow:
        "hidden",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    postMedia: {
      width: "100%",
      height: "100%",
    },

    videoContainer: {
      width: "100%",
      height: "100%",
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#080808",
    },

    videoPlaceholder: {
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 8,
    },

    videoHint: {
      color:
        "rgba(255,255,255,0.75)",
      fontSize: 12,
      fontWeight:
        "700",
    },

    videoMuteButton: {
      position:
        "absolute",
      right: 14,
      bottom: 14,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.58)",
    },

    noMedia: {
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    noMediaText: {
      color:
        "#94a3b8",
      fontSize: 13,
    },

    carouselButton: {
      position:
        "absolute",
      top: "50%",
      marginTop: -19,
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.55)",
    },

    carouselLeft: {
      left: 10,
    },

    carouselRight: {
      right: 10,
    },

    mediaCounter: {
      position:
        "absolute",
      top: 12,
      right: 12,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor:
        "rgba(0,0,0,0.55)",
    },

    mediaCounterText: {
      color:
        "#ffffff",
      fontSize: 10,
      fontWeight:
        "800",
    },

    content: {
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 14,
    },

    toolbar: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    toolbarLeft: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 15,
    },

    actionButton: {
      width: 32,
      height: 32,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    likesText: {
      marginTop: 8,
      color:
        "#0f172a",
      fontSize: 13,
      fontWeight:
        "800",
    },

    caption: {
      marginTop: 8,
      color:
        "#0f172a",
      fontSize: 13,
      lineHeight: 20,
    },

    captionUsername: {
      fontWeight:
        "800",
    },

    commentsSection: {
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor:
        "#e2e8f0",
      maxHeight: 230,
    },

    commentRow: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      gap: 8,
      marginBottom: 9,
    },

    commentAvatar: {
      width: 29,
      height: 29,
      borderRadius: 15,
    },

    commentBubble: {
      flex: 1,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor:
        "#f1f5f9",
    },

    commentUsername: {
      color:
        "#0f172a",
      fontSize: 10,
      fontWeight:
        "800",
      marginBottom: 2,
    },

    commentText: {
      color:
        "#475569",
      fontSize: 11,
      lineHeight: 17,
    },

    noComments: {
      color:
        "#94a3b8",
      fontSize: 11,
      textAlign:
        "center",
      paddingVertical: 10,
    },

    commentInputRow: {
      marginTop: 12,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    commentInput: {
      flex: 1,
      minHeight: 42,
      maxHeight: 90,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 21,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      backgroundColor:
        "#f8fafc",
      color:
        "#0f172a",
      fontSize: 12,
    },

    commentSendButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#a855f7",
    },

    disabledButton: {
      opacity: 0.4,
    },

    streamIntro: {
      marginHorizontal: 12,
      marginBottom: 4,
      paddingTop: 5,
      paddingBottom: 12,
      borderTopWidth: 1,
      borderTopColor:
        "#e2e8f0",
    },

    streamTitleRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
    },

    streamTitle: {
      color:
        "#0f172a",
      fontSize: 16,
      fontWeight:
        "800",
    },

    streamSubtitle: {
      marginTop: 4,
      color:
        "#64748b",
      fontSize: 11,
      lineHeight: 17,
    },

    endMessage: {
      paddingVertical: 26,
      alignItems:
        "center",
    },

    endMessageText: {
      color:
        "#64748b",
      fontSize: 12,
      fontWeight:
        "600",
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.68)",
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 18,
    },

    modalCard: {
      width: "100%",
      maxWidth: 420,
      padding: 18,
      borderRadius: 24,
      backgroundColor:
        "#ffffff",
    },

    modalHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 15,
    },

    modalTitleRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
    },

    modalTitle: {
      color:
        "#0f172a",
      fontSize: 16,
      fontWeight:
        "800",
    },

    fieldLabel: {
      color:
        "#475569",
      fontSize: 11,
      fontWeight:
        "700",
      marginBottom: 6,
      marginTop: 8,
    },

    captionInput: {
      minHeight: 110,
      textAlignVertical:
        "top",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      borderRadius: 14,
      padding: 12,
      color:
        "#0f172a",
      backgroundColor:
        "#f8fafc",
      fontSize: 13,
    },

    locationInput: {
      minHeight: 44,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      borderRadius: 14,
      paddingHorizontal: 12,
      color:
        "#0f172a",
      backgroundColor:
        "#f8fafc",
      fontSize: 13,
    },

    modalActions: {
      marginTop: 16,
      flexDirection:
        "row",
      gap: 10,
    },

    cancelButton: {
      flex: 1,
      minHeight: 45,
      borderRadius: 14,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#f1f5f9",
    },

    cancelButtonText: {
      color:
        "#475569",
      fontSize: 13,
      fontWeight:
        "800",
    },

    saveButton: {
      flex: 1,
      minHeight: 45,
      borderRadius: 14,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#a855f7",
    },

    saveButtonText: {
      color:
        "#ffffff",
      fontSize: 13,
      fontWeight:
        "800",
    },

    shareCard: {
      width: "100%",
      maxWidth: 360,
      padding: 20,
      borderRadius: 24,
      backgroundColor:
        "#111827",
    },

    shareTitle: {
      color:
        "#ffffff",
      fontSize: 18,
      fontWeight:
        "800",
      textAlign:
        "center",
      marginBottom: 16,
    },

    shareOption: {
      minHeight: 48,
      paddingHorizontal: 15,
      borderRadius: 14,
      backgroundColor:
        "#1f2937",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 8,
      marginBottom: 10,
    },

    shareOptionText: {
      color:
        "#ffffff",
      fontSize: 12,
      fontWeight:
        "700",
    },

    sharePrimary: {
      minHeight: 48,
      paddingHorizontal: 15,
      borderRadius: 14,
      backgroundColor:
        "#a855f7",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 8,
      marginBottom: 8,
    },

    sharePrimaryText: {
      color:
        "#ffffff",
      fontSize: 12,
      fontWeight:
        "800",
    },

    shareCancel: {
      minHeight: 42,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    shareCancelText: {
      color:
        "#94a3b8",
      fontSize: 12,
      fontWeight:
        "700",
    },
  });