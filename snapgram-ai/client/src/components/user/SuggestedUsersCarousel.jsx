import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { FollowButton } from '../profile/FollowButton';
import api from '../../services/api';

export const SuggestedUsersCarousel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/api/users/suggested?limit=10');
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

  // Listen for follow events to remove a user once followed (optional UX polish)
  useEffect(() => {
    const handleFollowUpdated = (e) => {
      const { userId, status } = e.detail;
      // If user was followed (not just requested), keep them so the user can see "Following"
      // but re-render to reflect the new state. FollowButton handles its own state.
      // No removal needed — cards stay visible so the user can unfollow if desired.
    };
    window.addEventListener('user_follow_updated', handleFollowUpdated);
    return () => window.removeEventListener('user_follow_updated', handleFollowUpdated);
  }, []);

  if (loading || users.length === 0) return null;

  return (
    <div className="py-4 border-b border-border-soft mb-6 md:hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h3 className="text-sm font-semibold text-text-primary">Suggested for you</h3>
        <Link
          to="/app/explore"
          className="text-xs font-semibold text-primary-500 hover:text-primary-400 transition-colors"
        >
          See all
        </Link>
      </div>

      {/* Horizontal scrolling cards */}
      <div className="flex overflow-x-auto hide-scrollbar gap-3 px-4 pb-4">
        {users.map(user => (
          <div
            key={user._id}
            className="min-w-[140px] max-w-[140px] flex-shrink-0 glass-card border border-border-soft rounded-2xl py-4 px-3 flex flex-col items-center text-center gap-2 relative"
          >
            {/* Avatar — centered at top */}
            <Link to={`/app/profile/${user._id}`} tabIndex={-1}>
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-500/30 shadow-md flex-shrink-0 bg-bg-surface-hover">
                <Avatar
                  src={user.profilePicture || user.avatar}
                  fallback={user.username?.charAt(0)?.toUpperCase()}
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>

            {/* Username */}
            <Link
              to={`/app/profile/${user._id}`}
              className="flex flex-col items-center min-w-0 w-full"
            >
              <span className="font-semibold text-text-primary text-sm truncate w-full leading-tight">
                {user.username}
              </span>
              <span className="text-[11px] text-text-secondary truncate w-full mt-0.5 leading-tight">
                {user.category || 'Suggested'}
              </span>
            </Link>

            {/* Full-width Follow Button */}
            <div className="w-full mt-1">
              <FollowButton
                userId={user._id}
                targetUser={user}
                className="w-full h-8 text-xs font-semibold rounded-lg"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
