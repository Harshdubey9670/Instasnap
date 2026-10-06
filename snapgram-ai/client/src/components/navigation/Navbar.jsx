import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useSelector } from "react-redux";
import { Menu, Bell, Sparkles } from "lucide-react";
import { SpatialSearchBar } from "../ui/spatial/SpatialSearchBar";
import { SpatialIconButton } from "../ui/spatial/SpatialIconButton";

export const Navbar = ({ scrollContainerRef, onOpenCreate }) => {
  const { unreadNotificationsCount } = useSelector((state) => state.auth);
  const location = useLocation();

  // --- Smart Scroll Header ---
  const { scrollY } = useScroll({ container: scrollContainerRef });
  const [headerHidden, setHeaderHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 100) {
      setHeaderHidden(true);
    } else {
      setHeaderHidden(false);
    }
  });

  if (location.pathname !== '/app') return null;

  return (
    <motion.div
      variants={{ visible: { y: 0, opacity: 1 }, hidden: { y: "-120%", opacity: 0 } }}
      animate={headerHidden ? "hidden" : "visible"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-3 sm:top-4 left-0 right-0 z-40 w-full px-3 sm:px-4 md:pl-28 lg:pl-32 md:pr-6"
    >
      <div className="flex items-center gap-2 sm:gap-3 max-w-[1400px] mx-auto">
        {/* Menu / Create — opens the shared create flow */}
        <SpatialIconButton
          variant="glass"
          size="lg"
          tooltip="Menu"
          aria-label="Open create menu"
          onClick={onOpenCreate}
          className="shrink-0 hidden sm:inline-flex"
        >
          <Menu className="w-5 h-5" />
        </SpatialIconButton>

        {/* Floating capsule search bar */}
        <SpatialSearchBar className="flex-1" placeholder="Search NUVYELO..." />

        {/* Notifications */}
        <Link
          to="/app/notifications"
          aria-label={`View notifications${unreadNotificationsCount > 0 ? ` (${unreadNotificationsCount} unread)` : ''}`}
          className="relative shrink-0 w-11 h-11 sm:w-13 sm:h-13 min-w-[44px] min-h-[44px] rounded-full inline-flex items-center justify-center bg-white dark:bg-white/10 hover:bg-[#F0EBE5] dark:hover:bg-white/20 text-[#1A1A1A] dark:text-white border border-black/7 dark:border-white/15 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all duration-200"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex min-w-[18px] h-[18px] px-1 items-center justify-center rounded-full bg-[#F43F5E] text-[10px] font-bold text-white border-2 border-[var(--bg-base)] shadow-md">
              {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
            </span>
          )}
        </Link>

        {/* Desktop Experience Toggle */}
        <Link
          to="/desktop"
          title="Switch to Desktop Homepage"
          className="hidden md:inline-flex shrink-0 px-3.5 py-2 rounded-full items-center gap-1.5 text-xs font-bold bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/25 hover:bg-[#FF6B35] hover:text-white shadow-sm transition-all duration-200"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Desktop UI</span>
        </Link>

        {/* AI Studio shortcut */}
        <Link
          to="/app/ai"
          aria-label="AI Studio"
          className="hidden sm:inline-flex shrink-0 w-13 h-13 min-w-[44px] min-h-[44px] rounded-full items-center justify-center bg-gradient-to-br from-[#FF6B35] to-[#E55A27] text-white border border-white/25 shadow-[0_6px_20px_rgba(255,107,53,0.4)] hover:brightness-110 active:scale-95 transition-all duration-200"
        >
          <Sparkles className="w-5 h-5" />
        </Link>
      </div>
    </motion.div>
  );
};
