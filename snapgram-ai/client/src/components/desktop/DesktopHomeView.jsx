import React, { useState } from 'react';
import DesktopLeftSidebar from './DesktopLeftSidebar';
import DesktopTopBar from './DesktopTopBar';
import DesktopStoriesRow from './DesktopStoriesRow';
import DesktopHeroSection from './DesktopHeroSection';
import DesktopPostGrid from './DesktopPostGrid';
import DesktopRightSidebar from './DesktopRightSidebar';

export default function DesktopHomeView({
  currentUser,
  posts = [],
  stories = [],
  liveStreams = [],
  isLoading = false,
  onStoryClick,
  onAddStory,
  onOpenPost,
}) {
  const [activeTab, setActiveTab] = useState('home');

  const featuredPost = posts && posts.length > 0 ? posts[0] : null;
  const gridPosts = posts && posts.length > 1 ? posts.slice(1) : posts;

  return (
    <div className="min-h-screen bg-[#F5F0EB] dark:bg-[#120907] text-[#1A1A1A] dark:text-[#F5F0EB] antialiased selection:bg-[#FF6B35]/20 selection:text-[#FF6B35]">
      {/* Max-width container for desktop panoramic layout */}
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

          {/* Feed Content */}
          <div className="flex-1 px-8 py-6 flex flex-col gap-7 overflow-y-auto">
            {/* Horizontal Stories Row */}
            <DesktopStoriesRow
              stories={stories}
              onStoryClick={onStoryClick}
              onAddStory={onAddStory}
            />

            {/* Featured Hero Moment + Stacked Moments */}
            <DesktopHeroSection
              featuredPost={featuredPost}
              onOpenPost={onOpenPost}
            />

            {/* Post Feed Grid with Tabs */}
            <DesktopPostGrid
              posts={gridPosts}
              onOpenPost={onOpenPost}
            />

            {/* End of Feed subtle signature */}
            <div className="py-8 text-center flex flex-col items-center justify-center gap-2 text-black/30 dark:text-white/30">
              <div className="w-12 h-1 rounded-full bg-black/10 dark:bg-white/10" />
              <p className="text-xs font-medium tracking-wide">
                You're all caught up with your circle's moments ✨
              </p>
              <p className="font-script text-lg text-[#FF6B35]/60">
                More moments await tomorrow
              </p>
            </div>
          </div>
        </main>

        {/* Right Sidebar: Profile, Messages & Insights */}
        <DesktopRightSidebar currentUser={currentUser} />

      </div>
    </div>
  );
}
