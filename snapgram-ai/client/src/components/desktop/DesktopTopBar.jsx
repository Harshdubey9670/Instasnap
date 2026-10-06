import React, { useState } from "react";
import { Search, Sun, Moon, Bell } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { useSelector } from "react-redux";

export const DesktopTopBar = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === "dark";
  const { unreadNotificationsCount } = useSelector((state) => state.auth);

  const handleSearch = (e) => {
    if (e.key === "Enter" && query.trim()) {
      navigate(`/app/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="w-full flex items-center justify-between gap-6 py-1 select-none">
      {/* Search Input Bar */}
      <div className="flex-1 max-w-xl relative">
        <div className="relative flex items-center w-full">
          <Search className="absolute left-5 w-4 h-4 text-[#9B9B9B] dark:text-white/50 pointer-events-none stroke-[2.2]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search creators, moments, or ideas..."
            className="w-full h-12 pl-12 pr-5 rounded-full bg-white dark:bg-[#1E1210] border border-black/[0.04] dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.03)] text-sm text-[#1A1A1A] dark:text-white placeholder:text-[#9B9B9B] dark:placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/25 focus:border-[#FF6B35]/40 transition-all duration-200"
          />
        </div>
      </div>

      {/* Right Controls: Theme Toggle, Notifications, and Script Tagline */}
      <div className="flex items-center gap-6 shrink-0">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#1E1210] border border-black/[0.04] dark:border-white/10 shadow-sm text-[#1A1A1A] dark:text-white hover:bg-black/[0.03] dark:hover:bg-white/10 active:scale-95 transition-all duration-150 cursor-pointer"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 stroke-[2.2]" />
          ) : (
            <Sun className="w-4 h-4 text-[#1A1A1A] stroke-[2.2]" />
          )}
        </button>

        {/* Notifications Icon Button */}
        <Link
          to="/app/notifications"
          aria-label="Notifications"
          className="relative w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#1E1210] border border-black/[0.04] dark:border-white/10 shadow-sm text-[#1A1A1A] dark:text-white hover:bg-black/[0.03] dark:hover:bg-white/10 active:scale-95 transition-all duration-150"
        >
          <Bell className="w-4 h-4 text-[#1A1A1A] dark:text-white stroke-[2.2]" />
          {unreadNotificationsCount > 0 ? (
            <span className="absolute 1 top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#FF6B35] ring-2 ring-white dark:ring-[#1E1210]" />
          ) : (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#FF6B35] ring-2 ring-white dark:ring-[#1E1210]" />
          )}
        </Link>

        {/* Decorative Tagline */}
        <div className="relative flex flex-col items-end pl-2">
          <div className="flex flex-col text-right leading-none">
            <span className="font-script text-xl sm:text-2xl text-[#1A1A1A] dark:text-white/90 font-bold tracking-wide select-none">
              More Moments,
            </span>
            <span className="font-script text-xl sm:text-2xl text-[#1A1A1A] dark:text-white/90 font-bold tracking-wide select-none -mt-1">
              Brighter Together
            </span>
          </div>
          {/* Subtle curved underline accent flourish */}
          <svg className="w-24 h-2 text-[#FF6B35] -mt-0.5" viewBox="0 0 100 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 7C30 1 70 2 98 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </header>
  );
};

export default DesktopTopBar;
