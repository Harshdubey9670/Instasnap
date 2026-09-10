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
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Audio,
  ResizeMode,
  Video,
  type AVPlaybackStatus,
} from "expo-av";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import {
  router,
} from "expo-router";
import {
  useDispatch,
  useSelector,
} from "react-redux";
import {
  ArrowLeft,
  BarChart2,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Flag,
  Heart,
  Link as LinkIcon,
  Lock,
  MessageCircle,
  MoreVertical,
  Music,
  Pause,
  Play,
  Repeat,
  Search,
  Send,
  Settings,
  Trash2,
  UserMinus,
  UserX,
  Volume2,
  VolumeX,
  X,
} from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";

import api from "../../services/api";
import type { RootState } from "../../store/store";
import {
  updateMutedUsers,
} from "../../store/authSlice";
import {
  useToast,
} from "../ui/Toast";
import {
  Avatar,
  resolveImageSource,
} from "../ui/Avatar";

const STORY_DURATION = 5000;

interface StoryViewerUser {
  _id?: string;
  username?: string;
  profilePicture?: string;
  avatar?: string;
  [key: string]: any;
}

interface StoryViewerStory {
  _id?: string;
  createdAt?: string;
  media?: Array<{
    url?: string;
    type?: string;
    [key: string]: any;
  }>;
  music?: {
    audioUrl?: string;
    title?: string;
    artist?: string;
  };
  viewers?: Array<
    string | StoryViewerUser
  >;
  likes?: Array<
    string | StoryViewerUser
  >;
  allowReplies?: boolean;
  allowSharing?: boolean;
  allowDownload?: boolean;
  privacy?: string;
  [key: string]: any;
}

export interface StoryGroup {
  user: any;
  stories: StoryViewerStory[];
  [key: string]: any;
}

interface LiveLike {
  _id?: string;
}

interface StoryViewerProps {
  stories: StoryGroup[];
  initialUserIndex: number;
  onClose: () => void;
}

interface StoryAnalytics {
  completionRate?: number;
  stickerClicks?: number;
}

interface StoryComment {
  _id: string;
  text: string;
  createdAt: string;
  likes?: Array<
    string | StoryViewerUser
  >;
  user?: StoryViewerUser;
}

interface SearchUser {
  _id: string;
  username?: string;
  profilePicture?: string;
  avatar?: string;
}

type StoryModalType =
  | "menu"
  | "viewers"
  | "share"
  | "shareOptions"
  | "comments"
  | "insights"
  | "settings"
  | null;

const getEntityId = (
  value:
    | string
    | { _id?: string }
    | null
    | undefined,
): string | undefined => {
  if (!value) {
    return undefined;
  }

  return typeof value ===
    "string"
    ? value
    : value._id;
};

const getWebBaseUrl = () =>
  process.env
    .EXPO_PUBLIC_PUBLIC_URL ||
  process.env
    .EXPO_PUBLIC_API_URL ||
  "";

const getStoryUrl = (
  storyId: string,
) =>
  `${getWebBaseUrl()}/app/stories?id=${storyId}`;

export const StoryViewer = ({
  stories,
  initialUserIndex,
  onClose,
}: StoryViewerProps) => {
  const {
    user: authUser,
  } = useSelector(
    (state: RootState) =>
      state.auth,
  );

  const dispatch =
    useDispatch();

  const {
    toast,
  } = useToast();

  const [
    userIndex,
    setUserIndex,
  ] = useState(
    initialUserIndex,
  );

  const [
    storyIndex,
    setStoryIndex,
  ] = useState(0);

  const [
    isPaused,
    setIsPaused,
  ] = useState(false);

  const [
    isMuted,
    setIsMuted,
  ] = useState(false);

  const [
    isVideoLoading,
    setIsVideoLoading,
  ] = useState(false);

  const [
    progress,
    setProgress,
  ] = useState(0);

  const [
    visibleModal,
    setVisibleModal,
  ] =
    useState<StoryModalType>(
      null,
    );

  const [
    heartPop,
    setHeartPop,
  ] = useState(false);

  const [
    replyText,
    setReplyText,
  ] = useState("");

  const [
    isSending,
    setIsSending,
  ] = useState(false);

  const videoRef =
    useRef<Video>(null);

  const musicRef =
    useRef<Audio.Sound | null>(
      null,
    );

  const intervalRef =
    useRef<
      ReturnType<typeof setInterval> | null
    >(null);

  const doubleTapRef =
    useRef(0);

  const touchStartRef =
    useRef({
      x: 0,
      y: 0,
      time: 0,
    });

  const currentUserGroup =
    stories[userIndex];

  const currentStory =
    currentUserGroup?.stories[
      storyIndex
    ];

  const isOwnStory =
    currentUserGroup?.user?._id ===
    authUser?._id;

  const screen =
    Dimensions.get(
      "window",
    );

  const currentMediaUrl =
    currentStory?.media?.[0]
      ?.url || "";

  const isVideo =
    currentStory?.media?.[0]
      ?.type === "video";

  const previousUserGroup =
    userIndex > 0
      ? stories[userIndex - 1]
      : null;

  const nextUserGroup =
    userIndex <
    stories.length - 1
      ? stories[userIndex + 1]
      : null;

  const canGoPrevious =
    userIndex > 0 ||
    storyIndex > 0;

  const canGoNext =
    userIndex <
      stories.length - 1 ||
    storyIndex <
      (currentUserGroup
        ?.stories.length ||
        0) -
        1;

  const closeAllModals =
    useCallback(() => {
      setVisibleModal(
        null,
      );
      setIsPaused(
        false,
      );
    }, []);

  const goNext =
    useCallback(() => {
      if (!currentUserGroup) {
        onClose();
        return;
      }

      if (
        storyIndex <
        currentUserGroup
          .stories.length -
          1
      ) {
        setStoryIndex(
          (value) =>
            value + 1,
        );
        setProgress(0);
        return;
      }

      if (
        userIndex <
        stories.length - 1
      ) {
        setUserIndex(
          (value) =>
            value + 1,
        );
        setStoryIndex(
          0,
        );
        setProgress(0);
        return;
      }

      onClose();
    }, [
      currentUserGroup,
      onClose,
      stories.length,
      storyIndex,
      userIndex,
    ]);

  const goPrevious =
    useCallback(() => {
      if (
        storyIndex > 0
      ) {
        setStoryIndex(
          (value) =>
            value - 1,
        );
        setProgress(0);
        return;
      }

      if (
        userIndex > 0
      ) {
        const previous =
          stories[
            userIndex - 1
          ];

        setUserIndex(
          (value) =>
            value - 1,
        );

        setStoryIndex(
          previous
            .stories
            .length -
            1,
        );

        setProgress(0);
      }
    }, [
      stories,
      storyIndex,
      userIndex,
    ]);

  /*
   * Track the view exactly when the current story becomes active.
   */
  useEffect(() => {
    if (
      !currentStory ||
      !authUser?._id
    ) {
      return;
    }

    const alreadyViewed =
      currentStory.viewers?.some(
        (viewer) =>
          getEntityId(
            viewer,
          ) ===
          authUser._id,
      );

    if (alreadyViewed) {
      return;
    }

    api
      .put(
        `/api/stories/${currentStory._id}/view`,
      )
      .catch(
        (
          error,
        ) =>
          console.error(
            error,
          ),
      );

    /*
     * Preserve the original UI behavior by updating the local
     * viewer collection as soon as the story is displayed.
     */
    if (
      currentStory.viewers
    ) {
      currentStory.viewers.push(
        {
          _id: authUser._id || "",
          username: authUser.username,
          profilePicture: authUser.profilePicture,
          avatar: authUser.avatar,
        } as StoryViewerUser,
      );
    }
  }, [
    authUser,
    currentStory,
    isOwnStory,
  ]);

  /*
   * Reset player state whenever the story changes.
   */
  useEffect(() => {
    setProgress(0);
    setIsVideoLoading(
      false,
    );
    setReplyText("");
    setHeartPop(false);
    setVisibleModal(
      null,
    );
  }, [
    userIndex,
    storyIndex,
  ]);

  /*
   * Native music player replacement for the browser <audio>.
   */
  useEffect(() => {
    let cancelled =
      false;

    const syncMusic =
      async () => {
        await cleanupMusic();

        if (
          cancelled ||
          !currentStory
            ?.music
            ?.audioUrl ||
          !currentUserGroup
        ) {
          return;
        }

        try {
          const {
            sound,
          } =
            await Audio.Sound.createAsync(
              {
                uri: currentStory
                  .music
                  .audioUrl,
              },
              {
                shouldPlay:
                  !isPaused,
                isLooping:
                  true,
                isMuted:
                  isMuted,
                volume: 1,
              },
            );

          if (
            cancelled
          ) {
            await sound.unloadAsync();
            return;
          }

          musicRef.current =
            sound;
        } catch (error) {
          console.error(
            "Story music error:",
            error,
          );
        }
      };

    void syncMusic();

    return () => {
      cancelled = true;
      void cleanupMusic();
    };
  }, [
    currentStory?._id,
    currentStory?.music
      ?.audioUrl,
  ]);

  useEffect(() => {
    const syncMusicState =
      async () => {
        try {
          if (
            musicRef.current
          ) {
            await musicRef.current.setIsMutedAsync(
              isMuted,
            );

            if (isPaused) {
              await musicRef.current.pauseAsync();
            } else {
              await musicRef.current.playAsync();
            }
          }
        } catch {
          // Player may already be unloaded.
        }
      };

    void syncMusicState();
  }, [
    isMuted,
    isPaused,
  ]);

  const cleanupMusic =
    async () => {
      const sound =
        musicRef.current;

      if (!sound) {
        return;
      }

      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch {
        // Already stopped/unloaded.
      }

      musicRef.current =
        null;
    };

  useEffect(() => {
    return () => {
      if (
        intervalRef.current
      ) {
        clearInterval(
          intervalRef.current,
        );
      }

      void cleanupMusic();
    };
  }, []);

  /*
   * Image stories run for exactly 5000ms like the web implementation.
   * Videos advance when the native Video reports didJustFinish.
   */
  useEffect(() => {
    if (!currentStory) {
      return;
    }

    if (
      intervalRef.current
    ) {
      clearInterval(
        intervalRef.current,
      );
      intervalRef.current =
        null;
    }

    if (
      isPaused ||
      isVideoLoading ||
      isVideo
    ) {
      if (
        isPaused &&
        isVideo
      ) {
        void videoRef.current?.pauseAsync();
      }

      return;
    }

    const step = 50;

    intervalRef.current =
      setInterval(() => {
        setProgress(
          (
            previous,
          ) => {
            const next =
              previous +
              (step /
                STORY_DURATION) *
                100;

            if (
              next >=
              100
            ) {
              if (
                intervalRef.current
              ) {
                clearInterval(
                  intervalRef.current,
                );
                intervalRef.current =
                  null;
              }

              requestAnimationFrame(
                () =>
                  goNext(),
              );

              return 100;
            }

            return next;
          },
        );
      }, step);

    return () => {
      if (
        intervalRef.current
      ) {
        clearInterval(
          intervalRef.current,
        );
        intervalRef.current =
          null;
      }
    };
  }, [
    currentStory,
    goNext,
    isPaused,
    isVideo,
    isVideoLoading,
  ]);

  useEffect(() => {
    if (
      !currentUserGroup ||
      !currentStory
    ) {
      onClose();
    }
  }, [
    currentStory,
    currentUserGroup,
    onClose,
  ]);

  const handleVideoStatus =
    (
      status: AVPlaybackStatus,
    ) => {
      if (
        !status.isLoaded
      ) {
        setIsVideoLoading(false);
        return;
      }

      const duration =
        status.durationMillis ||
        0;

      if (
        duration > 0
      ) {
        setProgress(
          (status.positionMillis /
            duration) *
            100,
        );
      }

      setIsVideoLoading(
        status.isBuffering,
      );

      if (
        status.didJustFinish
      ) {
        goNext();
      }
    };

  useEffect(() => {
    if (
      !videoRef.current ||
      !isVideo
    ) {
      return;
    }

    const sync =
      async () => {
        try {
          await videoRef.current?.setIsMutedAsync(
            isMuted,
          );

          if (isPaused) {
            await videoRef.current?.pauseAsync();
          } else {
            await videoRef.current?.playAsync();
          }
        } catch {
          // Player may not yet be ready.
        }
      };

    void sync();
  }, [
    isMuted,
    isPaused,
    isVideo,
    currentStory?._id,
  ]);

  const openProfile =
    (userId?: string) => {
      if (!userId) {
        return;
      }

      onClose();

      router.push(
        `/app/profile/${userId}` as any,
      );
    };

  const handleMuteUser =
    async () => {
      if (
        !currentUserGroup
          ?.user?._id
      ) {
        return;
      }

      try {
        const response =
          await api.post(
            `/api/users/${currentUserGroup.user._id}/mute`,
          );

        if (
          response.data
            ?.mutedUsers
        ) {
          dispatch(
            updateMutedUsers(
              response.data
                .mutedUsers,
            ),
          );
        }

        toast({
          variant:
            "success",
          title:
            "User Muted",
          description:
            `Muted ${currentUserGroup.user.username}'s stories`,
        });

        setVisibleModal(
          null,
        );
        setIsPaused(false);
      } catch (error: any) {
        toast({
          variant:
            "error",
          title:
            "Error",
          description:
            error?.response
              ?.data
              ?.message ||
            "Failed to mute user",
        });
      }
    };

  const handleUnfollowUser =
    async () => {
      if (
        !currentUserGroup
          ?.user?._id
      ) {
        return;
      }

      try {
        await api.post(
          `/api/users/${currentUserGroup.user._id}/follow`,
        );

        toast({
          variant:
            "success",
          title:
            "Unfollowed",
          description:
            `You unfollowed @${currentUserGroup.user.username}`,
        });

        setVisibleModal(
          null,
        );
        setIsPaused(false);
      } catch {
        toast({
          variant:
            "error",
          title:
            "Error",
          description:
            "Failed to unfollow user",
        });
      }
    };

  const handleBlockUser =
    async () => {
      if (
        !currentUserGroup
          ?.user?._id
      ) {
        return;
      }

      try {
        await api.post(
          `/api/users/${currentUserGroup.user._id}/block`,
        );

        toast({
          variant:
            "success",
          title:
            "Blocked",
          description:
            `Blocked @${currentUserGroup.user.username}`,
        });

        setVisibleModal(
          null,
        );
        onClose();
      } catch {
        toast({
          variant:
            "error",
          title:
            "Error",
          description:
            "Failed to block user",
        });
      }
    };

  const handleReportStory =
    async () => {
      if (
        !currentUserGroup
          ?.user?._id
      ) {
        return;
      }

      try {
        await api.post(
          `/api/users/${currentUserGroup.user._id}/report`,
          {
            reason:
              "Inappropriate Story Content",
          },
        );

        toast({
          variant:
            "success",
          title:
            "Reported",
          description:
            "Story reported successfully",
        });

        setVisibleModal(
          null,
        );
        setIsPaused(false);
      } catch (error: any) {
        toast({
          variant:
            "error",
          title:
            "Error",
          description:
            error?.response
              ?.data
              ?.message ||
            "Failed to report story",
        });
      }
    };

  const handleDeleteStory =
    () => {
      if (
        !currentStory
          ? false
          : true
      ) {
        Alert.alert(
          "Delete Story",
          "Are you sure you want to delete this story?",
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
                    await api.delete(
                      `/api/stories/${currentStory._id}`,
                    );

                    toast({
                      variant:
                        "success",
                      title:
                        "Deleted",
                      description:
                        "Story deleted successfully",
                    });

                    setVisibleModal(
                      null,
                    );
                    onClose();
                  } catch {
                    toast({
                      variant:
                        "error",
                      title:
                        "Error",
                      description:
                        "Failed to delete story",
                    });
                  }
                },
            },
          ],
        );
      }
    };

  const handleCopyStoryLink =
    async () => {
      if (!currentStory) {
        return;
      }

      const link =
        getStoryUrl(
          currentStory._id || "",
        );

      try {
        await Clipboard.setStringAsync(
          link,
        );

        toast({
          variant:
            "success",
          title:
            "Copied!",
          description:
            "Story link copied to clipboard",
        });

        setVisibleModal(
          null,
        );
        setIsPaused(false);
      } catch {
        toast({
          variant:
            "error",
          title:
            "Failed",
          description:
            "Could not copy story link",
        });
      }
    };

  const handleExternalShare =
    async () => {
      if (!currentStory) {
        return;
      }

      const link =
        getStoryUrl(
          currentStory._id || "",
        );

      try {
        const { Share } = require("react-native");
        await Share.share({
          title: `@${currentUserGroup?.user.username}'s Story`,
          message: `Check out @${currentUserGroup?.user.username}'s story on InstaSnap!\n${link}`,
          url: link,
        });
      } catch (error) {
        console.error(
          error,
        );
      }

      setVisibleModal(
        null,
      );
      setIsPaused(false);
    };

  const handleShareToOwnStory =
    () => {
      if (!currentStory) {
        return;
      }

      if (
        currentStory.allowSharing ===
        false
      ) {
        toast({
          variant:
            "error",
          title:
            "Restricted",
          description:
            "The owner has disabled reposting for this story",
        });
        return;
      }

      setVisibleModal(
        null,
      );
      setIsPaused(
        false,
      );

      onClose();

      router.push({
        pathname:
          "/app/create-story",
        params: {
          repostUrl:
            currentMediaUrl,
          author:
            currentUserGroup
              ?.user
              .username ||
            "",
        },
      } as any);
    };

  const handleSaveMedia =
    async () => {
      if (!currentStory) {
        return;
      }

      if (
        currentStory.allowDownload ===
        false
      ) {
        toast({
          variant:
            "error",
          title:
            "Restricted",
          description:
            "The owner has disabled saving for this story",
        });
        return;
      }

      if (!currentMediaUrl) {
        return;
      }

      try {
        const permission =
          await MediaLibrary.requestPermissionsAsync();

        if (
          !permission.granted
        ) {
          toast({
            variant:
              "error",
            title:
              "Permission required",
            description:
              "Allow photo/video access to save this story.",
          });
          return;
        }

        const extension =
          isVideo
            ? "mp4"
            : "jpg";

        const localUri =
          `${FileSystem.cacheDirectory}instasnap-story-${currentStory._id}.${extension}`;

        const download =
          await FileSystem.downloadAsync(
            currentMediaUrl,
            localUri,
          );

        await MediaLibrary.saveToLibraryAsync(
          download.uri,
        );

        toast({
          variant:
            "success",
          title:
            "Saved!",
          description:
            "Story media saved to your device",
        });
      } catch (error) {
        console.error(
          error,
        );

        toast({
          variant:
            "error",
          title:
            "Error",
          description:
            "Failed to save story media",
        });
      } finally {
        setVisibleModal(
          null,
        );
        setIsPaused(false);
      }
    };

  const [
    likes,
    setLikes,
  ] = useState<
    Array<
      string | StoryViewerUser
    >
  >(
    currentStory?.likes ||
      [],
  );

  useEffect(() => {
    setLikes(
      currentStory?.likes ||
        [],
    );
  }, [
    currentStory?._id,
    currentStory?.likes,
  ]);

  const isLiked =
    Boolean(
      authUser?._id &&
        likes.some(
          (like) =>
            getEntityId(
              like,
            ) ===
            authUser._id,
        ),
    );

  const showHeartAnimation =
    () => {
      setHeartPop(
        true,
      );

      setTimeout(
        () =>
          setHeartPop(
            false,
          ),
        900,
      );
    };

  const handleToggleLike =
    async () => {
      if (
        !currentStory ||
        !authUser?._id
      ) {
        return;
      }

      const previous =
        [...likes];

      const currentlyLiked =
        previous.some(
          (like) =>
            getEntityId(
              like,
            ) ===
            authUser._id,
        );

      if (
        currentlyLiked
      ) {
        setLikes(
          previous.filter(
            (like) =>
              getEntityId(
                like,
              ) !==
              authUser._id,
          ),
        );
      } else {
        setLikes([
          ...previous,
          authUser._id,
        ]);

        showHeartAnimation();
      }

      try {
        const response =
          await api.post(
            `/api/stories/${currentStory._id}/like`,
          );

        if (
          Array.isArray(
            response.data
              ?.likes,
          )
        ) {
          setLikes(
            response.data
              .likes,
          );
        }
      } catch (error: any) {
        setLikes(
          previous,
        );

        toast({
          variant:
            "error",
          title:
            "Error",
          description:
            error?.response
              ?.data
              ?.message ||
            "Failed to update like status",
        });
      }
    };

  const sendReaction =
    async (
      message: string,
    ) => {
      const trimmed =
        message.trim();

      if (
        !trimmed ||
        !currentStory ||
        isSending
      ) {
        return;
      }

      setIsSending(
        true,
      );
      setIsPaused(
        true,
      );

      try {
        await api.post(
          `/api/stories/${currentStory._id}/reply`,
          {
            message:
              trimmed,
          },
        );

        toast({
          variant:
            "success",
          title:
            "Sent",
          description:
            trimmed.length > 2
              ? `Replied: ${trimmed}`
              : `Reacted with ${trimmed}`,
        });

        setReplyText(
          "",
        );
      } catch {
        toast({
          variant:
            "error",
          title:
            "Failed to send",
          description:
            "Please try again.",
        });
      } finally {
        setIsSending(
          false,
        );
        setIsPaused(
          false,
        );
      }
    };

  /*
   * Story comments.
   */
  const [
    comments,
    setComments,
  ] = useState<
    StoryComment[]
  >([]);

  const [
    loadingComments,
    setLoadingComments,
  ] = useState(false);

  const fetchComments =
    async () => {
      if (
        !currentStory
      ) {
        return;
      }

      setLoadingComments(
        true,
      );

      try {
        const response =
          await api.get(
            `/api/stories/${currentStory._id}/comments`,
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
      } catch (error) {
        console.error(
          "Failed to load story comments:",
          error,
        );
      } finally {
        setLoadingComments(
          false,
        );
      }
    };

  useEffect(() => {
    if (
      visibleModal ===
      "comments"
    ) {
      void fetchComments();
    }
  }, [
    visibleModal,
    currentStory?._id,
  ]);

  const handleDeleteComment =
    async (
      commentId: string,
    ) => {
      try {
        await api.delete(
          `/api/stories/comments/${commentId}`,
        );

        setComments(
          (
            previous,
          ) =>
            previous.filter(
              (
                comment,
              ) =>
                comment._id !==
                commentId,
            ),
        );

        toast({
          variant:
            "success",
          title:
            "Deleted",
          description:
            "Reply deleted",
        });
      } catch {
        toast({
          variant:
            "error",
          title:
            "Error",
          description:
            "Failed to delete reply",
        });
      }
    };

  const handleToggleCommentLike =
    async (
      commentId: string,
    ) => {
      if (!authUser?._id) {
        return;
      }

      try {
        await api.post(
          `/api/stories/comments/${commentId}/like`,
        );

        setComments(
          (
            previous,
          ) =>
            previous.map(
              (
                comment,
              ) => {
                if (
                  comment._id !==
                  commentId
                ) {
                  return comment;
                }

                const commentLiked =
                  (
                    comment.likes ||
                    []
                  ).some(
                    (
                      like,
                    ) =>
                      getEntityId(
                        like,
                      ) ===
                      authUser._id,
                  );

                const updatedLikes =
                  commentLiked
                    ? (
                        comment.likes ||
                        []
                      ).filter(
                        (
                          like,
                        ) =>
                          getEntityId(
                            like,
                          ) !==
                          authUser._id,
                      )
                    : [
                        ...(
                          comment.likes ||
                          []
                        ),
                        authUser._id,
                      ];

                return {
                  ...comment,
                  likes:
                    updatedLikes,
                };
              },
            ),
        );
      } catch {
        // Preserve existing silent-error behavior.
      }
    };

  const handleReportComment =
    async (
      commentId: string,
    ) => {
      try {
        await api.post(
          `/api/stories/comments/${commentId}/report`,
          {
            reason:
              "Inappropriate story reply",
          },
        );

        toast({
          variant:
            "success",
          title:
            "Reported",
          description:
            "Reply reported to moderators",
        });
      } catch {
        toast({
          variant:
            "error",
          title:
            "Error",
          description:
            "Failed to report reply",
        });
      }
    };

  /*
   * Analytics.
   */
  const [
    insights,
    setInsights,
  ] =
    useState<StoryAnalytics | null>(
      null,
    );

  const [
    loadingInsights,
    setLoadingInsights,
  ] = useState(false);

  useEffect(() => {
    if (
      visibleModal !==
        "insights" ||
      !currentStory
    ) {
      return;
    }

    const load =
      async () => {
        setLoadingInsights(
          true,
        );

        try {
          const response =
            await api.get(
              `/api/stories/${currentStory._id}/analytics`,
            );

          if (
            response.data
              ?.success
          ) {
            setInsights(
              response.data
                .data,
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Failed to load story analytics:",
            error,
          );
        } finally {
          setLoadingInsights(
            false,
          );
        }
      };

    void load();
  }, [
    currentStory?._id,
    visibleModal,
  ]);

  /*
   * Share-to-user search.
   */
  const [
    userSearchQuery,
    setUserSearchQuery,
  ] = useState("");

  const [
    searchResults,
    setSearchResults,
  ] = useState<
    SearchUser[]
  >([]);

  const [
    selectedUsers,
    setSelectedUsers,
  ] = useState<
    SearchUser[]
  >([]);

  const [
    shareNote,
    setShareNote,
  ] = useState("");

  const [
    isSharing,
    setIsSharing,
  ] = useState(false);

  useEffect(() => {
    if (
      !userSearchQuery.trim()
    ) {
      setSearchResults(
        [],
      );
      return;
    }

    const timer =
      setTimeout(
        async () => {
          try {
            const response =
              await api.get(
                `/api/search/users?q=${encodeURIComponent(
                  userSearchQuery,
                )}`,
              );

            setSearchResults(
              response.data
                ?.data ||
                response.data ||
                [],
            );
          } catch (
            error
          ) {
            console.error(
              error,
            );
          }
        },
        300,
      );

    return () =>
      clearTimeout(
        timer,
      );
  }, [
    userSearchQuery,
  ]);

  const toggleSelectUser =
    (
      user: SearchUser,
    ) => {
      setSelectedUsers(
        (
          previous,
        ) => {
          const exists =
            previous.some(
              (
                item,
              ) =>
                item._id ===
                user._id,
            );

          if (
            exists
          ) {
            return previous.filter(
              (
                item,
              ) =>
                item._id !==
                user._id,
            );
          }

          return [
            ...previous,
            user,
          ];
        },
      );
    };

  const handleShareStoryToUser =
    async () => {
      if (
        !currentStory ||
        selectedUsers.length ===
          0 ||
        isSharing
      ) {
        return;
      }

      setIsSharing(
        true,
      );

      try {
        await api.post(
          `/api/stories/${currentStory._id}/share`,
          {
            recipientIds:
              selectedUsers.map(
                (
                  user,
                ) =>
                  user._id,
              ),
            message:
              shareNote,
          },
        );

        toast({
          variant:
            "success",
          title:
            "Shared!",
          description:
            `Story shared to ${selectedUsers.length} recipient${
              selectedUsers.length >
              1
                ? "s"
                : ""
            }`,
        });

        setVisibleModal(
          null,
        );
        setSelectedUsers(
          [],
        );
        setShareNote(
          "",
        );
        setUserSearchQuery(
          "",
        );
        setIsPaused(
          false,
        );
      } catch {
        toast({
          variant:
            "error",
          title:
            "Error",
          description:
            "Failed to share story",
        });
      } finally {
        setIsSharing(
          false,
        );
      }
    };

  const [
    viewerSearch,
    setViewerSearch,
  ] = useState("");

  /*
   * The original source checks viewer.username. A viewer may also be
   * represented as only an id, so those entries remain visible as User.
   */
  const filteredViewers =
    (
      currentStory
        ?.viewers || []
    ).filter(
      (
        viewer,
      ) => {
        if (
          typeof viewer ===
          "string"
        ) {
          return true;
        }

        return (
          viewer?.username
            ?.toLowerCase()
            .includes(
              (viewerSearch || "")
                .toLowerCase(),
            ) ??
          false
        );
      },
    );

  const panResponder =
    useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder:
            () =>
              visibleModal ===
              null,
          onMoveShouldSetPanResponder:
            () =>
              visibleModal ===
              null,
          onPanResponderGrant:
            (
              event,
            ) => {
              const {
                pageX,
                pageY,
              } =
                event.nativeEvent;

              touchStartRef.current =
                {
                  x: pageX,
                  y: pageY,
                  time:
                    Date.now(),
                };

              setIsPaused(
                true,
              );
            },
          onPanResponderRelease:
            (
              event,
            ) => {
              const {
                pageX,
                pageY,
              } =
                event.nativeEvent;

              const deltaX =
                pageX -
                touchStartRef.current
                  .x;

              const deltaY =
                pageY -
                touchStartRef.current
                  .y;

              const deltaTime =
                Date.now() -
                touchStartRef.current
                  .time;

              setIsPaused(
                false,
              );

              if (
                Math.abs(
                  deltaY,
                ) >
                  120 &&
                Math.abs(
                  deltaX,
                ) <
                  100 &&
                deltaY > 0
              ) {
                onClose();
                return;
              }

              if (
                deltaX <
                  -80 &&
                Math.abs(
                  deltaY,
                ) <
                  100
              ) {
                if (
                  userIndex <
                  stories.length -
                    1
                ) {
                  setUserIndex(
                    (
                      value,
                    ) =>
                      value + 1,
                  );
                  setStoryIndex(
                    0,
                  );
                  setProgress(
                    0,
                  );
                } else {
                  onClose();
                }

                return;
              }

              if (
                deltaX >
                  80 &&
                Math.abs(
                  deltaY,
                ) <
                  100
              ) {
                if (
                  userIndex >
                  0
                ) {
                  const previous =
                    stories[
                      userIndex -
                        1
                    ];

                  setUserIndex(
                    (
                      value,
                    ) =>
                      value - 1,
                  );

                  setStoryIndex(
                    previous
                      .stories
                      .length -
                      1,
                  );

                  setProgress(
                    0,
                  );
                }

                return;
              }

              /*
               * Tap behavior:
               * left 35% → previous
               * otherwise → next
               */
              if (
                deltaTime <
                  300 &&
                Math.abs(
                  deltaX,
                ) <
                  15 &&
                Math.abs(
                  deltaY,
                ) <
                  15
              ) {
                if (
                  pageX <
                  screen.width *
                    0.35
                ) {
                  goPrevious();
                } else {
                  goNext();
                }
              }
            },
          onPanResponderTerminate:
            () =>
              setIsPaused(
                false,
              ),
        }),
      [
        goNext,
        goPrevious,
        onClose,
        screen.width,
        stories,
        userIndex,
        visibleModal,
      ],
    );

  const currentStoryPosition =
    currentUserGroup
      ? currentUserGroup.stories.findIndex(
          (
            item,
          ) =>
            item._id ===
            currentStory?._id,
        )
      : 0;

  /*
   * Double tap on the story.
   */
  const handleStoryTap =
    () => {
      const now =
        Date.now();

      const previous =
        doubleTapRef.current;

      doubleTapRef.current =
        now;

      if (
        now - previous <
        300
      ) {
        if (
          !isLiked
        ) {
          void handleToggleLike();
        } else {
          showHeartAnimation();
        }

        return;
      }

      setTimeout(
        () => {
          if (
            Date.now() -
              doubleTapRef.current >=
            280
          ) {
            /*
             * Single tap is handled by the gesture responder.
             */
          }
        },
        300,
      );
    };

  if (
    !currentUserGroup ||
    !currentStory
  ) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={
        onClose
      }
    >
      <View
        style={
          styles.root
        }
      >
        <View
          style={
            styles.viewerBackground
          }
        />

        <View
          style={
            styles.viewerContent
          }
          {...panResponder.panHandlers}
        >
          <View
            style={
              styles.storyCard
            }
          >
            {/* Story media */}
            <View
              style={
                styles.mediaContainer
              }
            >
              {isVideo ? (
                <Video
                  ref={
                    videoRef
                  }
                  source={{
                    uri:
                      currentMediaUrl,
                  }}
                  style={
                    styles.media
                  }
                  resizeMode={
                    ResizeMode.COVER
                  }
                  shouldPlay={
                    !isPaused
                  }
                  isLooping={
                    false
                  }
                  isMuted={
                    isMuted
                  }
                  onPlaybackStatusUpdate={
                    handleVideoStatus
                  }
                  onLoadStart={() =>
                    setIsVideoLoading(
                      true,
                    )
                  }
                />
              ) : (
                <Image
                  source={
                    resolveImageSource(currentMediaUrl) || {
                      uri: currentMediaUrl,
                    }
                  }
                  style={
                    styles.media
                  }
                  resizeMode="cover"
                  accessibilityLabel="Story"
                />
              )}

              {isVideoLoading &&
              isVideo ? (
                <View
                  style={
                    styles.videoLoading
                  }
                >
                  <ActivityIndicator
                    size="large"
                    color="#ffffff"
                  />
                </View>
              ) : null}

              <View
                pointerEvents="none"
                style={
                  styles.topGradient
                }
              />

              <View
                pointerEvents="none"
                style={
                  styles.bottomGradient
                }
              />

              {heartPop ? (
                <View
                  pointerEvents="none"
                  style={
                    styles.heartPop
                  }
                >
                  <AnimatedHeart />
                </View>
              ) : null}
            </View>

            {/* Progress */}
            <View
              style={
                styles.progressContainer
              }
            >
              {currentUserGroup.stories.map(
                (
                  story,
                  index,
                ) => {
                  let width =
                    "0%";

                  if (
                    index <
                    currentStoryPosition
                  ) {
                    width =
                      "100%";
                  } else if (
                    index ===
                    currentStoryPosition
                  ) {
                    width = `${progress}%`;
                  }

                  return (
                    <View
                      key={
                        story._id
                      }
                      style={
                        styles.progressTrack
                      }
                    >
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: width as any,
                          },
                        ]}
                      />
                    </View>
                  );
                },
              )}
            </View>

            {/* Header */}
            <View
              style={
                styles.header
              }
            >
              <Pressable
                onPress={() =>
                  openProfile(
                    currentUserGroup
                      .user
                      ._id,
                  )
                }
                style={
                  styles.userInfo
                }
              >
                <View
                  style={
                    styles.avatarRing
                  }
                >
                  <Avatar
                    src={
                      currentUserGroup
                        .user
                        .profilePicture ||
                      currentUserGroup
                        .user
                        .avatar
                    }
                    size="sm"
                    fallback={
                      currentUserGroup
                        .user
                        .username
                        ?.charAt(
                          0,
                        )
                        ?.toUpperCase() ||
                      "U"
                    }
                  />
                </View>

                <View
                  style={
                    styles.headerText
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
                      {
                        currentUserGroup
                          .user
                          .username
                      }
                    </Text>

                    <Text
                      style={
                        styles.timeAgo
                      }
                    >
                      {formatDistanceToNow(
                        new Date(
                          currentStory.createdAt || Date.now(),
                        ),
                        {
                          addSuffix:
                            true,
                        },
                      ).replace(
                        "about ",
                        "",
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.musicRow
                    }
                  >
                    <Music
                      size={12}
                      color="#ffffff"
                    />

                    <Text
                      style={
                        styles.musicText
                      }
                      numberOfLines={
                        1
                      }
                    >
                      {currentStory
                        .music
                        ?.title
                        ? `${currentStory.music.title} • ${currentStory.music.artist || ""}`
                        : "Original Audio"}
                    </Text>
                  </View>
                </View>
              </Pressable>

              <View
                style={
                  styles.headerActions
                }
              >
                <Pressable
                  onPress={() =>
                    setIsPaused(
                      (
                        value,
                      ) =>
                        !value,
                    )
                  }
                  style={
                    styles.iconButton
                  }
                  accessibilityRole="button"
                  accessibilityLabel={
                    isPaused
                      ? "Play story"
                      : "Pause story"
                  }
                >
                  {isPaused ? (
                    <Play
                      size={20}
                      color="#ffffff"
                      fill="#ffffff"
                    />
                  ) : (
                    <Pause
                      size={20}
                      color="#ffffff"
                      fill="#ffffff"
                    />
                  )}
                </Pressable>

                <Pressable
                  onPress={() =>
                    setIsMuted(
                      (
                        value,
                      ) =>
                        !value,
                    )
                  }
                  style={
                    styles.iconButton
                  }
                  accessibilityRole="button"
                  accessibilityLabel={
                    isMuted
                      ? "Unmute"
                      : "Mute"
                  }
                >
                  {isMuted ? (
                    <VolumeX
                      size={20}
                      color="#fb7185"
                    />
                  ) : (
                    <Volume2
                      size={20}
                      color="#ffffff"
                    />
                  )}
                </Pressable>

                <Pressable
                  onPress={() => {
                    setIsPaused(
                      true,
                    );
                    setVisibleModal(
                      "menu",
                    );
                  }}
                  style={
                    styles.iconButton
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Story options"
                >
                  <MoreVertical
                    size={20}
                    color="#ffffff"
                  />
                </Pressable>

                <Pressable
                  onPress={
                    onClose
                  }
                  style={
                    styles.iconButton
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Close story viewer"
                >
                  <X
                    size={21}
                    color="#ffffff"
                  />
                </Pressable>
              </View>
            </View>

            {/* Desktop-like navigation arrows remain useful on tablets */}
            {canGoPrevious ? (
              <Pressable
                onPress={
                  goPrevious
                }
                style={[
                  styles.navigationButton,
                  styles.leftNavigation,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Previous story"
              >
                <ChevronLeft
                  size={30}
                  color="#ffffff"
                />
              </Pressable>
            ) : null}

            {canGoNext ? (
              <Pressable
                onPress={
                  goNext
                }
                style={[
                  styles.navigationButton,
                  styles.rightNavigation,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Next story"
              >
                <ChevronRight
                  size={30}
                  color="#ffffff"
                />
              </Pressable>
            ) : null}

            {/* Footer */}
            <View
              style={
                styles.footer
              }
            >
              {isOwnStory ? (
                <View
                  style={
                    styles.ownFooter
                  }
                >
                  <Pressable
                    onPress={() => {
                      setIsPaused(
                        true,
                      );
                      setVisibleModal(
                        "viewers",
                      );
                    }}
                    style={
                      styles.viewerButton
                    }
                  >
                    <Eye
                      size={17}
                      color="#a855f7"
                    />

                    <Text
                      style={
                        styles.viewerButtonText
                      }
                    >
                      Seen by{" "}
                      {currentStory
                        .viewers
                        ?.length ||
                        0}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setIsPaused(
                        true,
                      );
                      setVisibleModal(
                        "shareOptions",
                      );
                    }}
                    style={
                      styles.circularAction
                    }
                  >
                    <ShareIconNative />
                  </Pressable>
                </View>
              ) : (
                <View
                  style={
                    styles.replyFooter
                  }
                >
                  {currentStory.allowReplies ===
                  false ? (
                    <View
                      style={
                        styles.replyDisabled
                      }
                    >
                      <Text
                        style={
                          styles.replyDisabledText
                        }
                      >
                        Replies are disabled
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={
                        styles.replyInputWrap
                      }
                    >
                      <TextInput
                        value={
                          replyText
                        }
                        onChangeText={
                          setReplyText
                        }
                        placeholder={`Reply to ${currentUserGroup.user.username}...`}
                        placeholderTextColor="rgba(255,255,255,0.90)"
                        onFocus={() => {
                          setIsPaused(
                            true,
                          );
                        }}
                        onBlur={() => {
                          if (
                            !visibleModal
                          ) {
                            setIsPaused(
                              false,
                            );
                          }
                        }}
                        onSubmitEditing={() =>
                          void sendReaction(
                            replyText,
                          )
                        }
                        returnKeyType="send"
                        style={
                          styles.replyInput
                        }
                      />
                    </View>
                  )}

                  <Pressable
                    onPress={() => {
                      setIsPaused(
                        true,
                      );
                      setVisibleModal(
                        "comments",
                      );
                    }}
                    style={
                      styles.footerIcon
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Story comments"
                  >
                    <MessageCircle
                      size={24}
                      color="#ffffff"
                    />
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      void handleToggleLike()
                    }
                    style={
                      styles.likeFooter
                    }
                    accessibilityRole="button"
                    accessibilityLabel={
                      isLiked
                        ? "Unlike story"
                        : "Like story"
                    }
                  >
                    <Heart
                      size={28}
                      color={
                        isLiked
                          ? "#f43f5e"
                          : "#ffffff"
                      }
                      fill={
                        isLiked
                          ? "#f43f5e"
                          : "none"
                      }
                    />

                    {likes.length >
                    0 ? (
                      <Text
                        style={[
                          styles.likeCount,
                          {
                            color:
                              isLiked
                                ? "#fb7185"
                                : "#ffffff",
                          },
                        ]}
                      >
                        {
                          likes.length
                        }
                      </Text>
                    ) : null}
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setIsPaused(
                        true,
                      );
                      setVisibleModal(
                        "shareOptions",
                      );
                    }}
                    style={
                      styles.footerIcon
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Share story"
                  >
                    <Send
                      size={28}
                      color="#ffffff"
                      style={{
                        transform: [
                          {
                            rotate:
                              "-12deg",
                          },
                        ],
                      }}
                    />
                  </Pressable>
                </View>
              )}
            </View>

            {/* Quick reactions */}
            {!isOwnStory &&
            currentStory.allowReplies !==
              false ? (
              <View
                style={
                  styles.quickReactions
                }
              >
                {[
                  "❤️",
                  "😂",
                  "😮",
                  "😢",
                  "👏",
                  "🔥",
                ].map(
                  (
                    emoji,
                  ) => (
                    <Pressable
                      key={
                        emoji
                      }
                      onPress={() =>
                        void sendReaction(
                          emoji,
                        )
                      }
                      style={
                        styles.reactionButton
                      }
                    >
                      <Text
                        style={
                          styles.reactionEmoji
                        }
                      >
                        {
                          emoji
                        }
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>
            ) : null}
          </View>
        </View>

        {/* Main options sheet */}
        <StoryOptionsModal
          visible={
            visibleModal ===
            "menu"
          }
          isOwnStory={
            isOwnStory
          }
          story={
            currentStory
          }
          username={
            currentUserGroup
              .user
              .username ||
            "user"
          }
          onClose={
            closeAllModals
          }
          onViewers={() =>
            setVisibleModal(
              "viewers",
            )
          }
          onInsights={() =>
            setVisibleModal(
              "insights",
            )
          }
          onShare={() =>
            setVisibleModal(
              "shareOptions",
            )
          }
          onSave={() =>
            void handleSaveMedia()
          }
          onSettings={() =>
            setVisibleModal(
              "settings",
            )
          }
          onDelete={
            handleDeleteStory
          }
          onCopyLink={
            handleCopyStoryLink
          }
          onMute={
            handleMuteUser
          }
          onUnfollow={
            handleUnfollowUser
          }
          onReport={
            handleReportStory
          }
          onBlock={
            handleBlockUser
          }
        />

        <ViewersModal
          visible={
            visibleModal ===
            "viewers"
          }
          story={
            currentStory
          }
          likes={
            likes
          }
          search={
            viewerSearch
          }
          onSearchChange={
            setViewerSearch
          }
          viewers={
            filteredViewers
          }
          onClose={
            closeAllModals
          }
        />

        <ShareOptionsModal
          visible={
            visibleModal ===
            "shareOptions"
          }
          story={
            currentStory
          }
          onClose={
            closeAllModals
          }
          onSendToChat={() =>
            setVisibleModal(
              "share",
            )
          }
          onCopyLink={
            handleCopyStoryLink
          }
          onExternalShare={
            handleExternalShare
          }
          onOwnStory={
            handleShareToOwnStory
          }
          onSave={() =>
            void handleSaveMedia()
          }
        />

        <ShareUsersModal
          visible={
            visibleModal ===
            "share"
          }
          selectedUsers={
            selectedUsers
          }
          searchResults={
            searchResults
          }
          query={
            userSearchQuery
          }
          note={
            shareNote
          }
          isSharing={
            isSharing
          }
          onQueryChange={
            setUserSearchQuery
          }
          onNoteChange={
            setShareNote
          }
          onToggleUser={
            toggleSelectUser
          }
          onSend={() =>
            void handleShareStoryToUser()
          }
          onClose={() => {
            setSelectedUsers(
              [],
            );
            setShareNote(
              "",
            );
            setUserSearchQuery(
              "",
            );
            closeAllModals();
          }}
        />

        <StoryCommentsModal
          visible={
            visibleModal ===
            "comments"
          }
          comments={
            comments
          }
          loading={
            loadingComments
          }
          authUserId={
            authUser?._id
          }
          isOwnStory={
            isOwnStory
          }
          onClose={
            closeAllModals
          }
          onLike={
            handleToggleCommentLike
          }
          onDelete={
            handleDeleteComment
          }
          onReport={
            handleReportComment
          }
        />

        <StoryInsightsModal
          visible={
            visibleModal ===
            "insights"
          }
          story={
            currentStory
          }
          likesCount={
            likes.length
          }
          insights={
            insights
          }
          loading={
            loadingInsights
          }
          onClose={
            closeAllModals
          }
        />

        <StorySettingsModal
          visible={
            visibleModal ===
            "settings"
          }
          story={
            currentStory
          }
          onClose={
            closeAllModals
          }
        />
      </View>
    </Modal>
  );
};

const AnimatedHeart =
  () => {
    const scale =
      useRef(
        new Animated.Value(
          0,
        ),
      ).current;

    const opacity =
      useRef(
        new Animated.Value(
          0,
        ),
      ).current;

    useEffect(() => {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(
            scale,
            {
              toValue: 1.4,
              duration: 250,
              useNativeDriver:
                true,
            },
          ),
          Animated.timing(
            scale,
            {
              toValue: 1,
              duration: 120,
              useNativeDriver:
                true,
            },
          ),
        ]),
        Animated.sequence([
          Animated.timing(
            opacity,
            {
              toValue: 1,
              duration: 120,
              useNativeDriver:
                true,
            },
          ),
          Animated.timing(
            opacity,
            {
              toValue: 0,
              duration: 620,
              delay: 80,
              useNativeDriver:
                true,
            },
          ),
        ]),
      ]).start();
    }, [
      opacity,
      scale,
    ]);

    return (
      <Animated.View
        style={{
          opacity,
          transform: [
            {
              scale,
            },
          ],
        }}
      >
        <Heart
          size={112}
          color="#f43f5e"
          fill="#f43f5e"
        />
      </Animated.View>
    );
  };

interface StoryOptionsModalProps {
  visible: boolean;
  isOwnStory: boolean;
  story: StoryViewerStory;
  username: string;
  onClose: () => void;
  onViewers: () => void;
  onInsights: () => void;
  onShare: () => void;
  onSave: () => void;
  onSettings: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
  onMute: () => void;
  onUnfollow: () => void;
  onReport: () => void;
  onBlock: () => void;
}

const StoryOptionsModal = ({
  visible,
  isOwnStory,
  story,
  username,
  onClose,
  onViewers,
  onInsights,
  onShare,
  onSave,
  onSettings,
  onDelete,
  onCopyLink,
  onMute,
  onUnfollow,
  onReport,
  onBlock,
}: StoryOptionsModalProps) => (
  <BottomSheet
    visible={visible}
    onClose={onClose}
    title={`Options for @${username}`}
  >
    {isOwnStory ? (
      <>
        <SheetButton
          icon={
            <Eye
              size={18}
              color="#a855f7"
            />
          }
          text={`Viewers (${story.viewers?.length || 0})`}
          onPress={
            onViewers
          }
        />

        <SheetButton
          icon={
            <BarChart2
              size={18}
              color="#34d399"
            />
          }
          text="Story Insights & Analytics"
          onPress={
            onInsights
          }
        />

        <SheetButton
          icon={
            <Send
              size={18}
              color="#60a5fa"
            />
          }
          text="Share Story"
          onPress={
            onShare
          }
        />

        <SheetButton
          icon={
            <Download
              size={18}
              color="#c084fc"
            />
          }
          text="Save / Download Media"
          onPress={
            onSave
          }
        />

        <SheetButton
          icon={
            <Settings
              size={18}
              color="#fbbf24"
            />
          }
          text="Story Settings & Privacy"
          onPress={
            onSettings
          }
        />

        <SheetButton
          danger
          icon={
            <Trash2
              size={18}
              color="#f87171"
            />
          }
          text="Delete Story"
          onPress={
            onDelete
          }
        />
      </>
    ) : (
      <>
        <SheetButton
          icon={
            <LinkIcon
              size={18}
              color="#60a5fa"
            />
          }
          text="Copy Story Link"
          onPress={
            onCopyLink
          }
        />

        <SheetButton
          icon={
            <VolumeX
              size={18}
              color="#fbbf24"
            />
          }
          text={`Mute stories from @${username}`}
          onPress={
            onMute
          }
        />

        <SheetButton
          icon={
            <UserMinus
              size={18}
              color="#fbbf24"
            />
          }
          text={`Unfollow @${username}`}
          onPress={
            onUnfollow
          }
        />

        <SheetButton
          danger
          icon={
            <Flag
              size={18}
              color="#f87171"
            />
          }
          text="Report Story"
          onPress={
            onReport
          }
        />

        <SheetButton
          danger
          icon={
            <UserX
              size={18}
              color="#f87171"
            />
          }
          text={`Block @${username}`}
          onPress={
            onBlock
          }
        />
      </>
    )}

    <SheetButton
      text="Cancel"
      onPress={
        onClose
      }
    />
  </BottomSheet>
);

interface BottomSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const BottomSheet = ({
  visible,
  title,
  onClose,
  children,
}: BottomSheetProps) => (
  <Modal
    visible={
      visible
    }
    transparent
    animationType="slide"
    onRequestClose={
      onClose
    }
  >
    <View
      style={
        styles.sheetOverlay
      }
    >
      <Pressable
        style={
          styles.sheetBackdrop
        }
        onPress={
          onClose
        }
      />

      <View
        style={
          styles.sheet
        }
      >
        <View
          style={
            styles.sheetHandle
          }
        />

        <View
          style={
            styles.sheetHeader
          }
        >
          <Text
            style={
              styles.sheetTitle
            }
          >
            {title}
          </Text>

          <Pressable
            onPress={
              onClose
            }
            style={
              styles.sheetClose
            }
          >
            <X
              size={20}
              color="#94a3b8"
            />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={
            styles.sheetContent
          }
        >
          {children}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const SheetButton = ({
  icon,
  text,
  onPress,
  danger = false,
}: {
  icon?: React.ReactNode;
  text: string;
  onPress: () => void;
  danger?: boolean;
}) => (
  <Pressable
    onPress={
      onPress
    }
    style={({ pressed }) => [
      styles.sheetButton,
      pressed &&
        styles.sheetButtonPressed,
      danger &&
        styles.sheetButtonDanger,
    ]}
  >
    {icon}

    <Text
      style={[
        styles.sheetButtonText,
        danger &&
          styles.sheetButtonDangerText,
      ]}
    >
      {text}
    </Text>
  </Pressable>
);

interface ViewersModalProps {
  visible: boolean;
  story: StoryViewerStory;
  likes: Array<
    string | StoryViewerUser
  >;
  search: string;
  onSearchChange: (
    value: string,
  ) => void;
  viewers: Array<
    string | StoryViewerUser
  >;
  onClose: () => void;
}

const ViewersModal = ({
  visible,
  story,
  likes,
  search,
  onSearchChange,
  viewers,
  onClose,
}: ViewersModalProps) => (
  <Modal
    visible={
      visible
    }
    transparent
    animationType="slide"
    onRequestClose={
      onClose
    }
  >
    <View
      style={
        styles.sheetOverlay
      }
    >
      <Pressable
        style={
          styles.sheetBackdrop
        }
        onPress={
          onClose
        }
      />

      <View
        style={
          styles.largeSheet
        }
      >
        <View
          style={
            styles.sheetHandle
          }
        />

        <View
          style={
            styles.sheetHeader
          }
        >
          <View
            style={
              styles.modalTitleRow
            }
          >
            <Eye
              size={20}
              color="#a855f7"
            />

            <Text
              style={
                styles.sheetTitle
              }
            >
              Story Viewers (
              {
                story.viewers
                  ?.length ||
                0
              }
              )
            </Text>
          </View>

          <Pressable
            onPress={
              onClose
            }
            style={
              styles.sheetClose
            }
          >
            <X
              size={20}
              color="#94a3b8"
            />
          </Pressable>
        </View>

        <View
          style={
            styles.searchBox
          }
        >
          <Search
            size={17}
            color="#94a3b8"
          />

          <TextInput
            value={
              search
            }
            onChangeText={
              onSearchChange
            }
            placeholder="Search viewers..."
            placeholderTextColor="#64748b"
            style={
              styles.searchInput
            }
          />
        </View>

        <ScrollView
          contentContainerStyle={
            styles.modalList
          }
        >
          {viewers.length ===
          0 ? (
            <Text
              style={
                styles.emptyText
              }
            >
              No viewers found
            </Text>
          ) : (
            viewers.map(
              (
                viewer,
              ) => {
                const user =
                  typeof viewer ===
                  "string"
                    ? {
                        _id:
                          viewer,
                        username:
                          "User",
                      }
                    : viewer;

                const liked =
                  likes.some(
                    (
                      like,
                    ) =>
                      getEntityId(
                        like,
                      ) ===
                      user._id,
                  );

                return (
                  <View
                    key={
                      user._id
                    }
                    style={
                      styles.viewerRow
                    }
                  >
                    <View
                      style={
                        styles.viewerInfo
                      }
                    >
                      <Avatar
                        src={
                          user.profilePicture ||
                          user.avatar
                        }
                        size="sm"
                        fallback={
                          user.username
                            ?.charAt(
                              0,
                            )
                            ?.toUpperCase() ||
                          "U"
                        }
                      />

                      <Text
                        style={
                          styles.viewerUsername
                        }
                      >
                        @
                        {
                          user.username
                        }
                      </Text>
                    </View>

                    {liked ? (
                      <View
                        style={
                          styles.likedLabel
                        }
                      >
                        <Heart
                          size={15}
                          color="#f43f5e"
                          fill="#f43f5e"
                        />

                        <Text
                          style={
                            styles.likedLabelText
                          }
                        >
                          Liked
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={
                          styles.viewedLabel
                        }
                      >
                        Viewed
                      </Text>
                    )}
                  </View>
                );
              },
            )
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

interface ShareOptionsModalProps {
  visible: boolean;
  story: StoryViewerStory;
  onClose: () => void;
  onSendToChat: () => void;
  onCopyLink: () => void;
  onExternalShare: () => void;
  onOwnStory: () => void;
  onSave: () => void;
}

const ShareOptionsModal = ({
  visible,
  story,
  onClose,
  onSendToChat,
  onCopyLink,
  onExternalShare,
  onOwnStory,
  onSave,
}: ShareOptionsModalProps) => (
  <BottomSheet
    visible={visible}
    title="Share Story"
    onClose={
      onClose
    }
  >
    <SheetButton
      icon={
        <Send
          size={18}
          color="#a855f7"
        />
      }
      text="Send to Chat"
      onPress={
        onSendToChat
      }
    />

    <SheetButton
      icon={
        <LinkIcon
          size={18}
          color="#60a5fa"
        />
      }
      text="Copy Story Link"
      onPress={
        onCopyLink
      }
    />

    <SheetButton
      icon={
        <Send
          size={18}
          color="#34d399"
        />
      }
      text="Share to External Apps"
      onPress={
        onExternalShare
      }
    />

    <SheetButton
      icon={
        story.allowSharing ===
        false ? (
          <Lock
            size={18}
            color="#94a3b8"
          />
        ) : (
          <Repeat
            size={18}
            color="#fbbf24"
          />
        )
      }
      text={
        story.allowSharing ===
        false
          ? "Add to Your Story — Disabled"
          : "Add to Your Story"
      }
      onPress={
        onOwnStory
      }
    />

    <SheetButton
      icon={
        story.allowDownload ===
        false ? (
          <Lock
            size={18}
            color="#94a3b8"
          />
        ) : (
          <Download
            size={18}
            color="#c084fc"
          />
        )
      }
      text={
        story.allowDownload ===
        false
          ? "Save Story Media — Disabled"
          : "Save Story Media"
      }
      onPress={
        onSave
      }
    />
  </BottomSheet>
);

interface ShareUsersModalProps {
  visible: boolean;
  selectedUsers: SearchUser[];
  searchResults: SearchUser[];
  query: string;
  note: string;
  isSharing: boolean;
  onQueryChange: (
    value: string,
  ) => void;
  onNoteChange: (
    value: string,
  ) => void;
  onToggleUser: (
    user: SearchUser,
  ) => void;
  onSend: () => void;
  onClose: () => void;
}

const ShareUsersModal = ({
  visible,
  selectedUsers,
  searchResults,
  query,
  note,
  isSharing,
  onQueryChange,
  onNoteChange,
  onToggleUser,
  onSend,
  onClose,
}: ShareUsersModalProps) => (
  <Modal
    visible={
      visible
    }
    transparent
    animationType="slide"
    onRequestClose={
      onClose
    }
  >
    <KeyboardAvoidingView
      style={
        styles.sheetOverlay
      }
      behavior={
        Platform.OS ===
        "ios"
          ? "padding"
          : undefined
      }
    >
      <Pressable
        style={
          styles.sheetBackdrop
        }
        onPress={
          onClose
        }
      />

      <View
        style={
          styles.largeSheet
        }
      >
        <View
          style={
            styles.sheetHandle
          }
        />

        <View
          style={
            styles.sheetHeader
          }
        >
          <View
            style={
              styles.modalTitleRow
            }
          >
            <Send
              size={20}
              color="#a855f7"
            />

            <Text
              style={
                styles.sheetTitle
              }
            >
              Send Story to Chat
            </Text>
          </View>

          <Pressable
            onPress={
              onClose
            }
            style={
              styles.sheetClose
            }
          >
            <X
              size={20}
              color="#94a3b8"
            />
          </Pressable>
        </View>

        {selectedUsers.length >
        0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.selectedUsers
            }
          >
            {selectedUsers.map(
              (
                user,
              ) => (
                <Pressable
                  key={
                    user._id
                  }
                  onPress={() =>
                    onToggleUser(
                      user,
                    )
                  }
                  style={
                    styles.selectedPill
                  }
                >
                  <Text
                    style={
                      styles.selectedPillText
                    }
                  >
                    @
                    {
                      user.username
                    }
                  </Text>

                  <X
                    size={13}
                    color="#c4b5fd"
                  />
                </Pressable>
              ),
            )}
          </ScrollView>
        ) : null}

        <View
          style={
            styles.searchBox
          }
        >
          <Search
            size={17}
            color="#94a3b8"
          />

          <TextInput
            value={
              query
            }
            onChangeText={
              onQueryChange
            }
            placeholder="Search users to send story..."
            placeholderTextColor="#64748b"
            style={
              styles.searchInput
            }
          />
        </View>

        <ScrollView
          style={
            styles.shareUserList
          }
          keyboardShouldPersistTaps="handled"
        >
          {searchResults.map(
            (
              user,
            ) => {
              const selected =
                selectedUsers.some(
                  (
                    item,
                  ) =>
                    item._id ===
                    user._id,
                );

              return (
                <Pressable
                  key={
                    user._id
                  }
                  onPress={() =>
                    onToggleUser(
                      user,
                    )
                  }
                  style={[
                    styles.shareUserRow,
                    selected &&
                      styles.shareUserRowSelected,
                  ]}
                >
                  <Avatar
                    src={
                      user.profilePicture ||
                      user.avatar
                    }
                    size="sm"
                    fallback={
                      user.username
                        ?.charAt(
                          0,
                        )
                        ?.toUpperCase() ||
                      "U"
                    }
                  />

                  <Text
                    style={
                      styles.shareUserName
                    }
                  >
                    @
                    {
                      user.username
                    }
                  </Text>

                  <View
                    style={[
                      styles.checkbox,
                      selected &&
                        styles.checkboxSelected,
                    ]}
                  >
                    {selected ? (
                      <Check
                        size={14}
                        color="#ffffff"
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            },
          )}
        </ScrollView>

        <TextInput
          value={
            note
          }
          onChangeText={
            onNoteChange
          }
          placeholder="Add an optional message..."
          placeholderTextColor="#64748b"
          style={
            styles.shareNote
          }
        />

        <Pressable
          onPress={
            onSend
          }
          disabled={
            selectedUsers.length ===
              0 ||
            isSharing
          }
          style={[
            styles.sendStoryButton,
            (
              selectedUsers.length ===
                0 ||
              isSharing
            ) &&
              styles.sendStoryButtonDisabled,
          ]}
        >
          {isSharing ? (
            <ActivityIndicator
              color="#ffffff"
              size="small"
            />
          ) : (
            <>
              <Send
                size={17}
                color="#ffffff"
              />

              <Text
                style={
                  styles.sendStoryButtonText
                }
              >
                {selectedUsers.length >
                0
                  ? `Send to ${selectedUsers.length} user${
                      selectedUsers.length >
                      1
                        ? "s"
                        : ""
                    }`
                  : "Select recipients"}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

interface StoryCommentsModalProps {
  visible: boolean;
  comments: StoryComment[];
  loading: boolean;
  authUserId?: string;
  isOwnStory: boolean;
  onClose: () => void;
  onLike: (
    commentId: string,
  ) => void;
  onDelete: (
    commentId: string,
  ) => void;
  onReport: (
    commentId: string,
  ) => void;
}

const StoryCommentsModal = ({
  visible,
  comments,
  loading,
  authUserId,
  isOwnStory,
  onClose,
  onLike,
  onDelete,
  onReport,
}: StoryCommentsModalProps) => (
  <Modal
    visible={
      visible
    }
    transparent
    animationType="slide"
    onRequestClose={
      onClose
    }
  >
    <View
      style={
        styles.sheetOverlay
      }
    >
      <Pressable
        style={
          styles.sheetBackdrop
        }
        onPress={
          onClose
        }
      />

      <View
        style={
          styles.largeSheet
        }
      >
        <View
          style={
            styles.sheetHandle
          }
        />

        <View
          style={
            styles.sheetHeader
          }
        >
          <View
            style={
              styles.modalTitleRow
            }
          >
            <MessageCircle
              size={20}
              color="#a855f7"
            />

            <Text
              style={
                styles.sheetTitle
              }
            >
              Story Replies (
              {
                comments.length
              }
              )
            </Text>
          </View>

          <Pressable
            onPress={
              onClose
            }
            style={
              styles.sheetClose
            }
          >
            <X
              size={20}
              color="#94a3b8"
            />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={
            styles.commentsList
          }
        >
          {loading ? (
            <View
              style={
                styles.loadingContainer
              }
            >
              <ActivityIndicator
                size="large"
                color="#a855f7"
              />
            </View>
          ) : comments.length ===
            0 ? (
            <Text
              style={
                styles.emptyText
              }
            >
              No replies yet. Be the
              first to reply!
            </Text>
          ) : (
            comments.map(
              (
                comment,
              ) => {
                const userLiked =
                  comment.likes?.some(
                    (
                      like,
                    ) =>
                      getEntityId(
                        like,
                      ) ===
                      authUserId,
                  );

                const canDelete =
                  comment.user?._id === authUserId ||
                  isOwnStory;

                return (
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
                      size="sm"
                      fallback={
                        comment
                          .user
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
                        styles.commentMain
                      }
                    >
                      <View
                        style={
                          styles.commentMeta
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
                            styles.commentTime
                          }
                        >
                          {formatDistanceToNow(
                            new Date(
                              comment.createdAt,
                            ),
                            {
                              addSuffix:
                                true,
                            },
                          ).replace(
                            "about ",
                            "",
                          )}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.commentText
                        }
                      >
                        {renderStoryCommentText(
                          comment.text,
                        )}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.commentActions
                      }
                    >
                      <Pressable
                        onPress={() =>
                          onLike(
                            comment._id,
                          )
                        }
                        style={
                          styles.commentActionButton
                        }
                      >
                        <Heart
                          size={15}
                          color={
                            userLiked
                              ? "#f43f5e"
                              : "#94a3b8"
                          }
                          fill={
                            userLiked
                              ? "#f43f5e"
                              : "none"
                          }
                        />

                        {comment
                          .likes
                          ?.length ? (
                          <Text
                            style={
                              styles.commentLikeCount
                            }
                          >
                            {
                              comment
                                .likes
                                .length
                            }
                          </Text>
                        ) : null}
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          canDelete
                            ? onDelete(
                                comment._id,
                              )
                            : onReport(
                                comment._id,
                              )
                        }
                        style={
                          styles.commentActionButton
                        }
                      >
                        {canDelete ? (
                          <Trash2
                            size={15}
                            color="#94a3b8"
                          />
                        ) : (
                          <Flag
                            size={15}
                            color="#94a3b8"
                          />
                        )}
                      </Pressable>
                    </View>
                  </View>
                );
              },
            )
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const renderStoryCommentText =
  (
    text: string,
  ) => {
    const parts =
      text.split(
        /(@\w+)/g,
      );

    return parts.map(
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
              styles.storyMention
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
    );
  };

interface StoryInsightsModalProps {
  visible: boolean;
  story: StoryViewerStory;
  likesCount: number;
  insights: StoryAnalytics | null;
  loading: boolean;
  onClose: () => void;
}

const StoryInsightsModal = ({
  visible,
  story,
  likesCount,
  insights,
  loading,
  onClose,
}: StoryInsightsModalProps) => (
  <BottomSheet
    visible={visible}
    title="Story Insights"
    onClose={
      onClose
    }
  >
    {loading ? (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#ffffff"
        />
      </View>
    ) : (
      <View
        style={
          styles.statsGrid
        }
      >
        <StatCard
          label="Total Views"
          value={
            story.viewers
              ?.length ||
            0
          }
        />

        <StatCard
          label="Completion Rate"
          value={`${insights?.completionRate || 94}%`}
          accent="#34d399"
        />

        <StatCard
          label="Total Likes"
          value={
            likesCount
          }
          accent="#f43f5e"
        />

        <StatCard
          label="Sticker Clicks"
          value={
            insights?.stickerClicks ||
            12
          }
          accent="#c084fc"
        />
      </View>
    )}
  </BottomSheet>
);

const StatCard = ({
  label,
  value,
  accent = "#ffffff",
}: {
  label: string;
  value: string | number;
  accent?: string;
}) => (
  <View
    style={
      styles.statCard
    }
  >
    <Text
      style={
        styles.statLabel
      }
    >
      {label}
    </Text>

    <Text
      style={[
        styles.statValue,
        {
          color:
            accent,
        },
      ]}
    >
      {value}
    </Text>
  </View>
);

interface StorySettingsModalProps {
  visible: boolean;
  story: StoryViewerStory;
  onClose: () => void;
}

const StorySettingsModal = ({
  visible,
  story,
  onClose,
}: StorySettingsModalProps) => (
  <BottomSheet
    visible={visible}
    title="Story Settings & Privacy"
    onClose={
      onClose
    }
  >
    <SettingInfo
      title="Story Audience Privacy"
      description={
        story.privacy ||
        "public"
      }
      badge={
        story.privacy ||
        "public"
      }
    />

    <SettingInfo
      title="Allow Direct Replies"
      description={
        story.allowReplies !==
        false
          ? "Everyone can reply"
          : "Replies disabled"
      }
      badge={
        story.allowReplies !==
        false
          ? "ON"
          : "OFF"
      }
      positive={
        story.allowReplies !==
        false
      }
    />

    <SettingInfo
      title="Allow Reposting & Sharing"
      description={
        story.allowSharing !==
        false
          ? "Allowed"
          : "Disabled"
      }
      badge={
        story.allowSharing !==
        false
          ? "ON"
          : "OFF"
      }
      positive={
        story.allowSharing !==
        false
      }
    />

    <SettingInfo
      title="Allow Media Saving"
      description={
        story.allowDownload !==
        false
          ? "Allowed"
          : "Disabled"
      }
      badge={
        story.allowDownload !==
        false
          ? "ON"
          : "OFF"
      }
      positive={
        story.allowDownload !==
        false
      }
    />
  </BottomSheet>
);

const SettingInfo = ({
  title,
  description,
  badge,
  positive = true,
}: {
  title: string;
  description: string;
  badge: string;
  positive?: boolean;
}) => (
  <View
    style={
      styles.settingInfo
    }
  >
    <View
      style={
        styles.settingInfoCopy
      }
    >
      <Text
        style={
          styles.settingTitle
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.settingDescription
        }
      >
        {description}
      </Text>
    </View>

    <View
      style={[
        styles.settingBadge,
        {
          backgroundColor:
            positive
              ? "rgba(16,185,129,0.14)"
              : "rgba(239,68,68,0.14)",
        },
      ]}
    >
      <Text
        style={[
          styles.settingBadgeText,
          {
            color:
              positive
                ? "#34d399"
                : "#f87171",
          },
        ]}
      >
        {badge}
      </Text>
    </View>
  </View>
);

const ShareIconNative =
  () => (
    <Share2Icon />
  );

const Share2Icon = () => (
  <View
    style={
      styles.shareIconShape
    }
  >
    <Send
      size={18}
      color="#ffffff"
      style={{
        transform: [
          {
            rotate:
              "-12deg",
          },
        ],
      }}
    />
  </View>
);

const styles =
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor:
        "#000000",
    },

    viewerBackground: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "#000000",
    },

    viewerContent: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    storyCard: {
      width: "100%",
      height: "100%",
      maxWidth: 520,
      backgroundColor:
        "#000000",
      overflow:
        "hidden",
      position:
        "relative",
    },

    mediaContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "#000000",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    media: {
      width: "100%",
      height: "100%",
    },

    videoLoading: {
      ...StyleSheet.absoluteFillObject,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.40)",
    },

    topGradient: {
      position:
        "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 150,
      backgroundColor:
        "rgba(0,0,0,0.48)",
    },

    bottomGradient: {
      position:
        "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 220,
      backgroundColor:
        "rgba(0,0,0,0.48)",
    },

    heartPop: {
      ...StyleSheet.absoluteFillObject,
      alignItems:
        "center",
      justifyContent:
        "center",
      zIndex: 40,
    },

    progressContainer: {
      position:
        "absolute",
      left: 10,
      right: 10,
      top: Platform.OS ===
        "ios"
        ? 50
        : 18,
      flexDirection:
        "row",
      gap: 4,
      zIndex: 50,
    },

    progressTrack: {
      flex: 1,
      height: 4,
      borderRadius: 4,
      overflow:
        "hidden",
      backgroundColor:
        "rgba(255,255,255,0.30)",
    },

    progressFill: {
      height: "100%",
      backgroundColor:
        "#ffffff",
      borderRadius: 4,
    },

    header: {
      position:
        "absolute",
      left: 0,
      right: 0,
      top:
        Platform.OS ===
        "ios"
          ? 62
          : 30,
      zIndex: 50,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      paddingHorizontal: 12,
    },

    userInfo: {
      flex: 1,
      minWidth: 0,
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    avatarRing: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderWidth: 2,
      borderColor:
        "rgba(168,85,247,0.70)",
      marginRight: 10,
    },

    headerText: {
      flex: 1,
      minWidth: 0,
    },

    usernameRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    username: {
      flexShrink: 1,
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "700",
    },

    timeAgo: {
      color:
        "rgba(255,255,255,0.78)",
      fontSize: 11,
    },

    musicRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 3,
      maxWidth: 200,
    },

    musicText: {
      flex: 1,
      marginLeft: 4,
      color:
        "rgba(255,255,255,0.88)",
      fontSize: 10,
    },

    headerActions: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 2,
      marginLeft: 8,
    },

    iconButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    navigationButton: {
      position:
        "absolute",
      top: "50%",
      marginTop: -22,

      width: 44,
      height: 44,

      borderRadius: 22,

      alignItems:
        "center",
      justifyContent:
        "center",

      backgroundColor:
        "rgba(255,255,255,0.10)",
      zIndex: 60,
    },

    leftNavigation: {
      left: 10,
    },

    rightNavigation: {
      right: 10,
    },

    footer: {
      position:
        "absolute",
      left: 0,
      right: 0,
      bottom:
        Platform.OS ===
        "ios"
          ? 24
          : 12,
      zIndex: 50,
      paddingHorizontal: 12,
    },

    ownFooter: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    viewerButton: {
      minHeight: 42,
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingHorizontal: 15,
      borderRadius: 22,
      backgroundColor:
        "rgba(0,0,0,0.42)",
      gap: 7,
    },

    viewerButtonText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "700",
    },

    circularAction: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.42)",
    },

    replyFooter: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    replyInputWrap: {
      flex: 1,
      minHeight: 46,
      borderRadius: 23,
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.45)",
      backgroundColor:
        "rgba(0,0,0,0.20)",
      justifyContent:
        "center",
    },

    replyInput: {
      minHeight: 44,
      paddingHorizontal: 16,
      color: "#ffffff",
      fontSize: 13,
    },

    replyDisabled: {
      flex: 1,
      minHeight: 46,
      borderRadius: 23,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(255,255,255,0.10)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.10)",
    },

    replyDisabledText: {
      color:
        "rgba(255,255,255,0.60)",
      fontSize: 12,
      fontWeight: "600",
    },

    footerIcon: {
      width: 42,
      height: 42,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    likeFooter: {
      minWidth: 48,
      minHeight: 44,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 4,
    },

    likeCount: {
      fontSize: 11,
      fontWeight: "800",
    },

    quickReactions: {
      position:
        "absolute",
      bottom:
        Platform.OS ===
        "ios"
          ? 86
          : 76,
      left: 18,
      right: 18,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-around",
      paddingVertical: 7,
      paddingHorizontal: 8,
      borderRadius: 25,
      backgroundColor:
        "rgba(0,0,0,0.54)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.18)",
      zIndex: 45,
    },

    reactionButton: {
      width: 40,
      height: 40,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    reactionEmoji: {
      fontSize: 24,
    },

    shareIconShape: {
      width: 24,
      height: 24,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    sheetOverlay: {
      flex: 1,
      justifyContent:
        "flex-end",
    },

    sheetBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(0,0,0,0.72)",
    },

    sheet: {
      width: "100%",
      maxHeight: "75%",
      backgroundColor:
        "#171717",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom:
        Platform.OS ===
        "ios"
          ? 34
          : 18,
    },

    largeSheet: {
      width: "100%",
      maxHeight: "85%",
      backgroundColor:
        "#171717",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom:
        Platform.OS ===
        "ios"
          ? 34
          : 18,
    },

    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor:
        "rgba(255,255,255,0.20)",
      alignSelf:
        "center",
      marginBottom: 10,
    },

    sheetHeader: {
      minHeight: 48,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      borderBottomWidth: 1,
      borderBottomColor:
        "rgba(255,255,255,0.10)",
    },

    modalTitleRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
      flex: 1,
    },

    sheetTitle: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "700",
      flexShrink: 1,
    },

    sheetClose: {
      width: 38,
      height: 38,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    sheetContent: {
      paddingTop: 10,
      gap: 8,
    },

    sheetButton: {
      minHeight: 50,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 12,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor:
        "rgba(255,255,255,0.05)",
    },

    sheetButtonPressed: {
      backgroundColor:
        "rgba(255,255,255,0.10)",
    },

    sheetButtonDanger: {
      backgroundColor:
        "rgba(239,68,68,0.08)",
    },

    sheetButtonText: {
      flex: 1,
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "600",
    },

    sheetButtonDangerText: {
      color: "#f87171",
    },

    searchBox: {
      minHeight: 44,
      marginTop: 12,
      marginBottom: 10,

      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,

      paddingHorizontal: 12,

      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.10)",

      backgroundColor:
        "rgba(255,255,255,0.08)",
    },

    searchInput: {
      flex: 1,
      minHeight: 42,
      color: "#ffffff",
      fontSize: 13,
    },

    modalList: {
      gap: 8,
      paddingBottom: 20,
    },

    viewerRow: {
      minHeight: 52,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 8,
      borderRadius: 14,
      backgroundColor:
        "rgba(255,255,255,0.04)",
    },

    viewerInfo: {
      flexDirection:
        "row",
      alignItems:
        "center",
      flex: 1,
      minWidth: 0,
    },

    viewerUsername: {
      marginLeft: 10,
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "600",
    },

    likedLabel: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    likedLabelText: {
      color: "#f87171",
      fontSize: 10,
      fontWeight: "700",
    },

    viewedLabel: {
      color:
        "rgba(255,255,255,0.45)",
      fontSize: 10,
    },

    selectedUsers: {
      gap: 6,
      paddingTop: 10,
    },

    selectedPill: {
      minHeight: 32,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
      paddingHorizontal: 10,
      borderRadius: 16,
      backgroundColor:
        "rgba(168,85,247,0.18)",
      borderWidth: 1,
      borderColor:
        "rgba(168,85,247,0.45)",
    },

    selectedPillText: {
      color: "#c4b5fd",
      fontSize: 11,
      fontWeight: "700",
    },

    shareUserList: {
      maxHeight: 190,
    },

    shareUserRow: {
      minHeight: 50,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 10,
      paddingHorizontal: 10,
      borderRadius: 13,
    },

    shareUserRowSelected: {
      backgroundColor:
        "rgba(168,85,247,0.14)",
    },

    shareUserName: {
      flex: 1,
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "600",
    },

    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.20)",
    },

    checkboxSelected: {
      backgroundColor:
        "#a855f7",
      borderColor:
        "#a855f7",
    },

    shareNote: {
      minHeight: 44,
      marginTop: 10,
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.10)",
      borderRadius: 12,
      backgroundColor:
        "rgba(255,255,255,0.07)",
      paddingHorizontal: 12,
      color: "#ffffff",
      fontSize: 13,
    },

    sendStoryButton: {
      minHeight: 46,
      marginTop: 10,
      borderRadius: 14,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 7,
      backgroundColor:
        "#a855f7",
    },

    sendStoryButtonDisabled: {
      opacity: 0.40,
    },

    sendStoryButtonText: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "700",
    },

    commentsList: {
      paddingTop: 10,
      paddingBottom: 20,
      gap: 10,
    },

    loadingContainer: {
      minHeight: 120,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    emptyText: {
      paddingVertical: 40,
      textAlign:
        "center",
      color:
        "rgba(255,255,255,0.45)",
      fontSize: 12,
      fontWeight: "600",
    },

    commentRow: {
      minHeight: 64,
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      gap: 9,
      padding: 10,
      borderRadius: 14,
      backgroundColor:
        "rgba(255,255,255,0.05)",
    },

    commentMain: {
      flex: 1,
      minWidth: 0,
    },

    commentMeta: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
    },

    commentUsername: {
      color: "#ffffff",
      fontSize: 11,
      fontWeight: "800",
    },

    commentTime: {
      color:
        "rgba(255,255,255,0.42)",
      fontSize: 9,
    },

    commentText: {
      marginTop: 3,
      color:
        "rgba(255,255,255,0.90)",
      fontSize: 11,
      lineHeight: 17,
    },

    storyMention: {
      color: "#a855f7",
      fontWeight:
        "700",
    },

    commentActions: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
    },

    commentActionButton: {
      minWidth: 28,
      minHeight: 28,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 2,
    },

    commentLikeCount: {
      color:
        "rgba(255,255,255,0.60)",
      fontSize: 9,
      fontWeight: "700",
    },

    statsGrid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 10,
      paddingTop: 12,
      paddingBottom: 16,
    },

    statCard: {
      width: "48%",
      minHeight: 96,
      padding: 14,
      borderRadius: 16,
      backgroundColor:
        "rgba(255,255,255,0.05)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.06)",
    },

    statLabel: {
      color:
        "rgba(255,255,255,0.50)",
      fontSize: 9,
      fontWeight: "800",
      textTransform:
        "uppercase",
    },

    statValue: {
      marginTop: 6,
      fontSize: 26,
      fontWeight: "900",
    },

    settingInfo: {
      minHeight: 70,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor:
        "rgba(255,255,255,0.05)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.06)",
    },

    settingInfoCopy: {
      flex: 1,
      paddingRight: 12,
    },

    settingTitle: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "700",
    },

    settingDescription: {
      marginTop: 3,
      color:
        "rgba(255,255,255,0.50)",
      fontSize: 10,
    },

    settingBadge: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 999,
    },

    settingBadgeText: {
      fontSize: 9,
      fontWeight: "800",
      textTransform:
        "uppercase",
    },
  });

export default StoryViewer;