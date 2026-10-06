import { cn } from "../../../utils/cn";

export const SpatialTabs = ({
  tabs = [],
  activeTab,
  onChange,
  className,
  variant = "pill", // 'pill' | 'underline'
}) => {
  if (variant === "underline") {
    return (
      <div className={cn("flex items-center justify-around border-b border-black/8 dark:border-white/12", className)}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2 py-3 px-4 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "text-[#FF6B35] dark:text-white"
                  : "text-text-secondary dark:text-white/60 hover:text-text-primary dark:hover:text-white/90"
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 inset-x-2 h-0.5 bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center p-1 rounded-full bg-black/5 dark:bg-white/10 backdrop-blur-md border border-black/8 dark:border-white/12",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 select-none",
              isActive
                ? "bg-gradient-to-r from-[#FF6B35] to-[#E55A27] text-white shadow-[0_2px_10px_rgba(255,107,53,0.35)] border border-white/20"
                : "text-text-secondary hover:text-text-primary hover:bg-black/5 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/8"
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
