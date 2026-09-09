import React from 'react';

export const NotificationFilterTabs = ({
  activeTab,
  setActiveTab
}) => {
  const tabs = [
    { id: 'all', label: 'All Activity' },
    { id: 'mentions', label: 'Mentions' },
    { id: 'likes', label: 'Likes' },
    { id: 'comments', label: 'Comments' },
    { id: 'follows', label: 'Follows' }
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 pb-4">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === tab.id 
              ? "bg-white text-black shadow-md" 
              : "bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
