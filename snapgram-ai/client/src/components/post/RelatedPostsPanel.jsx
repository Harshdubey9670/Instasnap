import { Link } from "react-router-dom";
import { Heart, Sparkles } from "lucide-react";

const formatCount = (n = 0) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

export const RelatedPostsPanel = ({ posts, sourceLabel }) => {
  if (!posts || posts.length === 0) return null;

  return (
    <div className="warm-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-500" /> Related Posts
        </h3>
      </div>
      <div className="space-y-1">
        {posts.slice(0, 4).map((post) => {
          const media = post.media?.[0] || { url: post.mediaUrl };
          const title = post.caption?.split("\n")[0]?.slice(0, 40) || `Post by @${post.user?.username || "creator"}`;
          return (
            <Link
              key={post._id}
              to={`/app/post/${post._id}`}
              state={{ source: sourceLabel, userId: post.user?._id }}
              className="flex items-center gap-3 rounded-2xl p-2 hover:bg-bg-surface-hover transition-colors"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-bg-surface-hover shrink-0">
                {media?.url && (
                  media.type === "video" ? (
                    <video src={media.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={media.url} className="w-full h-full object-cover" alt="" />
                  )
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary truncate">{title}</p>
                <p className="text-xs text-text-secondary truncate">@{post.user?.username || "creator"}</p>
                <p className="flex items-center gap-1 text-[11px] text-text-secondary mt-0.5">
                  <Heart className="w-3 h-3" /> {formatCount(post.likes?.length ?? post.likesCount ?? 0)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
