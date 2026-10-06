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
  ChevronDown,
  BadgeCheck,
  MapPin,
  Briefcase,
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { EditProfileModal } from '../../components/profile/EditProfileModal';
import { FollowButton } from '../../components/profile/FollowButton';
import { UserOptionsModal } from '../../components/profile/UserOptionsModal';
import { StoryHighlightsRow } from '../../components/profile/StoryHighlightsRow';
import { AccountSwitcherModal } from '../../components/profile/AccountSwitcherModal';
import { ProfileAboutCard } from '../../components/profile/ProfileAboutCard';
import { InterestsCard } from '../../components/profile/InterestsCard';
import { RecentActivityCard } from '../../components/profile/RecentActivityCard';
import { StoryViewer } from '../../components/feed/StoryViewer';
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
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isNavigatingToChat, setIsNavigatingToChat] = useState(false);

  // Story ring — real "has an active story" state, reusing the same feed
  // endpoint and StoryViewer the rest of the app uses (not a fake decoration).
  const [activeStories, setActiveStories] = useState([]);
  const [viewingStoryIndex, setViewingStoryIndex] = useState(null);

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

  // Fetch the real active-story feed once to know whether to show a gradient
  // "story ring" around the avatar (and to let clicking it open the story).
  useEffect(() => {
    api.get('/api/stories')
      .then((res) => { if (res.data.success) setActiveStories(res.data.data || []); })
      .catch(() => {});
  }, []);

  // Live-sync follower count when any FollowButton changes state
  useEffect(() => {
    const handleFollowUpdated = (e) => {
      if (!profile) return;
      const { userId, status } = e.detail;
      if (String(userId) !== String(profile._id)) return;

      setProfile(prev => {
        if (!prev) return prev;
        const authIdStr = authUser?._id?.toString();
        const currentFollowers = prev.followers || [];
        const exists = currentFollowers.some(
          id => (typeof id === 'string' ? id : id?._id || id)?.toString() === authIdStr
        );
        let newFollowers = [...currentFollowers];
        if (status === 'following' && !exists) {
          newFollowers.push(authUser._id);
        } else if (status !== 'following') {
          newFollowers = newFollowers.filter(
            id => (typeof id === 'string' ? id : id?._id || id)?.toString() !== authIdStr
          );
        }
        return { ...prev, followers: newFollowers };
      });
    };
    window.addEventListener('user_follow_updated', handleFollowUpdated);
    return () => window.removeEventListener('user_follow_updated', handleFollowUpdated);
  }, [profile, authUser]);

  const handleProfileUpdated = (updatedData) => {
    setProfile(prev => ({ ...prev, ...updatedData }));
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto pt-8 animate-pulse px-4 space-y-8">
        <div className="warm-card p-6 flex gap-8 items-center">
          <div className="w-32 h-32 rounded-full bg-bg-surface-hover shrink-0" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-bg-surface-hover rounded w-1/3" />
            <div className="flex gap-8">
              <div className="h-4 bg-bg-surface-hover rounded w-16" />
              <div className="h-4 bg-bg-surface-hover rounded w-16" />
              <div className="h-4 bg-bg-surface-hover rounded w-16" />
            </div>
            <div className="h-4 bg-bg-surface-hover rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center mt-20 text-text-secondary">Profile not found.</div>;
  }

  const isOwner = String(profile._id) === String(authUser?._id);
  const isFollowing = (authUser?.following || []).some(
    id => (typeof id === 'string' ? id : id?._id || id)?.toString() === profile._id?.toString()
  );
  const isLocked = profile.isPrivate && !isOwner && !isFollowing;

  const storyGroupIndex = activeStories.findIndex(
    g => (g.user?._id || g.user)?.toString() === profile._id?.toString()
  );
  const hasStory = storyGroupIndex !== -1;
  const storySeen = hasStory && activeStories[storyGroupIndex].stories.every(
    s => s.viewers?.some(v => (typeof v === 'string' ? v : v._id) === authUser?._id)
  );

  const tabs = [
    { id: 'posts', label: 'Posts', icon: Grid },
    { id: 'reels', label: 'Reels', icon: PlaySquare },
    { id: 'tagged', label: 'Tagged', icon: Tag },
  ];

  if (isOwner) {
    tabs.push({ id: 'saved', label: 'Saved', icon: Bookmark });
    tabs.push({ id: 'archive', label: 'Archive', icon: Archive });
  }

  const displayedPosts = posts.filter(post => {
    if (activeTab === 'reels') return post.media?.[0]?.type === 'video';
    return true;
  });

  const infoLine = [profile.location, profile.category].filter(Boolean);

  // ── Shared sub-sections ────────────────────────────────────────────────────

  const AvatarSection = ({ size = 'default' }) => {
    const ringClass = hasStory
      ? (storySeen ? 'bg-black/15 dark:bg-border-strong p-[2px]' : 'bg-gradient-to-tr from-[#FF6B35] via-[#FF8C5A] to-[#FFB347] p-[3px]')
      : 'border-2 border-border-soft p-0';

    return (
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => (hasStory ? setViewingStoryIndex(storyGroupIndex) : isOwner && setIsEditModalOpen(true))}
          className={cn(
            'rounded-full overflow-hidden bg-bg-surface-hover shadow-xl flex items-center justify-center transition-transform hover:scale-[1.02]',
            size === 'default' ? 'w-32 h-32 md:w-36 md:h-36' : 'w-28 h-28',
            ringClass
          )}
          aria-label={hasStory ? "View story" : isOwner ? "Edit profile photo" : "Profile photo"}
        >
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-bg-base bg-bg-surface-hover flex items-center justify-center">
            {profile.avatar || profile.profilePicture ? (
              <img
                src={profile.avatar || profile.profilePicture}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-text-secondary font-bold text-3xl">
                {profile.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
        </button>
        {isOwner && (
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center border-2 border-bg-surface shadow-md hover:scale-110 transition-transform"
            aria-label="Edit profile photo"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  const UsernameBadges = ({ align = 'center' }) => (
    <div className={cn('flex items-center gap-2', align === 'center' ? 'justify-center' : 'justify-start')}>
      <h1 className="text-xl md:text-2xl font-bold text-text-primary">
        {profile.username}
      </h1>
      {profile.isVerified && (
        <BadgeCheck className="w-5 h-5 text-primary-500 fill-primary-500/20 shrink-0" />
      )}
      {profile.isPrivate && (
        <Lock className="w-4 h-4 text-text-secondary shrink-0" />
      )}
    </div>
  );

  const BioDetails = ({ align = 'center' }) => (
    <div className={cn('w-full space-y-1.5', align === 'center' ? 'text-center' : 'text-left')}>
      <h2 className="font-bold text-text-primary text-base md:text-lg">
        {profile.fullName || profile.username}
        {profile.pronouns && (
          <span className="text-text-secondary font-normal text-sm ml-2">{profile.pronouns}</span>
        )}
      </h2>
      {profile.bio && (
        <p className={cn('text-text-primary text-sm whitespace-pre-wrap leading-relaxed max-w-md', align === 'center' && 'mx-auto')}>
          {profile.bio}
        </p>
      )}
      {(infoLine.length > 0 || profile.website) && (
        <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary', align === 'center' && 'justify-center')}>
          {profile.location && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary-400" /> {profile.location}</span>
          )}
          {profile.category && (
            <>
              {profile.location && <span>·</span>}
              <span className="flex items-center gap-1"><Briefcase className="w-3 h-3 text-primary-400" /> {profile.category}</span>
            </>
          )}
          {profile.website && (
            <>
              {infoLine.length > 0 && <span>·</span>}
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary-500 font-semibold hover:underline"
              >
                <LinkIcon className="w-3 h-3" />
                <span>{profile.website.replace(/^https?:\/\//, '')}</span>
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );

  const StatsBar = ({ align = 'center' }) => (
    <div className={cn('flex items-center gap-6 py-3.5', align === 'center' ? 'justify-around w-full border-y border-border-soft' : 'justify-start')}>
      <div className="text-center text-sm">
        <span className="font-bold text-text-primary mr-1.5">{posts.length}</span>
        <span className="text-text-secondary">Posts</span>
      </div>
      <Link
        to={`/app/profile/${profile._id}/followers`}
        className="text-center text-sm hover:opacity-80 transition-opacity"
      >
        <span className="font-bold text-text-primary mr-1.5">{profile.followers?.length || 0}</span>
        <span className="text-text-secondary">Followers</span>
      </Link>
      <Link
        to={`/app/profile/${profile._id}/following`}
        className="text-center text-sm hover:opacity-80 transition-opacity"
      >
        <span className="font-bold text-text-primary mr-1.5">{profile.following?.length || 0}</span>
        <span className="text-text-secondary">Following</span>
      </Link>
    </div>
  );

  const pillBtn = "px-5 py-1.5 bg-bg-surface border border-border-soft hover:bg-bg-surface-hover text-text-primary text-sm font-semibold rounded-full transition-colors shadow-sm";
  const iconBtn = "p-2 bg-bg-surface border border-border-soft hover:bg-bg-surface-hover text-text-primary rounded-full transition-colors shadow-sm";

  const ActionButtons = ({ justify = 'center' }) => (
    <div className={cn('flex items-center gap-2.5 flex-wrap', justify === 'center' ? 'justify-center w-full' : 'justify-start')}>
      {isOwner ? (
        <>
          <button onClick={() => setIsEditModalOpen(true)} className={pillBtn}>
            Edit Profile
          </button>
          <button onClick={() => navigate('/app/settings')} className={iconBtn} aria-label="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          <FollowButton
            userId={profile._id}
            targetUser={profile}
            onToggle={({ isFollowing: nowFollowing }) => {
              setProfile(prev => {
                if (!prev) return prev;
                const authIdStr = authUser?._id?.toString();
                const currentFollowers = prev.followers || [];
                const exists = currentFollowers.some(
                  id => (typeof id === 'string' ? id : id?._id || id)?.toString() === authIdStr
                );
                let newFollowers = [...currentFollowers];
                if (nowFollowing && !exists) {
                  newFollowers.push(authUser._id);
                } else if (!nowFollowing) {
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
            className={cn(pillBtn, 'disabled:opacity-50')}
          >
            Message
          </button>
          <button
            onClick={() => setIsOptionsModalOpen(true)}
            className={iconBtn}
            aria-label="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[1400px] mx-auto pt-4 md:pt-6 pb-24 px-3 sm:px-4 text-text-primary"
    >
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6 lg:items-start">
        <div className="min-w-0">

          {/* ── Profile header card ── */}
          <div className="warm-card p-5 sm:p-6 mb-6">
            {/* Mobile top bar (own profile) */}
            {isOwner && (
              <div className="flex items-center justify-between w-full mb-4 md:hidden">
                <button
                  onClick={() => setIsAccountSwitcherOpen(true)}
                  className="flex items-center gap-1.5 text-text-primary font-bold text-lg hover:opacity-75 transition-opacity"
                  aria-label="Switch account"
                >
                  <span>{profile.username}</span>
                  <ChevronDown className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/app/settings')}
                  className="p-2 hover:bg-bg-surface-hover rounded-lg transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="w-5 h-5 text-text-primary" />
                </button>
              </div>
            )}

            {profile.music && (
              <div className="mb-3 mx-auto md:mx-0 w-fit px-3 py-1 bg-bg-surface-hover border border-border-soft rounded-full text-[11px] font-semibold text-text-primary flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5 text-primary-500" />
                <span className="truncate max-w-[140px]">{profile.music.title || 'Let Me Love You'}</span>
              </div>
            )}

            {/* Mobile: stacked & centered */}
            <div className="flex flex-col items-center md:hidden">
              <AvatarSection />
              {!isOwner && <div className="mt-4 mb-1"><UsernameBadges /></div>}
              <div className="mt-3"><BioDetails /></div>
              <div className="mt-4 w-full"><StatsBar /></div>
              <div className="mt-4"><ActionButtons /></div>
            </div>

            {/* Desktop: avatar left, info right */}
            <div className="hidden md:flex items-start gap-8">
              <AvatarSection />
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <UsernameBadges align="left" />
                  <ActionButtons justify="start" />
                </div>
                <div className="mt-3"><BioDetails align="left" /></div>
                <div className="mt-4"><StatsBar align="start" /></div>
              </div>
            </div>
          </div>

          {/* Story Highlights */}
          <div className="mb-6">
            <StoryHighlightsRow userId={profile._id} isOwnProfile={isOwner} />
          </div>

          {/* Tabs + Content */}
          {isLocked ? (
            <div className="warm-card p-10 text-center">
              <Lock className="w-10 h-10 mx-auto mb-3 text-text-secondary" />
              <p className="font-bold text-text-primary">This account is private</p>
              <p className="text-sm text-text-secondary mt-1">Follow @{profile.username} to see their posts and reels.</p>
            </div>
          ) : (
            <div className="warm-card overflow-hidden">
              <div className="flex justify-center gap-1.5 p-2 flex-wrap">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all',
                        isActive
                          ? 'bg-primary-500 text-white shadow-soft'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-1.5 sm:p-3">
                {loadingPosts ? (
                  <div className="grid grid-cols-3 gap-1 sm:gap-2">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="aspect-square bg-bg-surface-hover animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : displayedPosts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1 sm:gap-2">
                    {displayedPosts.map(post => (
                      <Link
                        key={post._id}
                        to={`/app/post/${post._id}`}
                        state={{ source: 'profile', userId: targetUserId }}
                        onClick={() => sessionStorage.setItem('profile_scroll_pos', window.scrollY.toString())}
                        className="aspect-square bg-bg-surface-hover relative overflow-hidden group cursor-pointer block rounded-lg"
                      >
                        {post.media && post.media.length > 0 && post.media[0].type === 'image' ? (
                          <img src={post.media[0].url} alt="Post" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : post.media && post.media.length > 0 && post.media[0].type === 'video' ? (
                          <video src={post.media[0].url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-secondary">No media</div>
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
                  <div className="py-20 text-center text-text-secondary">
                    <Grid className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-semibold text-text-primary">No {activeTab} yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar — desktop only */}
        <div className="hidden lg:flex flex-col gap-4">
          <ProfileAboutCard profile={profile} />
          <InterestsCard interests={profile.interests} />
          {isOwner && <RecentActivityCard />}
        </div>
      </div>

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

      <AccountSwitcherModal
        isOpen={isAccountSwitcherOpen}
        onClose={() => setIsAccountSwitcherOpen(false)}
      />

      {viewingStoryIndex !== null && (
        <StoryViewer
          stories={activeStories}
          initialUserIndex={viewingStoryIndex}
          onClose={() => setViewingStoryIndex(null)}
        />
      )}
    </motion.div>
  );
};

export default ProfilePage;
