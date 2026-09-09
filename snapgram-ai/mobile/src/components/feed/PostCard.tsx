import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import {
  useDispatch,
  useSelector,
} from "react-redux";

import api from "../../services/api";
import type { RootState } from "../../store/store";
import {
  updateSavedPosts,
} from "../../store/authSlice";

import {
  useToast,
} from "../ui/Toast";
import { useTheme } from "../../contexts/ThemeContext";

import {
  PostHeader,
} from "./PostHeader";

import {
  PostMediaCarousel,
} from "./PostMediaCarousel";

import {
  PostActions,
} from "./PostActions";

import {
  PostCaption,
} from "./PostCaption";

import {
  CommentModal,
} from "./CommentModal";

import {
  ShareModal,
} from "./ShareModal";

import {
  LikesModal,
} from "./LikesModal";

import {
  PostOptionsModal,
} from "../post/PostOptionsModal";

interface PostUser {
  _id?: string;
  username?: string;
  profilePicture?: string;
  avatar?: string;
}

interface PostMedia {
  url: string;
  type?: string;
  altText?: string;
}

interface PostSettings {
  commentsEnabled?: boolean;
  sharingEnabled?: boolean;
  hideLikes?: boolean;
}

export interface Post {
  _id: string;
  caption?: string;
  location?: string;
  media?: PostMedia[];
  mediaUrl?: string;
  likes?: Array<
    string | { _id?: string }
  >;
  commentsCount?: number;
  settings?: PostSettings;
  createdAt?: string;
  user?: PostUser;
  [key: string]: any;
}

interface PostCardProps {
  post: Post;
  onPostDeleted?: (
    postId?: string,
  ) => void;
}

export const PostCard = ({
  post: initialPost,
  onPostDeleted,
}: PostCardProps) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

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
    post,
    setPost,
  ] = useState<Post>(
    initialPost,
  );

  const getIsLiked =
    () => {
      const authUserId =
        authUser?._id;

      if (!authUserId) {
        return false;
      }

      return (
        post.likes?.some(
          (like) =>
            String(
              typeof like ===
                "string"
                ? like
                : like?._id,
            ) ===
            String(
              authUserId,
            ),
        ) ||
        false
      );
    };

  const [
    isLiked,
    setIsLiked,
  ] =
    useState<boolean>(
      getIsLiked(),
    );

  const [
    likesCount,
    setLikesCount,
  ] =
    useState<number>(
      post.likes
        ?.length || 0,
    );

  const [
    commentsCount,
    setCommentsCount,
  ] =
    useState<number>(
      post.commentsCount ||
        0,
    );

  const [
    isSaved,
    setIsSaved,
  ] =
    useState<boolean>(
      Boolean(
        authUser?.savedPosts?.some(
          (savedPostId: any) =>
            String(
              typeof savedPostId ===
                "string"
                ? savedPostId
                : savedPostId?._id,
            ) ===
            String(
              post._id,
            ),
        ),
      ),
    );

  const [
    showHeartOverlay,
    setShowHeartOverlay,
  ] =
    useState(false);

  const [
    showCommentModal,
    setShowCommentModal,
  ] =
    useState(false);

  const [
    showShareModal,
    setShowShareModal,
  ] =
    useState(false);

  const [
    showLikesModal,
    setShowLikesModal,
  ] =
    useState(false);

  const [
    showOptionsModal,
    setShowOptionsModal,
  ] =
    useState(false);

  const lastTap =
    useRef(0);

  /*
   * Keep post-derived state synchronized if the parent/feed
   * sends a newer version of the post.
   */
  useEffect(() => {
    setPost(
      initialPost,
    );

    const authUserId =
      authUser?._id;

    const nextIsLiked =
      Boolean(
        authUserId &&
          initialPost.likes?.some(
            (like) =>
              String(
                typeof like ===
                  "string"
                  ? like
                  : like?._id,
              ) ===
              String(
                authUserId,
              ),
          ),
      );

    setIsLiked(
      nextIsLiked,
    );

    setLikesCount(
      initialPost.likes
        ?.length || 0,
    );

    setCommentsCount(
      initialPost.commentsCount ||
        0,
    );
  }, [
    initialPost,
    authUser?._id,
  ]);

  useEffect(() => {
    if (
      authUser?.savedPosts
    ) {
      setIsSaved(
        authUser.savedPosts.some(
          (
            savedPostId: any,
          ) =>
            String(
              typeof savedPostId ===
                "string"
                ? savedPostId
                : savedPostId?._id,
            ) ===
            String(
              post._id,
            ),
        ),
      );
    }
  }, [
    authUser?.savedPosts,
    post._id,
  ]);

  /*
   * Normalize the media structure exactly like the web component.
   */
  const mediaItems: PostMedia[] =
    post.media &&
    post.media.length >
      0
      ? post.media
      : post.mediaUrl
        ? [
            {
              url:
                post.mediaUrl,
              type:
                "image",
            },
          ]
        : [];

  const handleLike =
    async () => {
      const newIsLiked =
        !isLiked;

      /*
       * Optimistic UI update.
       */
      setIsLiked(
        newIsLiked,
      );

      setLikesCount(
        (
          previous,
        ) =>
          newIsLiked
            ? previous + 1
            : Math.max(
                0,
                previous - 1,
              ),
      );

      try {
        await api.post(
          `/api/posts/${post._id}/like`,
        );
      } catch {
        /*
         * Rollback exactly like the web implementation.
         */
        setIsLiked(
          !newIsLiked,
        );

        setLikesCount(
          (
            previous,
          ) =>
            newIsLiked
              ? Math.max(
                  0,
                  previous - 1,
                )
              : previous + 1,
        );

        toast({
          variant:
            "error",
          title:
            "Action Failed",
          description:
            "Could not update like.",
        });
      }
    };

  const handleDoubleTap =
    () => {
      const now =
        Date.now();

      const tapLength =
        now -
        lastTap.current;

      if (
        tapLength > 0 &&
        tapLength < 300
      ) {
        /*
         * The web component only sends the like request if the post
         * isn't already liked.
         */
        if (!isLiked) {
          void handleLike();
        }

        setShowHeartOverlay(
          true,
        );

        setTimeout(
          () =>
            setShowHeartOverlay(
              false,
            ),
          1000,
        );
      }

      lastTap.current =
        now;
    };

  const handleSave =
    async () => {
      const newIsSaved =
        !isSaved;

      setIsSaved(
        newIsSaved,
      );

      try {
        const response =
          await api.post(
            `/api/posts/${post._id}/save`,
          );

        /*
         * Preserve the original Redux behavior.
         */
        if (
          response.data
            ?.data
        ) {
          dispatch(
            updateSavedPosts(
              response.data
                .data,
            ),
          );
        }
      } catch {
        setIsSaved(
          !newIsSaved,
        );

        toast({
          variant:
            "error",
          title:
            "Action Failed",
          description:
            "Could not save post.",
        });
      }
    };

  const handlePostUpdated =
    (
      updatedPost: unknown,
    ) => {
      if (
        updatedPost &&
        typeof updatedPost ===
          "object"
      ) {
        setPost(
          updatedPost as Post,
        );
      }
    };

  const handlePostDeleted =
    (
      postId?: string,
    ) => {
      onPostDeleted?.(
        postId ||
          post._id,
      );
    };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#0a0510" : "#ffffff",
          borderBottomColor: isDark ? "#1a0f26" : "rgba(226,232,240,0.60)",
        },
      ]}
    >
      <PostHeader
        user={
          post.user
        }
        location={
          post.location
        }
        onShowOptions={() =>
          setShowOptionsModal(
            true,
          )
        }
      />

      <Pressable
        onPress={
          handleDoubleTap
        }
        style={
          styles.mediaWrapper
        }
        accessibilityRole="button"
        accessibilityLabel="Post media"
      >
        <PostMediaCarousel
          mediaItems={
            mediaItems
          }
          onDoubleTap={
            handleDoubleTap
          }
          showHeartOverlay={
            showHeartOverlay
          }
        />
      </Pressable>

      <PostActions
        isLiked={
          isLiked
        }
        isSaved={
          isSaved
        }
        onLike={
          handleLike
        }
        onSave={
          handleSave
        }
        onComment={() =>
          setShowCommentModal(
            true,
          )
        }
        onShare={() =>
          setShowShareModal(
            true,
          )
        }
        commentsEnabled={
          post.settings
            ?.commentsEnabled
        }
        sharingEnabled={
          post.settings
            ?.sharingEnabled
        }
        isCarousel={
          mediaItems.length >
          1
        }
      />

      <PostCaption
        post={
          post
        }
        likesCount={
          likesCount
        }
        commentsCount={
          commentsCount
        }
        onShowLikes={() =>
          setShowLikesModal(
            true,
          )
        }
      />

      {post.settings
        ?.commentsEnabled !==
        false ? (
        <CommentModal
          isOpen={
            showCommentModal
          }
          onClose={() =>
            setShowCommentModal(
              false,
            )
          }
          post={
            post
          }
          onCommentAdded={() =>
            setCommentsCount(
              (
                previous,
              ) =>
                previous + 1,
            )
          }
          onCommentDeleted={() =>
            setCommentsCount(
              (
                previous,
              ) =>
                Math.max(
                  0,
                  previous - 1,
                ),
            )
          }
        />
      ) : null}

      {post.settings
        ?.sharingEnabled !==
        false ? (
        <ShareModal
          isOpen={
            showShareModal
          }
          onClose={() =>
            setShowShareModal(
              false,
            )
          }
          post={
            post
          }
        />
      ) : null}

      <LikesModal
        isOpen={
          showLikesModal
        }
        onClose={() =>
          setShowLikesModal(
            false,
          )
        }
        post={
          post
        }
      />

      <PostOptionsModal
        isOpen={
          showOptionsModal
        }
        onClose={() =>
          setShowOptionsModal(
            false,
          )
        }
        post={
          post
        }
        onPostDeleted={
          handlePostDeleted
        }
        onPostUpdated={
          handlePostUpdated
        }
      />
    </View>
  );
};

const styles =
  StyleSheet.create({
    card: {
      width: "100%",
      overflow:
        "hidden",
      marginBottom: 16,
      borderBottomWidth: 1,
    },

    mediaWrapper: {
      width: "100%",
    },
  });

export default PostCard;