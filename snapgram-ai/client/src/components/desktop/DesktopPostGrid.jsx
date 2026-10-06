import React, { useState } from "react";
import { Heart, MessageCircle, Bookmark, SlidersHorizontal, MoreHorizontal } from "lucide-react";

export const DesktopPostGrid = ({ posts: livePosts, onOpenPost }) => {
  const [activeTab, setActiveTab] = useState("For You");
  const tabs = ["For You", "Following", "Discover", "Trending"];

  const defaultMockPosts = [
    {
      id: "p1",
      title: "Spring Vibes",
      author: {
        name: "Minji",
        username: "minji",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      },
      image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80",
      likes: 8200,
      comments: 142,
      timeAgo: "6h ago",
      isLiked: false,
      isSaved: false,
    },
    {
      id: "p2",
      title: "Chasing Sunsets",
      author: {
        name: "Lucas",
        username: "lucas",
        avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80",
      },
      image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop&q=80",
      likes: 15000,
      comments: 320,
      timeAgo: "1d ago",
      isLiked: true,
      isSaved: false,
    },
    {
      id: "p3",
      title: "Music Heals",
      author: {
        name: "Seoyeon",
        username: "seoyeon",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
      },
      image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&auto=format&fit=crop&q=80",
      likes: 11000,
      comments: 98,
      timeAgo: "1d ago",
      isLiked: false,
      isSaved: true,
    },
    {
      id: "p4",
      title: "Little Happiness",
      author: {
        name: "Hye Park",
        username: "hyepark",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      },
      image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80",
      likes: 6400,
      comments: 76,
      timeAgo: "2d ago",
      isLiked: false,
      isSaved: false,
    },
  ];

  const [posts, setPosts] = useState(defaultMockPosts);

  React.useEffect(() => {
    if (livePosts && livePosts.length > 0) {
      setPosts(
        livePosts.map((p, idx) => ({
          id: p._id || p.id || `live-${idx}`,
          title: p.caption ? (p.caption.length > 20 ? p.caption.slice(0, 20) + "..." : p.caption) : "Moment",
          author: {
            name: p.user?.fullName || p.user?.username || "Creator",
            username: p.user?.username || "creator",
            avatar: p.user?.profilePicture || p.user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
          },
          image: p.media?.[0]?.url || p.image || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80",
          likes: p.likes?.length || p.likesCount || 1000,
          comments: p.comments?.length || p.commentsCount || 12,
          timeAgo: p.createdAt ? "recently" : "1d ago",
          isLiked: Boolean(p.isLiked),
          isSaved: Boolean(p.isSaved),
          rawPost: p,
        }))
      );
    }
  }, [livePosts]);

  const toggleLike = (id, e) => {
    e.stopPropagation();
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === id) {
          const nextLiked = !post.isLiked;
          return {
            ...post,
            isLiked: nextLiked,
            likes: nextLiked ? post.likes + 1 : post.likes - 1,
          };
        }
        return post;
      })
    );
  };

  const toggleSave = (id, e) => {
    e.stopPropagation();
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id ? { ...post, isSaved: !post.isSaved } : post
      )
    );
  };

  return (
    <div className="w-full flex flex-col gap-4 select-none">
      {/* ── Feed Header Navigation Tabs ── */}
      <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/10 pb-2">
        {/* Tabs */}
        <div className="flex items-center gap-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative pb-2 text-[15px] transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? "font-extrabold text-[#1A1A1A] dark:text-white"
                    : "font-semibold text-[#9B9B9B] dark:text-white/60 hover:text-[#1A1A1A] dark:hover:text-white"
                }`}
              >
                <span>{tab}</span>
                {isActive && (
                  <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#1A1A1A] dark:bg-white rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Personalize Button */}
        <button
          type="button"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-black/[0.06] dark:border-white/15 bg-white dark:bg-[#1E1210] hover:bg-black/[0.02] dark:hover:bg-white/5 text-xs font-semibold text-[#64748B] dark:text-white/70 shadow-sm transition-all"
        >
          <span>Personalize</span>
          <SlidersHorizontal className="w-3.5 h-3.5 text-current" />
        </button>
      </div>

      {/* ── 4-Column Post Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => onOpenPost && onOpenPost(post)}
            className="group flex flex-col bg-white dark:bg-[#1E1210] rounded-[24px] overflow-hidden p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.04] dark:border-white/10 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer"
          >
            {/* Post Thumbnail Image with overlay */}
            <div className="relative aspect-[4/3] rounded-[18px] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </div>

            {/* Engagement Metrics Row */}
            <div className="flex items-center justify-between px-1 pt-3 pb-2">
              <div className="flex items-center gap-3">
                {/* Heart */}
                <button
                  type="button"
                  onClick={(e) => toggleLike(post.id, e)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] dark:text-white/70 hover:text-[#1A1A1A] dark:hover:text-white"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      post.isLiked
                        ? "fill-[#FF4D4D] text-[#FF4D4D]"
                        : "text-[#64748B] dark:text-white/70"
                    }`}
                  />
                  <span>
                    {(post.likes / 1000).toFixed(post.likes % 1000 === 0 ? 0 : 1)}K
                  </span>
                </button>

                {/* Comments */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] dark:text-white/70">
                  <MessageCircle className="w-4 h-4 text-[#64748B] dark:text-white/70" />
                  <span>{post.comments}</span>
                </div>
              </div>

              {/* Bookmark */}
              <button
                type="button"
                onClick={(e) => toggleSave(post.id, e)}
                className="p-1 rounded-lg text-[#64748B] dark:text-white/70 hover:text-[#1A1A1A] dark:hover:text-white"
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    post.isSaved
                      ? "fill-[#1A1A1A] dark:fill-white text-[#1A1A1A] dark:text-white"
                      : ""
                  }`}
                />
              </button>
            </div>

            {/* Author & Post Info */}
            <div className="flex items-center justify-between px-1 pt-1 border-t border-black/[0.03] dark:border-white/5">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={post.author.avatar}
                  alt={post.author.username}
                  className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-black/5"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#1A1A1A] dark:text-white truncate">
                    {post.title}
                  </div>
                  <div className="text-[11px] text-[#9B9B9B] dark:text-white/60 truncate">
                    @{post.author.username} • {post.timeAgo}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="p-1 rounded-lg text-[#9B9B9B] hover:text-[#1A1A1A] dark:hover:text-white"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DesktopPostGrid;
