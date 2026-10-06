import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Plus, MoreHorizontal } from "lucide-react";
import { cn } from "../../utils/cn";

export const MobileNav = ({ onOpenCreate }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on full-screen pages
  const hiddenPages = ['/spotlight', '/camera', '/story/create', '/reels/create'];
  const shouldHide = hiddenPages.some(p => location.pathname.includes(p));
  if (shouldHide) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      aria-label="Mobile navigation"
    >
      <div
        className={cn(
          "flex items-center justify-between w-full max-w-sm h-14 px-6 rounded-full",
          "bg-white/95 dark:bg-[#1E1210]/95 backdrop-blur-xl",
          "border border-black/[0.06] dark:border-white/10",
          "shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
        )}
      >
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 text-[#78716C] dark:text-white/70 active:scale-90 transition-transform"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Forward */}
        <button
          type="button"
          onClick={() => navigate(1)}
          className="p-2 text-[#78716C] dark:text-white/70 active:scale-90 transition-transform"
          aria-label="Forward"
        >
          <ArrowRight className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Create Plus (Center pill) */}
        <button
          type="button"
          onClick={onOpenCreate}
          className="w-10 h-10 rounded-full bg-[#E5E0D8]/80 dark:bg-white/15 flex items-center justify-center text-[#1A1A1A] dark:text-white active:scale-90 transition-transform shadow-sm"
          aria-label="Create Post"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Tab switcher [ 1 ] */}
        <button
          type="button"
          onClick={() => navigate("/app")}
          className="w-6 h-6 rounded-md border-2 border-[#78716C] dark:border-white/70 flex items-center justify-center text-[11px] font-bold text-[#78716C] dark:text-white/70 active:scale-90 transition-transform"
          aria-label="Tabs"
        >
          1
        </button>

        {/* More */}
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="p-2 text-[#78716C] dark:text-white/70 active:scale-90 transition-transform"
          aria-label="More"
        >
          <MoreHorizontal className="w-5 h-5 stroke-[2]" />
        </button>
      </div>
    </nav>
  );
};

export default MobileNav;
