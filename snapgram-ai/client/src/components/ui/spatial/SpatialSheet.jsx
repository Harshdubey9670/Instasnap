import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../../utils/cn";

export const SpatialSheet = ({
  isOpen,
  onClose,
  title,
  children,
  position = "bottom", // 'bottom' | 'right'
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      {/* Sheet Container */}
      <div
        className={cn(
          "relative z-10 bg-white dark:bg-[rgba(var(--glass-strong),0.85)] backdrop-blur-3xl border-black/10 dark:border-white/18 text-text-primary dark:text-[#FFF7F5] shadow-2xl overflow-hidden flex flex-col",
          position === "bottom"
            ? "mt-auto w-full max-h-[85vh] rounded-t-[32px] border-t animate-in slide-in-from-bottom duration-300"
            : "ml-auto h-full w-full max-w-md rounded-l-[32px] border-l animate-in slide-in-from-right duration-300",
          className
        )}
      >
        {position === "bottom" && (
          <div className="w-12 h-1.5 bg-black/20 dark:bg-white/25 rounded-full mx-auto my-3 shrink-0" />
        )}

        <div className="flex items-center justify-between px-6 py-3 border-b border-black/8 dark:border-white/12 shrink-0">
          <h3 className="text-base font-bold text-text-primary dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/15 text-text-secondary hover:text-text-primary dark:text-white/70 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 hide-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
