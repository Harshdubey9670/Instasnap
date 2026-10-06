import React, { useState } from "react";
import {
  Search,
  Flame,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  Heart,
  MessageCircle,
  Bookmark,
  TrendingUp,
  Users,
  ArrowRight,
  Plane,
  Utensils,
  Coffee,
  Music,
  Palette,
  Sparkle,
  Dumbbell,
  PawPrint,
} from "lucide-react";
import DesktopLeftSidebar from "./DesktopLeftSidebar";
import DesktopTopBar from "./DesktopTopBar";

export default function DesktopExploreView({
  currentUser,
  posts = [],
  creators = [],
  trendingTags = [],
  onSearch,
  onOpenPost,
}) {
  const [activeTab, setActiveTab] = useState("explore");
  const [filterTab, setFilterTab] = useState("For You");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filterTabs = ["For You", "Trending", "Latest", "Nearby"];

  const categories = [
    { label: "All", icon: null, active: true },
    { label: "Travel", icon: Plane },
    { label: "Food", icon: Utensils },
    { label: "Lifestyle", icon: Coffee },
    { label: "Music", icon: Music },
    { label: "Art", icon: Palette },
    { label: "Beauty", icon: Sparkle },
    { label: "Sports", icon: Dumbbell },
    { label: "Pets", icon: PawPrint },
  ];

  const defaultTrendingTopics = [
    { tag: "#SpringVibes", count: "32.4K posts" },
    { tag: "#TravelDiary", count: "28.1K posts" },
    { tag: "#CozyLife", count: "19.7K posts" },
    { tag: "#CafeHopping", count: "16.2K posts" },
    { tag: "#PetStories", count: "12.9K posts" },
  ];

  const defaultSpotlightCreators = [
    {
      username: "minji",
      name: "Minji",
      category: "Lifestyle",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80",
    },
    {
      username: "lucas",
      name: "Lucas",
      category: "Travel",
      avatar:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80",
    },
    {
      username: "seoyeon",
      name: "Seoyeon",
      category: "Beauty",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80",
    },
    {
      username: "hyepark",
      name: "Hye Park",
      category: "Music",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80",
    },
  ];

  const defaultDiscoverPosts = [
    {
      id: "ep1",
      title: "A Brighter Tomorrow",
      author: {
        username: "seoyeon",
        name: "Seoyeon",
        avatar:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
      },
      image:
        "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop&q=80",
      likes: 12000,
      comments: 289,
      isLiked: false,
      isSaved: true,
    },
    {
      id: "ep2",
      title: "Little Happiness",
      author: {
        username: "hyepark",
        name: "Hye Park",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      },
      image:
        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80",
      likes: 7400,
      comments: 76,
      isLiked: true,
      isSaved: false,
    },
    {
      id: "ep3",
      title: "Café Chronicles",
      author: {
        username: "foodnomo",
        name: "Food Nomo",
        avatar:
          "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=100&auto=format&fit=crop&q=80",
      },
      image:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80",
      likes: 9200,
      comments: 184,
      isLiked: false,
      isSaved: false,
    },
    {
      id: "ep4",
      title: "Spring Vibes",
      author: {
        username: "hyepark",
        name: "Hye Park",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      },
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
      likes: 8100,
      comments: 142,
      isLiked: false,
      isSaved: false,
    },
  ];

  const [discoverPosts, setDiscoverPosts] = useState(defaultDiscoverPosts);

  React.useEffect(() => {
    if (posts && posts.length > 0) {
      setDiscoverPosts(
        posts.map((p, idx) => ({
          id: p._id || p.id || `dp-${idx}`,
          title: p.caption
            ? p.caption.length > 22
              ? p.caption.slice(0, 22) + "..."
              : p.caption
            : "Discover Moment",
          author: {
            username: p.user?.username || "creator",
            name: p.user?.fullName || p.user?.username || "Creator",
            avatar:
              p.user?.profilePicture ||
              p.user?.avatar ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
          },
          image:
            p.media?.[0]?.url ||
            p.image ||
            "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80",
          likes: p.likes?.length || p.likesCount || 1000,
          comments: p.comments?.length || p.commentsCount || 42,
          isLiked: Boolean(p.isLiked),
          isSaved: Boolean(p.isSaved),
          rawPost: p,
        }))
      );
    }
  }, [posts]);

  const togglePostLike = (id, e) => {
    e.stopPropagation();
    setDiscoverPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              isLiked: !p.isLiked,
              likes: p.isLiked ? p.likes - 1 : p.likes + 1,
            }
          : p
      )
    );
  };

  const togglePostSave = (id, e) => {
    e.stopPropagation();
    setDiscoverPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isSaved: !p.isSaved } : p))
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
  };

  return (
    <div className="min-h-screen bg-[#F5F0EB] dark:bg-[#120907] text-[#1A1A1A] dark:text-[#F5F0EB] antialiased selection:bg-[#FF6B35]/20 selection:text-[#FF6B35]">
      <div className="max-w-[1680px] mx-auto min-h-screen flex">
        {/* Left Navigation Sidebar */}
        <DesktopLeftSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
        />

        {/* Center Main Content Area */}
        <main className="flex-1 min-w-0 border-x border-black/[0.04] dark:border-white/[0.06] flex flex-col min-h-screen">
          {/* Top Bar Header */}
          <DesktopTopBar currentUser={currentUser} />

          {/* Explore Page Body Content */}
          <div className="flex-1 px-8 py-6 flex flex-col gap-6 overflow-y-auto">
            {/* ── 1. Hero Discovery Banner ── */}
            <div className="relative w-full h-[280px] rounded-[28px] overflow-hidden group shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-black/[0.04] dark:border-white/10 select-none">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1400&auto=format&fit=crop&q=80"
                alt="Discover More Moments"
                className="absolute inset-0 w-full h-full object-cover object-[center_20%] group-hover:scale-103 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />

              {/* Script Sticker on top-right */}
              <div className="absolute top-6 right-8 z-10 hidden sm:block">
                <span className="font-script text-2xl text-white/90 drop-shadow-sm tracking-wide">
                  Good Moments Everywhere —
                </span>
              </div>

              {/* Banner Text & Embedded Search Box */}
              <div className="absolute inset-0 p-8 sm:p-10 flex flex-col justify-center z-10 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider mb-2 self-start">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF8C5A]" />
                  <span>Explore</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight leading-tight">
                  Discover More Moments
                </h1>
                <p className="text-white/80 text-sm font-medium mt-1 mb-6">
                  People. Places. Ideas. A brighter tomorrow. ✨
                </p>

                {/* Floating Search Box */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="relative flex items-center bg-white/95 dark:bg-[#1E1210]/95 backdrop-blur-md rounded-full shadow-lg p-1.5 max-w-lg border border-white/40"
                >
                  <Search className="w-4 h-4 text-[#78716C] ml-3.5 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search photos, creators, topics, or locations..."
                    className="w-full bg-transparent px-3 py-1.5 text-xs text-[#1A1A1A] dark:text-white placeholder-[#A8A29E] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF6B35] to-[#FF8C5A] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* ── 2. Category Chips Row ── */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1 select-none">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.label;
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.label}
                    onClick={() => setActiveCategory(cat.label)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 border ${
                      isActive
                        ? "bg-[#FF6B35] text-white border-[#FF6B35] shadow-[0_4px_14px_rgba(255,107,53,0.3)]"
                        : "bg-white dark:bg-[#1E1210] text-[#78716C] dark:text-white/70 border-black/[0.05] dark:border-white/10 hover:border-[#FF6B35]/30 hover:text-[#1A1A1A] dark:hover:text-white shadow-xs"
                    }`}
                  >
                    {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-white dark:bg-[#1E1210] border border-black/[0.05] dark:border-white/10 flex items-center justify-center text-[#78716C] dark:text-white/70 hover:text-[#FF6B35] transition-colors shrink-0 shadow-xs cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* ── 3. Inline Highlight Panels (Split 2-Column) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 select-none">
              {/* Left Panel: Trending Topics (Cols: 7 / 12) */}
              <div className="lg:col-span-7 bg-white dark:bg-[#1E1210] rounded-[24px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-black/[0.04] dark:border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#FFEFEA] text-[#FF6B35] flex items-center justify-center">
                      <Flame className="w-3.5 h-3.5 fill-[#FF6B35]" />
                    </div>
                    <h3 className="font-extrabold text-sm tracking-tight text-[#1A1A1A] dark:text-white">
                      Trending Topics
                    </h3>
                  </div>
                  <button className="text-xs font-bold text-[#FF6B35] hover:underline flex items-center gap-0.5 cursor-pointer">
                    <span>See All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Horizontal topic tags */}
                <div className="flex items-center gap-2.5 overflow-x-auto hide-scrollbar py-1">
                  {(trendingTags && trendingTags.length > 0
                    ? trendingTags.map((t) => ({
                        tag: t.tag.startsWith("#") ? t.tag : `#${t.tag}`,
                        count: `${t.postCount || 10} posts`,
                      }))
                    : defaultTrendingTopics
                  ).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-0.5 bg-[#FAF6F0] dark:bg-white/5 border border-[#EBE3D9] dark:border-white/10 rounded-[16px] px-3.5 py-2.5 shrink-0 hover:border-[#FF6B35]/40 transition-colors cursor-pointer group"
                    >
                      <span className="text-xs font-bold text-[#1A1A1A] dark:text-white group-hover:text-[#FF6B35] transition-colors">
                        {item.tag}
                      </span>
                      <span className="text-[10px] text-[#A8A29E] font-medium">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel: Creator Spotlight (Cols: 5 / 12) */}
              <div className="lg:col-span-5 bg-white dark:bg-[#1E1210] rounded-[24px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-black/[0.04] dark:border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm tracking-tight text-[#1A1A1A] dark:text-white">
                      Creator Spotlight
                    </h3>
                  </div>
                  <button className="text-xs font-bold text-[#FF6B35] hover:underline flex items-center gap-0.5 cursor-pointer">
                    <span>See All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 4 Spotlight Creators */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar">
                  {(creators && creators.length > 0
                    ? creators.slice(0, 4).map((c, i) => ({
                        username: c.username || `creator-${i}`,
                        name: c.fullName || c.username || "Creator",
                        category: "Creator",
                        avatar:
                          c.profilePicture ||
                          c.avatar ||
                          defaultSpotlightCreators[i % 4].avatar,
                      }))
                    : defaultSpotlightCreators
                  ).map((creator, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
                    >
                      <div className="w-13 h-13 rounded-full p-[2px] bg-gradient-to-tr from-[#FF6B35] via-[#FF8C5A] to-[#FFB347] shadow-[0_0_10px_rgba(255,107,53,0.3)] group-hover:scale-105 transition-transform">
                        <div className="w-full h-full rounded-full border-2 border-white dark:border-[#1E1210] overflow-hidden">
                          <img
                            src={creator.avatar}
                            alt={creator.username}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#1A1A1A] dark:text-white truncate max-w-[62px]">
                        {creator.username}
                      </span>
                      <span className="text-[9px] font-semibold text-[#FF6B35] px-2 py-0.5 rounded-full bg-[#FFEFEA] dark:bg-[#FF6B35]/15">
                        {creator.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── 4. Filter Tabs Bar ── */}
            <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/10 pt-2 pb-2 select-none">
              <div className="flex items-center gap-6">
                {filterTabs.map((tab) => {
                  const isActive = filterTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setFilterTab(tab)}
                      className={`relative pb-2 text-[14px] transition-colors cursor-pointer ${
                        isActive
                          ? "font-extrabold text-[#1A1A1A] dark:text-white"
                          : "font-semibold text-[#9B9B9B] dark:text-white/60 hover:text-[#1A1A1A]"
                      }`}
                    >
                      <span>{tab}</span>
                      {isActive && (
                        <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#FF6B35] rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* View options / Dropdown */}
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/[0.06] dark:border-white/15 bg-white dark:bg-[#1E1210] text-xs font-semibold text-[#78716C] dark:text-white/70 shadow-xs cursor-pointer">
                  <span>All Content</span>
                  <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                </button>
              </div>
            </div>

            {/* ── 5. 4-Column Discover Content Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
              {discoverPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => onOpenPost && onOpenPost(post)}
                  className="group flex flex-col bg-white dark:bg-[#1E1210] rounded-[24px] overflow-hidden p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.04] dark:border-white/10 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                >
                  {/* Thumbnail Image */}
                  <div className="relative aspect-[4/3] rounded-[18px] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </div>

                  {/* Engagement Row */}
                  <div className="flex items-center justify-between px-1 pt-3 pb-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => togglePostLike(post.id, e)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] dark:text-white/70 hover:text-[#1A1A1A]"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            post.isLiked
                              ? "fill-[#FF4D4D] text-[#FF4D4D]"
                              : "text-[#64748B] dark:text-white/70"
                          }`}
                        />
                        <span>
                          {(post.likes / 1000).toFixed(
                            post.likes % 1000 === 0 ? 0 : 1
                          )}
                          K
                        </span>
                      </button>

                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] dark:text-white/70">
                        <MessageCircle className="w-4 h-4 text-[#64748B] dark:text-white/70" />
                        <span>{post.comments}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => togglePostSave(post.id, e)}
                      className="text-[#64748B] dark:text-white/70 hover:text-[#1A1A1A]"
                    >
                      <Bookmark
                        className={`w-4 h-4 ${
                          post.isSaved
                            ? "fill-[#FF6B35] text-[#FF6B35]"
                            : "text-[#64748B] dark:text-white/70"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Creator Info */}
                  <div className="flex items-center gap-2 px-1 pt-1 border-t border-black/[0.04] dark:border-white/5">
                    <img
                      src={post.author.avatar}
                      alt={post.author.username}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-[#1A1A1A] dark:text-white truncate">
                        {post.title}
                      </span>
                      <span className="text-[10px] text-[#A8A29E] truncate">
                        @{post.author.username}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── 6. Bottom Signature Footer ── */}
            <div className="py-10 border-t border-black/[0.04] dark:border-white/10 flex items-center justify-between text-xs text-[#A8A29E]">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#1A1A1A] dark:text-white font-display">
                  NUVYELO
                </span>
                <span>•</span>
                <span>Explore a brighter side of everyday life.</span>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-[10px] font-bold tracking-widest uppercase">
                <span>CREATE</span>
                <span>•</span>
                <span>DISCOVER</span>
                <span>•</span>
                <span>CONNECT</span>
                <span>•</span>
                <span>BELONG</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
