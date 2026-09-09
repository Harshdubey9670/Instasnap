import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../services/api';
import { useToast } from '../ui/Toast';
import { updateFollowing, updateSentFollowRequests } from '../../store/authSlice';

export const FollowButton = ({ userId, targetUser, onToggle, className }) => {
  const { user: authUser } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authUser?.following && userId) {
      const targetIdStr = userId.toString();
      setIsFollowing(
        authUser.following.some(id => (typeof id === 'string' ? id : id?._id || id)?.toString() === targetIdStr)
      );
    } else {
      setIsFollowing(false);
    }

    if (authUser?.sentFollowRequests && userId) {
      const targetIdStr = userId.toString();
      setIsRequested(
        authUser.sentFollowRequests.some(id => (typeof id === 'string' ? id : id?._id || id)?.toString() === targetIdStr)
      );
    } else {
      setIsRequested(false);
    }
  }, [authUser?.following, authUser?.sentFollowRequests, userId]);

  const handleToggleFollow = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    const wasFollowing = isFollowing;
    const wasRequested = isRequested;
    
    // Optimistic Update
    if (isFollowing) {
      setIsFollowing(false);
    } else if (isRequested) {
      setIsRequested(false);
    } else {
      // We don't know if target is private instantly without targetUser,
      // but usually we assume follow if public. We'll rely on backend response.
      // We'll tentatively set following to true for fast UI.
      setIsFollowing(true);
    }

    try {
      let res;
      if (wasFollowing) {
        res = await api.delete(`/api/users/${userId}/follow`);
      } else if (wasRequested) {
        res = await api.delete(`/api/users/follow-requests/${userId}/cancel`);
      } else {
        res = await api.post(`/api/users/${userId}/follow`);
      }
      
      if (res?.data?.success) {
        const nextStatus = res.data.status;
        if (nextStatus === 'requested') {
          setIsRequested(true);
          setIsFollowing(false);
          const updatedSentRequests = [...(authUser.sentFollowRequests || []), userId];
          dispatch(updateSentFollowRequests(updatedSentRequests));
        } else if (nextStatus === 'following') {
          setIsFollowing(true);
          setIsRequested(false);
          if (res.data.data) dispatch(updateFollowing(res.data.data));
        } else {
          // Unfollowed or cancelled
          setIsFollowing(false);
          setIsRequested(false);
          if (res.data.data) dispatch(updateFollowing(res.data.data));
          
          if (wasRequested) {
             const updatedSentRequests = (authUser.sentFollowRequests || []).filter(id => id.toString() !== userId.toString());
             dispatch(updateSentFollowRequests(updatedSentRequests));
          }
        }
        
        if (onToggle) {
          onToggle({
            isFollowing: nextStatus === 'following',
            isRequested: nextStatus === 'requested'
          });
        }
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(wasFollowing);
      setIsRequested(wasRequested);
      toast({ variant: 'error', title: 'Action Failed', description: error.response?.data?.message || 'Could not update follow status.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!authUser || String(authUser._id) === String(userId)) return null;

  return (
    <Button 
      variant={isFollowing || isRequested ? 'glass' : 'primary'} 
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={className || `min-w-[100px] h-9 px-4 text-sm font-medium ${isFollowing ? 'hover:border-red-500/50 hover:text-red-400' : ''}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
      ) : isFollowing ? (
        'Following'
      ) : isRequested ? (
        'Requested'
      ) : (
        'Follow'
      )}
    </Button>
  );
};
