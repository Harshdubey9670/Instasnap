import React, { useState, useEffect, useRef, useCallback, Suspense, memo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Search,
  Loader2,
  X,
  Heart,
  MessageCircle,
  TrendingUp,
  Hash,
  Compass,
  Clock,
  Users,
  Video,
  Flame,
  Sparkles,
  Plane,
  Utensils,
  Coffee,
  Music,
  Palette,
  Dumbbell,
  PawPrint,
  Send,
  Bookmark,
  ArrowRight,
  UserPlus,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { Avatar } from "../../components/ui/Avatar";
import { trackEvent } from "../../utils/analytics";
import { prefetch } from "../../utils/cache";
import { LazyImage } from "../../components/ui/LazyImage";
import { cn } from "../../utils/cn";
import DesktopExploreView from "../../components/desktop/DesktopExploreView";

// Lazy load the popular creators carousel
const PopularCreatorsCarousel = React.lazy(
  () => import("../../components/user/PopularCreatorsCarousel")
);

// --- Mobile Web Discover Card (2-column masonry/grid) ---
const MobileDiscoverCard = memo(({ post, index, isLast, lastPostRef }) => {
  const [isLiked, setIsLiked] = useState(Boolean(post.isLiked));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const mediaUrl = post.media?.[0]?.url || post.image;
  if (!mediaUrl) return null;

  const toggleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked((prev) => !prev);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  return (
    <motion.div
      ref={isLast ? lastPostRef : null}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      className="group relative rounded-[22px] overflow-hidden bg-white dark:bg-[#1E1210] shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-black/[0.04] dark:border-white/10 flex flex-col cursor-pointer active:scale-[0.98] transition-transform"
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 240px" }}
    >
      <Link
        to={`/app/profile/${post.user?._id}`}
        onClick={() =>
          trackEvent("recommendation_click", post._id, {
            source: "explore_mobile_web",
          })
        }
        className="block w-full"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#FAF6F0] dark:bg-black/20">
          <LazyImage
            src={mediaUrl}
            alt={post.caption || "Discover moment"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

          {/* Quick like button floating on top-right */}
          <button
            onClick={toggleLike}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                isLiked ? "fill-[#FF6B35] text-[#FF6B35]" : "text-white"
              )}
            />
          </button>

          {/* Overlay creator info & likes */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/60">
                <Avatar
                  src={post.user?.profilePicture || post.user?.avatar}
                  className="w-full h-full"
                />
              </div>
              <span className="text-[11px] font-semibold truncate drop-shadow-sm">
                {post.user?.username || "creator"}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0 bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-full">
              <Heart className="w-3 h-3 fill-white text-white" />
              <span className="text-[10px] font-bold">
                {likesCount > 999
                  ? `${(likesCount / 1000).toFixed(1)}k`
                  : likesCount}
              </span>
            </div>
          </div>
        </div>

        {post.caption && (
          <div className="p-2.5 bg-white dark:bg-[#1E1210]">
            <p className="text-xs text-[#1A1A1A] dark:text-white/90 line-clamp-1 font-medium">
              {post.caption}
            </p>
          </div>
        )}
      </Link>
    </motion.div>
  );
});

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const observer = useRef();
  const inputRef = useRef(null);

  const { user: authUser } = useSelector((state) => state.auth);

  // --- Search State ---
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isSearchActive, setIsSearchActive] = useState(initialQuery.length > 0);
  const [searchTab, setSearchTab] = useState("all");
  const [searchResults, setSearchResults] = useState({
    users: [],
    posts: [],
    stories: [],
    hashtags: [],
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState({
    popularUsers: [],
    trendingTags: [],
  });
  const [recentSearches, setRecentSearches] = useState([]);

  // --- Explore Grid State ---
  const [posts, setPosts] = useState([]);
  const [newestMedia, setNewestMedia] = useState([]);
  const [suggestedReels, setSuggestedReels] = useState([]);
  const [explorePageNum, setExplorePageNum] = useState(1);
  const [exploreHasMore, setExploreHasMore] = useState(true);
  const [exploreLoading, setExploreLoading] = useState(true);

  // Active Category Chip for Mobile Web
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = [
    { label: "All", icon: null },
    { label: "Travel", icon: Plane },
    { label: "Food", icon: Utensils },
    { label: "Lifestyle", icon: Coffee },
    { label: "Music", icon: Music },
    { label: "Art", icon: Palette },
    { label: "Sports", icon: Dumbbell },
    { label: "Pets", icon: PawPrint },
  ];

  // Default Trending Topics for Mobile Web
  const defaultTrendingTopics = [
    { rank: 1, tag: "#SpringVibes", posts: "32.4K posts", category: "Trending" },
    { rank: 2, tag: "#TravelDiary", posts: "28.1K posts", category: "Travel" },
    { rank: 3, tag: "#CafeHopping", posts: "16.2K posts", category: "Food" },
  ];

  const fallbackDiscoverPosts = [
    {
      _id: "fdp-1",
      caption: "A Brighter Tomorrow in Santorini",
      media: [{ url: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop&q=80" }],
      user: {
        _id: "u1",
        username: "seoyeon",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
      },
      likes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      _id: "fdp-2",
      caption: "Little Happiness with feline friends",
      media: [{ url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80" }],
      user: {
        _id: "u2",
        username: "hyepark",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      },
      likes: [1, 2, 3, 4, 5, 6, 7],
    },
    {
      _id: "fdp-3",
      caption: "Morning roast and café chronicles",
      media: [{ url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80" }],
      user: {
        _id: "u3",
        username: "foodnomo",
        avatar: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=100&auto=format&fit=crop&q=80",
      },
      likes: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      _id: "fdp-4",
      caption: "Spring vibes in the city light",
      media: [{ url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80" }],
      user: {
        _id: "u4",
        username: "minji",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      },
      likes: [1, 2, 3, 4, 5, 6, 7, 8],
    },
  ];

  const displayPosts = posts && posts.length > 0 ? posts : fallbackDiscoverPosts;

  // Load Search History and Suggestions once
  useEffect(() => {
    api
      .get("/api/search/suggestions")
      .then((res) => {
        if (res.data?.success) setSearchSuggestions(res.data.data);
      })
      .catch(console.error);

    api
      .get("/api/search/history")
      .then((res) => {
        if (res.data?.success) setRecentSearches(res.data.data);
      })
      .catch(console.error);
  }, []);

  // --- Explore Grid Fetch ---
  const fetchExplorePosts = useCallback(async (pageNum, reset = false) => {
    try {
      if (pageNum === 1) setExploreLoading(true);
      const res = await api.get(`/api/posts/explore?page=${pageNum}&limit=18`);
      if (res.data?.success) {
        setPosts((prev) =>
          reset ? res.data.data.posts : [...prev, ...res.data.data.posts]
        );
        if (reset) {
          setNewestMedia(res.data.data.newestMedia || []);
          setSuggestedReels(res.data.data.suggestedReels || []);
        }
        setExploreHasMore(res.data.pagination?.hasMore ?? true);
      }
    } catch (e) {
      console.error("Explore fetch error", e);
    } finally {
      setExploreLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSearchActive) {
      fetchExplorePosts(1, true);
    }
  }, [isSearchActive, fetchExplorePosts]);

  const exploreLastPostRef = useCallback(
    (node) => {
      if (exploreLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && exploreHasMore) {
          setExplorePageNum((prev) => {
            const next = prev + 1;
            fetchExplorePosts(next, false);
            return next;
          });
        }
      });
      if (node) observer.current.observe(node);
    },
    [exploreLoading, exploreHasMore, fetchExplorePosts]
  );

  // --- Search Logic ---
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!isSearchActive) return;
    if (debouncedQuery.trim().length === 0) {
      setSearchResults({ users: [], posts: [], stories: [], hashtags: [] });
      setSearchParams({});
      return;
    }

    setSearchLoading(true);
    const params = new URLSearchParams({
      q: debouncedQuery,
      type: searchTab,
      limit: 15,
    });
    setSearchParams(params);

    let isStale = false;
    api
      .get(`/api/search/advanced?${params.toString()}`)
      .then((res) => {
        if (isStale) return;
        if (res.data?.success) {
          setSearchResults(res.data.data);
        }
      })
      .catch((err) => {
        if (!isStale) console.error(err);
      })
      .finally(() => {
        if (!isStale) setSearchLoading(false);
      });

    return () => {
      isStale = true;
    };
  }, [debouncedQuery, searchTab, isSearchActive, setSearchParams]);

  const handleSelectSuggestion = async (type, data) => {
    try {
      let payload = { type };
      if (type === "user") {
        payload.query = data.username;
        payload.refId = data._id;
        payload.username = data.username;
        payload.fullName = data.fullName;
        payload.avatar = data.profilePicture;
      } else if (type === "hashtag") {
        payload.query = data.tag;
        payload.tag = data.tag;
      } else {
        payload.query = data;
        payload.type = "text";
      }

      const res = await api.post("/api/search/history", payload);
      if (res.data?.success) setRecentSearches(res.data.data);
    } catch (err) {
      console.error(err);
    }

    if (type === "user") navigate(`/app/profile/${data._id}`);
    else if (type === "hashtag") navigate(`/app/hashtag/${data.tag}`);
    else setQuery(data);
  };

  const removeRecent = async (e, id) => {
    e.stopPropagation();
    setRecentSearches((prev) => prev.filter((r) => r._id !== id));
    try {
      await api.delete(`/api/search/history/${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllRecent = async (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      await api.delete("/api/search/history");
    } catch (err) {
      console.error(err);
    }
  };

  const currentUser = authUser
    ? {
        name: authUser.fullName || authUser.username || "Creator",
        username: authUser.username || "creator",
        avatar:
          authUser.avatar ||
          authUser.profilePicture ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      }
    : null;

  return (
    <>
      {/* ── Desktop View (lg+) ── */}
      <div className="hidden lg:block w-full">
        <DesktopExploreView
          currentUser={currentUser}
          posts={posts}
          creators={searchSuggestions.popularUsers}
          trendingTags={searchSuggestions.trendingTags}
          onSearch={(q) => {
            setQuery(q);
            setIsSearchActive(true);
          }}
          onOpenPost={(post) => {
            const id = post._id || post.id || post.rawPost?._id;
            if (id) navigate(`/app/profile/${post.user?._id || post.rawPost?.user?._id || id}`);
          }}
        />
      </div>

      {/* ── Responsive Mobile Web (< lg) ── */}
      <div className="block lg:hidden w-full min-h-screen bg-[#F5F0EB] dark:bg-[#120907] text-[#1A1A1A] dark:text-[#F5F0EB] pb-24">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 bg-[#F5F0EB]/95 dark:bg-[#120907]/95 backdrop-blur-md px-4 py-3 border-b border-black/[0.04] dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center shadow-sm">
              <Compass className="w-4 h-4 text-white stroke-[2.4]" />
            </div>
            <span className="font-extrabold text-lg tracking-tight font-display">
              Explore
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/chat")}
              className="w-9 h-9 rounded-full bg-white dark:bg-[#1E1210] border border-black/[0.05] dark:border-white/10 flex items-center justify-center text-[#1A1A1A] dark:text-white shadow-sm active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(`/profile/${authUser?.username || "me"}`)}
              className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#FF6B35]/40 active:scale-95"
            >
              <img
                src={
                  currentUser?.avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                }
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </header>

        {/* ── Search Bar Section ── */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A70] dark:text-white/40" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onFocus={() => setIsSearchActive(true)}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search creators, tags, places..."
              className="w-full h-11 pl-10 pr-24 rounded-full bg-white dark:bg-[#1E1210] border border-black/[0.06] dark:border-white/10 text-xs sm:text-sm font-medium text-[#1A1A1A] dark:text-white placeholder-[#8C7A70] dark:placeholder-white/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 transition-all"
            />
            {query.length > 0 && (
              <button
                onClick={() => {
                  setQuery("");
                  setIsSearchActive(false);
                  setSearchParams({});
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-[#8C7A70] hover:text-[#1A1A1A] rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setIsSearchActive(true)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white text-[11px] font-bold shadow-xs active:scale-95"
            >
              Search
            </button>
          </div>

          {/* Search Filter Tabs (Visible when typing) */}
          <AnimatePresence>
            {isSearchActive && query.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 overflow-x-auto hide-scrollbar pt-3"
              >
                {["all", "users", "posts", "hashtags"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSearchTab(tab)}
                    className={cn(
                      "px-3.5 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-colors border",
                      searchTab === tab
                        ? "bg-[#FF6B35] text-white border-[#FF6B35] shadow-xs"
                        : "bg-white dark:bg-[#1E1210] border-black/[0.06] dark:border-white/10 text-[#64748B] dark:text-white/60"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Active Search Results Mode ── */}
        {isSearchActive ? (
          <div className="px-4 py-3">
            {debouncedQuery.trim().length === 0 ? (
              <div className="space-y-5">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-[#8C7A70] dark:text-white/40 uppercase tracking-wider">
                        Recent Searches
                      </h3>
                      <button
                        onClick={clearAllRecent}
                        className="text-xs font-semibold text-[#FF6B35]"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-1 bg-white dark:bg-[#1E1210] rounded-2xl p-2 border border-black/[0.04] dark:border-white/10">
                      {recentSearches.slice(0, 5).map((r) => (
                        <div
                          key={r._id}
                          onClick={() => handleSelectSuggestion(r.type, r)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-black/[0.02] cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Clock className="w-4 h-4 text-[#8C7A70]" />
                            <span className="text-xs font-semibold text-[#1A1A1A] dark:text-white">
                              {r.query}
                            </span>
                          </div>
                          <button
                            onClick={(e) => removeRecent(e, r._id)}
                            className="p-1 text-[#8C7A70] hover:text-[#1A1A1A]"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Users */}
                {searchSuggestions.popularUsers?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-[#8C7A70] dark:text-white/40 uppercase tracking-wider mb-2">
                      Suggested Creators
                    </h3>
                    <div className="space-y-1 bg-white dark:bg-[#1E1210] rounded-2xl p-2 border border-black/[0.04] dark:border-white/10">
                      {searchSuggestions.popularUsers.slice(0, 4).map((u) => (
                        <div
                          key={u._id}
                          onClick={() => handleSelectSuggestion("user", u)}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/[0.02] cursor-pointer"
                        >
                          <Avatar
                            src={u.profilePicture || u.avatar}
                            className="w-9 h-9 rounded-full border border-black/[0.06]"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-[#1A1A1A] dark:text-white truncate">
                              {u.username}
                            </span>
                            <span className="text-[11px] text-[#8C7A70] dark:text-white/50 truncate">
                              {u.fullName || "NUVYELO Creator"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Results List */
              <div className="space-y-3">
                {searchLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-7 h-7 animate-spin text-[#FF6B35]" />
                  </div>
                ) : (
                  <>
                    {(searchTab === "all" || searchTab === "users") &&
                      searchResults.users?.length > 0 && (
                        <div className="bg-white dark:bg-[#1E1210] rounded-2xl p-2 border border-black/[0.04] dark:border-white/10">
                          {searchResults.users.map((u) => (
                            <Link
                              to={`/app/profile/${u._id}`}
                              key={u._id}
                              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/[0.02]"
                            >
                              <Avatar
                                src={u.profilePicture || u.avatar}
                                className="w-10 h-10 rounded-full border border-black/[0.06]"
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-[#1A1A1A] dark:text-white truncate">
                                  {u.username}
                                </span>
                                <span className="text-[11px] text-[#8C7A70] dark:text-white/50 truncate">
                                  {u.fullName}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                    {(searchTab === "all" || searchTab === "hashtags") &&
                      searchResults.hashtags?.length > 0 && (
                        <div className="bg-white dark:bg-[#1E1210] rounded-2xl p-2 border border-black/[0.04] dark:border-white/10">
                          {searchResults.hashtags.map((h) => (
                            <Link
                              to={`/app/hashtag/${h.tag}`}
                              key={h._id}
                              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/[0.02]"
                            >
                              <div className="w-9 h-9 rounded-xl bg-[#FFF5F0] dark:bg-white/5 text-[#FF6B35] flex items-center justify-center">
                                <Hash className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-[#1A1A1A] dark:text-white">
                                  #{h.tag}
                                </span>
                                <span className="text-[10px] text-[#8C7A70] dark:text-white/50">
                                  {h.postCount || 100} posts
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── Default Mobile Web Explore Feed ── */
          <div className="flex flex-col gap-4 pt-1">
            {/* Category Chips Horizontal Bar */}
            <div className="px-4">
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isCatActive = activeCategory === cat.label;
                  return (
                    <button
                      key={cat.label}
                      onClick={() => setActiveCategory(cat.label)}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none active:scale-95 shadow-2xs",
                        isCatActive
                          ? "bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white shadow-[#FF6B35]/20"
                          : "bg-white dark:bg-[#1E1210] border border-black/[0.05] dark:border-white/10 text-[#64748B] dark:text-white/70 hover:text-[#1A1A1A]"
                      )}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trending Topics Section (Ranked 1, 2, 3) */}
            <div className="px-4">
              <div className="bg-white dark:bg-[#1E1210] rounded-[24px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.04] dark:border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#FFEBE3] dark:bg-white/10 text-[#FF6B35] flex items-center justify-center">
                      <Flame className="w-3.5 h-3.5 fill-[#FF6B35]" />
                    </div>
                    <h3 className="font-bold text-xs tracking-wide uppercase text-[#1A1A1A] dark:text-white">
                      Trending Topics
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-[#FF6B35]">
                    Updated hourly
                  </span>
                </div>

                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                  {defaultTrendingTopics.map((item) => (
                    <div
                      key={item.tag}
                      onClick={() =>
                        navigate(`/app/hashtag/${item.tag.replace("#", "")}`)
                      }
                      className="py-2.5 flex items-center justify-between first:pt-1 last:pb-1 cursor-pointer active:opacity-75 transition-opacity"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 font-black text-xs text-[#FF6B35]">
                          {item.rank}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-[#1A1A1A] dark:text-white">
                            {item.tag}
                          </p>
                          <p className="text-[10px] text-[#8C7A70] dark:text-white/50">
                            {item.category} • {item.posts}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8C7A70]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Popular Creators Carousel */}
            <div className="px-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-xs tracking-wide uppercase text-[#8C7A70] dark:text-white/50 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF6B35]" /> Popular Creators
                </h3>
              </div>
              <Suspense
                fallback={
                  <div className="h-28 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-[#FF6B35]" />
                  </div>
                }
              >
                <PopularCreatorsCarousel />
              </Suspense>
            </div>

            {/* Discover 2-Column Grid */}
            <div className="px-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-xs tracking-wide uppercase text-[#8C7A70] dark:text-white/50 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#FF6B35]" /> Discover
                </h3>
                <span className="text-[11px] text-[#8C7A70] dark:text-white/40">
                  {displayPosts.length} moments
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-6">
                {displayPosts.map((post, index) => (
                  <MobileDiscoverCard
                    key={post._id || `mdp-${index}`}
                    post={post}
                    index={index}
                    isLast={index === displayPosts.length - 1}
                    lastPostRef={exploreLastPostRef}
                  />
                ))}
              </div>

              {exploreLoading && (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
