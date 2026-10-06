import React, { useState } from 'react';
import {
  Settings,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  CheckCheck
} from 'lucide-react';

export default function DesktopRightSidebar({ currentUser }) {
  const [selectedMessage, setSelectedMessage] = useState(null);

  const user = currentUser || {
    name: 'Alex Park',
    username: 'alex.park',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    posts: '184',
    followers: '12.4K',
    following: '356',
    bio: 'Capturing little moments of a brighter tomorrow. ✨'
  };

  const messages = [
    {
      id: 1,
      name: 'Minji Kim',
      handle: 'minji',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      lastMessage: 'Loved your recent sunset photos! 😍',
      time: '2m ago',
      unread: true,
      online: true,
    },
    {
      id: 2,
      name: 'Lucas Vance',
      handle: 'lucas',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      lastMessage: 'Are we still shooting tomorrow afternoon?',
      time: '1h ago',
      unread: false,
      online: true,
    },
    {
      id: 3,
      name: 'Hye Park',
      handle: 'hyepark',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      lastMessage: 'Sent you the golden hour Lightroom preset 🎨',
      time: '3h ago',
      unread: false,
      online: false,
    },
    {
      id: 4,
      name: 'Jisoo Lee',
      handle: 'jisoo',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
      lastMessage: "Can't wait to catch up over coffee this weekend!",
      time: 'Yesterday',
      unread: false,
      online: false,
    },
  ];

  return (
    <aside className="w-80 flex-shrink-0 flex flex-col gap-5 py-6 pr-6 overflow-y-auto select-none">
      
      {/* 1. Profile Summary Card */}
      <div className="bg-white dark:bg-[#1E1210] rounded-[26px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-black/[0.04] dark:border-white/[0.06] transition-all hover:shadow-[0_8px_30px_rgba(255,107,53,0.07)]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[12px] font-bold uppercase tracking-wider text-black/40 dark:text-white/40">
            Account Profile
          </span>
          <button
            aria-label="Settings"
            className="w-8 h-8 rounded-full flex items-center justify-center text-black/50 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* User Info */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full p-[2.5px] bg-gradient-to-tr from-[#FF6B35] to-[#FFB347] shadow-[0_4px_16px_rgba(255,107,53,0.25)]">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full rounded-full object-cover bg-white dark:bg-[#1E1210] p-[2px]"
              />
            </div>
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1E1210]" />
          </div>

          <h3 className="text-base font-bold text-[#1A1A1A] dark:text-[#F5F0EB]">
            {user.name}
          </h3>
          <p className="text-xs text-black/45 dark:text-white/45 font-medium mt-0.5">
            @{user.username}
          </p>

          {/* Stats Bar */}
          <div className="w-full grid grid-cols-3 gap-2 mt-4 py-3 px-2 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.03] border border-black/[0.03] dark:border-white/[0.04]">
            <div className="text-center">
              <span className="block text-sm font-extrabold text-[#1A1A1A] dark:text-[#F5F0EB]">
                {user.posts}
              </span>
              <span className="text-[11px] font-medium text-black/45 dark:text-white/45">
                Posts
              </span>
            </div>
            <div className="text-center border-x border-black/[0.06] dark:border-white/[0.06]">
              <span className="block text-sm font-extrabold text-[#1A1A1A] dark:text-[#F5F0EB]">
                {user.followers}
              </span>
              <span className="text-[11px] font-medium text-black/45 dark:text-white/45">
                Followers
              </span>
            </div>
            <div className="text-center">
              <span className="block text-sm font-extrabold text-[#1A1A1A] dark:text-[#F5F0EB]">
                {user.following}
              </span>
              <span className="text-[11px] font-medium text-black/45 dark:text-white/45">
                Following
              </span>
            </div>
          </div>

          {/* Bio Quote Card */}
          <div className="w-full mt-3 p-3 rounded-2xl bg-gradient-to-r from-[#FF6B35]/[0.06] to-[#FF9F1C]/[0.08] dark:from-[#FF6B35]/10 dark:to-transparent border border-[#FF6B35]/15 text-left">
            <p className="text-xs text-black/70 dark:text-white/75 italic leading-relaxed">
              "{user.bio}"
            </p>
          </div>
        </div>
      </div>

      {/* 2. Messages Card */}
      <div className="bg-white dark:bg-[#1E1210] rounded-[26px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-black/[0.04] dark:border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#FF6B35]" />
            <h3 className="text-sm font-bold text-[#1A1A1A] dark:text-[#F5F0EB]">
              Messages
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-[#FF6B35]/10 text-[#FF6B35]">
              1 new
            </span>
          </div>
          <button className="text-xs font-semibold text-[#FF6B35] hover:text-[#E85D26] flex items-center gap-0.5 group">
            See All
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Message items */}
        <div className="flex flex-col gap-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => setSelectedMessage(msg.id)}
              className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all ${
                selectedMessage === msg.id
                  ? 'bg-[#FF6B35]/10 dark:bg-[#FF6B35]/20'
                  : 'hover:bg-[#FBF8F5] dark:hover:bg-white/[0.03]'
              }`}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={msg.avatar}
                  alt={msg.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                {msg.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#1E1210]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className={`text-xs font-bold truncate ${msg.unread ? 'text-[#1A1A1A] dark:text-white' : 'text-black/80 dark:text-white/80'}`}>
                    {msg.name}
                  </h4>
                  <span className="text-[10px] text-black/40 dark:text-white/40 font-medium">
                    {msg.time}
                  </span>
                </div>
                <p className={`text-[11px] truncate ${msg.unread ? 'font-semibold text-[#FF6B35]' : 'text-black/50 dark:text-white/50'}`}>
                  {msg.lastMessage}
                </p>
              </div>

              {msg.unread && (
                <span className="w-2 h-2 rounded-full bg-[#FF6B35] flex-shrink-0 animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Insights & Analytics Card */}
      <div className="bg-white dark:bg-[#1E1210] rounded-[26px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-black/[0.04] dark:border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FF6B35]" />
            <h3 className="text-sm font-bold text-[#1A1A1A] dark:text-[#F5F0EB]">
              Insights
            </h3>
          </div>
          <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-[#FBF8F5] dark:bg-white/5 text-black/60 dark:text-white/60 border border-black/[0.04]">
            Last 7 days ▾
          </span>
        </div>

        {/* 3 Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2.5 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.03] border border-black/[0.03]">
            <span className="text-[10px] font-medium text-black/45 dark:text-white/45 block">
              Views
            </span>
            <span className="text-sm font-black text-[#1A1A1A] dark:text-white block mt-0.5">
              240K
            </span>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              <ArrowUpRight className="w-3 h-3" /> +12%
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.03] border border-black/[0.03]">
            <span className="text-[10px] font-medium text-black/45 dark:text-white/45 block">
              Likes
            </span>
            <span className="text-sm font-black text-[#1A1A1A] dark:text-white block mt-0.5">
              18.9K
            </span>
            <span className="inline-flex items-center text-[10px] font-bold text-[#FF6B35] mt-1">
              <ArrowUpRight className="w-3 h-3" /> +24%
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.03] border border-black/[0.03]">
            <span className="text-[10px] font-medium text-black/45 dark:text-white/45 block">
              Growth
            </span>
            <span className="text-sm font-black text-[#1A1A1A] dark:text-white block mt-0.5">
              +2.4K
            </span>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              <ArrowUpRight className="w-3 h-3" /> +16%
            </span>
          </div>
        </div>

        {/* Orange Sparkline Area Chart */}
        <div className="relative pt-2 pb-1">
          <svg
            viewBox="0 0 280 80"
            className="w-full h-20 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.35" />
                <stop offset="60%" stopColor="#FF9F1C" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gradient Fill */}
            <path
              d="M 0 65 Q 40 45, 70 52 T 140 25 T 210 38 T 280 10 L 280 80 L 0 80 Z"
              fill="url(#sparklineGrad)"
            />

            {/* Stroke Line */}
            <path
              d="M 0 65 Q 40 45, 70 52 T 140 25 T 210 38 T 280 10"
              fill="none"
              stroke="#FF6B35"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Active Peak Dot */}
            <circle cx="280" cy="10" r="4.5" fill="#FF6B35" className="animate-pulse" />
            <circle cx="280" cy="10" r="8" fill="#FF6B35" opacity="0.25" />
          </svg>

          {/* Days axis */}
          <div className="flex justify-between items-center text-[10px] text-black/40 dark:text-white/40 font-semibold mt-1 px-1">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span className="text-[#FF6B35] font-bold">Sun</span>
          </div>
        </div>

        {/* Tip Pill Card */}
        <div className="mt-4 p-3 rounded-2xl bg-[#FFF8F3] dark:bg-[#FF6B35]/10 border border-[#FF6B35]/15 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#FF6B35] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-[#1A1A1A] dark:text-[#F5F0EB] leading-snug">
              Keep going! Your content is reaching <span className="text-[#FF6B35] font-bold">32% more</span> people this week.
            </p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-black/40 dark:text-white/40 flex-shrink-0 self-center" />
        </div>
      </div>

    </aside>
  );
}
