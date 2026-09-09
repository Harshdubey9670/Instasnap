import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useSelector } from "react-redux";
import { Plus, Bell } from "lucide-react";
import { CreateMenuModal } from "./CreateMenuModal";
import { CreatePostModal } from "../post/CreatePostModal";

export const Navbar = ({ scrollContainerRef }) => {
  const { unreadNotificationsCount } = useSelector((state) => state.auth);
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

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
    <>
      <motion.nav 
        variants={{ visible: { y: 0, opacity: 1 }, hidden: { y: "-100%", opacity: 0 } }}
        animate={headerHidden ? "hidden" : "visible"}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-0 left-0 right-0 z-40 w-full glass border-b border-border-soft bg-bg-base/80 backdrop-blur-xl"
      >
        <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-6 max-w-[1400px] mx-auto gap-2">
          
          {/* Left Actions: Create Menu */}
          <div className="shrink-0 flex items-center">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 group transition-transform duration-200 active:scale-95"
              aria-label="Create New"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl hero-gradient flex items-center justify-center text-white shadow-sm group-hover:rotate-90 transition-transform shrink-0">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
              </div>
            </button>
          </div>

          {/* Center: App Name */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
            <h1 className="font-outfit text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              InstaSnap
            </h1>
          </div>

          {/* Right Actions: Notifications */}
          <div className="flex items-center shrink-0">
            <Link
              to="/app/notifications"
              className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-bg-surface-hover transition-all text-text-primary hover:scale-105 active:scale-95"
              aria-label={`View notifications${unreadNotificationsCount > 0 ? ` (${unreadNotificationsCount} unread)` : ''}`}
            >
              <Bell className="h-6 w-6" aria-hidden="true" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary-500 border-2 border-bg-base"></span>
                </span>
              )}
            </Link>
          </div>

        </div>
      </motion.nav>

      {/* Modals */}
      <CreateMenuModal 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onOpenCreatePost={() => setIsCreatePostOpen(true)} 
      />
      <CreatePostModal 
        isOpen={isCreatePostOpen} 
        onClose={() => setIsCreatePostOpen(false)} 
      />
    </>
  );
};
