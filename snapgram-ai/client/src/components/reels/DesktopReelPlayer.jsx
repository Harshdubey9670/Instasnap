import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, Maximize, BadgeCheck, Music2 } from "lucide-react";
import { cn } from "../../utils/cn";
import { ReelActionRail } from "./ReelActionRail";
import { ReelMoreMenu } from "./ReelMoreMenu";
import { FollowButton } from "../profile/FollowButton";
import api from "../../services/api";

const formatTime = (s) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${sec}`;
};

/**
 * The large bounded video panel in the center column of the desktop reels
 * browser — a rounded "player" rather than a fullscreen takeover, matching
 * the reference layout's cream/soft-shadow card language.
 */
export const DesktopReelPlayer = ({ reel, onDeleted }) => {
  const videoRef = useRef(null);
  const panelRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);
    v.play().catch(() => {});
    api.put(`/api/reels/${reel._id}/view`).catch(() => {});
  }, [reel._id]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setCurrentTime(v.currentTime);
    setDuration(v.duration);
    setProgress((v.currentTime / v.duration) * 100);
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    const pct = Number(e.target.value);
    setProgress(pct);
    if (v && v.duration) {
      v.currentTime = (pct / 100) * v.duration;
    }
  };

  const handleFullscreen = () => {
    if (panelRef.current?.requestFullscreen) panelRef.current.requestFullscreen();
  };

  return (
    <div
      ref={panelRef}
      className="relative w-full max-w-[420px] mx-auto aspect-[9/16] rounded-[28px] overflow-hidden bg-black shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-border-soft"
    >
      <video
        ref={videoRef}
        src={reel.video?.url}
        poster={reel.video?.thumbnailUrl}
        className="absolute inset-0 w-full h-full object-cover cursor-pointer select-none"
        loop
        playsInline
        muted={isMuted}
        preload="metadata"
        controlsList="nodownload no-share"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Gradient scrims for legibility */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none" />

      {/* Center play/pause affordance */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10"
          aria-label="Play"
        >
          <span className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </span>
        </button>
      )}

      {/* Header — creator + follow + more */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-3">
        <Link to={`/app/profile/${reel.user?._id}`} className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/80 flex-shrink-0">
            <img
              src={reel.user?.profilePicture || "https://i.pravatar.cc/150"}
              alt={reel.user?.username}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-white font-semibold text-sm drop-shadow flex items-center gap-1 truncate">
            @{reel.user?.username}
            {reel.user?.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary-300 fill-primary-300/25 flex-shrink-0" />}
          </span>
        </Link>
        <div className="flex items-center gap-2 flex-shrink-0">
          <FollowButton
            userId={reel.user?._id}
            targetUser={reel.user}
            className="h-8 px-3.5 text-xs font-semibold rounded-full bg-white text-[#1A1A1A] hover:bg-white/90 shadow"
          />
          <ReelMoreMenu reel={reel} isMuted={isMuted} onMuteToggle={() => setIsMuted((m) => !m)} onDeleted={onDeleted} />
        </div>
      </div>

      {/* Action rail */}
      <div className="absolute right-3 bottom-20 z-10">
        <ReelActionRail reel={reel} variant="compact" size="md" />
      </div>

      {/* Caption + music */}
      <div className="absolute left-4 right-16 bottom-12 z-10">
        {reel.caption && <p className="text-white text-sm font-medium leading-snug drop-shadow line-clamp-2">{reel.caption}</p>}
        {reel.music?.title && (
          <div className="flex items-center gap-1.5 mt-2">
            <Music2 className="w-3.5 h-3.5 text-white/90 animate-spin" style={{ animationDuration: "3s" }} />
            <p className="text-white/90 text-xs font-medium truncate max-w-[220px]">
              {reel.music.title}
              {reel.music.artist ? ` · ${reel.music.artist}` : ""}
            </p>
          </div>
        )}
      </div>

      {/* Scrub bar */}
      <div className="absolute left-3 right-3 bottom-3 z-10 flex items-center gap-2">
        <button onClick={togglePlay} className="text-white flex-shrink-0" aria-label={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <span className="text-white text-[11px] font-medium tabular-nums flex-shrink-0 drop-shadow">
          {formatTime(currentTime)}/{formatTime(duration)}
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={Number.isFinite(progress) ? progress : 0}
          onChange={handleSeek}
          className={cn(
            "flex-1 h-1 rounded-full appearance-none cursor-pointer accent-primary-500",
            "bg-white/25 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          )}
          aria-label="Seek"
        />
        <button onClick={handleFullscreen} className="text-white flex-shrink-0" aria-label="Fullscreen">
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
