import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Music2, Loader2, Plus } from "lucide-react";
import { ReelActionRail } from "./ReelActionRail";
import { ReelsTabs } from "./ReelsTabs";
import { FollowButton } from "../profile/FollowButton";
import { useReelActions } from "../../hooks/useReelActions";

const DOUBLE_TAP_DELAY = 300;

const ReelItem = ({ reel, isActive, isMuted, onMuteToggle }) => {
  const { triggerLike, liked } = useReelActions(reel);
  const videoRef = useRef(null);
  const tapTimer = useRef(null);
  const tapCount = useRef(0);

  const [showHeart, setShowHeart] = useState(false);
  const [heartPos, setHeartPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  const handleTap = (e) => {
    tapCount.current += 1;

    if (tapCount.current === 1) {
      tapTimer.current = setTimeout(() => {
        tapCount.current = 0;
      }, DOUBLE_TAP_DELAY);
    } else if (tapCount.current === 2) {
      clearTimeout(tapTimer.current);
      tapCount.current = 0;

      const rect = e.currentTarget.getBoundingClientRect();
      setHeartPos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });

      if (!liked) triggerLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
  };

  return (
    <div
      className="relative w-full h-full bg-black overflow-hidden flex-shrink-0"
      onClick={handleTap}
      style={{ scrollSnapAlign: "start" }}
    >
      <video
        ref={videoRef}
        src={reel.video?.url}
        poster={reel.video?.thumbnailUrl}
        className="absolute inset-0 w-full h-full object-cover select-none"
        loop
        playsInline
        muted={isMuted}
        preload="metadata"
        controlsList="nodownload no-share"
        onContextMenu={(e) => e.preventDefault()}
      />
      <div className="absolute inset-0 z-0 pointer-events-auto" onContextMenu={(e) => e.preventDefault()} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute pointer-events-none"
            style={{ left: `${heartPos.x}%`, top: `${heartPos.y}%`, transform: "translate(-50%, -50%)" }}
          >
            <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right action rail */}
      <div
        className="absolute right-3 flex flex-col items-center gap-5 z-10"
        style={{ bottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-1">
          <Link to={`/app/profile/${reel.user?._id}`}>
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white ring-2 ring-primary-500">
              <img
                src={reel.user?.profilePicture || "https://i.pravatar.cc/150"}
                alt={reel.user?.username}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
          <FollowButton
            userId={reel.user?._id}
            targetUser={reel.user}
            icon={Plus}
            hideWhenFollowing
            className="w-6 h-6 min-w-0 p-0.5 rounded-full bg-primary-500 text-white flex items-center justify-center -mt-3 border-2 border-black"
          />
        </div>

        <ReelActionRail reel={reel} variant="full" size="lg" isMuted={isMuted} onMuteToggle={onMuteToggle} />
      </div>

      {/* Bottom info overlay */}
      <div
        className="absolute left-3 right-16 z-10"
        style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Link to={`/app/profile/${reel.user?._id}`} className="text-white font-bold text-base drop-shadow hover:underline">
          @{reel.user?.username}
        </Link>

        {reel.caption && (
          <p className="text-white/90 text-sm mt-1 leading-snug drop-shadow line-clamp-2">{reel.caption}</p>
        )}

        {reel.music?.title && (
          <div className="flex items-center gap-2 mt-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 w-fit">
            <Music2 className="w-3.5 h-3.5 text-white animate-spin" style={{ animationDuration: "3s" }} />
            <p className="text-white text-xs font-medium truncate max-w-[180px]">
              {reel.music.title}
              {reel.music.artist ? ` · ${reel.music.artist}` : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Immersive vertical feed used on phones and narrow "mobile web" viewports
 * (< lg breakpoint). Desktop uses DesktopReelsView instead.
 */
export const MobileReelsFeed = ({
  reels,
  loadingMore,
  tab,
  onTabChange,
  containerRef,
  activeIndex,
  isMuted,
  onMuteToggle,
}) => {
  return (
    <div className="w-full h-[100dvh] flex justify-center bg-black md:bg-bg-base md:py-4">
      <div
        ref={containerRef}
        className="relative w-full h-[100dvh] md:h-full md:max-w-[420px] md:rounded-[24px] overflow-y-scroll no-scrollbar md:shadow-2xl md:border md:border-border-soft bg-black flex-shrink-0"
        style={{
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        {/* Following / For You tabs */}
        <div
          className="absolute left-0 right-0 z-20 flex justify-center pointer-events-none"
          style={{ top: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
        >
          <div className="pointer-events-auto">
            <ReelsTabs tab={tab} onChange={onTabChange} variant="dark" />
          </div>
        </div>

        {reels.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center px-8">
            <p className="text-white text-lg font-bold">
              {tab === "following" ? "No reels from people you follow yet" : "No reels yet"}
            </p>
            <Link to="/app/reels/create" className="px-6 py-3 rounded-full hero-gradient text-white font-semibold">
              Upload the first one
            </Link>
          </div>
        ) : (
          reels.map((reel, idx) => (
            <div key={reel._id} data-reel-item data-reel-index={idx} data-reel-id={reel._id} className="reel-item w-full flex-shrink-0">
              <ReelItem reel={reel} isActive={idx === activeIndex} isMuted={isMuted} onMuteToggle={onMuteToggle} />
            </div>
          ))
        )}

        {loadingMore && (
          <div className="w-full flex items-center justify-center bg-black" style={{ height: "100dvh", scrollSnapAlign: "start" }}>
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};
