import React from "react";
import { 
  Home, 
  Compass, 
  PlusSquare, 
  MessageSquare, 
  Bell, 
  Bookmark, 
  User, 
  Crown, 
  MoreHorizontal,
  Flame
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export const DesktopLeftSidebar = ({ onOpenCreate, onUpgrade }) => {
  const location = useLocation();
  const { user: authUser } = useSelector((state) => state.auth);

  const navItems = [
    { name: "Home", path: "/app", icon: Home, exact: true },
    { name: "Explore", path: "/app/explore", icon: Compass },
    { name: "Create", action: onOpenCreate, icon: PlusSquare },
    { name: "Messages", path: "/app/chat", icon: MessageSquare, badge: 3 },
    { name: "Notifications", path: "/app/notifications", icon: Bell },
    { name: "Collections", path: "/app/vault", icon: Bookmark },
    { name: "Profile", path: "/app/profile", icon: User },
  ];

  return (
    <aside className="w-[240px] shrink-0 h-full flex flex-col justify-between bg-white dark:bg-[#1E1210] rounded-[28px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-black/[0.04] dark:border-white/10 select-none">
      {/* Top Section: Logo & Navigation */}
      <div className="flex flex-col gap-6">
        {/* Brand Logo */}
        <Link to="/app" className="flex items-center gap-3 px-2 pt-1 group">
          <img
            src="/nuvyelo-emblem.png"
            alt="NUVYELO"
            className="w-9 h-9 object-contain group-hover:scale-105 transition-transform duration-200"
          />
          <span className="text-xl font-black tracking-tight text-[#1A1A1A] dark:text-white font-display">
            NUVYELO
          </span>
        </Link>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path 
              ? (item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path))
              : false;

            if (item.action) {
              return (
                <button
                  key={item.name}
                  onClick={item.action}
                  type="button"
                  className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-semibold text-[#64748B] dark:text-white/70 hover:text-[#1A1A1A] dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/5 transition-all duration-150 active:scale-[0.98]"
                >
                  <Icon className="w-5 h-5 text-current shrink-0 stroke-[2.2]" />
                  <span>{item.name}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all duration-150 active:scale-[0.98] ${
                  isActive
                    ? "bg-[#FFF0EB] dark:bg-[#FF6B35]/20 text-[#FF6B35] font-bold shadow-sm shadow-[#FF6B35]/10"
                    : "text-[#64748B] dark:text-white/70 hover:text-[#1A1A1A] dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 shrink-0 stroke-[2.2] ${isActive ? "text-[#FF6B35]" : "text-current"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#FF6B35] text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: InstaSnap+ Card & User Mini Profile */}
      <div className="flex flex-col gap-4 pt-4 border-t border-black/[0.04] dark:border-white/10">
        {/* InstaSnap+ Promo Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#FFF5F0] to-[#FFEBE3] dark:from-white/[0.06] dark:to-white/[0.02] p-4 border border-[#FFD8CC]/60 dark:border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-7 h-7 rounded-xl bg-[#FF6B35]/15 text-[#FF6B35] flex items-center justify-center text-sm shadow-sm">
              <Crown className="w-4 h-4 fill-[#FF6B35]" />
            </span>
            <span className="font-extrabold text-[15px] text-[#1A1A1A] dark:text-white font-display">
              NUVYELO+
            </span>
          </div>
          <p className="text-[12px] leading-relaxed text-[#64748B] dark:text-white/70 mb-3.5">
            More creativity. More connections. A brighter you.
          </p>
          <button
            type="button"
            onClick={onUpgrade}
            className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white text-xs font-bold shadow-md shadow-[#FF6B35]/30 hover:brightness-105 active:scale-95 transition-all text-center cursor-pointer"
          >
            Upgrade
          </button>
        </div>

        {/* User Mini Profile */}
        <div className="flex items-center justify-between px-2 pt-1 group cursor-pointer">
          <Link to="/app/profile" className="flex items-center gap-3 min-w-0">
            <img
              src={authUser?.profilePicture || authUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
              alt={authUser?.username || "alex.park"}
              className="w-9 h-9 rounded-full object-cover border border-black/10 dark:border-white/20 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#1A1A1A] dark:text-white truncate">
                {authUser?.fullName || "Alex Park"}
              </div>
              <div className="text-[11px] text-[#9B9B9B] dark:text-white/60 truncate">
                @{authUser?.username || "alex.park"}
              </div>
            </div>
          </Link>
          <button
            type="button"
            className="p-1 rounded-lg text-[#9B9B9B] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Account options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DesktopLeftSidebar;
