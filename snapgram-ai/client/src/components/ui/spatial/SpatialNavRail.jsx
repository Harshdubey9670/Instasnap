import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Home, Compass, Film, Plus, Send, Heart, ShieldCheck, Sparkles, Settings, User } from "lucide-react";
import { cn } from "../../../utils/cn";
import { SpatialAvatar } from "./SpatialAvatar";

export const SpatialNavRail = ({ className, onOpenCreate }) => {
  const location = useLocation();
  const { user: authUser, unreadNotificationsCount } = useSelector((state) => state.auth);

  const navItems = [
    { label: "Home", icon: Home, path: "/app", exact: true },
    { label: "Explore", icon: Compass, path: "/app/explore" },
    { label: "Reels", icon: Film, path: "/app/reels" },
    { label: "Create", icon: Plus, isAction: true, onClick: onOpenCreate },
    { label: "Messages", icon: Send, path: "/app/chat" },
    { label: "Notifications", icon: Heart, path: "/app/notifications", badge: unreadNotificationsCount },
    { label: "AI Studio", icon: Sparkles, path: "/app/ai" },
    { label: "Vault", icon: ShieldCheck, path: "/app/vault" },
    { label: "Settings", icon: Settings, path: "/app/settings" },
    { label: "Profile", isProfile: true, path: "/app/profile" },
  ];

  return (
    <nav
      aria-label="Spatial Navigation Rail"
      className={cn(
        "flex flex-col items-center py-4 px-2 gap-2",
        "bg-white dark:bg-[rgba(var(--glass-2),0.48)] dark:backdrop-blur-2xl",
        "border border-black/7 dark:border-white/18",
        "shadow-[0_4px_24px_rgba(0,0,0,0.10)] dark:shadow-[0_20px_50px_rgba(var(--glass-shadow),0.5),inset_0_1px_1px_rgba(255,255,255,0.22)]",
        "rounded-full w-16 z-40 select-none",
        "max-h-[88vh] overflow-y-auto hide-scrollbar",
        className
      )}
    >
      {navItems.map((item) => {
        if (item.isAction) {
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              title={item.label}
              aria-label={item.label}
              className="relative w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#FF6B35] to-[#E55A27] text-white shadow-[0_4px_16px_rgba(255,107,53,0.45)] border border-[#FF6B35]/20 hover:scale-110 active:scale-95 transition-all duration-200"
            >
              <item.icon className="w-5 h-5 stroke-[2.5]" />
            </button>
          );
        }

        const isActive = item.exact
          ? location.pathname === item.path
          : location.pathname.startsWith(item.path);

        if (item.isProfile) {
          return (
            <NavLink
              key={item.label}
              to={item.path}
              title={item.label}
              aria-label={item.label}
              className={({ isActive: linkActive }) =>
                cn(
                  "relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 p-0.5",
                  linkActive
                    ? "bg-[#FF6B35]/12 dark:bg-white/25 shadow-[0_0_16px_rgba(255,107,53,0.25)] dark:shadow-[0_0_16px_rgba(255,255,255,0.35)] border border-[#FF6B35]/30 dark:border-white/40 scale-105"
                    : "hover:bg-[#F0EBE5] dark:hover:bg-white/12 hover:scale-105 border border-transparent"
                )
              }
            >
              <SpatialAvatar
                src={authUser?.profilePicture || authUser?.avatar}
                alt={authUser?.username || "Profile"}
                size="sm"
                fallback={authUser?.username?.charAt(0) || "U"}
              />
            </NavLink>
          );
        }

        return (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.exact}
            title={item.label}
            aria-label={`${item.label}${item.badge > 0 ? ` (${item.badge} unread)` : ""}`}
            className={({ isActive: linkActive }) =>
              cn(
                "group relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200",
                linkActive
                  ? "bg-[#FF6B35]/12 dark:bg-white/25 text-[#FF6B35] dark:text-white shadow-[0_0_16px_rgba(255,107,53,0.25)] dark:shadow-[0_0_16px_rgba(255,255,255,0.3)] border border-[#FF6B35]/25 dark:border-white/30 scale-105"
                  : "text-[#9B9B9B] dark:text-white/70 hover:text-[#FF6B35] dark:hover:text-white hover:bg-[#F0EBE5] dark:hover:bg-white/12 hover:scale-105 border border-transparent"
              )
            }
          >
            <item.icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            {item.badge > 0 && (
              <span className="absolute top-1 right-1 flex min-w-[16px] h-4 px-1 items-center justify-center rounded-full bg-[#FF6B35] text-[9px] font-black text-white border-2 border-white dark:border-[var(--bg-base)]">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};
