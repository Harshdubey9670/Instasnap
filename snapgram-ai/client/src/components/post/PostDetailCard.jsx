import { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useAnimation } from "framer-motion";
import api from "../../services/api";
import { useToast } from "../ui/Toast";
import { updateSavedPosts } from "../../store/authSlice";
import { PostDetailMediaViewer } from "./PostDetailMediaViewer";
import { PostDetailCreatorRow } from "./PostDetailCreatorRow";
import { PostActions } from "../feed/PostActions";
import { CommentsPanel } from "../feed/CommentsPanel";
import { LikesModal } from "../feed/LikesModal";
import { ShareModal } from "../feed/ShareModal";
import { PostOptionsModal } from "./PostOptionsModal";
import { RenderCaption } from "../../utils/renderCaption";

/**
 * The hero "post detail" treatment — large media + a full detail panel
 * (creator row, caption, engagement, inline comments). Built entirely from
 * the same modular pieces the main feed's PostCard uses (PostActions,
 * CommentsPanel, ShareModal, LikesModal, PostOptionsModal) so every action
 * here behaves identically to the rest of the app, just laid out bigger.
 */
export const PostDetailCard = ({ post: initialPost, onPostDeleted }) => {
  const { user: authUser } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const controls = useAnimation();
  const commentsRef = useRef(null);

  const [post, setPost] = useState(initialPost);
  const [isLiked, setIsLiked] = useState(initialPost.isLiked ?? initialPost.likes?.includes(authUser?._id) ?? false);
  const [likesCount, setLikesCount] = useState(initialPost.likesCount ?? initialPost.likes?.length ?? 0);
  const [isSaved, setIsSaved] = useState(initialPost.isSaved ?? authUser?.savedPosts?.includes(initialPost._id) ?? false);
  const [commentsCount, setCommentsCount] = useState(initialPost.commentsCount || 0);
  const [sortOrder, setSortOrder] = useState("newest");
  const [showMenu, setShowMenu] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showLikes, setShowLikes] = useState(false);

  const mediaItems = post.media?.length > 0 ? post.media : [{ url: post.mediaUrl, type: post.mediaType || "image" }];

  const handleLike = async () => {
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    if (next) controls.start({ scale: [1, 1.2, 1], transition: { duration: 0.3 } });
    try {
      await api.post(`/api/posts/${post._id}/like`);
    } catch {
      setIsLiked(!next);
      setLikesCount((c) => (!next ? c + 1 : Math.max(0, c - 1)));
      toast({ variant: "error", title: "Action Failed", description: "Could not update like." });
    }
  };

  const handleSave = async () => {
    const next = !isSaved;
    setIsSaved(next);
    try {
      const res = await api.post(`/api/posts/${post._id}/save`);
      dispatch(updateSavedPosts(res.data.data));
    } catch {
      setIsSaved(!next);
      toast({ variant: "error", title: "Action Failed", description: "Could not save post." });
    }
  };

  const scrollToComments = () => commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="warm-card overflow-hidden lg:flex lg:items-stretch">
      {/* Media */}
      <div className="lg:w-[56%] lg:shrink-0 p-2 sm:p-3 lg:p-4">
        <PostDetailMediaViewer mediaItems={mediaItems} title={post.caption?.split("\n")[0]} location={post.location} />
      </div>

      {/* Detail panel */}
      <div className="flex-1 min-w-0 flex flex-col border-t lg:border-t-0 lg:border-l border-border-soft lg:max-h-[720px]">
        <div className="p-4 space-y-3 shrink-0">
          <PostDetailCreatorRow post={post} onShowOptions={() => setShowMenu(true)} />
          {post.caption && (
            <div className="text-sm text-text-primary leading-relaxed">
              <RenderCaption caption={post.caption} />
            </div>
          )}
        </div>

        <div className="px-4 pb-3 shrink-0 space-y-2">
          <PostActions
            isLiked={isLiked}
            isSaved={isSaved}
            onLike={handleLike}
            onSave={handleSave}
            onComment={scrollToComments}
            onShare={() => setShowShare(true)}
            commentsEnabled={post.settings?.commentsEnabled}
            sharingEnabled={post.settings?.sharingEnabled}
            controls={controls}
            isCarousel={false}
          />
          {!post.settings?.hideLikes ? (
            <button
              onClick={() => likesCount > 0 && setShowLikes(true)}
              className="text-sm font-bold text-text-primary hover:text-text-secondary transition-colors -mt-1 block"
            >
              {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}
            </button>
          ) : (
            <p className="text-sm font-medium text-text-secondary -mt-1">Liked by others</p>
          )}
        </div>

        {post.settings?.commentsEnabled !== false ? (
          <>
            <div ref={commentsRef} className="px-4 py-2.5 border-t border-border-soft flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-text-primary">Comments ({commentsCount})</h3>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="text-xs font-semibold text-text-secondary bg-transparent outline-none cursor-pointer"
              >
                <option value="newest">Sort by Newest</option>
                <option value="oldest">Sort by Oldest</option>
              </select>
            </div>
            <CommentsPanel
              post={post}
              sortOrder={sortOrder}
              onCommentAdded={() => setCommentsCount((c) => c + 1)}
              onCommentDeleted={() => setCommentsCount((c) => Math.max(0, c - 1))}
              className="flex-1 min-h-[240px] lg:min-h-0 px-4"
            />
          </>
        ) : (
          <p className="px-4 py-6 text-sm text-text-secondary text-center border-t border-border-soft">Comments are turned off for this post.</p>
        )}
      </div>

      {showShare && <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} post={post} />}
      <LikesModal isOpen={showLikes} onClose={() => setShowLikes(false)} post={post} />
      <PostOptionsModal
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        post={post}
        onPostDeleted={onPostDeleted}
        onPostUpdated={(updated) => setPost((prev) => ({ ...prev, ...updated }))}
      />
    </div>
  );
};
