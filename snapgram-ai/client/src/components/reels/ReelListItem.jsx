import { Play, Eye } from "lucide-react";
import { cn } from "../../utils/cn";
import { formatCount } from "../../hooks/useReelActions";

const formatDuration = (s) => {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

/**
 * A thumbnail row used both in the left "browse" rail and the right
 * "Trending Reels" panel of the desktop layout.
 */
export const ReelListItem = ({ reel, active, onClick, size = "md" }) => {
  const duration = formatDuration(reel.video?.duration);
  const title = reel.caption?.split("\n")[0]?.slice(0, 60) || `Reel by @${reel.user?.username || "creator"}`;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 rounded-2xl p-2 text-left transition-all duration-150",
        active ? "bg-primary-500/10 ring-1 ring-primary-500/40" : "hover:bg-bg-surface-hover"
      )}
    >
      <div
        className={cn(
          "relative flex-shrink-0 rounded-xl overflow-hidden bg-bg-surface-hover",
          size === "sm" ? "w-12 h-16" : "w-14 h-[4.75rem]"
        )}
      >
        {reel.video?.thumbnailUrl ? (
          <img src={reel.video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <video src={reel.video?.url} className="w-full h-full object-cover" muted preload="metadata" />
        )}
        <div className="absolute inset-0 bg-black/10" />
        <Play className="absolute bottom-1 left-1 w-3 h-3 text-white drop-shadow" fill="white" />
        {duration && (
          <span className="absolute bottom-1 right-1 text-[9px] font-semibold text-white bg-black/50 rounded px-1">
            {duration}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("font-semibold text-text-primary truncate", size === "sm" ? "text-xs" : "text-sm")}>{title}</p>
        <p className="text-xs text-text-secondary truncate mt-0.5">@{reel.user?.username || "creator"}</p>
        <p className="flex items-center gap-1 text-[11px] text-text-secondary mt-0.5">
          <Eye className="w-3 h-3" /> {formatCount(reel.viewsCount ?? 0)} views
        </p>
      </div>
    </button>
  );
};
