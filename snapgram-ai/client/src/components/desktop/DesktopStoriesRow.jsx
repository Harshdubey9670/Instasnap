import React from "react";
import { Plus, ChevronRight } from "lucide-react";

export const DesktopStoriesRow = ({ stories = [], onAddStory, onStoryClick }) => {
  const defaultStories = [
    {
      id: "s1",
      username: "minji",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80",
    },
    {
      id: "s2",
      username: "lucas",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80",
    },
    {
      id: "s3",
      username: "seoyeon",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80",
    },
    {
      id: "s4",
      username: "travel.diary",
      avatar: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=160&auto=format&fit=crop&q=80",
    },
    {
      id: "s5",
      username: "foodnomo",
      avatar: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=160&auto=format&fit=crop&q=80",
    },
    {
      id: "s6",
      username: "art.jun",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80",
    },
    {
      id: "s7",
      username: "hyepark",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80",
    },
  ];

  const displayStories = stories && stories.length > 0
    ? stories.map((s, i) => ({
        id: s._id || s.user?._id || `rs-${i}`,
        username: s.user?.username || `user-${i}`,
        avatar: s.user?.profilePicture || s.user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80",
      }))
    : defaultStories;

  return (
    <div className="w-full bg-white dark:bg-[#1E1210] rounded-[24px] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-black/[0.04] dark:border-white/10 flex items-center justify-between gap-3 overflow-hidden select-none">
      {/* Add Story Button */}
      <button
        type="button"
        onClick={onAddStory}
        className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
      >
        <div className="relative w-16 h-16 rounded-full flex items-center justify-center p-[2px] bg-gradient-to-tr from-[#FFEBE3] to-[#FFF5F0] dark:from-white/10 dark:to-white/5 border border-dashed border-[#FF6B35]/40 group-hover:scale-105 transition-transform duration-200">
          <div className="w-10 h-10 rounded-full bg-[#FF6B35]/15 text-[#FF6B35] flex items-center justify-center group-hover:bg-[#FF6B35] group-hover:text-white transition-colors duration-200">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>
        <span className="text-[11px] font-semibold text-[#64748B] dark:text-white/70 group-hover:text-[#FF6B35] transition-colors">
          Add Story
        </span>
      </button>

      {/* Story Items */}
      <div className="flex items-center gap-4 sm:gap-5 overflow-x-auto hide-scrollbar py-0.5 px-1">
        {displayStories.map((story, idx) => (
          <button
            key={story.id}
            type="button"
            onClick={() => onStoryClick && onStoryClick(idx)}
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-[#FF6B35] via-[#FF8C5A] to-[#FFB347] shadow-[0_0_12px_rgba(255,107,53,0.35)] group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full rounded-full border-2 border-white dark:border-[#1E1210] overflow-hidden bg-neutral-100">
                <img
                  src={story.avatar}
                  alt={story.username}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>
            <span className="text-[11px] font-medium text-[#1A1A1A] dark:text-white/90 truncate max-w-[62px]">
              {story.username}
            </span>
          </button>
        ))}
      </div>

      {/* See All Button */}
      <button
        type="button"
        onClick={() => onStoryClick && onStoryClick(0)}
        className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer pl-1"
        title="See all stories"
      >
        <div className="w-16 h-16 rounded-full bg-black/[0.03] dark:bg-white/5 border border-black/[0.06] dark:border-white/10 flex items-center justify-center text-[#64748B] dark:text-white/70 group-hover:bg-[#FF6B35]/10 group-hover:text-[#FF6B35] group-hover:scale-105 transition-all duration-200">
          <ChevronRight className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span className="text-[11px] font-semibold text-[#64748B] dark:text-white/70 group-hover:text-[#FF6B35] transition-colors">
          See All
        </span>
      </button>
    </div>
  );
};

export default DesktopStoriesRow;
