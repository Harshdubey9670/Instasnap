import { Link } from "react-router-dom";
import { BadgeCheck, MoreHorizontal } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { FollowButton } from "../profile/FollowButton";

const shortTimeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const PostDetailCreatorRow = ({ post, onShowOptions }) => (
  <div className="flex items-center justify-between gap-3">
    <Link to={`/app/profile/${post.user?._id}`} className="flex items-center gap-2.5 min-w-0">
      <Avatar src={post.user?.profilePicture || post.user?.avatar} fallback={post.user?.username?.charAt(0)?.toUpperCase()} size="md" />
      <div className="min-w-0">
        <p className="font-bold text-sm text-text-primary flex items-center gap-1 truncate">
          {post.user?.username}
          {post.user?.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary-500 fill-primary-500/20 shrink-0" />}
        </p>
        <p className="text-xs text-text-secondary">{shortTimeAgo(post.createdAt)}</p>
      </div>
    </Link>

    <div className="flex items-center gap-2 shrink-0">
      <FollowButton
        userId={post.user?._id}
        targetUser={post.user}
        className="h-8 px-3.5 text-xs font-semibold rounded-full bg-primary-500 text-white hover:bg-primary-600"
      />
      <button
        onClick={onShowOptions}
        className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
        aria-label="Post options"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  </div>
);
