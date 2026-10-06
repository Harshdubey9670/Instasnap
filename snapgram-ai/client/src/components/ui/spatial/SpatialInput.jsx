import { forwardRef } from "react";
import { cn } from "../../../utils/cn";

export const SpatialInput = forwardRef(({
  className,
  error,
  icon: Icon,
  rightElement,
  ...props
}, ref) => {
  return (
    <div className="relative w-full">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary dark:text-white/60 pointer-events-none">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full h-11 px-4 rounded-xl text-sm text-text-primary dark:text-white placeholder:text-text-secondary/60 dark:placeholder:text-white/50",
          "bg-black/5 dark:bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/15",
          "transition-all duration-200 outline-none",
          "focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/30 focus:bg-white dark:focus:bg-white/15",
          Icon && "pl-10",
          rightElement && "pr-10",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/30",
          className
        )}
        {...props}
      />
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {rightElement}
        </div>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
});

SpatialInput.displayName = "SpatialInput";
