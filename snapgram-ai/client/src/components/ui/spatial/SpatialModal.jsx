import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../../utils/cn";

export const SpatialModal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
  className,
  showCloseButton = true,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Environmental Backdrop Blur */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      {/* Floating Spatial Glass Card */}
      <div
        className={cn(
          "relative z-10 w-full overflow-hidden text-text-primary dark:text-[#FFF7F5]",
          "bg-white/95 dark:bg-[rgba(var(--glass-strong),0.72)] backdrop-blur-3xl border border-black/10 dark:border-white/20",
          "shadow-[0_24px_70px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.25)] dark:shadow-[0_24px_70px_rgba(var(--glass-shadow),0.65),inset_0_1px_1px_rgba(255,255,255,0.25)]",
          "rounded-[28px] animate-in zoom-in-95 duration-200",
          maxWidth,
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/8 dark:border-white/12">
            {title ? (
              <h3 className="text-lg font-bold text-text-primary dark:text-white tracking-tight">{title}</h3>
            ) : <div />}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/15 text-text-secondary hover:text-text-primary dark:text-white/70 dark:hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto hide-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
