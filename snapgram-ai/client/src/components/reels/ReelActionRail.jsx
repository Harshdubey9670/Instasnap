import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, Repeat, Download, Volume2, VolumeX, Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";
import { useReelActions, formatCount } from "../../hooks/useReelActions";

const RailButton = ({ icon: Icon, label, count, active, activeClass, onClick, to, size, disabled, spin }) => {
  const iconSize = size === "lg" ? "w-8 h-8" : "w-7 h-7";
  const Wrapper = to ? Link : "button";

  return (
    <Wrapper
      to={to}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="flex flex-col items-center gap-1.5 disabled:opacity-60"
    >
      <motion.div whileTap={{ scale: 1.25 }} transition={{ type: "spring", stiffness: 400 }}>
        {spin ? (
          <Loader2 className={cn(iconSize, "text-white animate-spin drop-shadow")} />
        ) : (
          <Icon
            className={cn(
              iconSize,
              "drop-shadow transition-colors",
              active ? activeClass : "text-white fill-white/10 hover:fill-white/20"
            )}
          />
        )}
      </motion.div>
      {count !== undefined && (
        <span className="text-white text-xs font-semibold drop-shadow">{formatCount(count)}</span>
      )}
    </Wrapper>
  );
};

/**
 * Vertical like/comment/share/save action stack. Shared by the immersive
 * mobile feed and the desktop player so behavior is identical everywhere —
 * only which buttons render differs (`variant`).
 */
export const ReelActionRail = ({ reel, isMuted, onMuteToggle, variant = "full", size = "lg", className }) => {
  const { liked, likesCount, toggleLike, saved, toggleSave, downloading, handleDownload, handleShare } =
    useReelActions(reel);

  return (
    <div className={cn("flex flex-col items-center gap-5", className)}>
      <RailButton
        icon={Heart}
        label="Like"
        size={size}
        active={liked}
        activeClass="text-red-500 fill-red-500"
        count={likesCount}
        onClick={toggleLike}
      />
      <RailButton icon={MessageCircle} label="Comments" size={size} count={reel.commentsCount ?? 0} />
      <RailButton icon={Share2} label="Share" size={size} count={reel.sharesCount ?? 0} onClick={handleShare} />
      <RailButton
        icon={Bookmark}
        label="Save"
        size={size}
        active={saved}
        activeClass="text-primary-400 fill-primary-400"
        onClick={toggleSave}
      />

      {variant === "full" && (
        <>
          <RailButton icon={Repeat} label="Remix" size={size} to={`/app/reels/create?remix=${reel._id}`} />
          <RailButton icon={Download} label="Save to device" size={size} onClick={handleDownload} spin={downloading} disabled={downloading} />
        </>
      )}

      {onMuteToggle && (
        <button onClick={onMuteToggle} title={isMuted ? "Unmute" : "Mute"} aria-label={isMuted ? "Unmute" : "Mute"}>
          {isMuted ? (
            <VolumeX className={cn(size === "lg" ? "w-7 h-7" : "w-6 h-6", "text-white drop-shadow")} />
          ) : (
            <Volume2 className={cn(size === "lg" ? "w-7 h-7" : "w-6 h-6", "text-white drop-shadow")} />
          )}
        </button>
      )}
    </div>
  );
};

export { RailButton };
