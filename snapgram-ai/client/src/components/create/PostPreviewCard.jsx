import { useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ChevronLeft, ChevronRight, MapPin, Users } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { cn } from "../../utils/cn";

/**
 * Read-only "how your post will look" preview. Deliberately not wired to
 * any real like/comment/save actions — it's a mockup of an unpublished
 * post, not a real PostCard, so nothing here should be clickable/navigable.
 */
export const PostPreviewCard = ({ authUser, previews, caption, location, audience }) => {
  const [idx, setIdx] = useState(0);
  const activeIdx = Math.min(idx, Math.max(0, previews.length - 1));

  const captionPreview = (
    <>
      {caption.split(/(#\w+|@\w+)/g).map((part, i) =>
        /^(#|@)\w+$/.test(part) ? (
          <span key={i} className={part.startsWith("#") ? "text-primary-500 font-medium" : "text-sky-500 font-medium"}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );

  return (
    <div className="warm-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar src={authUser?.profilePicture || authUser?.avatar} fallback={authUser?.username?.charAt(0)?.toUpperCase()} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary truncate">{authUser?.username || "you"}</p>
            <p className="text-[11px] text-text-secondary flex items-center gap-1 truncate">
              Just now
              {location && (
                <>
                  <span>·</span>
                  <MapPin className="w-2.5 h-2.5" />
                  {location}
                </>
              )}
            </p>
          </div>
        </div>
        <MoreHorizontal className="w-4 h-4 text-text-secondary shrink-0" />
      </div>

      {/* Media */}
      <div className="relative w-full aspect-square bg-bg-surface-hover">
        {previews.length > 0 ? (
          <>
            {previews[activeIdx].type === "image" ? (
              <img src={previews[activeIdx].url} alt="" className="w-full h-full object-cover" />
            ) : (
              <video src={previews[activeIdx].url} className="w-full h-full object-cover" muted />
            )}
            {previews.length > 1 && (
              <>
                <span className="absolute top-2 right-2 text-[11px] font-semibold text-white bg-black/50 rounded-full px-2 py-0.5">
                  {activeIdx + 1}/{previews.length}
                </span>
                {activeIdx > 0 && (
                  <button
                    type="button"
                    onClick={() => setIdx(activeIdx - 1)}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {activeIdx < previews.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setIdx(activeIdx + 1)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-secondary text-sm">
            Your media will appear here
          </div>
        )}
      </div>

      {/* Actions row (decorative — this post doesn't exist yet) */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-1.5 text-text-primary">
        <div className="flex items-center gap-3">
          <Heart className="w-5 h-5" />
          <MessageCircle className="w-5 h-5" />
          <Send className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2">
          {audience === "closeFriends" && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
              <Users className="w-2.5 h-2.5" /> Close Friends
            </span>
          )}
          <Bookmark className="w-5 h-5" />
        </div>
      </div>

      {/* Caption */}
      <div className="px-3.5 pb-3.5 text-sm leading-snug">
        {caption ? (
          <p className={cn("text-text-primary")}>
            <span className="font-bold mr-1">{authUser?.username || "you"}</span>
            {captionPreview}
          </p>
        ) : (
          <p className="text-text-secondary italic">Your caption will appear here...</p>
        )}
        <p className="text-[11px] text-text-secondary mt-1 uppercase tracking-wide">Just now</p>
      </div>
    </div>
  );
};
