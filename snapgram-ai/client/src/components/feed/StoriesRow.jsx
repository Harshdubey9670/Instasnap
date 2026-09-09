import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Avatar } from "../ui/Avatar";

export const StoriesRow = ({ stories = [], liveStreams = [], isLoading, onStoryClick }) => {
  const { user: authUser } = useSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 px-3 sm:px-0 no-scrollbar snap-x-mandatory">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 snap-start">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-bg-surface-hover animate-pulse" />
            <div className="w-14 sm:w-16 h-2.5 rounded bg-bg-surface-hover animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 px-3 sm:px-0 no-scrollbar snap-x-mandatory">

      {/* Current User — Add/View Story */}
      {(() => {
        const myStoryIndex = stories.findIndex(s => (s.user?._id === authUser?._id) || (s.user === authUser?._id));
        const myStoryGroup = myStoryIndex !== -1 ? stories[myStoryIndex] : null;
        const allSeen = myStoryGroup?.stories.every((s) => 
          s.viewers?.some((v) => (typeof v === 'string' ? v : v._id) === authUser?._id)
        );
        const ringClass = myStoryGroup 
          ? (allSeen ? "bg-border-strong p-[2px]" : "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px]")
          : "border-[3px] border-bg-base";

        return (
          <div className="flex flex-col items-center gap-1.5 shrink-0 group snap-start relative">
            <div className="relative">
              <div 
                onClick={() => myStoryGroup ? onStoryClick?.(myStoryIndex) : document.getElementById('create-story-link').click()}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full transition-transform duration-300 group-hover:scale-105 shadow-sm group-hover:shadow-md cursor-pointer ${ringClass}`}
              >
                <div className="w-full h-full rounded-full border-[3px] border-bg-base overflow-hidden">
                  <Avatar
                    src={authUser?.profilePicture || authUser?.avatar}
                    alt="Your story"
                    fallback={authUser?.username?.charAt(0)}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <Link 
                id="create-story-link"
                to="/app/story/create" 
                className="absolute bottom-1 right-0 bg-primary-500 rounded-full p-1 border-2 border-bg-base shadow-sm hover:scale-110 transition-transform z-10"
                onClick={(e) => e.stopPropagation()}
                aria-label="Upload story"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </Link>
            </div>
            <span className="text-[10px] sm:text-xs text-text-secondary font-medium">Your story</span>
          </div>
        );
      })()}

      {/* Active Live Streams */}
      {liveStreams.map((stream) => (
        <Link
          to={`/app/live/${stream._id}`}
          key={`live-${stream._id}`}
          className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer relative group snap-start"
          aria-label={`${stream.host.username} is live`}
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-pink-500 via-red-500 to-purple-500 p-[3px] animate-pulse">
            <div className="w-full h-full rounded-full border-[3px] border-bg-base overflow-hidden">
              <img
                src={stream.host.profilePicture || "https://i.pravatar.cc/150"}
                alt={stream.host.username}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="absolute top-[68px] sm:top-[80px] bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm border-2 border-bg-base shadow-sm">
            LIVE
          </div>
          <span className="text-xs sm:text-sm text-text-primary font-medium truncate w-16 sm:w-20 text-center mt-2 sm:mt-2.5">
            {stream.host.username}
          </span>
        </Link>
      ))}

      {/* Friends' Stories */}
      {stories.filter(s => (s.user?._id !== authUser?._id) && (s.user !== authUser?._id)).map((storyGroup) => {
        const originalIndex = stories.indexOf(storyGroup);
        const allSeen = storyGroup.stories.every((s) => 
          s.viewers?.some((v) => (typeof v === 'string' ? v : v._id) === authUser?._id)
        );
        const ringClass = allSeen 
          ? "bg-border-strong p-[2px]" 
          : "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px]";

        return (
          <motion.div
            whileTap={{ scale: 0.95 }}
            key={storyGroup.user._id}
            onClick={() => onStoryClick && onStoryClick(originalIndex)}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer snap-start group"
            role="button"
            tabIndex={0}
            aria-label={`${storyGroup.user.username}'s story`}
            onKeyDown={(e) => e.key === 'Enter' && onStoryClick?.(originalIndex)}
          >
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full ${ringClass} transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[10deg] shadow-sm group-hover:shadow-md`}>
              <div className="w-full h-full rounded-full border-[3px] border-bg-base overflow-hidden transition-transform duration-300 group-hover:-rotate-[10deg]">
                <Avatar
                  src={storyGroup.user.profilePicture || storyGroup.user.avatar}
                  alt={storyGroup.user.username}
                  fallback={storyGroup.user.username?.charAt(0)}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <span className="text-xs sm:text-sm text-text-primary font-medium truncate w-16 sm:w-20 text-center">
              {storyGroup.user.username}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};
