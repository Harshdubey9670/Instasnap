import { useState } from "react";
import { cn } from "../../../utils/cn";
import { User } from "lucide-react";

export const SpatialAvatar = ({
  src,
  alt = "User avatar",
  size = "md", // 'xs' (28) | 'sm' (36) | 'md' (48) | 'lg' (64) | 'xl' (84) | '2xl' (100)
  hasStory = false,
  isLive = false,
  isOnline = false,
  fallback,
  className,
  onClick,
  ...props
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    xs: { outer: "w-7 h-7", inner: "w-6 h-6", text: "text-[10px]" },
    sm: { outer: "w-9 h-9", inner: "w-8 h-8", text: "text-xs" },
    md: { outer: "w-12 h-12", inner: "w-11 h-11", text: "text-sm" },
    lg: { outer: "w-16 h-16", inner: "w-15 h-15", text: "text-base" },
    xl: { outer: "w-22 h-22", inner: "w-20 h-20", text: "text-xl" },
    "2xl": { outer: "w-28 h-28", inner: "w-26 h-26", text: "text-2xl" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 select-none",
        onClick && "cursor-pointer group",
        currentSize.outer,
        className
      )}
      {...props}
    >
      {/* Story Ring - Warm gradient ring inspired by reference screenshot */}
      {hasStory && (
        <div className="absolute inset-0 rounded-full p-[2px] bg-gradient-to-tr from-[#FF6B35] via-[#FF8C5A] to-[#FFB347] animate-pulse-subtle shadow-[0_0_12px_rgba(255,107,53,0.4)]" />
      )}

      {isLive && (
        <div className="absolute inset-0 rounded-full p-[2px] bg-gradient-to-tr from-[#F43F5E] via-[#E11D48] to-[#FDA4AF] animate-pulse" />
      )}

      {/* Avatar Container */}
      <div
        className={cn(
          "relative overflow-hidden rounded-full border-2 border-[rgba(255,255,255,0.2)] bg-[var(--bg-surface)] shadow-inner flex items-center justify-center transition-transform duration-200",
          onClick && "group-hover:scale-105",
          hasStory ? currentSize.inner : "w-full h-full"
        )}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={alt}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={cn("w-full h-full flex items-center justify-center bg-[rgba(var(--glass-2),0.5)] font-bold text-white uppercase", currentSize.text)}>
            {fallback || <User className="w-1/2 h-1/2 text-white/70" />}
          </div>
        )}
      </div>

      {/* Online indicator */}
      {isOnline && (
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#22C55E] border-2 border-[var(--bg-base)] shadow-sm" />
      )}

      {/* Live Badge */}
      {isLive && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#E11D48] text-[9px] font-black uppercase tracking-wider text-white px-1.5 py-0.2 rounded-full border border-white/20">
          LIVE
        </span>
      )}
    </div>
  );
};
