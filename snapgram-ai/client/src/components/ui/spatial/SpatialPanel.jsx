import { forwardRef } from "react";
import { cn } from "../../../utils/cn";

export const SpatialPanel = forwardRef(({
  children,
  className,
  header,
  footer,
  withPadding = true,
  ...props
}, ref) => {
  return (
    <section
      ref={ref}
      className={cn(
        "relative flex flex-col overflow-hidden",
        "bg-[rgba(var(--glass-2),0.44)] backdrop-blur-2xl",
        "border border-white/15 dark:border-white/15 border-black/8",
        "shadow-[0_24px_60px_rgba(var(--glass-shadow),0.48),inset_0_1px_1px_rgba(255,255,255,0.22)]",
        "rounded-[28px] sm:rounded-[32px] text-text-primary",
        className
      )}
      {...props}
    >
      {/* Subtle top inner light reflection */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/15 to-transparent rounded-t-[32px]" />

      {header && (
        <div className="relative z-10 shrink-0 border-b border-white/10 px-5 py-4">
          {header}
        </div>
      )}

      <div className={cn("relative z-10 flex-1 min-h-0 overflow-y-auto hide-scrollbar", withPadding && "p-5")}>
        {children}
      </div>

      {footer && (
        <div className="relative z-10 shrink-0 border-t border-white/10 p-4">
          {footer}
        </div>
      )}
    </section>
  );
});

SpatialPanel.displayName = "SpatialPanel";
