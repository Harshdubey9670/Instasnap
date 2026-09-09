import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  AlertTriangle,
  CornerDownRight,
  Edit2,
  Heart,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Pin,
  Send,
  Smile,
  Trash2,
  X,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { formatDistanceToNow } from "date-fns";
import {
  useSelector,
} from "react-redux";

import api from "../../services/api";
import type { RootState } from "../../store/store";
import {
  useToast,
} from "../ui/Toast";
import { Avatar } from "../ui/Avatar";
import { useTheme } from "../../contexts/ThemeContext";

interface CommentUser {
  _id?: string;
  username?: string;
  profilePicture?: string;
  avatar?: string;
}

interface Comment {
  _id: string;
  text: string;
  createdAt: string;
  likes?: Array<
    string | { _id?: string }
  >;
  isPinned?: boolean;
  isEdited?: boolean;
  parentComment?: string;
  user?: CommentUser;
}

interface CommentPost {
  _id: string;
  caption?: string;
  createdAt?: string;
  media?: Array<{
    url?: string;
    type?: string;
  }>;
  mediaUrl?: string;
  user?: CommentUser;
}

interface CommentModalProps {
  post: CommentPost | null;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
}

interface CommentItemProps {
  comment: Comment;
  post: CommentPost;
  authUser: CommentUser | null;
  onReply: () => void;
  onEdit: () => void;
  onDelete: (
    id: string,
  ) => void;
  onUpdate: (
    comment: Comment,
  ) => void;
  childReplies?: Comment[];
  isReply?: boolean;
}

const EMOJIS = [
  "😀",
  "😂",
  "😍",
  "🥰",
  "😎",
  "😢",
  "😭",
  "😡",
  "🔥",
  "❤️",
  "💜",
  "💯",
  "👏",
  "🙌",
  "🎉",
  "✨",
];

export const CommentModal = ({
  post,
  isOpen,
  onClose,
  onCommentAdded,
  onCommentDeleted,
}: CommentModalProps) => {
  const {
    user: authUser,
  } = useSelector(
    (state: RootState) =>
      state.auth,
  );

  const {
    toast,
  } = useToast();

  const {
    effectiveTheme,
  } = useTheme();

  const [
    comments,
    setComments,
  ] = useState<Comment[]>(
    [],
  );

  const [
    newComment,
    setNewComment,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    replyingTo,
    setReplyingTo,
  ] = useState<{
    id: string;
    username: string;
  } | null>(null);

  const [
    editingComment,
    setEditingComment,
  ] = useState<{
    id: string;
  } | null>(null);

  const [
    showEmojiPicker,
    setShowEmojiPicker,
  ] = useState(false);

  const inputRef =
    useRef<TextInput>(null);

  const listRef =
    useRef<
      FlatList<Comment>
    >(null);

  const dark =
    effectiveTheme ===
    "dark";

  useEffect(() => {
    if (
      isOpen &&
      post
    ) {
      void fetchComments();
    }
  }, [
    isOpen,
    post?._id,
  ]);

  const fetchComments =
    async () => {
      if (!post) {
        return;
      }

      setIsLoading(
        true,
      );

      try {
        const response =
          await api.get(
            `/api/posts/${post._id}/comments?limit=100`,
          );

        const data =
          response.data
            ?.data || [];

        /*
         * Preserve the final intended ordering from the web source:
         * pinned comments first, then oldest → newest.
         */
        const properlySorted =
          [...data].sort(
            (
              a: Comment,
              b: Comment,
            ) => {
              if (
                a.isPinned !==
                b.isPinned
              ) {
                return a.isPinned
                  ? -1
                  : 1;
              }

              return (
                new Date(
                  a.createdAt,
                ).getTime() -
                new Date(
                  b.createdAt,
                ).getTime()
              );
            },
          );

        setComments(
          properlySorted,
        );

        requestAnimationFrame(
          () => {
            scrollToBottom();
          },
        );
      } catch {
        toast({
          variant:
            "error",
          title:
            "Error",
          description:
            "Could not load comments",
        });
      } finally {
        setIsLoading(
          false,
        );
      }
    };

  const scrollToBottom =
    () => {
      requestAnimationFrame(
        () => {
          listRef.current?.scrollToEnd?.(
            {
              animated:
                true,
            },
          );
        },
      );
    };

  const handleSubmit =
    async () => {
      if (
        !newComment.trim() ||
        isSubmitting ||
        !post
      ) {
        return;
      }

      if (
        newComment
          .trim()
          .length > 500
      ) {
        toast({
          variant:
            "error",
          title:
            "Too long",
          description:
            "Comment cannot exceed 500 characters",
        });
        return;
      }

      setIsSubmitting(
        true,
      );

      try {
        if (
          editingComment
        ) {
          const response =
            await api.put(
              `/api/posts/${post._id}/comments/${editingComment.id}`,
              {
                text:
                  newComment,
              },
            );

          setComments(
            (
              previous,
            ) =>
              previous.map(
                (
                  comment,
                ) =>
                  comment._id ===
                  editingComment.id
                    ? response
                        .data
                        .data
                    : comment,
              ),
          );

          setEditingComment(
            null,
          );
        } else {
          const payload: {
            text: string;
            parentComment?: string;
          } = {
            text:
              newComment,
          };

          if (
            replyingTo
          ) {
            payload.parentComment =
              replyingTo.id;
          }

          const response =
            await api.post(
              `/api/posts/${post._id}/comments`,
              payload,
            );

          setComments(
            (
              previous,
            ) => [
              ...previous,
              response.data.data,
            ],
          );

          onCommentAdded?.();

          if (
            !replyingTo
          ) {
            requestAnimationFrame(
              () => {
                scrollToBottom();
              },
            );
          }
        }

        setNewComment(
          "",
        );
        setReplyingTo(
          null,
        );
        setShowEmojiPicker(
          false,
        );
      } catch (
        error: any
      ) {
        toast({
          variant:
            "error",
          title:
            "Failed to post",
          description:
            error?.response
              ?.data
              ?.message ||
            "Something went wrong",
        });
      } finally {
        setIsSubmitting(
          false,
        );
      }
    };

  const handleEmoji =
    (
      emoji: string,
    ) => {
      setNewComment(
        (
          previous,
        ) =>
          previous +
          emoji,
      );
    };

  const handleReplyClick =
    (
      comment: Comment,
    ) => {
      setReplyingTo({
        id:
          comment._id,
        username:
          comment.user
            ?.username ||
          "",
      });

      setEditingComment(
        null,
      );

      setNewComment(
        `@${
          comment.user
            ?.username || ""
        } `,
      );

      requestAnimationFrame(
        () =>
          inputRef.current?.focus(),
      );
    };

  const handleEditClick =
    (
      comment: Comment,
    ) => {
      setEditingComment({
        id:
          comment._id,
      });

      setReplyingTo(
        null,
      );

      setNewComment(
        comment.text,
      );

      requestAnimationFrame(
        () =>
          inputRef.current?.focus(),
      );
    };

  const cancelAction =
    () => {
      setReplyingTo(
        null,
      );

      setEditingComment(
        null,
      );

      setNewComment(
        "",
      );

      setShowEmojiPicker(
        false,
      );
    };

  const rootComments =
    useMemo(
      () =>
        comments.filter(
          (comment) =>
            !comment.parentComment,
        ),
      [comments],
    );

  const replies =
    useMemo(
      () =>
        comments.filter(
          (comment) =>
            Boolean(
              comment.parentComment,
            ),
        ),
      [comments],
    );

  const handleDeleteComment =
    (
      id: string,
    ) => {
      setComments(
        (
          previous,
        ) =>
          previous.filter(
            (
              comment,
            ) =>
              comment._id !==
              id,
          ),
      );

      onCommentDeleted?.();
    };

  if (
    !isOpen ||
    !post
  ) {
    return null;
  }

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={
        onClose
      }
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={
          styles.screen
        }
        behavior={
          Platform.OS ===
          "ios"
            ? "padding"
            : "height"
        }
      >
        <Pressable
          style={
            styles.backdrop
          }
          onPress={() => {
            setShowEmojiPicker(
              false,
            );
            onClose();
          }}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor:
                dark
                  ? "#0a0510"
                  : "#f8fafc",
            },
          ]}
        >
          <View
            style={
              styles.handle
            }
          />

          <Pressable
            onPress={
              onClose
            }
            style={
              styles.closeButton
            }
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close comments"
          >
            <X
              size={22}
              color={
                dark
                  ? "#94a3b8"
                  : "#64748b"
              }
            />
          </Pressable>

          <View
            style={[
              styles.header,
              {
                borderBottomColor:
                  dark
                    ? "#2d1b3b"
                    : "#e2e8f0",
              },
            ]}
          >
            <MessageCircle
              size={20}
              color={
                dark
                  ? "#f8fafc"
                  : "#0f172a"
              }
            />

            <Text
              style={[
                styles.headerTitle,
                {
                  color:
                    dark
                      ? "#f8fafc"
                      : "#0f172a",
                },
              ]}
            >
              Comments
            </Text>
          </View>

          <View
            style={
              styles.postCaption
            }
          >
            <Avatar
              src={
                post.user
                  ?.profilePicture ||
                post.user
                  ?.avatar
              }
              alt={
                post.user
                  ?.username ||
                "Post author"
              }
              size="sm"
              fallback={
                post.user
                  ?.username
                  ?.charAt(
                    0,
                  )
                  ?.toUpperCase() ||
                "U"
              }
            />

            <View
              style={
                styles.captionContent
              }
            >
              <View
                style={
                  styles.captionRow
                }
              >
                <Text
                  style={[
                    styles.captionUsername,
                    {
                      color:
                        dark
                          ? "#f8fafc"
                          : "#0f172a",
                    },
                  ]}
                >
                  {
                    post.user
                      ?.username
                  }
                </Text>

                <Text
                  style={[
                    styles.captionText,
                    {
                      color:
                        dark
                          ? "#f8fafc"
                          : "#0f172a",
                    },
                  ]}
                >
                  {
                    post.caption
                  }
                </Text>
              </View>

              <Text
                style={[
                  styles.timestamp,
                  {
                    color:
                      dark
                        ? "#94a3b8"
                        : "#64748b",
                  },
                ]}
              >
                {formatDistanceToNow(
                  new Date(
                    post.createdAt || Date.now(),
                  ),
                  {
                    addSuffix:
                      true,
                  },
                )}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.commentsContainer
            }
          >
            {isLoading ? (
              <View
                style={
                  styles.centerState
                }
              >
                <Loader2
                  size={28}
                  color="#a855f7"
                />
                <Text
                  style={[
                    styles.stateText,
                    {
                      color:
                        dark
                          ? "#94a3b8"
                          : "#64748b",
                    },
                  ]}
                >
                  Loading comments...
                </Text>
              </View>
            ) : rootComments.length ===
              0 ? (
              <View
                style={
                  styles.centerState
                }
              >
                <MessageCircle
                  size={48}
                  color={
                    dark
                      ? "#94a3b8"
                      : "#64748b"
                  }
                  strokeWidth={
                    1.5
                  }
                />

                <Text
                  style={[
                    styles.emptyTitle,
                    {
                      color:
                        dark
                          ? "#f8fafc"
                          : "#0f172a",
                    },
                  ]}
                >
                  No comments yet.
                </Text>

                <Text
                  style={[
                    styles.stateText,
                    {
                      color:
                        dark
                          ? "#94a3b8"
                          : "#64748b",
                    },
                  ]}
                >
                  Be the first to
                  comment!
                </Text>
              </View>
            ) : (
              <FlatList
                ref={
                  listRef
                }
                data={
                  rootComments
                }
                keyExtractor={(
                  item,
                ) =>
                  item._id}
                contentContainerStyle={
                  styles.commentList
                }
                showsVerticalScrollIndicator={
                  false
                }
                keyboardShouldPersistTaps="handled"
                renderItem={({
                  item,
                }) => (
                  <CommentItem
                    comment={
                      item
                    }
                    post={
                      post
                    }
                    authUser={
                      authUser as CommentUser | null
                    }
                    onReply={() =>
                      handleReplyClick(
                        item,
                      )
                    }
                    onEdit={() =>
                      handleEditClick(
                        item,
                      )
                    }
                    onDelete={
                      handleDeleteComment
                    }
                    onUpdate={(
                      updated,
                    ) => {
                      setComments(
                        (
                          previous,
                        ) =>
                          previous.map(
                            (
                              comment,
                            ) =>
                              comment._id ===
                              updated._id
                                ? updated
                                : comment,
                          ),
                      );
                    }}
                    childReplies={
                      replies.filter(
                        (
                          reply,
                        ) =>
                          reply.parentComment ===
                          item._id,
                      )
                    }
                  />
                )}
                ListFooterComponent={
                  <View
                    style={
                      styles.listFooter
                    }
                  />
                }
              />
            )}
          </View>

          {(replyingTo ||
            editingComment) ? (
            <View
              style={[
                styles.actionBar,
                {
                  backgroundColor:
                    dark
                      ? "#130a1c"
                      : "#ffffff",
                  borderTopColor:
                    dark
                      ? "#2d1b3b"
                      : "#e2e8f0",
                },
              ]}
            >
              <Text
                style={[
                  styles.actionBarText,
                  {
                    color:
                      dark
                        ? "#94a3b8"
                        : "#64748b",
                  },
                ]}
                numberOfLines={1}
              >
                {replyingTo
                  ? `Replying to @${replyingTo.username}`
                  : "Editing comment"}
              </Text>

              <Pressable
                onPress={
                  cancelAction
                }
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Cancel
                </Text>
              </Pressable>
            </View>
          ) : null}

          {showEmojiPicker ? (
            <View
              style={[
                styles.emojiPicker,
                {
                  backgroundColor:
                    dark
                      ? "#130a1c"
                      : "#ffffff",
                  borderColor:
                    dark
                      ? "#2d1b3b"
                      : "#e2e8f0",
                },
              ]}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.emojiContent
                }
              >
                {EMOJIS.map(
                  (
                    emoji,
                  ) => (
                    <Pressable
                      key={
                        emoji
                      }
                      onPress={() =>
                        handleEmoji(
                          emoji,
                        )
                      }
                      style={
                        styles.emojiButton
                      }
                    >
                      <Text
                        style={
                          styles.emojiText
                        }
                      >
                        {
                          emoji
                        }
                      </Text>
                    </Pressable>
                  ),
                )}
              </ScrollView>
            </View>
          ) : null}

          <View
            style={[
              styles.inputSection,
              {
                backgroundColor:
                  dark
                    ? "rgba(19,10,28,0.92)"
                    : "rgba(255,255,255,0.96)",
                borderTopColor:
                  dark
                    ? "#2d1b3b"
                    : "#e2e8f0",
              },
            ]}
          >
            <Avatar
              src={
                authUser
                  ?.profilePicture ||
                authUser
                  ?.avatar
              }
              alt="You"
              size="sm"
              fallback={
                authUser
                  ?.username
                  ?.charAt(
                    0,
                  )
                  ?.toUpperCase() ||
                "U"
              }
            />

            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor:
                    dark
                      ? "#0a0510"
                      : "#f8fafc",
                  borderColor:
                    dark
                      ? "#2d1b3b"
                      : "#e2e8f0",
                },
              ]}
            >
              <Pressable
                onPress={() =>
                  setShowEmojiPicker(
                    (
                      value,
                    ) =>
                      !value,
                  )
                }
                style={
                  styles.emojiTrigger
                }
                accessibilityRole="button"
                accessibilityLabel="Open emoji picker"
              >
                <Smile
                  size={20}
                  color={
                    dark
                      ? "#94a3b8"
                      : "#64748b"
                  }
                />
              </Pressable>

              <TextInput
                ref={
                  inputRef
                }
                value={
                  newComment
                }
                onChangeText={
                  setNewComment
                }
                placeholder="Add a comment..."
                placeholderTextColor={
                  dark
                    ? "#64748b"
                    : "#94a3b8"
                }
                multiline
                maxLength={500}
                textAlignVertical="top"
                onFocus={() =>
                  setShowEmojiPicker(
                    false,
                  )
                }
                style={[
                  styles.input,
                  {
                    color:
                      dark
                        ? "#f8fafc"
                        : "#0f172a",
                  },
                ]}
              />

              <Pressable
                onPress={() =>
                  void handleSubmit()
                }
                disabled={
                  !newComment.trim() ||
                  isSubmitting
                }
                style={[
                  styles.sendButton,
                  (
                    !newComment.trim() ||
                    isSubmitting
                  ) &&
                    styles.sendDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Post comment"
              >
                {isSubmitting ? (
                  <Loader2
                    size={20}
                    color="#a855f7"
                  />
                ) : (
                  <Send
                    size={20}
                    color="#a855f7"
                  />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const CommentItem = ({
  comment,
  post,
  authUser,
  onReply,
  onEdit,
  onDelete,
  onUpdate,
  childReplies = [],
  isReply = false,
}: CommentItemProps) => {
  const {
    toast,
  } = useToast();

  const [
    showOptions,
    setShowOptions,
  ] = useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const {
    effectiveTheme,
  } = useTheme();

  const dark =
    effectiveTheme ===
    "dark";

  const userId =
    authUser?._id;

  const isLiked =
    Boolean(
      userId &&
        comment.likes?.some(
          (id) =>
            String(
              typeof id ===
                "string"
                ? id
                : id?._id,
            ) ===
            String(
              userId,
            ),
        ),
    );

  const isCommentAuthor =
    String(
      comment.user?._id,
    ) ===
    String(userId);

  const isPostOwner =
    String(
      post.user?._id,
    ) ===
    String(userId);

  const handleLike =
    async () => {
      try {
        const response =
          await api.put(
            `/api/posts/${post._id}/comments/${comment._id}/like`,
          );

        const currentLikes =
          comment.likes ||
          [];

        const updatedLikes =
          response.data
            ?.isLiked
            ? [
                ...currentLikes,
                userId!,
              ]
            : currentLikes.filter(
                (id) =>
                  String(
                    typeof id ===
                      "string"
                      ? id
                      : id?._id,
                  ) !==
                  String(
                    userId,
                  ),
              );

        onUpdate({
          ...comment,
          likes:
            updatedLikes,
        });
      } catch {
        toast({
          variant:
            "error",
          title:
            "Error",
          description:
            "Could not like comment",
        });
      }
    };

  const handlePin =
    async () => {
      try {
        const response =
          await api.put(
            `/api/posts/${post._id}/comments/${comment._id}/pin`,
          );

        onUpdate({
          ...comment,
          isPinned:
            response.data
              ?.isPinned,
        });

        setShowOptions(
          false,
        );
      } catch {
        toast({
          variant:
            "error",
          title:
            "Error",
          description:
            "Could not pin comment",
        });
      }
    };

  const handleDelete =
    () => {
      Alert.alert(
        "Delete comment",
        "Are you sure you want to delete this comment?",
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
                setIsDeleting(
                  true,
                );

                try {
                  await api.delete(
                    `/api/posts/${post._id}/comments/${comment._id}`,
                  );

                  onDelete(
                    comment._id,
                  );

                  toast({
                    variant:
                      "success",
                    title:
                      "Deleted",
                    description:
                      "Comment removed",
                  });
                } catch {
                  toast({
                    variant:
                      "error",
                    title:
                      "Error",
                    description:
                      "Could not delete comment",
                  });

                  setIsDeleting(
                    false,
                  );
                }
              },
          },
        ],
      );
    };

  const handleCopy =
    async () => {
      try {
        await Clipboard.setStringAsync(
          comment.text,
        );

        toast({
          variant:
            "success",
          title:
            "Copied",
          description:
            "Comment copied to clipboard",
        });

        setShowOptions(
          false,
        );
      } catch {
        toast({
          variant:
            "error",
          title:
            "Error",
          description:
            "Could not copy comment",
        });
      }
    };

  const handleReport =
    async () => {
      try {
        await api.post(
          `/api/posts/${post._id}/comments/${comment._id}/report`,
        );

        toast({
          variant:
            "success",
          title:
            "Reported",
          description:
            "Comment reported successfully",
        });

        setShowOptions(
          false,
        );
      } catch {
        toast({
          variant:
            "error",
          title:
            "Error",
          description:
            "Could not report comment",
        });
      }
    };

  const renderCommentText =
    () => {
      const parts =
        comment.text.split(
          /(@[a-zA-Z0-9_]+)/g,
        );

      return (
        <Text
          style={[
            styles.commentText,
            {
              color:
                dark
                  ? "#f8fafc"
                  : "#0f172a",
            },
          ]}
        >
          {parts.map(
            (
              part,
              index,
            ) =>
              part.startsWith(
                "@",
              ) ? (
                <Text
                  key={
                    index
                  }
                  style={
                    styles.mention
                  }
                >
                  {part}
                </Text>
              ) : (
                <Text
                  key={
                    index
                  }
                >
                  {part}
                </Text>
              ),
          )}
        </Text>
      );
    };

  return (
    <View
      style={[
        styles.commentItem,
        isReply &&
          styles.replyItem,
      ]}
    >
      <View
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
          alt={
            comment.user
              ?.username ||
            "Comment author"
          }
          size={
            isReply
              ? "sm"
              : "sm"
          }
          fallback={
            comment.user
              ?.username
              ?.charAt(
                0,
              )
              ?.toUpperCase() ||
            "U"
          }
        />

        <View
          style={
            styles.commentBody
          }
        >
          <View
            style={
              styles.commentTopRow
            }
          >
            <View
              style={
                styles.commentContent
              }
            >
              <Text
                style={[
                  styles.commentUsername,
                  {
                    color:
                      dark
                        ? "#f8fafc"
                        : "#0f172a",
                  },
                ]}
              >
                {
                  comment.user
                    ?.username
                }{" "}
              </Text>

              {renderCommentText()}
            </View>

            <Pressable
              onPress={() =>
                void handleLike()
              }
              style={
                styles.likeButton
              }
              accessibilityRole="button"
              accessibilityLabel={
                isLiked
                  ? "Unlike comment"
                  : "Like comment"
              }
            >
              <Heart
                size={15}
                color={
                  isLiked
                    ? "#ef4444"
                    : dark
                      ? "#94a3b8"
                      : "#64748b"
                }
                fill={
                  isLiked
                    ? "#ef4444"
                    : "none"
                }
              />
            </Pressable>
          </View>

          <View
            style={
              styles.metaRow
            }
          >
            <Text
              style={[
                styles.metaText,
                {
                  color:
                    dark
                      ? "#94a3b8"
                      : "#64748b",
                },
              ]}
            >
              {formatDistanceToNow(
                new Date(
                  comment.createdAt,
                ),
                {
                  addSuffix:
                    false,
                },
              ).replace(
                "about ",
                "",
              )}
            </Text>

            {comment.likes &&
            comment.likes.length >
              0 ? (
              <Text
                style={[
                  styles.metaText,
                  {
                    color:
                      dark
                        ? "#94a3b8"
                        : "#64748b",
                  },
                ]}
              >
                {
                  comment.likes
                    .length
                }{" "}
                {comment.likes
                  .length ===
                1
                  ? "like"
                  : "likes"}
              </Text>
            ) : null}

            {!isReply ? (
              <Pressable
                onPress={
                  onReply
                }
              >
                <Text
                  style={
                    styles.replyText
                  }
                >
                  Reply
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() =>
                setShowOptions(
                  (
                    value,
                  ) =>
                    !value,
                )
              }
              style={
                styles.moreButton
              }
              accessibilityRole="button"
              accessibilityLabel="Comment options"
            >
              <MoreHorizontal
                size={17}
                color={
                  dark
                    ? "#94a3b8"
                    : "#64748b"
                }
              />
            </Pressable>
          </View>

          {showOptions ? (
            <View
              style={[
                styles.optionsMenu,
                {
                  backgroundColor:
                    dark
                      ? "#130a1c"
                      : "#ffffff",
                  borderColor:
                    dark
                      ? "#2d1b3b"
                      : "#e2e8f0",
                },
              ]}
            >
              {isPostOwner &&
              !isReply ? (
                <OptionButton
                  icon={
                    <Pin
                      size={14}
                      color="#64748b"
                    />
                  }
                  label={
                    comment.isPinned
                      ? "Unpin"
                      : "Pin to top"
                  }
                  onPress={() =>
                    void handlePin()
                  }
                  dark={dark}
                />
              ) : null}

              <OptionButton
                icon={
                  <MessageCircle
                    size={14}
                    color="#64748b"
                  />
                }
                label="Copy"
                onPress={() =>
                  void handleCopy()
                }
                dark={dark}
              />

              {isCommentAuthor ? (
                <>
                  <OptionButton
                    icon={
                      <Edit2
                        size={14}
                        color="#64748b"
                      />
                    }
                    label="Edit"
                    onPress={() => {
                      setShowOptions(
                        false,
                      );
                      onEdit();
                    }}
                    dark={dark}
                  />

                  <OptionButton
                    icon={
                      isDeleting ? (
                        <Loader2
                          size={14}
                          color="#ef4444"
                        />
                      ) : (
                        <Trash2
                          size={14}
                          color="#ef4444"
                        />
                      )
                    }
                    label="Delete"
                    danger
                    onPress={
                      handleDelete
                    }
                    disabled={
                      isDeleting
                    }
                    dark={dark}
                  />
                </>
              ) : (
                <OptionButton
                  icon={
                    <AlertTriangle
                      size={14}
                      color="#ef4444"
                    />
                  }
                  label="Report"
                  danger
                  onPress={() =>
                    void handleReport()
                  }
                  dark={dark}
                />
              )}
            </View>
          ) : null}

          <View
            style={
              styles.statusRow
            }
          >
            {comment.isPinned ? (
              <View
                style={
                  styles.statusItem
                }
              >
                <Pin
                  size={11}
                  color="#a855f7"
                />

                <Text
                  style={
                    styles.pinnedText
                  }
                >
                  Pinned
                </Text>
              </View>
            ) : null}

            {comment.isEdited ? (
              <Text
                style={[
                  styles.editedText,
                  {
                    color:
                      dark
                        ? "#94a3b8"
                        : "#64748b",
                  },
                ]}
              >
                (Edited)
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {childReplies.length >
      0 ? (
        <View
          style={
            styles.children
          }
        >
          <View
            style={
              styles.replyHeader
            }
          >
            <View
              style={
                styles.replyLine
              }
            />

            <CornerDownRight
              size={13}
              color={
                dark
                  ? "#94a3b8"
                  : "#64748b"
              }
            />

            <Text
              style={[
                styles.replyHeaderText,
                {
                  color:
                    dark
                      ? "#94a3b8"
                      : "#64748b",
                },
              ]}
            >
              View{" "}
              {
                childReplies.length
              }{" "}
              {childReplies.length ===
              1
                ? "reply"
                : "replies"}
            </Text>
          </View>

          {childReplies.map(
            (
              reply,
            ) => (
              <CommentItem
                key={
                  reply._id
                }
                comment={
                  reply
                }
                post={
                  post
                }
                authUser={
                  authUser
                }
                onReply={
                  onReply
                }
                onEdit={() =>
                  onEdit()
                }
                onDelete={
                  onDelete
                }
                onUpdate={
                  onUpdate
                }
                isReply
              />
            ),
          )}
        </View>
      ) : null}
    </View>
  );
};

interface OptionButtonProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
  dark: boolean;
}

const OptionButton = ({
  icon,
  label,
  onPress,
  danger = false,
  disabled = false,
  dark,
}: OptionButtonProps) => (
  <Pressable
    onPress={
      onPress
    }
    disabled={
      disabled
    }
    style={({ pressed }) => [
      styles.optionButton,
      pressed &&
        styles.optionPressed,
      disabled &&
        styles.optionDisabled,
    ]}
  >
    {icon}

    <Text
      style={[
        styles.optionText,
        {
          color:
            danger
              ? "#ef4444"
              : dark
                ? "#f8fafc"
                : "#0f172a",
        },
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
    },

    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(0,0,0,0.60)",
    },

    sheet: {
      flex: 1,
      marginTop: "10%",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow:
        "hidden",
    },

    handle: {
      width: 42,
      height: 4,
      borderRadius: 2,
      alignSelf: "center",
      backgroundColor:
        "#94a3b8",
      marginTop: 8,
      marginBottom: 6,
    },

    closeButton: {
      position:
        "absolute",
      right: 10,
      top: 14,
      zIndex: 50,

      width: 42,
      height: 42,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 21,
    },

    header: {
      minHeight: 54,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",

      gap: 8,

      borderBottomWidth: 1,
      paddingHorizontal: 54,
    },

    headerTitle: {
      fontSize: 17,
      fontWeight: "700",
    },

    postCaption: {
      flexDirection:
        "row",
      gap: 10,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        "rgba(148,163,184,0.15)",
    },

    captionContent: {
      flex: 1,
    },

    captionRow: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
    },

    captionUsername: {
      fontSize: 13,
      lineHeight: 20,
      fontWeight: "800",
      marginRight: 6,
    },

    captionText: {
      flexShrink: 1,
      fontSize: 13,
      lineHeight: 20,
    },

    timestamp: {
      marginTop: 4,
      fontSize: 11,
    },

    commentsContainer: {
      flex: 1,
      minHeight: 0,
    },

    commentList: {
      padding: 16,
      gap: 18,
    },

    listFooter: {
      height: 24,
    },

    centerState: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 32,
      gap: 10,
    },

    stateText: {
      fontSize: 13,
      textAlign:
        "center",
    },

    emptyTitle: {
      fontSize: 16,
      fontWeight: "700",
      textAlign:
        "center",
      marginTop: 4,
    },

    commentItem: {
      width: "100%",
    },

    replyItem: {
      marginTop: 8,
    },

    commentRow: {
      flexDirection:
        "row",
      gap: 10,
      width: "100%",
    },

    commentBody: {
      flex: 1,
      minWidth: 0,
      position:
        "relative",
    },

    commentTopRow: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
    },

    commentContent: {
      flex: 1,
      paddingRight: 8,
    },

    commentUsername: {
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "800",
    },

    commentText: {
      fontSize: 13,
      lineHeight: 19,
    },

    mention: {
      color:
        "#a855f7",
      fontWeight:
        "600",
    },

    likeButton: {
      width: 30,
      height: 30,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    metaRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 12,
      marginTop: 2,
    },

    metaText: {
      fontSize: 10,
      fontWeight:
        "500",
    },

    replyText: {
      fontSize: 10,
      fontWeight:
        "700",
      color:
        "#64748b",
    },

    moreButton: {
      width: 24,
      height: 24,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    optionsMenu: {
      position:
        "absolute",
      top: 24,
      right: 0,

      width: 150,

      borderWidth: 1,
      borderRadius: 10,

      paddingVertical: 4,

      zIndex: 100,
      elevation: 12,

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.20,
      shadowRadius: 16,
    },

    optionButton: {
      minHeight: 40,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
      paddingHorizontal: 12,
    },

    optionPressed: {
      backgroundColor:
        "rgba(148,163,184,0.08)",
    },

    optionDisabled: {
      opacity: 0.5,
    },

    optionText: {
      fontSize: 12,
      fontWeight:
        "600",
    },

    statusRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
      marginTop: 3,
    },

    statusItem: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 3,
    },

    pinnedText: {
      color:
        "#a855f7",
      fontSize: 10,
      fontWeight:
        "700",
      textTransform:
        "uppercase",
      letterSpacing:
        0.6,
    },

    editedText: {
      fontSize: 10,
      fontWeight:
        "500",
    },

    children: {
      marginLeft: 42,
      marginTop: 8,
      gap: 10,
    },

    replyHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
    },

    replyLine: {
      width: 20,
      height: 1,
      backgroundColor:
        "#e2e8f0",
    },

    replyHeaderText: {
      fontSize: 10,
      fontWeight:
        "600",
    },

    actionBar: {
      minHeight: 42,
      paddingHorizontal: 16,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      borderTopWidth: 1,
    },

    actionBarText: {
      flex: 1,
      fontSize: 11,
    },

    cancelText: {
      color:
        "#a855f7",
      fontSize: 11,
      fontWeight:
        "700",
    },

    emojiPicker: {
      borderTopWidth: 1,
      borderBottomWidth: 1,
      paddingVertical: 8,
    },

    emojiContent: {
      paddingHorizontal: 10,
      gap: 4,
    },

    emojiButton: {
      width: 38,
      height: 38,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 19,
    },

    emojiText: {
      fontSize: 23,
    },

    inputSection: {
      minHeight: 72,

      flexDirection:
        "row",
      alignItems:
        "flex-end",

      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 10,

      gap: 8,

      borderTopWidth: 1,
    },

    inputWrapper: {
      flex: 1,
      minHeight: 46,

      flexDirection:
        "row",
      alignItems:
        "flex-end",

      borderWidth: 1,
      borderRadius: 24,

      paddingLeft: 4,
      paddingRight: 4,
    },

    emojiTrigger: {
      width: 40,
      minHeight: 42,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    input: {
      flex: 1,
      maxHeight: 110,
      minHeight: 42,

      paddingHorizontal: 4,
      paddingVertical: 10,

      fontSize: 13,
      lineHeight: 19,
    },

    sendButton: {
      width: 42,
      height: 42,

      alignItems:
        "center",
      justifyContent:
        "center",
    },

    sendDisabled: {
      opacity: 0.45,
    },
  });

export default CommentModal;