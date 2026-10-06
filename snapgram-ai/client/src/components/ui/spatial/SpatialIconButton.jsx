import { forwardRef } from "react";
import { cn } from "../../../utils/cn";

export const SpatialIconButton = forwardRef(({
  children,
  className,
  variant = "glass", // 'glass' | 'primary' | 'ghost'
  size = "md",      // 'sm' (36px) | 'md' (44px) | 'lg' (50px)
  active = false,
  badge = 0,
  tooltip,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "w-9 h-9 min-w-[36px] min-h-[36px] text-xs",
    md: "w-11 h-11 min-w-[44px] min-h-[44px] text-sm",
    lg: "w-13 h-13 min-w-[50px] min-h-[50px] text-base",
  };

  const variantClasses = {
    glass: cn(
      "bg-black/5 hover:bg-black/10 active:bg-black/15 text-text-primary",
      "dark:bg-white/10 dark:hover:bg-white/20 dark:active:bg-white/25 dark:text-white",
      "border border-black/10 dark:border-white/15 hover:border-black/20 dark:hover:border-white/30",
      "backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
      active && "bg-[#FF6B35]/15 text-[#FF6B35] border-[#FF6B35]/30 dark:bg-[#FF6B35]/35 dark:border-white/40 dark:text-white shadow-[0_0_16px_rgba(255,107,53,0.35)]"
    ),
    primary: cn(
      "bg-gradient-to-br from-[#FF6B35] to-[#E55A27] text-white",
      "border border-white/25 shadow-[0_6px_20px_rgba(255,107,53,0.35)]",
      "hover:brightness-110 active:scale-95"
    ),
    ghost: cn(
      "bg-transparent hover:bg-black/5 text-text-secondary hover:text-text-primary",
      "dark:hover:bg-white/10 dark:text-white/80 dark:hover:text-white",
      active && "text-[#FF6B35] bg-[#FF6B35]/10 dark:text-white dark:bg-white/10"
    ),
  };

  return (
    <button
      ref={ref}
      type="button"
      title={tooltip}
      className={cn(
        "relative rounded-full inline-flex items-center justify-center transition-all duration-200 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]",
        sizeClasses[size] || sizeClasses.md,
        variantClasses[variant] || variantClasses.glass,
        className
      )}
      {...props}
    >
      {children}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 flex min-w-[18px] h-[18px] px-1 items-center justify-center rounded-full bg-[#F43F5E] text-[10px] font-bold text-white border-2 border-[var(--bg-base)] shadow-md">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
});

SpatialIconButton.displayName = "SpatialIconButton";
