import { cn } from "../../utils/cn";

/**
 * Shared "Following / For You" tab switch, used both as a floating overlay
 * on the immersive mobile feed and as the header of the desktop browser rail.
 * `following` filters the already-fetched reels down to people the viewer
 * follows — no separate endpoint needed.
 */
export const ReelsTabs = ({ tab, onChange, variant = "light", className }) => {
  const tabs = [
    { id: "following", label: "Following" },
    { id: "forYou", label: "For You" },
  ];

  const isDark = variant === "dark";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full p-1",
        isDark ? "bg-black/35 backdrop-blur-md border border-white/15" : "bg-bg-surface-hover border border-border-soft",
        className
      )}
    >
      {tabs.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200",
              active
                ? isDark
                  ? "bg-white text-[#1A1A1A] shadow"
                  : "bg-primary-500 text-white shadow-soft"
                : isDark
                  ? "text-white/70 hover:text-white"
                  : "text-text-secondary hover:text-text-primary"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
};
