import { useState, useEffect } from 'react';
import { Plus, X, Check } from 'lucide-react';
import api from '../../services/api';
import { StoryViewer } from '../feed/StoryViewer';

export const StoryHighlightsRow = ({ userId, isOwnProfile }) => {
  const [highlights, setHighlights] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [archivedStories, setArchivedStories] = useState([]);
  const [selectedStoryIds, setSelectedStoryIds] = useState([]);
  const [activeHighlight, setActiveHighlight] = useState(null);

  useEffect(() => {
    if (!userId) return;
    api.get(`/api/stories/highlights/${userId}`)
      .then((res) => setHighlights(res.data.data || []))
      .catch(() => console.error("Failed to load story highlights"));
  }, [userId]);

  const handleOpenCreateModal = async () => {
    setShowCreateModal(true);
    try {
      const res = await api.get('/api/stories/archive');
      setArchivedStories(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch archive");
    }
  };

  const handleCreateHighlight = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const selectedStories = archivedStories.filter(s => selectedStoryIds.includes(s._id));
      const coverImage = selectedStories[0]?.media?.[0]?.url || 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?q=80&w=400&auto=format&fit=crop';
      
      const res = await api.post('/api/stories/highlights', {
        title,
        coverImage,
        stories: selectedStoryIds.length > 0 ? selectedStoryIds : (archivedStories[0] ? [archivedStories[0]._id] : [])
      });
      setHighlights([...highlights, res.data.data]);
      setTitle('');
      setSelectedStoryIds([]);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create highlight', err);
    }
  };

  const toggleSelectStory = (id) => {
    setSelectedStoryIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="py-4 border-b border-border-soft space-y-3">
      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
        {/* Add New Highlight (Owner Only) */}
        {isOwnProfile && (
          <button
            onClick={handleOpenCreateModal}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-border-soft group-hover:border-primary-500 flex items-center justify-center bg-bg-surface transition-all">
              <Plus className="w-6 h-6 text-text-secondary group-hover:text-primary-500" />
            </div>
            <span className="text-xs font-semibold text-text-secondary">New</span>
          </button>
        )}

        {/* Existing Highlights */}
        {highlights.map((item) => (
          <div 
            key={item._id} 
            onClick={() => setActiveHighlight(item)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-primary-500 to-purple-500 group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full border-2 border-bg-base overflow-hidden">
                <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="text-xs font-semibold max-w-[70px] truncate">{item.title}</span>
          </div>
        ))}
      </div>

      {/* Story Viewer for Highlight */}
      {activeHighlight && (
        <StoryViewer
          stories={[{
            user: { _id: userId, username: activeHighlight.title },
            stories: activeHighlight.stories && activeHighlight.stories.length > 0 
              ? activeHighlight.stories 
              : [{ _id: 'hl-1', media: [{ url: activeHighlight.coverImage, type: 'image' }], createdAt: new Date() }]
          }]}
          initialUserIndex={0}
          onClose={() => setActiveHighlight(null)}
        />
      )}

      {/* Create Highlight Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface p-6 rounded-3xl border border-border-soft max-w-md w-full space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-text-primary">New Story Highlight</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHighlight} className="space-y-4 flex-1 flex flex-col min-h-0">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Highlight Name (e.g. Summer '26)"
                className="w-full p-3 bg-bg-base border border-border-soft rounded-xl text-sm outline-none text-text-primary"
                required
              />

              <label className="text-xs font-bold text-text-secondary">Select Stories from Archive:</label>
              
              <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-56 p-1 border border-border-soft rounded-xl bg-bg-base flex-1">
                {archivedStories.length === 0 ? (
                  <div className="col-span-3 py-6 text-center text-xs text-text-secondary">No archived stories found</div>
                ) : (
                  archivedStories.map((story) => {
                    const isSelected = selectedStoryIds.includes(story._id);
                    return (
                      <div
                        key={story._id}
                        onClick={() => toggleSelectStory(story._id)}
                        className={`aspect-[9/16] rounded-xl overflow-hidden relative cursor-pointer border-2 transition-all ${isSelected ? 'border-primary-500 scale-95' : 'border-transparent'}`}
                      >
                        <img src={story.media?.[0]?.url} alt="Archived" className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-primary-500 text-white rounded-full p-0.5 shadow-md">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm rounded-xl transition-all"
              >
                Create Highlight
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
