import { useState, useRef, useEffect } from "react";
import { Search, X, Loader2, Sparkles, Filter } from "lucide-react";
import { cn } from "../../../utils/cn";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";

export const SpatialSearchBar = ({
  placeholder = "Search NUVYELO...",
  className,
  onOpenFilter,
}) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.data.success) {
          setResults(res.data.data.users || []);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query.trim()) {
      setIsFocused(false);
      navigate(`/app/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative z-50 w-full max-w-xl mx-auto", className)}>
      {/* Floating Capsule Bar */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 h-12 rounded-full transition-all duration-200",
          "bg-white dark:bg-[rgba(var(--glass-2),0.48)] dark:backdrop-blur-2xl border border-black/8 dark:border-white/18",
          "shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_32px_rgba(var(--glass-shadow),0.35),inset_0_1px_1px_rgba(255,255,255,0.22)]",
          isFocused && "border-[#FF6B35]/40 dark:border-white/40 ring-2 ring-[#FF6B35]/20"
        )}
      >
        <Search className="w-5 h-5 text-text-secondary shrink-0" />

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none text-text-primary dark:text-white placeholder:text-text-secondary dark:placeholder:text-white/55 text-sm focus:outline-none"
        />

        {isLoading && <Loader2 className="w-4 h-4 text-[#FF6B35] animate-spin shrink-0" />}

        {query && !isLoading && (
          <button
            onClick={() => setQuery("")}
            className="p-1 rounded-full hover:bg-black/8 dark:hover:bg-white/15 text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {onOpenFilter && (
          <button
            onClick={onOpenFilter}
            className="p-1.5 rounded-full hover:bg-black/8 dark:hover:bg-white/15 text-text-secondary hover:text-text-primary transition-colors border-l border-black/8 dark:border-white/10 pl-2.5"
            title="Search filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Floating Autocomplete Dropdown */}
      {isFocused && (results.length > 0 || query) && (
        <div className="absolute top-14 left-0 right-0 rounded-2xl bg-white dark:bg-[rgba(var(--glass-strong),0.92)] dark:backdrop-blur-2xl border border-black/8 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {results.length > 0 ? (
            <div className="p-2 space-y-1 max-h-80 overflow-y-auto hide-scrollbar">
              {results.slice(0, 6).map((user) => (
                <div
                  key={user._id}
                  onClick={() => {
                    navigate(`/app/profile/${user._id}`);
                    setIsFocused(false);
                    setQuery("");
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/12 cursor-pointer transition-colors"
                >
                  <img
                    src={user.profilePicture || user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover border border-black/8 dark:border-white/20"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-text-primary truncate">{user.fullName || user.username}</div>
                    <div className="text-xs text-text-secondary truncate">@{user.username}</div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  navigate(`/app/search?q=${encodeURIComponent(query)}`);
                  setIsFocused(false);
                }}
                className="w-full text-center py-2.5 text-xs font-bold text-[#FF6B35] hover:text-[#E55A27] transition-colors border-t border-black/8 dark:border-white/10"
              >
                See all results for "{query}"
              </button>
            </div>
          ) : query && !isLoading ? (
            <div className="p-4 text-center text-sm text-text-secondary">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
