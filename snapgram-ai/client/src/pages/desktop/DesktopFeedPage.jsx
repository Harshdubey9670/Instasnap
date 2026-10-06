import React from 'react';
import { useSelector } from 'react-redux';
import DesktopHomeView from '../../components/desktop/DesktopHomeView';

export default function DesktopFeedPage() {
  const { user } = useSelector((state) => state.auth);

  const currentUser = user ? {
    name: user.fullName || user.username || 'Alex Park',
    username: user.username || 'alex.park',
    avatar: user.avatar || user.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    posts: user.postsCount || '184',
    followers: user.followersCount ? `${(user.followersCount / 1000).toFixed(1)}K` : '12.4K',
    following: user.followingCount || '356',
    bio: user.bio || 'Capturing little moments of a brighter tomorrow. ✨'
  } : null;

  return <DesktopHomeView currentUser={currentUser} />;
}
