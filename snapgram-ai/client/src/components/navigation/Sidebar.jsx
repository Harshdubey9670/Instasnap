import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { cn } from "../../utils/cn";
import { 
  Home, 
  Search,
  Compass, 
  Film, 
  Send, 
  Heart, 
  PlusSquare, 
  User, 
  Menu,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar } from "../ui/Avatar";

export const Sidebar = ({ className }) => {
  const { unreadNotificationsCount, user } = useSelector((state) => state.auth);
  const { t } = useTranslation();

  const navItems = [
    { label: t("nav.home"),           icon: Home,         path: "/app" },
    { label: t("nav.explore"),        icon: Compass,      path: "/app/explore" },
    { label: "Reels",                 icon: Film,         path: "/app/reels" },
    { label: t("nav.chat"),           icon: Send,         path: "/app/chat" },
    { label: t("nav.notifications"),  icon: Heart,        path: "/app/notifications", badge: unreadNotificationsCount },
    { label: t("nav.create") || "Create", icon: PlusSquare, path: "/app/camera" },
    { label: "AI Studio",             icon: Sparkles,     path: "/app/ai" },
    { label: "Secure Vault",          icon: ShieldCheck,  path: "/app/vault" },
    { label: t("nav.profile"),        icon: User,         path: "/app/profile", isProfile: true },
  ];

  return (
    <aside className={cn(
      "hidden md:flex flex-col border-r border-border-soft bg-bg-base py-5 h-full select-none overflow-y-auto hide-scrollbar shrink-0 z-30",
      "md:w-16 lg:w-60",
      "md:px-2 lg:px-4 md:pt-20",
      className
    )}>
      {/* Instagram Web Logo */}
      <div className="mb-6 px-2.5 hidden lg:block">
        <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-yellow-400 via-rose-500 to-purple-600 bg-clip-text text-transparent italic">
          InstaSnap
        </h1>
      </div>

      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => (
          <NavLink
            key={`${item.label}-${item.path}`}
            to={item.path}
            end={item.path === "/app"}
            aria-label={`${item.label}${item.badge > 0 ? ` (${item.badge} unread)` : ''}`}
            className={({ isActive }) => cn(
              "group relative flex items-center gap-4 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200",
              "md:justify-center lg:justify-start",
              isActive
                ? "font-extrabold text-text-primary bg-bg-surface shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover"
            )}
          >
            {({ isActive }) => (
              <>
                <div className="relative shrink-0 flex items-center justify-center">
                  {item.isProfile ? (
                    <Avatar 
                      src={user?.profilePicture || user?.avatar} 
                      fallback={user?.username?.charAt(0) || 'U'} 
                      className={cn("w-6 h-6 rounded-full border", isActive ? "border-text-primary" : "border-transparent")} 
                    />
                  ) : (
                    <item.icon className={cn(
                      "h-6 w-6 transition-transform duration-200 group-hover:scale-105",
                      isActive ? "text-text-primary stroke-[2.5]" : "text-text-secondary group-hover:text-text-primary"
                    )} />
                  )}

                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-black">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>

                <span className={cn("hidden lg:block text-sm tracking-tight", isActive ? "font-bold text-text-primary" : "font-normal text-text-secondary")}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      {/* More / Settings Menu at bottom */}
      <div className="mt-auto pt-3 border-t border-border-soft">
        <NavLink
          to="/app/settings"
          aria-label="More Options"
          className={({ isActive }) => cn(
            "group relative flex items-center gap-4 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200",
            "md:justify-center lg:justify-start",
            isActive
              ? "font-extrabold text-text-primary bg-bg-surface shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover"
          )}
        >
          <Menu className={cn("h-6 w-6 shrink-0 transition-transform duration-200 group-hover:scale-105", location.pathname === '/app/settings' ? "text-text-primary stroke-[2.5]" : "text-text-secondary group-hover:text-text-primary")} />
          <span className={cn("hidden lg:block text-sm tracking-tight", location.pathname === '/app/settings' ? "font-bold text-text-primary" : "font-normal text-text-secondary group-hover:text-text-primary")}>More</span>
        </NavLink>
      </div>
    </aside>
  );
};

