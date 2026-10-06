import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "../../utils/cn";

// Static pseudo-waveform bar heights (%) — real per-sample amplitude data
// isn't captured at record time, so this gives the "voice note card" look
// from the reference without pretending to visualize actual audio content.
const BAR_HEIGHTS = [35, 60, 45, 80, 55, 30, 70, 50, 60, 40, 65, 45, 25, 55, 75, 35, 50, 65, 40, 55];

export const VoiceNotePlayer = ({ src, duration = 0, isMine }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(audio.currentTime);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const displaySeconds = Math.round(currentTime > 0 ? currentTime : duration);

  return (
    <div className="flex items-center gap-2.5 min-w-[180px] py-0.5">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
          isMine ? "bg-white/25 text-white hover:bg-white/35" : "bg-primary-500/15 text-primary-500 hover:bg-primary-500/25"
        )}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
      </button>

      <div className="flex items-end gap-[2.5px] h-6 flex-1 min-w-[70px]">
        {BAR_HEIGHTS.map((h, i) => {
          const isActive = (i / BAR_HEIGHTS.length) * 100 <= progress;
          return (
            <span
              key={i}
              style={{ height: `${h}%` }}
              className={cn(
                "w-[2.5px] rounded-full transition-colors",
                isMine ? (isActive ? "bg-white" : "bg-white/35") : isActive ? "bg-primary-500" : "bg-primary-500/25"
              )}
            />
          );
        })}
      </div>

      <span className={cn("text-[10px] font-mono flex-shrink-0 tabular-nums", isMine ? "text-white/85" : "text-text-secondary")}>
        {displaySeconds}s
      </span>
    </div>
  );
};
