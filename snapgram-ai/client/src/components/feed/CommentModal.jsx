import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { CommentsPanel } from "./CommentsPanel";

export const CommentModal = ({ post, isOpen, onClose, onCommentAdded, onCommentDeleted }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="comment-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />

      {/* Mobile: bottom sheet | Desktop: centered modal */}
      <motion.div
        key="comment-modal"
        initial={{ y: '100%', opacity: 1 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed z-[51] w-full md:w-auto
          bottom-0 left-0 right-0
          md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
          md:max-w-5xl
          h-[90dvh] md:h-[85vh]
          flex flex-col md:flex-row
          overflow-hidden
          rounded-t-3xl md:rounded-3xl
          bg-bg-base border border-border-soft/50 shadow-2xl"
      >
        <div className="md:hidden">
          <div className="bottom-sheet-handle" />
        </div>

        <button
          onClick={onClose}
          className="absolute top-3 right-4 z-20 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover rounded-full transition-colors"
          aria-label="Close comments"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Post Image — desktop only */}
        <div className="hidden md:flex md:w-[55%] bg-black items-center justify-center relative flex-shrink-0">
          <img
            src={post.media?.[0]?.url || post.mediaUrl}
            alt="Post"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Right / Main: Comments Section */}
        <div className="flex-1 flex flex-col min-h-0 bg-bg-base relative">
          <div className="flex items-center justify-between p-4 border-b border-border-soft">
            <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
              <MessageCircle className="w-5 h-5" /> Comments
            </h2>
          </div>

          {/* Post Caption as first "Comment" */}
          <div className="px-4 pt-4">
            <div className="flex gap-3 mb-4 pb-4 border-b border-border-soft/50">
              <img
                src={post.user?.profilePicture || "https://i.pravatar.cc/150"}
                alt={post.user?.username}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <div>
                <span className="font-bold text-sm text-text-primary mr-2">{post.user?.username}</span>
                <span className="text-sm text-text-primary whitespace-pre-wrap">{post.caption}</span>
                <p className="text-xs text-text-secondary mt-1">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>

          <CommentsPanel post={post} onCommentAdded={onCommentAdded} onCommentDeleted={onCommentDeleted} sortOrder="oldest" className="flex-1 px-4" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
