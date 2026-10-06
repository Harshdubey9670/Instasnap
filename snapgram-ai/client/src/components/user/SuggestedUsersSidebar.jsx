import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Avatar } from '../ui/Avatar';
import { FollowButton } from '../profile/FollowButton';
import { AccountSwitcherModal } from '../profile/AccountSwitcherModal';
import { SpatialGlassCard } from '../ui/spatial/SpatialGlassCard';
import api from '../../services/api';

export const SuggestedUsersSidebar = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
  const { user: authUser } = useSelector(state => state.auth);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/api/users/suggested?limit=5');
        if (res.data.success) {
          setUsers(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch suggested users', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Listen for global follow events — re-render triggered automatically
  // since FollowButton handles its own state via the same event listener.
  // We only need to listen here if we want to filter out followed users.
  useEffect(() => {
    // No filtering for now — keep cards visible so users can unfollow if needed.
    const handleFollowUpdated = () => {};
    window.addEventListener('user_follow_updated', handleFollowUpdated);
    return () => window.removeEventListener('user_follow_updated', handleFollowUpdated);
  }, []);

  if (loading) return <div className="w-full h-40 rounded-[26px] bg-white/5 animate-pulse" />;

  return (
    <SpatialGlassCard variant="elevated" className="w-full p-5">
      {/* Current User Profile Mini */}
      {authUser && (
        <div className="flex items-center justify-between mb-6">
          <Link to="/app/profile" className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/20 bg-white/10">
              <Avatar
                src={authUser.profilePicture || authUser.avatar}
                fallback={authUser.username?.charAt(0)?.toUpperCase()}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-text-primary text-sm leading-tight truncate">
                {authUser.username}
              </span>
              <span className="text-text-secondary text-xs truncate">
                {authUser.fullName || authUser.category || 'SnapGram'}
              </span>
            </div>
          </Link>
          <button
          onClick={() => setIsAccountSwitcherOpen(true)}
            className="text-xs font-semibold text-primary-300 hover:text-primary-200 transition-colors ml-3 shrink-0"
            aria-label="Switch account"
          >
            Switch
          </button>
        </div>
      )}

      {/* Suggested Users List */}
      {users.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-secondary">Suggested for you</h3>
            <Link
              to="/app/explore"
              className="text-xs font-semibold text-text-primary hover:text-text-secondary transition-colors"
            >
              See All
            </Link>
          </div>
          <div className="space-y-4">
            {users.map(user => (
              <div key={user._id} className="flex items-center justify-between">
                <Link to={`/app/profile/${user._id}`} className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-white/15 bg-white/10">
                    <Avatar
                      src={user.profilePicture || user.avatar}
                      fallback={user.username?.charAt(0)?.toUpperCase()}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-text-primary text-sm truncate leading-tight">
                      {user.username}
                    </span>
                    <span className="text-xs text-text-secondary truncate">
                      {user.category || 'Suggested'}
                    </span>
                  </div>
                </Link>
                <div className="ml-3 shrink-0">
                  <FollowButton userId={user._id} targetUser={user} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Footer Links */}
      <div className="mt-8 text-[11px] text-text-secondary space-y-3">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <a href="#" className="hover:underline">About</a>
          <a href="#" className="hover:underline">Help</a>
          <a href="#" className="hover:underline">Press</a>
          <a href="#" className="hover:underline">API</a>
          <a href="#" className="hover:underline">Jobs</a>
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
        </div>
        <p>© 2026 NUVYELO AI</p>
      </div>

      {/* Account Switcher Modal */}
      <AccountSwitcherModal
        isOpen={isAccountSwitcherOpen}
        onClose={() => setIsAccountSwitcherOpen(false)}
      />
    </SpatialGlassCard>
  );
};
