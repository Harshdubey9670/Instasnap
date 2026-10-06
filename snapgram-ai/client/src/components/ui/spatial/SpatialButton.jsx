import { forwardRef } from "react";
import { cn } from "../../../utils/cn";
import { Loader2 } from "lucide-react";

export const SpatialButton = forwardRef(({
  children,
  className,
  variant = "primary", // 'primary' | 'glass' | 'ghost' | 'danger'
  size = "md",        // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  icon: Icon,
  type = "button",
  ...props
}, ref) => {
  const sizeClasses = {
    sm: "h-9 px-3.5 text-xs rounded-full gap-1.5",
    md: "h-11 px-5 text-sm font-semibold rounded-full gap-2",
    lg: "h-13 px-7 text-base font-semibold rounded-full gap-2.5",
  };

  const variantClasses = {
    primary: cn(
      "bg-gradient-to-r from-[#FF6B35] via-[#E55A27] to-[#D44A18] text-white",
      "border border-white/25 shadow-[0_6px_20px_rgba(255,107,53,0.35)]",
      "hover:brightness-110 active:scale-[0.98]"
    ),
    glass: cn(
      "bg-black/5 dark:bg-white/12 text-text-primary dark:text-[#FFF7F5] border border-black/10 dark:border-white/20",
      "backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.15)]",
      "hover:bg-black/10 dark:hover:bg-white/20 hover:border-black/20 dark:hover:border-white/30 active:scale-[0.98]"
    ),
    ghost: cn(
      "bg-transparent text-text-secondary hover:text-text-primary dark:text-[#FFF7F5]/85 dark:hover:text-[#FFF7F5]",
      "hover:bg-black/5 dark:hover:bg-white/10 border border-transparent active:scale-[0.98]"
    ),
    danger: cn(
      "bg-[#E11D48] text-white border border-white/20 shadow-md",
      "hover:bg-[#BE123C] active:scale-[0.98]"
    ),
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center select-none transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]",
        sizeClasses[size] || sizeClasses.md,
        variantClasses[variant] || variantClasses.primary,
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
});

SpatialButton.displayName = "SpatialButton";
