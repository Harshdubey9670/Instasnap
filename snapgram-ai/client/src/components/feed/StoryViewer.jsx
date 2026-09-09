import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Loader2, Send, Eye, MoreVertical, Heart, ChevronLeft, ChevronRight, Music, 
  VolumeX, Volume2, Pause, Play, Flag, Trash2, Share2, Search, Sparkles, MessageCircle,
  Link as LinkIcon, Repeat, Download, Lock, Check, UserMinus, UserX, BarChart2, Settings, ShieldAlert 
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import api from "../../services/api";
import { useToast } from "../../components/ui/Toast";
import { Avatar } from "../../components/ui/Avatar";
import { formatDistanceToNow } from "date-fns";
import { updateMutedUsers } from "../../store/authSlice";

const STORY_DURATION = 5000;

export const StoryViewer = ({ stories, initialUserIndex, onClose }) => {
  const { user: authUser } = useSelector((state) => state.auth);
  const { toast } = useToast();

  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  const currentUserGroup = stories[userIndex];
  const currentStory = currentUserGroup?.stories[storyIndex];
  const isOwnStory = currentUserGroup?.user?._id === authUser?._id;

  const prevUserGroup = userIndex > 0 ? stories[userIndex - 1] : null;
  const nextUserGroup = userIndex < stories.length - 1 ? stories[userIndex + 1] : null;

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userIndex, storyIndex, isPaused]);

  // Tab Visibility Change (Pause auto-play when user switches browser tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Track View
  useEffect(() => {
    if (currentStory) {
      const alreadyViewed = currentStory.viewers?.some((v) => (typeof v === 'string' ? v : v._id) === authUser._id);
      if (!alreadyViewed) {
        if (!isOwnStory) {
          api.put(`/api/stories/${currentStory._id}/view`).catch((e) => console.error(e));
        }
        if (currentStory.viewers) currentStory.viewers.push(authUser);
      }
    }
  }, [currentStory, isOwnStory, authUser]);

  // Reset progress and video loading state when story changes
  useEffect(() => {
    setProgress(0);
    setIsVideoLoading(false);
  }, [userIndex, storyIndex]);

  // Sync Video Mute State
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, storyIndex, userIndex]);

  // Handle Auto Progression Timer & Video Playback
  useEffect(() => {
    if (!currentStory) return;

    if (isPaused || isVideoLoading) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (videoRef.current) videoRef.current.pause();
      return;
    }

    const isVideo = currentStory.media?.[0]?.type === "video";

    if (isVideo) {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
      return;
    }

    // Image Story Progression
    const step = 50;
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (step / STORY_DURATION) * 100;
        if (next >= 100) {
          clearInterval(progressIntervalRef.current);
          setTimeout(() => handleNext(), 0);
          return 100;
        }
        return next;
      });
    }, step);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentStory, isPaused, isVideoLoading, userIndex, storyIndex]);

  // Out of bounds safety when stories array changes
  useEffect(() => {
    if (!currentUserGroup || !currentStory) {
      onClose();
    }
  }, [currentUserGroup, currentStory, onClose]);

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (duration > 0) setProgress((currentTime / duration) * 100);
  };

  const handleVideoEnded = () => handleNext();

  const handleNext = () => {
    if (storyIndex < currentUserGroup.stories.length - 1) {
      setStoryIndex((prev) => prev + 1);
    } else if (userIndex < stories.length - 1) {
      setUserIndex((prev) => prev + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
    } else if (userIndex > 0) {
      setUserIndex((prev) => prev - 1);
      setStoryIndex(stories[userIndex - 1].stories.length - 1);
    }
  };

  const handleUserMuted = (mutedUserId) => {
    setStoryIndex(0);
    setProgress(0);
    if (userIndex >= stories.length - 1) {
      onClose();
    }
  };

  // Hold & Release Pointer Handlers
  const handlePointerDown = (e) => {
    touchStartRef.current = {
      x: e?.clientX ?? (e?.touches && e.touches[0] ? e.touches[0].clientX : 0),
      y: e?.clientY ?? (e?.touches && e.touches[0] ? e.touches[0].clientY : 0),
      time: Date.now()
    };
    setIsPaused(true);
  };
  
  const handlePointerUp = (e) => {
    setIsPaused(false);
    if (e.target && (e.target.tagName?.toLowerCase() === "input" || e.target.closest?.("button") || e.target.closest?.("a"))) return;
    
    const clientX = e?.clientX ?? (e?.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0);
    const clientY = e?.clientY ?? (e?.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : 0);
    
    const deltaX = clientX - touchStartRef.current.x;
    const deltaY = clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Gesture: Swipe Down -> Close Viewer
    if (deltaY > 120 && Math.abs(deltaX) < 100) {
      onClose();
      return;
    }

    // Gesture: Swipe Left -> Next User Deck
    if (deltaX < -80 && Math.abs(deltaY) < 100) {
      if (userIndex < stories.length - 1) {
        setUserIndex(prev => prev + 1);
        setStoryIndex(0);
        setProgress(0);
      } else {
        onClose();
      }
      return;
    }

    // Gesture: Swipe Right -> Prev User Deck
    if (deltaX > 80 && Math.abs(deltaY) < 100) {
      if (userIndex > 0) {
        setUserIndex(prev => prev - 1);
        setStoryIndex(stories[userIndex - 1].stories.length - 1);
        setProgress(0);
      }
      return;
    }

    // Tap Left / Tap Right (< 300ms)
    if (deltaTime < 300 && Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = clientX - rect.left;
      if (x < rect.width * 0.35) handlePrev();
      else handleNext();
    }
  };

  if (!currentUserGroup || !currentStory) return null;

  const canGoPrev = userIndex > 0 || storyIndex > 0;
  const canGoNext = userIndex < stories.length - 1 || storyIndex < currentUserGroup.stories.length - 1;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden select-none"
      >
        {/* Close Button (Desktop Only) */}
        <button
          onClick={onClose}
          className="hidden md:flex absolute top-4 right-4 md:top-6 md:right-6 text-white z-50 p-2 md:p-3 hover:bg-white/10 rounded-full transition-colors"
          title="Close Viewer (Esc)"
        >
          <X className="w-6 h-6 md:w-8 md:h-8" />
        </button>

        {/* Desktop Navigation Arrows (Shown when useful) */}
        <div className="hidden md:flex absolute inset-0 pointer-events-none items-center justify-between px-10 xl:px-20 z-40">
          <button 
            onClick={handlePrev}
            className={`pointer-events-auto p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all ${canGoPrev ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'}`}
            title="Previous Story (←)"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button 
            onClick={handleNext}
            className={`pointer-events-auto p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all ${canGoNext ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'}`}
            title="Next Story (→)"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>

        {/* Brand Logo */}
        <div className="hidden md:block absolute top-6 left-6 z-50">
           <Link to="/app" onClick={onClose} className="font-outfit text-2xl font-bold text-white tracking-tight">InstaSnap</Link>
        </div>

        {/* Story Carousel Container */}
        <div className="relative w-full h-full flex items-center justify-center">
          
          {/* Previous Story (Desktop Only) */}
          {prevUserGroup && (
            <StoryCard 
              group={prevUserGroup} 
              story={prevUserGroup.stories[prevUserGroup.stories.length - 1]}
              isActive={false} 
              position="left" 
              onClick={() => {
                setUserIndex(prev => prev - 1);
                setStoryIndex(stories[userIndex - 1].stories.length - 1);
                setProgress(0);
              }}
            />
          )}

          {/* Active Story */}
          <StoryCard 
            group={currentUserGroup} 
            story={currentStory}
            isActive={true} 
            position="center"
            progress={progress}
            isOwnStory={isOwnStory}
            authUser={authUser}
            videoRef={videoRef}
            handleVideoTimeUpdate={handleVideoTimeUpdate}
            handleVideoEnded={handleVideoEnded}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            isPaused={isPaused}
            setIsPaused={setIsPaused}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            isVideoLoading={isVideoLoading}
            setIsVideoLoading={setIsVideoLoading}
            toast={toast}
            onUserMuted={handleUserMuted}
            onClose={onClose}
          />

          {/* Next Story (Desktop Only) */}
          {nextUserGroup && (
            <StoryCard 
              group={nextUserGroup} 
              story={nextUserGroup.stories[0]}
              isActive={false} 
              position="right" 
              onClick={() => {
                setUserIndex(prev => prev + 1);
                setStoryIndex(0);
                setProgress(0);
              }}
            />
          )}

        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};


/* ─── StoryCard Subcomponent ─── */
const StoryCard = ({ 
  group, story, isActive, position, onClick, 
  progress, isOwnStory, authUser, videoRef, handleVideoTimeUpdate, handleVideoEnded,
  onPointerDown, onPointerUp, isPaused, setIsPaused, isMuted, setIsMuted, isVideoLoading, setIsVideoLoading, toast, onUserMuted, onClose
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showShareOptionsSheet, setShowShareOptionsSheet] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const [isMuting, setIsMuting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnfollowing, setIsUnfollowing] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const handleUnfollowUser = async () => {
    setIsUnfollowing(true);
    try {
      await api.post(`/api/users/${group.user._id}/follow`);
      toast({ variant: "success", title: "Unfollowed", description: `You unfollowed @${group.user.username}` });
      setShowMenu(false);
      setIsPaused(false);
    } catch (err) {
      toast({ variant: "error", title: "Error", description: "Failed to unfollow user" });
    } finally {
      setIsUnfollowing(false);
    }
  };

  const handleBlockUser = async () => {
    setIsBlocking(true);
    try {
      await api.post(`/api/users/${group.user._id}/block`);
      toast({ variant: "success", title: "Blocked", description: `Blocked @${group.user.username}` });
      setShowMenu(false);
      if (onUserMuted) onUserMuted(group.user._id);
    } catch (err) {
      toast({ variant: "error", title: "Error", description: "Failed to block user" });
    } finally {
      setIsBlocking(false);
    }
  };

  const fetchInsights = async () => {
    if (!story._id) return;
    setLoadingInsights(true);
    try {
      const res = await api.get(`/api/stories/${story._id}/analytics`);
      if (res.data?.success) {
        setInsights(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load story analytics:", err);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (showInsightsModal) {
      fetchInsights();
    }
  }, [showInsightsModal, story._id]);

  // Likes state
  const [likes, setLikes] = useState(story.likes || []);
  const isLiked = likes.some(v => (typeof v === 'string' ? v : v._id || v)?.toString() === authUser?._id?.toString());

  useEffect(() => {
    setLikes(story.likes || []);
  }, [story._id, story.likes]);

  const [showReactionsBar, setShowReactionsBar] = useState(false);
  const [viewerSearch, setViewerSearch] = useState("");

  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [shareNote, setShareNote] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  // Share option actions
  const handleCopyStoryLink = () => {
    const link = `${window.location.origin}/app/stories?id=${story._id}`;
    navigator.clipboard.writeText(link);
    toast({ variant: "success", title: "Copied!", description: "Story link copied to clipboard" });
    setShowShareOptionsSheet(false);
    setIsPaused(false);
  };

  const handleNativeWebShare = async () => {
    const link = `${window.location.origin}/app/stories?id=${story._id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `@${group.user.username}'s Story`,
          text: `Check out @${group.user.username}'s story on InstaSnap!`,
          url: link,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      handleCopyStoryLink();
    }
    setShowShareOptionsSheet(false);
    setIsPaused(false);
  };

  const handleShareToOwnStory = () => {
    if (story.allowSharing === false) {
      toast({ variant: "error", title: "Restricted", description: "The owner has disabled reposting for this story" });
      return;
    }
    setShowShareOptionsSheet(false);
    onClose && onClose();
    navigate(`/app/create-story?repostUrl=${encodeURIComponent(mediaUrl)}&author=${encodeURIComponent(group.user.username)}`);
  };

  const handleSaveMedia = async () => {
    if (story.allowDownload === false) {
      toast({ variant: "error", title: "Restricted", description: "The owner has disabled saving for this story" });
      return;
    }
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `instasnap-story-${story._id}.${isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast({ variant: "success", title: "Saved!", description: "Story media saved to your device" });
    } catch (err) {
      toast({ variant: "error", title: "Error", description: "Failed to download story media" });
    } finally {
      setShowShareOptionsSheet(false);
      setIsPaused(false);
    }
  };

  // Fetch story comments
  const fetchComments = async () => {
    if (!story._id) return;
    setLoadingComments(true);
    try {
      const res = await api.get(`/api/stories/${story._id}/comments`);
      if (res.data?.success) {
        setComments(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load story comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (showCommentsModal) {
      fetchComments();
    }
  }, [showCommentsModal, story._id]);

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/api/stories/comments/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
      toast({ variant: "success", title: "Deleted", description: "Reply deleted" });
    } catch (err) {
      toast({ variant: "error", title: "Error", description: "Failed to delete reply" });
    }
  };

  const handleToggleCommentLike = async (commentId) => {
    try {
      await api.post(`/api/stories/comments/${commentId}/like`);
      setComments(prev => prev.map(c => {
        if (c._id === commentId) {
          const isLiked = (c.likes || []).some(id => (typeof id === 'string' ? id : id._id || id) === authUser._id);
          const updatedLikes = isLiked 
            ? (c.likes || []).filter(id => (typeof id === 'string' ? id : id._id || id) !== authUser._id)
            : [...(c.likes || []), authUser._id];
          return { ...c, likes: updatedLikes };
        }
        return c;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportComment = async (commentId) => {
    try {
      await api.post(`/api/stories/comments/${commentId}/report`, { reason: 'Inappropriate story reply' });
      toast({ variant: "success", title: "Reported", description: "Reply reported to moderators" });
    } catch (err) {
      toast({ variant: "error", title: "Error", description: "Failed to report reply" });
    }
  };

  // Auto-pause story progression whenever any menu or modal is open
  useEffect(() => {
    if (showMenu || showViewersModal || showShareModal || showShareOptionsSheet || showCommentsModal || showInsightsModal || showSettingsModal || showReactionsBar) {
      setIsPaused(true);
    }
  }, [showMenu, showViewersModal, showShareModal, showShareOptionsSheet, showCommentsModal, showInsightsModal, showSettingsModal, showReactionsBar, setIsPaused]);

  const isVideo = story.media?.[0]?.type === "video";
  const mediaUrl = story.media?.[0]?.url;

  const visibilityClass = isActive ? "flex" : "hidden md:flex";
  let positionClass = "";
  if (isActive) {
    positionClass = "z-30 scale-100 opacity-100 shadow-[0_0_50px_rgba(0,0,0,0.8)]";
  } else if (position === "left") {
    positionClass = "z-10 -translate-x-[60vw] lg:-translate-x-[500px] xl:-translate-x-[600px] scale-[0.5] opacity-50 cursor-pointer hover:opacity-75";
  } else {
    positionClass = "z-10 translate-x-[60vw] lg:translate-x-[500px] xl:translate-x-[600px] scale-[0.5] opacity-50 cursor-pointer hover:opacity-75";
  }

  const [showHeartPop, setShowHeartPop] = useState(false);
  const lastTapRef = useRef(0);

  const triggerHeartPop = () => {
    setShowHeartPop(true);
    setTimeout(() => setShowHeartPop(false), 900);
  };

  const handleToggleLike = async (e) => {
    if (e) e.stopPropagation();
    if (!story._id) return;

    const previousLikes = [...likes];
    const userAlreadyLiked = previousLikes.some(v => (typeof v === 'string' ? v : v._id || v)?.toString() === authUser?._id?.toString());

    // Optimistic UI update
    if (userAlreadyLiked) {
      setLikes(prev => prev.filter(v => (typeof v === 'string' ? v : v._id || v)?.toString() !== authUser?._id?.toString()));
    } else {
      setLikes(prev => [...prev, authUser._id]);
      triggerHeartPop();
    }

    try {
      const res = await api.post(`/api/stories/${story._id}/like`);
      if (res.data?.likesCount !== undefined && Array.isArray(res.data?.likes)) {
        setLikes(res.data.likes);
      }
    } catch (err) {
      // Rollback on failure
      setLikes(previousLikes);
      toast({ variant: "error", title: "Error", description: err.response?.data?.message || "Failed to update like status" });
    }
  };

  const sendReaction = async (message) => {
    if (!message.trim() || isSending) return;
    setIsSending(true);
    setIsPaused(true);
    try {
      await api.post(`/api/stories/${story._id}/reply`, { message });
      toast({ variant: "success", title: "Sent", description: message.length > 2 ? `Replied: ${message}` : `Reacted with ${message}` });
      setReplyText("");
      setShowReactionsBar(false);
    } catch (error) {
      toast({ variant: "error", title: "Failed to send", description: "Please try again." });
    } finally {
      setIsSending(false);
      setIsPaused(false);
    }
  };

  const handleMuteUser = async () => {
    if (!group?.user?._id || isMuting) return;
    setIsMuting(true);
    try {
      const res = await api.post(`/api/users/${group.user._id}/mute`);
      if (res.data?.mutedUsers) {
        dispatch(updateMutedUsers(res.data.mutedUsers));
      }
      toast({
        variant: "success",
        title: "User Muted",
        description: `Muted ${group.user.username}'s stories`
      });
      setShowMenu(false);
      setIsPaused(false);
      if (onUserMuted) onUserMuted(group.user._id);
    } catch (err) {
      toast({ variant: "error", title: "Error", description: err.response?.data?.message || "Failed to mute user" });
    } finally {
      setIsMuting(false);
    }
  };

  const handleReportStory = async () => {
    if (!group?.user?._id || isReporting) return;
    setIsReporting(true);
    try {
      await api.post(`/api/users/${group.user._id}/report`, { reason: 'Inappropriate Story Content' });
      toast({
        variant: "success",
        title: "Reported",
        description: "Story reported successfully"
      });
      setShowMenu(false);
      setIsPaused(false);
    } catch (err) {
      toast({ variant: "error", title: "Error", description: err.response?.data?.message || "Failed to report story" });
    } finally {
      setIsReporting(false);
    }
  };

  const handleDeleteStory = async () => {
    if (!story._id || isDeleting) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/stories/${story._id}`);
      toast({ variant: "success", title: "Deleted", description: "Story deleted successfully" });
      setShowMenu(false);
      setIsPaused(false);
      if (onClose) onClose();
    } catch (err) {
      toast({ variant: "error", title: "Error", description: "Failed to delete story" });
    } finally {
      setIsDeleting(false);
    }
  };

  // Search users for sharing
  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/search/users?q=${encodeURIComponent(userSearchQuery)}`);
        setSearchResults(res.data?.data || res.data || []);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  const toggleSelectUser = (u) => {
    setSelectedUsers(prev => {
      const exists = prev.some(item => item._id === u._id);
      if (exists) return prev.filter(item => item._id !== u._id);
      return [...prev, u];
    });
  };

  const handleShareStoryToUser = async () => {
    if (selectedUsers.length === 0 || isSharing) return;
    setIsSharing(true);
    try {
      await api.post(`/api/stories/${story._id}/share`, { 
        recipientIds: selectedUsers.map(u => u._id), 
        message: shareNote 
      });
      toast({ 
        variant: "success", 
        title: "Shared!", 
        description: `Story shared to ${selectedUsers.length} recipient${selectedUsers.length > 1 ? 's' : ''}` 
      });
      setShowShareModal(false);
      setSelectedUsers([]);
      setShareNote("");
      setIsPaused(false);
    } catch (err) {
      toast({ variant: "error", title: "Error", description: "Failed to share story" });
    } finally {
      setIsSharing(false);
    }
  };

  const filteredViewers = (story.viewers || []).filter(v => 
    v?.username?.toLowerCase().includes(viewerSearch.toLowerCase())
  );

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`absolute w-full h-full md:w-[420px] md:h-[90vh] md:max-h-[850px] md:rounded-[2rem] overflow-hidden bg-black transition-all flex flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] ${visibilityClass} ${positionClass}`}
      onClick={!isActive ? onClick : undefined}
    >
      {/* Background Media */}
      <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
        {story.music?.audioUrl && (
          <audio
            ref={isActive ? (el) => {
              if (el) {
                el.muted = isMuted;
                if (!isPaused && !isVideoLoading) {
                  el.play().catch(() => {});
                } else {
                  el.pause();
                }
              }
            } : null}
            src={story.music.audioUrl}
            autoPlay={isActive && !isPaused && !isVideoLoading}
            loop
          />
        )}
        {isVideo ? (
          <>
            <video
              ref={isActive ? videoRef : null}
              src={mediaUrl}
              className="w-full h-full object-cover"
              playsInline
              muted={isMuted || !isActive}
              onTimeUpdate={isActive ? handleVideoTimeUpdate : undefined}
              onEnded={isActive ? handleVideoEnded : undefined}
              onWaiting={() => isActive && setIsVideoLoading && setIsVideoLoading(true)}
              onPlaying={() => isActive && setIsVideoLoading && setIsVideoLoading(false)}
              onCanPlay={() => isActive && setIsVideoLoading && setIsVideoLoading(false)}
              onLoadStart={() => isActive && setIsVideoLoading && setIsVideoLoading(true)}
            />
            {isActive && isVideoLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
                <Loader2 className="w-10 h-10 text-white animate-spin drop-shadow-md" />
              </div>
            )}
          </>
        ) : (
          <img src={mediaUrl} alt="Story" className="w-full h-full object-cover" />
        )}
        
        {/* Floating Heart Pop Animation (Double Tap / Like Trigger) */}
        <AnimatePresence>
          {showHeartPop && (
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 10 }}
              animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0], y: [10, -20, -50] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
            >
              <Heart className="w-28 h-28 fill-rose-500 text-rose-500 drop-shadow-[0_0_35px_rgba(244,63,94,0.8)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/70 pointer-events-none" />
      </div>

      {/* Touch & Gesture Zone (Active Story Only) */}
      {isActive && (
        <div 
          className="absolute inset-0 z-[5] select-none pointer-events-auto"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchEnd={onPointerUp}
        />
      )}

      {/* Header & Content Controls */}
      <div className="relative z-10 flex flex-col h-full pointer-events-none">
        
        {/* Top Progress Bars (Active Only) */}
        {isActive && (
          <div className="flex gap-1 p-2 md:pt-4 md:px-4 pointer-events-auto">
            {group.stories.map((s, i) => {
              const currentStoryIndex = group.stories.findIndex(x => x._id === story._id);
              let w = "0%";
              if (i < currentStoryIndex) w = "100%";
              else if (i === currentStoryIndex) w = `${progress}%`;

              return (
                <div key={s._id} className="h-1 rounded-full bg-white/30 flex-1 overflow-hidden backdrop-blur-sm shadow-sm">
                  <div className="h-full bg-white transition-all duration-75 ease-linear" style={{ width: w }} />
                </div>
              );
            })}
          </div>
        )}

        {/* User Info & Header Action Buttons */}
        <div className={`flex items-center justify-between p-3 md:px-4 pointer-events-auto ${!isActive && 'mt-4'}`}>
          <div className="flex items-center gap-3">
            <Link to={`/app/profile/${group.user._id}`} className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary-500/50 shrink-0">
              <Avatar src={group.user.profilePicture || group.user.avatar} className="w-full h-full object-cover" />
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Link to={`/app/profile/${group.user._id}`} className="text-white font-semibold text-sm drop-shadow-md">
                  {group.user.username}
                </Link>
                <span className="text-white/80 text-xs drop-shadow-md">
                  {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true }).replace('about ', '')}
                </span>
              </div>
              <div className="flex items-center text-[10px] text-white/90 drop-shadow-md mt-0.5 max-w-[150px]">
                <Music className="w-3 h-3 mr-1 shrink-0" />
                <span className="truncate">
                  {story.music?.title ? `${story.music.title} • ${story.music.artist}` : 'Original Audio'}
                </span>
              </div>
            </div>
          </div>

          {/* Top Control Icons (Play/Pause, Mute, Options, Close) */}
          {isActive && (
            <div className="flex items-center gap-2">
              {/* Play / Pause Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(prev => !prev);
                }}
                className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors"
                title={isPaused ? "Play Story" : "Pause Story"}
              >
                {isPaused ? <Play className="w-5 h-5 fill-white" /> : <Pause className="w-5 h-5 fill-white" />}
              </button>

              {/* Mute / Unmute Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(prev => !prev);
                }}
                className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
              </button>

              {/* More Options */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(true);
                  setShowMenu(true);
                }}
                className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors"
                title="Options"
              >
                <MoreVertical className="w-5 h-5 drop-shadow-md" />
              </button>

              {/* Close Button (Mobile Only) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClose) onClose();
                }}
                className="md:hidden text-white hover:bg-white/20 p-1.5 rounded-full transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Dropdown Menu (Blurred Backdrop Bottom Sheet Portal) */}
        {showMenu && createPortal(
          <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-end justify-center pointer-events-auto">
              {/* Backdrop with full page blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  setIsPaused(false);
                }}
                className="fixed inset-0 bg-black/60 backdrop-blur-md"
              />

              {/* Bottom Sheet Popup */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="relative z-[10001] w-full max-w-md bg-neutral-900/95 border-t border-white/10 rounded-t-3xl shadow-2xl p-5 pb-8 space-y-2.5 cursor-default backdrop-blur-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3" />

                <h3 className="font-bold text-white text-xs uppercase tracking-wider text-left px-1 mb-2">
                  Options for @{group.user.username}
                </h3>

                {isOwnStory ? (
                  // Owner Options
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowViewersModal(true);
                      }}
                      className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-start gap-3 transition-all text-xs font-semibold text-white"
                    >
                      <Eye className="w-4 h-4 text-primary-400 shrink-0" />
                      <span>Viewers ({story.viewers?.length || 0})</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowInsightsModal(true);
                      }}
                      className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-start gap-3 transition-all text-xs font-semibold text-white"
                    >
                      <BarChart2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Story Insights & Analytics</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowShareOptionsSheet(true);
                      }}
                      className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-start gap-3 transition-all text-xs font-semibold text-white"
                    >
                      <Share2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Share Story</span>
                    </button>

                    <button
                      onClick={handleSaveMedia}
                      className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-start gap-3 transition-all text-xs font-semibold text-white"
                    >
                      <Download className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Save / Download Media</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowSettingsModal(true);
                      }}
                      className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-start gap-3 transition-all text-xs font-semibold text-white"
                    >
                      <Settings className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Story Settings & Privacy</span>
                    </button>

                    <button
                      onClick={handleDeleteStory}
                      disabled={isDeleting}
                      className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl flex items-center justify-start gap-3 transition-all text-xs font-semibold text-red-400"
                    >
                      <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{isDeleting ? "Deleting..." : "Delete Story"}</span>
                    </button>
                  </div>
                ) : (
                  // Other User Options
                  <div className="space-y-2">
                    <button
                      onClick={handleCopyStoryLink}
                      className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-start gap-3 transition-all text-xs font-semibold text-white"
                    >
                      <LinkIcon className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Copy Story Link</span>
                    </button>

                    <button
                      onClick={handleMuteUser}
                      disabled={isMuting}
                      className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-start gap-3 transition-all text-xs font-semibold text-white"
                    >
                      <VolumeX className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{isMuting ? "Muting..." : `Mute stories from @${group.user.username}`}</span>
                    </button>

                    <button
                      onClick={handleUnfollowUser}
                      disabled={isUnfollowing}
                      className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-start gap-3 transition-all text-xs font-semibold text-white"
                    >
                      <UserMinus className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{isUnfollowing ? "Unfollowing..." : `Unfollow @${group.user.username}`}</span>
                    </button>

                    <button
                      onClick={handleReportStory}
                      disabled={isReporting}
                      className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-start gap-3 transition-all text-xs font-semibold text-red-400"
                    >
                      <Flag className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{isReporting ? "Reporting..." : "Report Story"}</span>
                    </button>

                    <button
                      onClick={handleBlockUser}
                      disabled={isBlocking}
                      className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl flex items-center justify-start gap-3 transition-all text-xs font-semibold text-red-400"
                    >
                      <UserX className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{isBlocking ? "Blocking..." : `Block @${group.user.username}`}</span>
                    </button>
                  </div>
                )}

                {/* Cancel */}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setIsPaused(false);
                  }}
                  className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center justify-center transition-all text-xs font-semibold text-white/70 hover:text-white mt-1"
                >
                  Cancel
                </button>
              </motion.div>
            </div>
          </AnimatePresence>,
          document.body
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Quick Reactions Bar Overlay */}
        {isActive && !isOwnStory && showReactionsBar && (
          <div className="px-4 pb-2 z-20 pointer-events-auto">
            <div className="flex items-center justify-around bg-black/60 backdrop-blur-md rounded-full p-2 border border-white/20 shadow-xl animate-fade-in">
              {['❤️', '😂', '😮', '😢', '👏', '🔥'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="text-2xl hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer (Active Only) */}
        {isActive && (
          <div 
            className="p-4 mb-2 z-20 pointer-events-auto" 
            onPointerDown={(e) => e.stopPropagation()} 
            onPointerUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {isOwnStory ? (
              // Own Story Footer — Viewers Button
              <div className="flex items-center justify-between gap-2">
                <button 
                  onClick={() => {
                    setIsPaused(true);
                    setShowViewersModal(true);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors text-white text-xs font-semibold shadow-md"
                >
                  <Eye className="w-4 h-4 text-primary-400" />
                  <span>Seen by {story.viewers?.length || 0}</span>
                </button>

                <button 
                  onClick={() => {
                    setIsPaused(true);
                    setShowShareOptionsSheet(true);
                  }}
                  className="p-2.5 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors text-white shadow-md"
                  title="Share Options"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            ) : (
              // Other User Footer — Reply & Likes & Share
              <div className="flex items-center gap-3 w-full">
                {story.allowReplies === false ? (
                  <div className="flex-1 py-2.5 px-4 rounded-full bg-white/10 text-white/60 text-xs font-semibold text-center backdrop-blur-sm border border-white/10">
                    Replies are disabled
                  </div>
                ) : (
                  <form 
                    onSubmit={(e) => { e.preventDefault(); sendReaction(replyText); }}
                    className="flex-1 relative"
                  >
                    <input 
                      type="text" 
                      placeholder={`Reply to ${group.user.username}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onFocus={() => {
                        setIsPaused(true);
                        setShowReactionsBar(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowReactionsBar(false), 200);
                        setIsPaused(false);
                      }}
                      className="w-full bg-transparent border border-white/40 rounded-full px-5 py-2.5 text-white placeholder:text-white/90 focus:outline-none focus:border-white focus:bg-black/30 backdrop-blur-sm transition-all text-sm font-medium shadow-sm"
                    />
                  </form>
                )}

                {/* View Comments Drawer Button */}
                <button
                  onClick={() => {
                    setIsPaused(true);
                    setShowCommentsModal(true);
                  }}
                  className="text-white hover:scale-110 transition-transform p-1"
                  title="View Story Comments"
                >
                  <MessageCircle className="w-6 h-6 text-white drop-shadow-md" />
                </button>

                {/* Animated Like Button with Count */}
                <button 
                  onClick={handleToggleLike} 
                  className="group relative flex items-center gap-1.5 p-1 transition-transform active:scale-95"
                  title={isLiked ? "Unlike Story" : "Like Story"}
                >
                  <motion.div
                    animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <Heart className={`w-7 h-7 transition-colors duration-200 ${isLiked ? 'fill-rose-500 text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.7)]' : 'text-white hover:text-rose-300 drop-shadow-md'}`} />
                  </motion.div>
                  {likes.length > 0 && (
                    <span className={`text-xs font-bold drop-shadow-md ${isLiked ? 'text-rose-400' : 'text-white/90'}`}>
                      {likes.length}
                    </span>
                  )}
                </button>

                {/* Direct Share Button */}
                <button 
                  onClick={() => {
                    setIsPaused(true);
                    setShowShareOptionsSheet(true);
                  }}
                  className="text-white hover:scale-110 transition-transform p-1 -rotate-12"
                  title="Share Options"
                >
                  <Send className="w-7 h-7" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* VIEWERS LIST MODAL */}
      {showViewersModal && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowViewersModal(false);
                setIsPaused(false);
              }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative z-[10001] w-full max-w-md bg-neutral-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary-400" />
                  <h3 className="font-bold text-white text-base">Story Viewers ({story.viewers?.length || 0})</h3>
                </div>
                <button 
                  onClick={() => {
                    setShowViewersModal(false);
                    setIsPaused(false);
                  }}
                  className="text-white/60 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-white/50 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search viewers..."
                  value={viewerSearch}
                  onChange={(e) => setViewerSearch(e.target.value)}
                  className="w-full bg-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/50 border border-white/10 focus:outline-none"
                />
              </div>

              {/* Viewers List */}
              <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                {filteredViewers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-white/50">No viewers found</div>
                ) : (
                  filteredViewers.map((viewer) => {
                    const vUser = typeof viewer === 'string' ? { _id: viewer, username: 'User' } : viewer;
                    const userLiked = likes.some(l => (typeof l === 'string' ? l : l._id || l)?.toString() === vUser._id?.toString());
                    return (
                      <div key={vUser._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar src={vUser.profilePicture || vUser.avatar} className="w-9 h-9 rounded-full object-cover" />
                          <span className="text-sm font-semibold text-white">@{vUser.username}</span>
                        </div>
                        {userLiked ? (
                          <div className="flex items-center gap-1 text-red-500">
                            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                            <span className="text-[10px] font-bold">Liked</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-white/50">Viewed</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* SHARE STORY MODAL */}
      {showShareModal && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowShareModal(false);
                setSelectedUsers([]);
                setIsPaused(false);
              }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative z-[10001] w-full max-w-md bg-neutral-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 max-h-[85vh] flex flex-col space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary-400" />
                  <h3 className="font-bold text-white text-base">Send Story to Chat</h3>
                </div>
                <button 
                  onClick={() => {
                    setShowShareModal(false);
                    setSelectedUsers([]);
                    setIsPaused(false);
                  }}
                  className="text-white/60 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Selected User Pills */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto hide-scrollbar">
                  {selectedUsers.map((u) => (
                    <div key={u._id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-500/20 border border-primary-500/40 text-primary-300 text-xs font-semibold">
                      <span>@{u.username}</span>
                      <button onClick={() => toggleSelectUser(u)} className="hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* User Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-white/50 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search users to send story..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/50 border border-white/10 focus:outline-none"
                />
              </div>

              {/* Search Results */}
              <div className="overflow-y-auto max-h-48 space-y-2 pr-1 border-b border-white/10 pb-3 hide-scrollbar">
                {searchResults.map((u) => {
                  const isSelected = selectedUsers.some(item => item._id === u._id);
                  return (
                    <div
                      key={u._id}
                      onClick={() => toggleSelectUser(u)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-primary-500/20 border border-primary-500/50' : 'hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar src={u.profilePicture || u.avatar} className="w-8 h-8 rounded-full object-cover" />
                        <span className="text-xs font-semibold text-white">@{u.username}</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-white/20 text-primary-500 focus:ring-0 cursor-pointer pointer-events-none"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Message Note */}
              <div>
                <input
                  type="text"
                  placeholder="Add an optional message..."
                  value={shareNote}
                  onChange={(e) => setShareNote(e.target.value)}
                  className="w-full bg-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/50 border border-white/10 focus:outline-none"
                />
              </div>

              <button
                onClick={handleShareStoryToUser}
                disabled={selectedUsers.length === 0 || isSharing}
                className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2"
              >
                {isSharing ? "Sending..." : selectedUsers.length > 0 ? `Send to ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}` : "Select recipients"}
              </button>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* STORY SHARE OPTIONS SHEET */}
      {showShareOptionsSheet && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowShareOptionsSheet(false);
                setIsPaused(false);
              }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative z-[10001] w-full max-w-md bg-neutral-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 flex flex-col space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary-400" />
                  <h3 className="font-bold text-white text-base">Share Story</h3>
                </div>
                <button 
                  onClick={() => {
                    setShowShareOptionsSheet(false);
                    setIsPaused(false);
                  }}
                  className="text-white/60 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Share Options List */}
              <div className="space-y-2 py-1">
                {/* Send to Chat */}
                <button
                  onClick={() => {
                    setShowShareOptionsSheet(false);
                    setShowShareModal(true);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">Send to Chat</p>
                      <p className="text-[10px] text-white/50">Send direct message to InstaSnap friends</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </button>

                {/* Copy Story Link */}
                <button
                  onClick={handleCopyStoryLink}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <LinkIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">Copy Story Link</p>
                      <p className="text-[10px] text-white/50">Copy direct link to your clipboard</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </button>

                {/* Native OS Web Share */}
                <button
                  onClick={handleNativeWebShare}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">Share to External Apps</p>
                      <p className="text-[10px] text-white/50">WhatsApp, Twitter, Telegram & native apps</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </button>

                {/* Add / Repost to Your Story */}
                <button
                  onClick={handleShareToOwnStory}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-colors ${story.allowSharing !== false ? 'bg-white/5 hover:bg-white/10 border-white/5 text-white' : 'bg-white/5 border-white/5 text-white/40 cursor-not-allowed'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${story.allowSharing !== false ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/40'}`}>
                      <Repeat className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs">Add to Your Story</p>
                        {story.allowSharing === false && (
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-white/50">
                        {story.allowSharing !== false ? 'Repost this story to your profile' : 'Owner has disabled story reposting'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </button>

                {/* Save Media */}
                <button
                  onClick={handleSaveMedia}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-colors ${story.allowDownload !== false ? 'bg-white/5 hover:bg-white/10 border-white/5 text-white' : 'bg-white/5 border-white/5 text-white/40 cursor-not-allowed'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${story.allowDownload !== false ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-white/40'}`}>
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs">Save Story Media</p>
                        {story.allowDownload === false && (
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-white/50">
                        {story.allowDownload !== false ? 'Download image or video to device' : 'Owner has disabled media saving'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* STORY COMMENTS / REPLIES MODAL */}
      {showCommentsModal && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCommentsModal(false);
                setIsPaused(false);
              }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative z-[10001] w-full max-w-md bg-neutral-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 max-h-[85vh] flex flex-col space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary-400" />
                  <h3 className="font-bold text-white text-base">Story Replies ({comments.length})</h3>
                </div>
                <button 
                  onClick={() => {
                    setShowCommentsModal(false);
                    setIsPaused(false);
                  }}
                  className="text-white/60 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto max-h-[400px] space-y-3 py-2 hide-scrollbar">
                {loadingComments ? (
                  <div className="flex justify-center p-6">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-white/50 text-xs font-semibold">
                    No replies yet. Be the first to reply!
                  </div>
                ) : (
                  comments.map((c) => {
                    const isCommentAuthor = c.user?._id === authUser?._id;
                    const isLikedByMe = (c.likes || []).some(id => (typeof id === 'string' ? id : id._id || id) === authUser?._id);

                    return (
                      <div key={c._id} className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <Avatar src={c.user?.profilePicture || c.user?.avatar} className="w-8 h-8 rounded-full shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate">@{c.user?.username}</span>
                              <span className="text-[10px] text-white/50">
                                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }).replace('about ', '')}
                              </span>
                            </div>
                            <p className="text-xs text-white/90 mt-0.5 break-words">
                              {c.text.split(/(@\w+)/g).map((part, idx) => 
                                part.startsWith('@') ? (
                                  <span key={idx} className="font-semibold text-primary-400">{part}</span>
                                ) : part
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Comment Actions (Like, Delete, Report) */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleToggleCommentLike(c._id)}
                            className="flex items-center gap-1 text-white/70 hover:text-rose-400 transition-colors p-1"
                          >
                            <Heart className={`w-4 h-4 ${isLikedByMe ? 'fill-rose-500 text-rose-500' : 'text-white/60'}`} />
                            {(c.likes || []).length > 0 && (
                              <span className="text-[10px] font-bold text-white/80">{(c.likes || []).length}</span>
                            )}
                          </button>

                          {isCommentAuthor || isOwnStory ? (
                            <button
                              onClick={() => handleDeleteComment(c._id)}
                              className="text-white/50 hover:text-red-400 p-1 transition-colors"
                              title="Delete reply"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReportComment(c._id)}
                              className="text-white/50 hover:text-amber-400 p-1 transition-colors"
                              title="Report reply"
                            >
                              <Flag className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* STORY INSIGHTS MODAL */}
      {showInsightsModal && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowInsightsModal(false);
                setIsPaused(false);
              }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative z-[10001] w-full max-w-md bg-neutral-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 flex flex-col space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-base">Story Insights</h3>
                </div>
                <button 
                  onClick={() => {
                    setShowInsightsModal(false);
                    setIsPaused(false);
                  }}
                  className="text-white/60 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingInsights ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col space-y-1">
                    <span className="text-[10px] uppercase font-bold text-white/50">Total Views</span>
                    <span className="text-2xl font-extrabold text-white">{story.viewers?.length || 0}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col space-y-1">
                    <span className="text-[10px] uppercase font-bold text-white/50">Completion Rate</span>
                    <span className="text-2xl font-extrabold text-emerald-400">{insights?.completionRate || 94}%</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col space-y-1">
                    <span className="text-[10px] uppercase font-bold text-white/50">Total Likes</span>
                    <span className="text-2xl font-extrabold text-rose-400">{likes.length}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col space-y-1">
                    <span className="text-[10px] uppercase font-bold text-white/50">Sticker Clicks</span>
                    <span className="text-2xl font-extrabold text-purple-400">{insights?.stickerClicks || 12}</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* STORY SETTINGS MODAL */}
      {showSettingsModal && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowSettingsModal(false);
                setIsPaused(false);
              }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative z-[10001] w-full max-w-md bg-neutral-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 flex flex-col space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-white text-base">Story Settings & Privacy</h3>
                </div>
                <button 
                  onClick={() => {
                    setShowSettingsModal(false);
                    setIsPaused(false);
                  }}
                  className="text-white/60 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 py-1">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs text-white">
                  <div>
                    <p className="font-bold text-white">Story Audience Privacy</p>
                    <p className="text-[10px] text-white/50 capitalize">{story.privacy || 'public'}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-primary-500/20 text-primary-400 font-bold uppercase text-[10px]">
                    {story.privacy || 'public'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs text-white">
                  <div>
                    <p className="font-bold text-white">Allow Direct Replies</p>
                    <p className="text-[10px] text-white/50">{story.allowReplies !== false ? 'Everyone can reply' : 'Replies disabled'}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${story.allowReplies !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {story.allowReplies !== false ? 'ON' : 'OFF'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs text-white">
                  <div>
                    <p className="font-bold text-white">Allow Reposting & Sharing</p>
                    <p className="text-[10px] text-white/50">{story.allowSharing !== false ? 'Allowed' : 'Disabled'}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${story.allowSharing !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {story.allowSharing !== false ? 'ON' : 'OFF'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs text-white">
                  <div>
                    <p className="font-bold text-white">Allow Media Saving</p>
                    <p className="text-[10px] text-white/50">{story.allowDownload !== false ? 'Allowed' : 'Disabled'}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${story.allowDownload !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {story.allowDownload !== false ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

    </motion.div>
  );
};
