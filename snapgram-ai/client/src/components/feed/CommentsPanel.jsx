import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2, Loader2, MessageCircle, Heart, MoreHorizontal, Edit2, Pin, AlertTriangle, Smile } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import EmojiPicker from "emoji-picker-react";
import api from "../../services/api";
import { useToast } from "../ui/Toast";

/**
 * The comment list + composer, shared by the feed's CommentModal (popup) and
 * the Post Detail page (inline panel) so replies/likes/pin/edit/delete/report
 * behave identically everywhere instead of drifting into two implementations.
 */
export const CommentsPanel = ({ post, onCommentAdded, onCommentDeleted, sortOrder = "oldest", className = "" }) => {
  const { user: authUser } = useSelector((state) => state.auth);
  const { toast } = useToast();

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const commentsEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (post?._id) fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?._id]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/posts/${post._id}/comments?limit=100`);
      setComments(res.data.data || []);
    } catch (error) {
      toast({ variant: "error", title: "Error", description: "Could not load comments" });
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    if (newComment.trim().length > 500) {
      return toast({ variant: "error", title: "Too long", description: "Comment cannot exceed 500 characters" });
    }

    setIsSubmitting(true);
    try {
      if (editingComment) {
        const res = await api.put(`/api/posts/${post._id}/comments/${editingComment.id}`, { text: newComment });
        setComments((prev) => prev.map((c) => (c._id === editingComment.id ? res.data.data : c)));
        setEditingComment(null);
      } else {
        const payload = { text: newComment };
        if (replyingTo) payload.parentComment = replyingTo.id;
        const res = await api.post(`/api/posts/${post._id}/comments`, payload);
        setComments((prev) => [...prev, res.data.data]);
        onCommentAdded?.();
        if (!replyingTo) scrollToBottom();
      }
      setNewComment("");
      setReplyingTo(null);
      setShowEmojiPicker(false);
    } catch (error) {
      toast({ variant: "error", title: "Failed to post", description: error.response?.data?.message || "Something went wrong" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEmojiClick = (emojiObject) => setNewComment((prev) => prev + emojiObject.emoji);

  const handleReplyClick = (comment) => {
    setReplyingTo({ id: comment._id, username: comment.user.username });
    setEditingComment(null);
    setNewComment(`@${comment.user.username} `);
    inputRef.current?.focus();
  };

  const handleEditClick = (comment) => {
    setEditingComment({ id: comment._id });
    setReplyingTo(null);
    setNewComment(comment.text);
    inputRef.current?.focus();
  };

  const cancelAction = () => {
    setReplyingTo(null);
    setEditingComment(null);
    setNewComment("");
  };

  const rootComments = comments
    .filter((c) => !c.parentComment)
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      const diff = new Date(b.createdAt) - new Date(a.createdAt);
      return sortOrder === "newest" ? diff : -diff;
    });
  const replies = comments.filter((c) => c.parentComment);

  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      <div className="flex-1 overflow-y-auto custom-scrollbar" onClick={() => setShowEmojiPicker(false)}>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : rootComments.length === 0 ? (
          <div className="text-center p-8 text-text-secondary flex flex-col items-center">
            <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
            <p>No comments yet.</p>
            <p className="text-sm">Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-5">
            {rootComments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                post={post}
                authUser={authUser}
                onReply={() => handleReplyClick(comment)}
                onEdit={() => handleEditClick(comment)}
                onDelete={(id) => {
                  setComments((prev) => prev.filter((c) => c._id !== id));
                  onCommentDeleted?.();
                }}
                onUpdate={(updated) => setComments((prev) => prev.map((c) => (c._id === updated._id ? updated : c)))}
                childReplies={replies.filter((r) => r.parentComment === comment._id)}
              />
            ))}
            <div ref={commentsEndRef} />
          </div>
        )}
      </div>

      {(replyingTo || editingComment) && (
        <div className="px-4 py-2 bg-bg-surface border-t border-border-soft flex items-center justify-between text-xs text-text-secondary">
          <span>{replyingTo ? `Replying to @${replyingTo.username}` : "Editing comment"}</span>
          <button onClick={cancelAction} className="hover:text-text-primary font-semibold">
            Cancel
          </button>
        </div>
      )}

      <div className="border-t border-border-soft bg-bg-surface/50 relative shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="p-3 sm:p-4">
          {showEmojiPicker && (
            <div className="absolute bottom-full right-2 sm:right-4 z-50 mb-2">
              <EmojiPicker onEmojiClick={onEmojiClick} theme="auto" />
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-end gap-2 relative">
            <img
              src={authUser?.profilePicture || "https://i.pravatar.cc/150"}
              alt="You"
              className="w-9 h-9 rounded-full object-cover shrink-0 mb-1 hidden sm:block"
            />
            <div className="flex-1 relative bg-bg-base border border-border-soft focus-within:border-primary-500 rounded-3xl flex items-center transition-colors">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 ml-1 text-text-secondary hover:text-primary-500 transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>
              <textarea
                ref={inputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent py-2.5 px-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none resize-none custom-scrollbar"
                rows={Math.min(Math.max(newComment.split("\n").length, 1), 4)}
                maxLength={500}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="p-2 mr-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-primary-500 disabled:opacity-50 transition-colors hover:text-primary-600"
                aria-label="Post comment"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Individual comment + its replies
const CommentItem = ({ comment, post, authUser, onReply, onEdit, onDelete, onUpdate, childReplies = [], isReply = false }) => {
  const { toast } = useToast();
  const [showOptions, setShowOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);

  const isLiked = comment.likes?.includes(authUser?._id);

  const handleLike = async () => {
    try {
      const res = await api.put(`/api/posts/${post._id}/comments/${comment._id}/like`);
      const newLikes = res.data.isLiked ? [...comment.likes, authUser._id] : comment.likes.filter((id) => id !== authUser._id);
      onUpdate({ ...comment, likes: newLikes });
    } catch (err) {
      toast({ variant: "error", title: "Error", description: "Could not like comment" });
    }
  };

  const handlePin = async () => {
    try {
      const res = await api.put(`/api/posts/${post._id}/comments/${comment._id}/pin`);
      onUpdate({ ...comment, isPinned: res.data.isPinned });
      setShowOptions(false);
    } catch (err) {
      toast({ variant: "error", title: "Error", description: "Could not pin comment" });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/api/posts/${post._id}/comments/${comment._id}`);
      onDelete(comment._id);
      toast({ variant: "success", title: "Deleted", description: "Comment removed" });
    } catch (err) {
      toast({ variant: "error", title: "Error", description: "Could not delete comment" });
      setIsDeleting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(comment.text);
    toast({ variant: "success", title: "Copied", description: "Comment copied to clipboard" });
    setShowOptions(false);
  };

  const handleReport = async () => {
    try {
      await api.post(`/api/posts/${post._id}/comments/${comment._id}/report`);
      toast({ variant: "success", title: "Reported", description: "Comment reported successfully" });
      setShowOptions(false);
    } catch (err) {
      toast({ variant: "error", title: "Error", description: "Could not report comment" });
    }
  };

  const renderTextWithMentions = (text) => {
    const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
    return parts.map((part, i) =>
      part.startsWith("@") ? (
        <span key={i} className="text-primary-500 hover:underline cursor-pointer">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="group">
      <div className="flex gap-3 relative">
        <img
          src={comment.user?.profilePicture || "https://i.pravatar.cc/150"}
          alt={comment.user?.username}
          className={`${isReply ? "w-6 h-6 mt-1" : "w-8 h-8"} rounded-full object-cover shrink-0`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <span className="font-bold text-sm text-text-primary mr-2">{comment.user?.username}</span>
              <span className="text-sm text-text-primary break-words whitespace-pre-wrap">{renderTextWithMentions(comment.text)}</span>
            </div>

            <button onClick={handleLike} className="shrink-0 pt-1 group/btn">
              <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-red-500 text-red-500" : "text-text-secondary group-hover/btn:text-red-400"}`} />
            </button>
          </div>

          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-text-secondary font-medium">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: false }).replace("about ", "")}
            </span>

            {comment.likes?.length > 0 && (
              <span className="text-xs text-text-secondary font-semibold">
                {comment.likes.length} {comment.likes.length === 1 ? "like" : "likes"}
              </span>
            )}

            {!isReply && (
              <button onClick={onReply} className="text-xs text-text-secondary font-semibold hover:text-text-primary">
                Reply
              </button>
            )}

            <div className="relative">
              <button onClick={() => setShowOptions(!showOptions)} className="text-text-secondary hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showOptions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute top-6 left-0 w-36 bg-bg-surface border border-border-soft rounded-lg shadow-xl py-1 z-10"
                  >
                    {post.user?._id === authUser?._id && !isReply && (
                      <button onClick={handlePin} className="w-full px-3 py-1.5 text-left text-xs font-semibold text-text-primary hover:bg-bg-surface-hover flex items-center gap-2">
                        <Pin className="w-3.5 h-3.5" /> {comment.isPinned ? "Unpin" : "Pin to top"}
                      </button>
                    )}
                    <button onClick={handleCopy} className="w-full px-3 py-1.5 text-left text-xs font-semibold text-text-primary hover:bg-bg-surface-hover flex items-center gap-2">
                      <MessageCircle className="w-3.5 h-3.5" /> Copy
                    </button>
                    {comment.user?._id === authUser?._id ? (
                      <>
                        <button onClick={() => { setShowOptions(false); onEdit(); }} className="w-full px-3 py-1.5 text-left text-xs font-semibold text-text-primary hover:bg-bg-surface-hover flex items-center gap-2">
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={handleDelete} disabled={isDeleting} className="w-full px-3 py-1.5 text-left text-xs font-semibold text-red-500 hover:bg-bg-surface-hover flex items-center gap-2">
                          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
                        </button>
                      </>
                    ) : (
                      <button onClick={handleReport} className="w-full px-3 py-1.5 text-left text-xs font-semibold text-red-500 hover:bg-bg-surface-hover flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5" /> Report
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            {comment.isPinned && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-primary-500 uppercase tracking-wider">
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}
            {comment.isEdited && <span className="text-[10px] text-text-secondary font-medium">(Edited)</span>}
          </div>
        </div>
      </div>

      {childReplies.length > 0 && (
        <div className="ml-11 mt-2 space-y-3">
          <button
            onClick={() => setRepliesOpen((o) => !o)}
            className="flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors mb-2"
          >
            <div className="w-6 h-[1px] bg-border-soft" />
            {repliesOpen ? "Hide replies" : `View ${childReplies.length} ${childReplies.length === 1 ? "reply" : "replies"}`}
          </button>
          {repliesOpen &&
            childReplies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                post={post}
                authUser={authUser}
                onReply={onReply}
                onEdit={() => onEdit(reply)}
                onDelete={onDelete}
                onUpdate={onUpdate}
                isReply={true}
              />
            ))}
        </div>
      )}
    </div>
  );
};
