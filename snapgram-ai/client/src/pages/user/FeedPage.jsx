import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Loader2,
  Heart,
  MessageCircle,
  Bookmark,
  Zap,
  Flame,
  Plus,
  Send,
  MoreHorizontal,
} from "lucide-react";

import { StoryViewer } from "../../components/feed/StoryViewer";
import { FeedSkeleton } from "../../components/feed/FeedSkeleton";
import { getActiveStreams } from "../../services/liveService";
import api from "../../services/api";
import DesktopHomeView from "../../components/desktop/DesktopHomeView";

const FeedPage = () => {
  const navigate = useNavigate();
  const { user: authUser } = useSelector((state) => state.auth);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [liveStreams, setLiveStreams] = useState([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active filter tab for mobile web feed
  const [mobileTab, setMobileTab] = useState("For You");
  const mobileTabs = ["For You", "Following", "Trending"];

  const mutedUserIds = (authUser?.mutedUsers || []).map(
    (id) => (typeof id === "string" ? id : id?._id || id)?.toString()
  );

  const activeStories = stories.filter(
    (group) =>
      group?.user?._id && !mutedUserIds.includes(group.user._id.toString())
  );

  // Default mock items for high-aesthetic fallback when feed is fresh/empty
  const fallbackHero = {
    title: "Golden Afternoons",
    subtitle: "Finding beauty in the simple things.",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=80",
    author: {
      username: "hyepark",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    },
    likes: 12400,
    comments: 289,
    timeAgo: "2h ago",
  };

  const fallbackGridPosts = [
    {
      id: "fg1",
      title: "Spring Vibes",
      author: {
        username: "minji",
        avatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      },
      image:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80",
      likes: 8200,
      comments: 142,
    },
    {
      id: "fg2",
      title: "Chasing Sunsets",
      author: {
        username: "lucas",
        avatar:
          "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80",
      },
      image:
        "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop&q=80",
      likes: 15000,
      comments: 320,
    },
    {
      id: "fg3",
      title: "Music Heals",
      author: {
        username: "seoyeon",
        avatar:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
      },
      image:
        "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&auto=format&fit=crop&q=80",
      likes: 11000,
      comments: 98,
    },
    {
      id: "fg4",
      title: "Little Happiness",
      author: {
        username: "hyepark",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      },
      image:
        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80",
      likes: 6400,
      comments: 76,
    },
  ];

  // Infinite Scroll — observe the last post element
  const observer = useRef();
  const lastPostElementRef = useCallback(
    (node) => {
      if (isLoading || isFetchingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            setPage((prevPage) => prevPage + 1);
          }
        },
        {
          rootMargin: "200px",
        }
      );
      if (node) observer.current.observe(node);
    },
    [isLoading, isFetchingMore, hasMore]
  );

  const fetchData = async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum === 1 && !isRefresh) setIsLoading(true);
      if (pageNum > 1) setIsFetchingMore(true);

      const tabParam = mobileTab === "For You" ? "forYou" : mobileTab.toLowerCase();
      const [postsRes, storiesRes, liveRes] = await Promise.all([
        api.get(`/api/posts/feed?page=${pageNum}&limit=10&tab=${tabParam}`),
        pageNum === 1 ? api.get("/api/stories") : Promise.resolve(null),
        pageNum === 1 ? getActiveStreams() : Promise.resolve(null),
      ]);

      if (storiesRes?.data?.data) setStories(storiesRes.data.data);
      if (liveRes?.data) setLiveStreams(liveRes.data);

      const newPosts = postsRes?.data?.data || [];
      setHasMore(Boolean(postsRes?.data?.pagination?.hasMore));

      if (isRefresh || pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchData(1, true);
  }, [mobileTab]);

  useEffect(() => {
    if (page > 1) {
      fetchData(page);
    }
  }, [page]);

  // Pull to Refresh
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientY);
  const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientY);
  const handleTouchEnd = () => {
    if (touchStart - touchEnd < -100 && window.scrollY <= 10) {
      setIsRefreshing(true);
      setPage(1);
      fetchData(1, true);
    }
  };

  const currentUser = authUser
    ? {
        name: authUser.fullName || authUser.username || "Alex Park",
        username: authUser.username || "alex.park",
        avatar:
          authUser.avatar ||
          authUser.profilePicture ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        posts: authUser.postsCount || "184",
        followers: authUser.followersCount
          ? `${(authUser.followersCount / 1000).toFixed(1)}K`
          : "12.4K",
        following: authUser.followingCount || "356",
        bio: authUser.bio || "Capturing little moments of a brighter tomorrow. ✨",
      }
    : null;

  // Proxy helper for Android emulator network DNS compatibility
  const getMediaUrl = (url) => {
    if (!url) return "";
    if (
      typeof window !== "undefined" &&
      window.location.hostname &&
      (window.location.hostname === "10.0.2.2" || window.location.hostname.startsWith("10.0."))
    ) {
      if (url.includes("cloudinary.com") || url.includes("unsplash.com")) {
        return `http://${window.location.hostname}:5001/api/proxy/image?url=${encodeURIComponent(url)}`;
      }
    }
    return url;
  };

  // Real or fallback hero post
  const heroPost =
    posts && posts.length > 0
      ? {
          id: posts[0]._id,
          title: posts[0].caption?.slice(0, 25) || "Golden Afternoons",
          subtitle:
            posts[0].caption && posts[0].caption.length > 25
              ? posts[0].caption.slice(25, 75)
              : "Finding beauty in the simple things.",
          image: (() => {
            const m = posts[0].media?.[0];
            let url = m?.url || posts[0].image || fallbackHero.image;
            if (m?.type === "video" || (typeof url === "string" && url.endsWith(".mp4"))) {
              url = url.replace(/\.mp4(\?.*)?$/i, ".jpg");
            }
            return getMediaUrl(url);
          })(),
          author: {
            username: posts[0].user?.username || "hyepark",
            avatar: getMediaUrl(
              posts[0].user?.profilePicture ||
              posts[0].user?.avatar ||
              fallbackHero.author.avatar
            ),
          },
          likes: posts[0].likes?.length || posts[0].likesCount || 12400,
          comments: posts[0].comments?.length || posts[0].commentsCount || 289,
          timeAgo: "2h ago",
          rawPost: posts[0],
        }
      : fallbackHero;

  // Grid posts (excluding hero if more than 1 post)
  const displayGridPosts =
    posts && posts.length > 1
      ? posts.slice(1).map((p, idx) => {
          const m = p.media?.[0];
          let url = m?.url || p.image || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80";
          if (m?.type === "video" || (typeof url === "string" && url.endsWith(".mp4"))) {
            url = url.replace(/\.mp4(\?.*)?$/i, ".jpg");
          }

          return {
            id: p._id || `gp-${idx}`,
            title: p.caption
              ? p.caption.length > 20
                ? p.caption.slice(0, 20) + "..."
                : p.caption
              : (idx % 2 === 0 ? "Spring Vibes" : "Chasing Sunsets"),
            author: {
              username: p.user?.username || "creator",
              avatar: getMediaUrl(
                p.user?.profilePicture ||
                p.user?.avatar ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              ),
            },
            image: getMediaUrl(url),
            likes: p.likes?.length || p.likesCount || (idx % 2 === 0 ? 8200 : 15000),
            comments: p.comments?.length || p.commentsCount || (idx % 2 === 0 ? 142 : 320),
            rawPost: p,
          };
        })
      : fallbackGridPosts;

  return (
    <>
      {/* ── Desktop Panoramic Homepage (lg and above) ── */}
      <div className="hidden lg:block w-full min-h-screen">
        <DesktopHomeView
          currentUser={currentUser}
          posts={posts}
          stories={activeStories}
          liveStreams={liveStreams}
          isLoading={isLoading}
          onStoryClick={(index) => setActiveStoryIndex(index)}
          onAddStory={() => navigate("/stories/create")}
          onOpenPost={(post) => {
            const id = post._id || post.id || post.rawPost?._id;
            if (id) navigate(`/post/${id}`);
          }}
        />
      </div>

      {/* ── Responsive Mobile Web (< lg) ── */}
      <div
        className="block lg:hidden w-full min-h-screen bg-[#F5F0EB] dark:bg-[#120907] text-[#1A1A1A] dark:text-[#F5F0EB] pb-24"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile Web Header */}
        <header className="sticky top-0 z-30 bg-[#F5F0EB]/95 dark:bg-[#120907]/95 backdrop-blur-md px-4 py-3 border-b border-black/[0.04] dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/nuvyelo-emblem.png"
              alt="NUVYELO"
              className="w-8 h-8 object-contain"
            />
            <span className="font-black text-xl tracking-tight font-display text-[#1A1A1A] dark:text-[#F5F0EB]">
              NUVYELO
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate("/chat")}
              className="p-1 text-[#1A1A1A] dark:text-white active:scale-95 transition-transform"
              aria-label="Messages"
            >
              <MessageCircle className="w-6 h-6 stroke-[1.8]" />
            </button>
            <button
              onClick={() => navigate(`/profile/${authUser?.username || "me"}`)}
              className="relative w-8 h-8 rounded-full overflow-visible active:scale-95 transition-transform"
              aria-label="Profile"
            >
              <img
                src={
                  currentUser?.avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                }
                alt="Profile"
                className="w-full h-full rounded-full object-cover ring-1 ring-black/10 dark:ring-white/20"
              />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#FF6B35] ring-2 ring-white dark:ring-[#120907]" />
            </button>
          </div>
        </header>

        {/* Pull to refresh spinner */}
        {isRefreshing && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 text-[#FF6B35] animate-spin" />
          </div>
        )}

        <div className="px-3.5 pt-3 flex flex-col gap-4">
          {/* Stories Horizontal Row */}
          <div className="bg-white dark:bg-[#1E1210] rounded-[24px] p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.04] dark:border-white/10 flex items-center gap-3 overflow-x-auto hide-scrollbar select-none">
            {/* Your Story */}
            <div
              onClick={() => navigate("/stories/create")}
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <div className="relative w-15 h-15 rounded-full bg-[#FF6B35]/12 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-[#FF6B35] text-white flex items-center justify-center">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
              </div>
              <span className="text-[10px] font-semibold text-[#64748B] dark:text-white/70">
                Your Story
              </span>
            </div>

            {/* Stories List */}
            {(activeStories && activeStories.length > 0
              ? activeStories
              : [
                  { user: { username: "minji" } },
                  { user: { username: "lucas" } },
                  { user: { username: "seoyeon" } },
                ]
            ).map((group, index) => {
              const username = group.user?.username || `user-${index}`;
              const avatar = getMediaUrl(
                group.user?.profilePicture ||
                group.user?.avatar ||
                fallbackHero.author.avatar
              );
              return (
                <div
                  key={index}
                  onClick={() => setActiveStoryIndex(index)}
                  className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <div className="w-15 h-15 rounded-full p-[2px] bg-gradient-to-tr from-[#FF6B35] via-[#FF8C5A] to-[#FFB347] shadow-[0_0_10px_rgba(255,107,53,0.3)]">
                    <div className="w-full h-full rounded-full border-2 border-white dark:border-[#1E1210] overflow-hidden bg-neutral-100">
                      <img
                        src={avatar}
                        alt={username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-[#1A1A1A] dark:text-white/90 truncate max-w-[58px]">
                    {username}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hero Featured Moment Card (Matching Reference Design) */}
          <div
            onClick={() => {
              if (heroPost.rawPost?._id) navigate(`/post/${heroPost.rawPost._id}`);
            }}
            className="relative h-[340px] rounded-[24px] overflow-hidden group shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-black/[0.04] dark:border-white/10 cursor-pointer select-none"
          >
            <img
              src={heroPost.image}
              alt={heroPost.title}
              className="absolute inset-0 w-full h-full object-cover group-active:scale-102 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/15" />

            {/* Top Options Menu */}
            <div className="absolute top-4 right-4 flex items-center z-10">
              <button
                type="button"
                className="px-2 py-1 rounded-lg bg-black/35 backdrop-blur-md border border-white/20 flex items-center gap-1 text-white"
              >
                <span className="w-1 h-1 rounded-full bg-white" />
                <span className="w-1 h-1 rounded-full bg-white" />
                <span className="w-1 h-1 rounded-full bg-white" />
              </button>
            </div>

            {/* Bottom Content */}
            <div className="absolute bottom-4 inset-x-4 flex flex-col gap-2.5 z-10">
              <h2 className="text-2xl font-extrabold text-white font-display leading-tight">
                {heroPost.title}
              </h2>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={heroPost.author.avatar}
                    alt={heroPost.author.username}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-white/60"
                  />
                  <span className="text-xs font-semibold text-white/95">
                    @{heroPost.author.username} • 2h ago
                  </span>
                </div>
                <div className="flex items-center gap-1 text-white/70 px-1">
                  <span className="w-0.5 h-0.5 rounded-full bg-white/70" />
                  <span className="w-0.5 h-0.5 rounded-full bg-white/70" />
                  <span className="w-0.5 h-0.5 rounded-full bg-white/70" />
                </div>
              </div>

              {/* Engagement Badges */}
              <div className="flex items-center gap-2 pt-0.5">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white text-xs font-bold">
                  <Heart className="w-3.5 h-3.5 fill-[#FF4D4D] text-[#FF4D4D]" />
                  <span>
                    {heroPost.likes >= 1000
                      ? `${(heroPost.likes / 1000).toFixed(heroPost.likes % 1000 === 0 ? 0 : 1)}K`
                      : heroPost.likes}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white text-xs font-bold">
                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                  <span>{heroPost.comments}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-black/45 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                  <Bookmark className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Feed Filter Tabs */}
          <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/10 pt-2 pb-1">
            <div className="flex items-center gap-5">
              {mobileTabs.map((tab) => {
                const isActive = mobileTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setMobileTab(tab)}
                    className={`relative pb-2 text-[14px] font-bold transition-colors ${
                      isActive
                        ? "text-[#1A1A1A] dark:text-white"
                        : "text-[#9B9B9B] dark:text-white/60"
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
          </div>

          {/* 2-Column Card Grid (Matching Reference Design) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {displayGridPosts.map((post, idx) => (
              <div
                key={post.id || idx}
                ref={
                  idx === displayGridPosts.length - 1
                    ? lastPostElementRef
                    : null
                }
                onClick={() => {
                  const id = post.rawPost?._id || post.id;
                  if (id) navigate(`/post/${id}`);
                }}
                className="group flex flex-col bg-white dark:bg-[#1E1210] rounded-[22px] overflow-hidden p-2.5 shadow-[0_4px_18px_rgba(0,0,0,0.03)] border border-black/[0.04] dark:border-white/10 active:scale-98 transition-all cursor-pointer select-none"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] rounded-[16px] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Engagement row */}
                <div className="flex items-center justify-between px-1 pt-2 pb-1">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[#64748B] dark:text-white/70">
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-[#FF4D4D] text-[#FF4D4D]" />
                      <span>
                        {post.likes >= 1000
                          ? `${(post.likes / 1000).toFixed(post.likes % 1000 === 0 ? 0 : 1)}K`
                          : post.likes}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 text-[#64748B] dark:text-white/70" />
                      <span>{post.comments}</span>
                    </div>
                  </div>
                  <Bookmark className="w-3.5 h-3.5 text-[#64748B] dark:text-white/70" />
                </div>

                {/* Creator details: Avatar on left, Title + Username on right */}
                <div className="flex items-center gap-2 px-1 pt-1">
                  <img
                    src={post.author.avatar}
                    alt={post.author.username}
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11.5px] font-bold text-[#1A1A1A] dark:text-white truncate leading-snug">
                      {post.title}
                    </span>
                    <span className="text-[10px] text-[#8C827A] dark:text-white/60 truncate leading-none">
                      @{post.author.username}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading More Spinner */}
          {isFetchingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 text-[#FF6B35] animate-spin" />
            </div>
          )}

          {/* End of Feed */}
          {!hasMore && (
            <div className="text-center py-6 text-xs text-[#8C827A] dark:text-white/50">
              You're all caught up with your circle's moments ✨
            </div>
          )}
        </div>

        {/* Story Viewer Modal */}
        {activeStoryIndex !== null && (
          <StoryViewer
            stories={activeStories}
            initialUserIndex={activeStoryIndex}
            onClose={() => setActiveStoryIndex(null)}
          />
        )}
      </div>
    </>
  );
};

export default FeedPage;
