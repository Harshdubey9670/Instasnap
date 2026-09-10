import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Grid, 
  Bookmark, 
  PlaySquare, 
  Settings, 
  Link as LinkIcon, 
  Lock, 
  Archive, 
  Pin, 
  MoreHorizontal,
  Tag,
  Music2,
  Send,
  Plus
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { EditProfileModal } from '../../components/profile/EditProfileModal';
import { FollowButton } from '../../components/profile/FollowButton';
import { UserOptionsModal } from '../../components/profile/UserOptionsModal';
import { StoryHighlightsRow } from '../../components/profile/StoryHighlightsRow';
import { trackEvent } from '../../utils/analytics';
import { cn } from '../../utils/cn';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: authUser } = useSelector((state) => state.auth);
  
  const targetUserId = id || authUser?._id;
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); 
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isNavigatingToChat, setIsNavigatingToChat] = useState(false);

  const handleChat = async () => {
    if (!profile) return;
    try {
      setIsNavigatingToChat(true);
      const res = await api.post('/api/conversations', { userId: profile._id });
      if (res.data.success) {
        navigate(`/app/chat/${res.data.data._id}`);
      }
    } catch (error) {
      console.error(error);
      showToast('error', 'Error', 'Failed to start conversation');
    } finally {
      setIsNavigatingToChat(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetUserId) return;
      setLoading(true);
      try {
        const response = await api.get(`/api/users/${targetUserId}`);
        if (response.data.success) {
          const profileData = response.data.data;
          setProfile(profileData);
          if (profileData._id !== authUser?._id) {
            trackEvent('profile_visit', profileData._id, { username: profileData.username });
          }
        }
      } catch (error) {
        showToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };

    const fetchPosts = async () => {
      if (!targetUserId) return;
      setLoadingPosts(true);
      try {
        let endpoint = `/api/posts/user/${targetUserId}?status=${activeTab === 'archive' ? 'archived' : 'published'}`;
        if (activeTab === 'saved') {
          endpoint = `/api/users/saved-posts`;
        }

        const response = await api.get(endpoint);
        if (response.data.success) {
          const fetchedData = response.data.data.posts || response.data.data || [];
          setPosts(fetchedData);
        }
      } catch (error) {
        console.error('Failed to load posts for profile tab', error);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchProfile();
    fetchPosts();

    const savedPos = sessionStorage.getItem('profile_scroll_pos');
    if (savedPos) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPos, 10));
      }, 200);
    }

    const handlePostCreated = () => {
      fetchPosts();
    };
    
    window.addEventListener('postCreated', handlePostCreated);
    return () => window.removeEventListener('postCreated', handlePostCreated);
  }, [targetUserId, authUser, activeTab, showToast]);

  const handleProfileUpdated = (updatedData) => {
    setProfile(prev => ({ ...prev, ...updatedData }));
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto pt-8 animate-pulse px-4 space-y-8">
        <div className="flex gap-12 items-center">
          <div className="w-36 h-36 rounded-full bg-neutral-800 shrink-0" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-neutral-800 rounded w-1/3" />
            <div className="flex gap-8">
              <div className="h-4 bg-neutral-800 rounded w-16" />
              <div className="h-4 bg-neutral-800 rounded w-16" />
              <div className="h-4 bg-neutral-800 rounded w-16" />
            </div>
            <div className="h-4 bg-neutral-800 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center mt-20 text-neutral-400">Profile not found.</div>;
  }

  const isOwner = String(profile._id) === String(authUser?._id);
  const isFollowing = (authUser?.following || []).some(
    id => (typeof id === 'string' ? id : id?._id || id)?.toString() === profile._id?.toString()
  );
  const isLocked = profile.isPrivate && !isOwner && !isFollowing;

  const tabs = [
    { id: 'posts', label: 'POSTS', icon: Grid },
    { id: 'reels', label: 'REELS', icon: PlaySquare },
    { id: 'tagged', label: 'TAGGED', icon: Tag },
  ];

  if (isOwner) {
    tabs.push({ id: 'saved', label: 'SAVED', icon: Bookmark });
    tabs.push({ id: 'archive', label: 'ARCHIVE', icon: Archive });
  }

  const displayedPosts = posts.filter(post => {
    if (activeTab === 'reels') return post.media?.[0]?.type === 'video';
    return true; 
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto pt-6 md:pt-10 pb-24 px-4 text-text-primary">
      
      {/* Instagram Header Layout (Matching Screenshot) */}
      <div className="flex flex-col items-center mb-6 w-full max-w-lg mx-auto">
        
        {/* Profile Music Note Badge (if present) */}
        {profile.music && (
          <div className="mb-3 px-3 py-1 bg-neutral-800/90 backdrop-blur-md rounded-full border border-neutral-700 text-[11px] font-semibold text-neutral-200 flex items-center gap-1.5 shadow-md">
            <Music2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="truncate max-w-[120px]">{profile.music.title || 'Let Me Love You'}</span>
          </div>
        )}

        {/* Centered Circular Avatar with Perfect Cover Fit (No Black Crescent) */}
        <div className="relative group cursor-pointer mb-4" onClick={() => isOwner && setIsEditModalOpen(true)}>
          <div className="w-32 h-32 md:w-36 md:h-36 rounded-full border-2 border-neutral-300 dark:border-neutral-700 overflow-hidden bg-neutral-900 shadow-xl flex items-center justify-center">
            {profile.avatar || profile.profilePicture ? (
              <img
                src={profile.avatar || profile.profilePicture}
                alt={profile.username}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 font-bold text-3xl">
                {profile.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
        </div>

        {/* Username & Verification Badge */}
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-xl md:text-2xl font-bold text-text-primary text-center">
            {profile.username}
          </h1>
          {profile.isVerified && <img src="/verified-badge.png" className="w-5 h-5 inline-block" alt="Verified" />}
          {profile.isPrivate && <Lock className="w-4 h-4 text-text-secondary inline-block" />}
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2.5 mb-5 flex-wrap justify-center w-full">
          {isOwner ? (
            <>
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="px-5 py-1.5 bg-bg-surface border border-border-soft hover:bg-bg-surface-hover text-text-primary text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                Edit profile
              </button>

              <button 
                onClick={() => navigate('/app/archive')}
                className="px-5 py-1.5 bg-bg-surface border border-border-soft hover:bg-bg-surface-hover text-text-primary text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                View archive
              </button>

              <button 
                onClick={() => navigate('/app/settings')}
                className="p-2 bg-bg-surface border border-border-soft hover:bg-bg-surface-hover text-text-primary rounded-lg transition-colors shadow-sm"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <FollowButton 
                userId={profile._id} 
                targetUser={profile}
                onToggle={({ isFollowing }) => {
                  setProfile(prev => {
                    if (!prev) return prev;
                    const authIdStr = authUser?._id?.toString();
                    const currentFollowers = prev.followers || [];
                    const exists = currentFollowers.some(
                      id => (typeof id === 'string' ? id : id?._id || id)?.toString() === authIdStr
                    );
                    let newFollowers = [...currentFollowers];
                    if (isFollowing && !exists) {
                      newFollowers.push(authUser._id);
                    } else if (!isFollowing) {
                      newFollowers = newFollowers.filter(
                        id => (typeof id === 'string' ? id : id?._id || id)?.toString() !== authIdStr
                      );
                    }
                    return { ...prev, followers: newFollowers };
                  });
                }} 
              />

              <button 
                onClick={handleChat}
                disabled={isNavigatingToChat}
                className="px-5 py-1.5 bg-bg-surface border border-border-soft hover:bg-bg-surface-hover text-text-primary text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
              >
                Message
              </button>

              <button 
                onClick={() => setIsOptionsModalOpen(true)} 
                className="p-2 bg-bg-surface border border-border-soft hover:bg-bg-surface-hover text-text-primary rounded-lg transition-colors shadow-sm"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Stats Row with Horizontal Dividers Top & Bottom */}
        <div className="flex items-center justify-around w-full py-3.5 border-y border-border-soft mb-4">
          <div className="text-center text-sm">
            <span className="font-bold text-text-primary mr-1.5">{posts.length}</span>
            <span className="text-text-secondary">posts</span>
          </div>
          <Link to={`/app/profile/${profile._id}/followers`} className="text-center text-sm hover:opacity-80 transition-opacity">
            <span className="font-bold text-text-primary mr-1.5">{profile.followers?.length || 0}</span>
            <span className="text-text-secondary">followers</span>
          </Link>
          <Link to={`/app/profile/${profile._id}/following`} className="text-center text-sm hover:opacity-80 transition-opacity">
            <span className="font-bold text-text-primary mr-1.5">{profile.following?.length || 0}</span>
            <span className="text-text-secondary">following</span>
          </Link>
        </div>

        {/* Centered Full Name & Bio Details */}
        <div className="text-center w-full space-y-1 mb-2">
          <h2 className="font-bold text-text-primary text-base md:text-lg">
            {profile.fullName || profile.username}
            {profile.pronouns && <span className="text-text-secondary font-normal text-sm ml-2">{profile.pronouns}</span>}
          </h2>

          {profile.category && <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">{profile.category}</p>}
          {profile.bio && <p className="text-text-primary text-sm whitespace-pre-wrap leading-relaxed max-w-md mx-auto">{profile.bio}</p>}
          
          {profile.website && (
            <a 
              href={profile.website} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1.5 text-sky-400 font-semibold hover:underline text-sm mt-1"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>@{profile.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
        </div>
      </div>

      {/* Story Highlights Horizontal Row */}
      <div className="mb-8 px-2">
        <StoryHighlightsRow userId={profile._id} isOwnProfile={isOwner} />
      </div>

      {/* Profile Tabs (Instagram Top Border Active Indicator) */}
      {!isLocked && (
        <div className="border-t border-border-soft">
          <div className="flex justify-center gap-12">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 py-4 text-xs font-bold tracking-widest uppercase transition-all relative border-t-2 -mt-[1px]",
                    isActive 
                      ? 'border-text-primary text-text-primary' 
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Posts Grid */}
          <div className="mt-4">
            {loadingPosts ? (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-square bg-neutral-900 animate-pulse rounded" />
                ))}
              </div>
            ) : displayedPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {displayedPosts.map(post => (
                  <Link 
                    key={post._id} 
                    to={`/app/post/${post._id}`} 
                    state={{ source: 'profile', userId: targetUserId }}
                    onClick={() => sessionStorage.setItem('profile_scroll_pos', window.scrollY.toString())}
                    className="aspect-square bg-neutral-900 relative overflow-hidden group cursor-pointer block"
                  >
                    {post.media && post.media.length > 0 && post.media[0].type === 'image' ? (
                      <img src={post.media[0].url} alt="Post" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : post.media && post.media.length > 0 && post.media[0].type === 'video' ? (
                      <video src={post.media[0].url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-400">No media</div>
                    )}
                    
                    {post.isPinned && (
                      <div className="absolute top-2 right-2 text-white bg-black/50 p-1 rounded-full backdrop-blur-sm z-10">
                        <Pin className="w-3.5 h-3.5 fill-white" />
                      </div>
                    )}
                    
                    {post.media && post.media.length > 1 && !post.isPinned && (
                      <div className="absolute top-2 right-2 text-white bg-black/50 p-1 rounded-full backdrop-blur-sm z-10">
                        <Grid className="w-3.5 h-3.5 fill-white" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 z-20">
                      <div className="flex items-center gap-2 text-white font-bold">
                        <Heart className="w-5 h-5 fill-white" />
                        <span>{post.settings?.hideLikes ? '-' : (post.likes?.length || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white font-bold">
                        <MessageCircle className="w-5 h-5 fill-white" />
                        <span>{post.comments?.length || 0}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-neutral-400">
                <Grid className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-semibold text-white">No posts yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Messages Pill Button (Screenshot 3 - Bottom Right) */}
      <button
        onClick={() => navigate('/app/chat')}
        className="fixed bottom-6 right-6 z-40 bg-bg-surface hover:bg-bg-surface-hover border border-border-soft text-text-primary px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-3 transition-transform hover:scale-105"
      >
        <Send className="w-4 h-4 text-sky-400" />
        <span className="font-semibold text-sm">Messages</span>
        <div className="flex -space-x-2">
          <div className="w-6 h-6 rounded-full border-2 border-black bg-rose-500 flex items-center justify-center text-[10px] font-bold">
            S
          </div>
          <div className="w-6 h-6 rounded-full border-2 border-black bg-purple-500 flex items-center justify-center text-[10px] font-bold">
            A
          </div>
        </div>
      </button>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        user={profile}
        onProfileUpdated={handleProfileUpdated}
      />
      
      {profile && (
        <UserOptionsModal 
          isOpen={isOptionsModalOpen}
          onClose={() => setIsOptionsModalOpen(false)}
          user={profile}
          onActionComplete={() => {}}
        />
      )}
    </motion.div>
  );
};

export default ProfilePage;

