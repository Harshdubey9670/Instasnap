import { useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Loader2, Clapperboard } from "lucide-react";
import { ReelsTabs } from "./ReelsTabs";
import { ReelListItem } from "./ReelListItem";
import { DesktopReelPlayer } from "./DesktopReelPlayer";
import { TrendingReelsPanel } from "./TrendingReelsPanel";
import { SuggestedCreatorsPanel } from "./SuggestedCreatorsPanel";
import { CreateReelCTA } from "./CreateReelCTA";

/**
 * Desktop "reel browser" — left rail lists reels to pick from, the center
 * panel plays whichever one is selected, and the right rail surfaces
 * trending reels, suggested creators and the create CTA. This is a
 * deliberately different interaction model from the mobile infinite-scroll
 * feed (browse-then-watch rather than swipe-to-advance), suited to a mouse
 * + keyboard, wide-viewport context.
 */
export const DesktopReelsView = ({
  reels,
  tab,
  onTabChange,
  activeReel,
  onSelectReel,
  hasMore,
  loadingMore,
  onLoadMore,
  onReelDeleted,
}) => {
  const railRef = useRef(null);

  const handleRailScroll = useCallback(() => {
    const el = railRef.current;
    if (!el || loadingMore || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      onLoadMore();
    }
  }, [loadingMore, hasMore, onLoadMore]);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleRailScroll);
    return () => el.removeEventListener("scroll", handleRailScroll);
  }, [handleRailScroll]);

  return (
    <div className="grid h-full grid-cols-[280px_minmax(0,1fr)_320px] gap-6 px-6 py-4">
      {/* Left rail — browse */}
      <div className="flex flex-col min-h-0">
        <div className="mb-3 flex-shrink-0">
          <ReelsTabs tab={tab} onChange={onTabChange} variant="light" className="w-full justify-center" />
        </div>
        <div ref={railRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-1 pr-1">
          {reels.length === 0 ? (
            <div className="warm-card p-6 text-center">
              <Clapperboard className="w-8 h-8 text-text-secondary mx-auto mb-2" />
              <p className="text-sm font-semibold text-text-primary">
                {tab === "following" ? "No reels from people you follow yet" : "No reels yet"}
              </p>
              <Link to="/app/reels/create" className="inline-block mt-3 text-xs font-semibold text-primary-500 hover:text-primary-600">
                Upload the first one
              </Link>
            </div>
          ) : (
            reels.map((reel) => (
              <ReelListItem key={reel._id} reel={reel} active={reel._id === activeReel?._id} onClick={() => onSelectReel(reel)} />
            ))
          )}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
            </div>
          )}
        </div>
      </div>

      {/* Center — active player */}
      <div className="flex items-center justify-center min-h-0 overflow-y-auto no-scrollbar py-2">
        {activeReel ? (
          <DesktopReelPlayer reel={activeReel} onDeleted={onReelDeleted} />
        ) : (
          <div className="warm-card w-full max-w-[420px] aspect-[9/16] flex items-center justify-center">
            <p className="text-text-secondary text-sm">Select a reel to start watching</p>
          </div>
        )}
      </div>

      {/* Right rail — discover */}
      <div className="flex flex-col gap-4 min-h-0 overflow-y-auto no-scrollbar pb-2">
        <TrendingReelsPanel activeReelId={activeReel?._id} onSelect={onSelectReel} />
        <CreateReelCTA />
        <SuggestedCreatorsPanel />
      </div>
    </div>
  );
};
