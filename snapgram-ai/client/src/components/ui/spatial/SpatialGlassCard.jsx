import { forwardRef } from "react";
import { cn } from "../../../utils/cn";

export const SpatialGlassCard = forwardRef(({
  children,
  className,
  variant = "default", // 'default' | 'elevated' | 'subtle' | 'pill'
  interactive = false,
  onClick,
  ...props
}, ref) => {
  const variants = {
    default: "bg-[rgba(var(--glass-1),0.38)] backdrop-blur-xl border border-white/15 shadow-[0_12px_32px_rgba(var(--glass-shadow),0.35),inset_0_1px_0_rgba(255,255,255,0.18)] rounded-[22px]",
    elevated: "bg-[rgba(var(--glass-2),0.48)] backdrop-blur-2xl border border-white/20 shadow-[0_20px_48px_rgba(var(--glass-shadow),0.45),inset_0_1px_1px_rgba(255,255,255,0.22)] rounded-[26px]",
    subtle: "bg-[rgba(var(--glass-1),0.28)] backdrop-blur-md border border-white/10 shadow-sm rounded-[18px]",
    pill: "bg-[rgba(var(--glass-1),0.45)] backdrop-blur-xl border border-white/15 rounded-full",
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        variants[variant] || variants.default,
        "text-text-primary transition-all duration-200",
        interactive && "cursor-pointer hover:scale-[1.01] hover:bg-[rgba(var(--glass-2),0.45)] hover:border-white/25 active:scale-[0.98]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

SpatialGlassCard.displayName = "SpatialGlassCard";
