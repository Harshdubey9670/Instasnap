import React, { useState } from "react";
import { Zap, Heart, MessageCircle, Bookmark, MoreHorizontal, ArrowRight } from "lucide-react";

export const DesktopHeroSection = ({ featuredPost, onOpenPost, onExploreTopic }) => {
  const [isLiked, setIsLiked] = useState(false);
  const initialLikes = featuredPost?.likes?.length || featuredPost?.likesCount || 12400;
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [isSaved, setIsSaved] = useState(false);

  const heroImage = featuredPost?.media?.[0]?.url || featuredPost?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop&q=80";
  const heroTitle = featuredPost?.title || (featuredPost?.caption ? (featuredPost.caption.length > 25 ? featuredPost.caption.slice(0, 25) + '...' : featuredPost.caption) : "Golden Afternoons");
  const heroSubtitle = featuredPost?.subtitle || (featuredPost?.caption && featuredPost.caption.length > 25 ? featuredPost.caption.slice(25, 75) : "Finding beauty in the simple things.");
  const authorUsername = featuredPost?.user?.username || featuredPost?.author?.username || "hyepark";
  const authorAvatar = featuredPost?.user?.profilePicture || featuredPost?.user?.avatar || featuredPost?.author?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80";
  const commentCount = featuredPost?.comments?.length || featuredPost?.commentsCount || 289;

  const handleLikeToggle = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleSaveToggle = (e) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 select-none">
      {/* ── Main Large Featured Moment Card (Cols: 8 / 12) ── */}
      <div 
        onClick={() => featuredPost && onOpenPost && onOpenPost(featuredPost)}
        className="lg:col-span-8 relative h-[360px] rounded-[28px] overflow-hidden group shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-black/[0.04] dark:border-white/10 cursor-pointer"
      >
        {/* Full Bleed Background Image */}
        <img
          src={heroImage}
          alt={heroTitle}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Gradient Overlay Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/15 group-hover:from-black/90 transition-colors duration-300" />

        {/* Top Badges & Options Bar */}
        <div className="absolute top-5 inset-x-5 flex items-center justify-between z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-sm">
            <Zap className="w-3.5 h-3.5 fill-[#FF6B35] text-[#FF6B35]" />
            <span>Featured Moment</span>
          </div>

          <button
            type="button"
            className="w-9 h-9 rounded-full bg-black/35 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 hover:text-white hover:bg-black/50 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Card Information & Engagements */}
        <div className="absolute bottom-5 inset-x-5 flex items-end justify-between z-10">
          {/* Creator & Title Info */}
          <div className="flex flex-col gap-2 max-w-md">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight leading-tight">
              {heroTitle}
            </h2>
            <p className="text-white/80 text-sm font-medium leading-snug">
              {heroSubtitle}
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <img
                src={authorAvatar}
                alt={authorUsername}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-white/50"
              />
              <span className="text-xs font-semibold text-white/95">
                @{authorUsername}
              </span>
              <span className="text-xs text-white/60">• 2h ago</span>
            </div>
          </div>

          {/* Engagement Badges */}
          <div className="flex items-center gap-2">
            {/* Likes */}
            <button
              type="button"
              onClick={handleLikeToggle}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md border border-white/20 text-white text-xs font-semibold transition-all active:scale-95"
            >
              <Heart
                className={`w-4 h-4 ${
                  isLiked ? "fill-[#FF4D4D] text-[#FF4D4D]" : "text-white"
                }`}
              />
              <span>{(likeCount / 1000).toFixed(likeCount % 1000 === 0 ? 0 : 1)}K</span>
            </button>

            {/* Comments */}
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md border border-white/20 text-white text-xs font-semibold transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4 text-white" />
              <span>{commentCount}</span>
            </button>

            {/* Bookmark / Save */}
            <button
              type="button"
              onClick={handleSaveToggle}
              className="w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all active:scale-95"
            >
              <Bookmark
                className={`w-4 h-4 ${
                  isSaved ? "fill-white text-white" : "text-white"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2 Stacked Beside Cards (Cols: 4 / 12) ── */}
      <div className="lg:col-span-4 flex flex-col justify-between gap-4 h-[360px]">
        {/* Card 1: Travel Diaries */}
        <div 
          onClick={() => onExploreTopic && onExploreTopic("travel")}
          className="relative flex-1 rounded-[24px] overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-black/[0.04] dark:border-white/10 cursor-pointer"
        >
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80"
            alt="Travel Diaries"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10 group-hover:from-black/80 transition-colors" />

          <div className="absolute inset-0 p-5 flex items-end justify-between z-10">
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-white font-display leading-snug">
                Travel Diaries
              </h3>
              <p className="text-xs text-white/75 font-medium">By lucas</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/25 hover:bg-white/40 backdrop-blur-md border border-white/30 flex items-center justify-center text-white group-hover:translate-x-1 transition-all duration-200">
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Card 2: Café Chronicles */}
        <div 
          onClick={() => onExploreTopic && onExploreTopic("coffee")}
          className="relative flex-1 rounded-[24px] overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-black/[0.04] dark:border-white/10 cursor-pointer"
        >
          <img
            src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80"
            alt="Café Chronicles"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10 group-hover:from-black/80 transition-colors" />

          <div className="absolute inset-0 p-5 flex items-end justify-between z-10">
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-white font-display leading-snug">
                Café Chronicles
              </h3>
              <p className="text-xs text-white/75 font-medium">By foodnomo</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/25 hover:bg-white/40 backdrop-blur-md border border-white/30 flex items-center justify-center text-white group-hover:translate-x-1 transition-all duration-200">
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopHeroSection;
