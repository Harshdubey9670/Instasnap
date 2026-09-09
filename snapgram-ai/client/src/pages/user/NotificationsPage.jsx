import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Bell, Loader2, AtSign, Heart, UserPlus, MessageCircle, CheckCheck, Send, Trash2 } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { FollowButton } from "../../components/profile/FollowButton";
import { clearUnreadCount } from "../../store/authSlice";
import api from "../../services/api";

const notificationIcon = (type) => {
  switch (type) {
    case "mention":  return <AtSign className="w-3 h-3 text-sky-400" />;
    case "tag":      return <AtSign className="w-3 h-3 text-sky-400" />;
    case "like":     return <Heart className="w-3 h-3 text-red-500 fill-red-500" />;
    case "follow":   
    case "accept_request":
    case "follow_request": return <UserPlus className="w-3 h-3 text-emerald-400" />;
    case "comment":  
    case "reply":    return <MessageCircle className="w-3 h-3 text-primary-400" />;
    case "story_reply": 
    case "story":
    case "reel":     return <Send className="w-3 h-3 text-primary-400" />;
    case "save":     return <Heart className="w-3 h-3 text-amber-400 fill-amber-400" />;
    case "system":   return <Bell className="w-3 h-3 text-primary-400" />;
    default:         return <Bell className="w-3 h-3 text-text-secondary" />;
  }
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
};

// Group notifications of the same type on the same post
const groupNotifications = (notifications) => {
  const grouped = [];
  
  notifications.forEach(notif => {
    const canGroup = notif.post?._id && ["like", "comment", "mention"].includes(notif.type);
    
    if (!canGroup) {
      grouped.push({ ...notif, senders: [notif.sender], _id: notif._id });
      return;
    }

    const lastGroup = grouped[grouped.length - 1];
    if (lastGroup && lastGroup.type === notif.type && lastGroup.post?._id === notif.post?._id) {
      if (!lastGroup.senders.some(s => s?._id === notif.sender?._id)) {
        lastGroup.senders.push(notif.sender);
      }
      if (!notif.read) lastGroup.read = false;
      if (!lastGroup.ids) lastGroup.ids = [lastGroup._id];
      lastGroup.ids.push(notif._id);
    } else {
      grouped.push({ ...notif, senders: [notif.sender], ids: [notif._id] });
    }
  });

  return grouped;
};

// Format grouped text
const formatGroupedText = (senders, type) => {
  const count = senders.length;
  const s1 = senders[0];
  const s2 = senders[1];
  
  let names = null;
  if (count === 1) {
    names = <Link to={`/app/profile/${s1?._id}`} className="font-semibold text-text-primary hover:opacity-80">{s1?.username}</Link>;
  } else if (count === 2) {
    names = (
      <>
        <Link to={`/app/profile/${s1?._id}`} className="font-semibold text-text-primary hover:opacity-80">{s1?.username}</Link>
        {" and "}
        <Link to={`/app/profile/${s2?._id}`} className="font-semibold text-text-primary hover:opacity-80">{s2?.username}</Link>
      </>
    );
  } else {
    names = (
      <>
        <Link to={`/app/profile/${s1?._id}`} className="font-semibold text-text-primary hover:opacity-80">{s1?.username}</Link>
        {", "}
        <Link to={`/app/profile/${s2?._id}`} className="font-semibold text-text-primary hover:opacity-80">{s2?.username}</Link>
        {` and ${count - 2} other${count - 2 > 1 ? 's' : ''}`}
      </>
    );
  }

  let action = "";
  switch (type) {
    case "mention": action = "mentioned you in a post."; break;
    case "tag": action = "tagged you in a post."; break;
    case "like": action = "liked your post."; break;
    case "follow": action = "started following you."; break;
    case "follow_request": action = "requested to follow you."; break;
    case "accept_request": action = "accepted your follow request."; break;
    case "comment": action = "commented on your post."; break;
    case "reply": action = "replied to your comment."; break;
    case "story_reply": action = "replied to your story."; break;
    case "story": action = "mentioned you in their story."; break;
    case "reel": action = "shared a reel with you."; break;
    case "save": action = "saved your post."; break;
    case "system": action = "sent a system update."; break;
    default: action = "sent you a notification."; break;
  }

  return <span>{names} {action}</span>;
};

// Categorize notifications into Today, This Week, Earlier
const categorizeNotifications = (groupedList) => {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const SEVEN_DAYS = 7 * ONE_DAY;

  const today = [];
  const thisWeek = [];
  const earlier = [];

  groupedList.forEach((item) => {
    const age = now - new Date(item.createdAt).getTime();
    if (age <= ONE_DAY) {
      today.push(item);
    } else if (age <= SEVEN_DAYS) {
      thisWeek.push(item);
    } else {
      earlier.push(item);
    }
  });

  return { today, thisWeek, earlier };
};

const NotificationItem = ({
  group,
  isLast,
  lastNotificationRef,
  handleNotificationClick,
  handleMarkOneRead,
  handleDelete
}) => {
  const senders = group.senders || [group.sender];
  const primarySender = senders[0] || group.sender;

  return (
    <div
      ref={isLast ? lastNotificationRef : null}
      onClick={() => handleNotificationClick(group)}
      className={`group relative flex items-center justify-between gap-3 px-4 py-3 transition-colors cursor-pointer ${
        !group.read ? "bg-primary-500/5 hover:bg-primary-500/10" : "hover:bg-bg-surface-hover/60"
      }`}
    >
      {/* Left: Avatar with Badge Icon */}
      <div className="relative shrink-0 w-11 h-11">
        {senders.length > 1 ? (
          <div className="relative w-11 h-11">
            <Avatar
              src={senders[0]?.profilePicture || senders[0]?.avatar}
              fallback={senders[0]?.username?.charAt(0) || 'U'}
              className="w-8 h-8 rounded-full absolute bottom-0 left-0 border-2 border-bg-base z-10"
            />
            <Avatar
              src={senders[1]?.profilePicture || senders[1]?.avatar}
              fallback={senders[1]?.username?.charAt(0) || 'U'}
              className="w-7 h-7 rounded-full absolute top-0 right-0 border-2 border-bg-base z-0"
            />
          </div>
        ) : (
          <Avatar
            src={primarySender?.profilePicture || primarySender?.avatar}
            fallback={primarySender?.username?.charAt(0) || 'U'}
            className="w-11 h-11 rounded-full object-cover"
          />
        )}

        {/* Badge Icon */}
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-neutral-900 border-2 border-bg-base flex items-center justify-center shadow-sm z-20">
          {notificationIcon(group.type)}
        </div>
      </div>

      {/* Center: Text Body */}
      <div className="flex-1 min-w-0 text-sm text-text-primary leading-snug">
        <span>
          {formatGroupedText(senders, group.type)}
        </span>
        <span className="text-text-secondary text-xs ml-1.5 font-normal whitespace-nowrap">
          {timeAgo(group.createdAt)}
        </span>

        {group.type === 'story_reply' && group.message && (
          <p className="text-xs text-text-secondary mt-0.5 italic truncate max-w-xs">
            "{group.message}"
          </p>
        )}
      </div>

      {/* Right Action: Follow Button or Post Thumbnail or Actions */}
      <div className="flex items-center gap-2 shrink-0 ml-1" onClick={(e) => e.stopPropagation()}>
        {/* If follow notification, show Instagram style FollowButton */}
        {(group.type === 'follow' || group.type === 'accept_request') && primarySender?._id && (
          <FollowButton userId={primarySender._id} targetUser={primarySender} />
        )}

        {/* Post thumbnail for likes/comments/mentions */}
        {group.post?.media?.[0]?.url && (
          <div className="w-11 h-11 rounded-lg overflow-hidden border border-border-soft/60 shrink-0">
            <img src={group.post.media[0].url} alt="Post" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Unread indicator */}
        {!group.read && (
          <button
            onClick={(e) => handleMarkOneRead(e, group._id)}
            className="w-2.5 h-2.5 rounded-full bg-primary-500 hover:scale-125 transition-transform"
            title="Mark read"
          />
        )}

        {/* Delete notification */}
        <button
          onClick={(e) => handleDelete(e, group._id)}
          className="p-1.5 text-text-secondary hover:text-red-400 hover:bg-white/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [followRequests, setFollowRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Pagination / Infinite Scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  
  const observer = useRef();
  const lastNotificationRef = useCallback(node => {
    if (loading || fetchingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, fetchingMore, hasMore]);

  // Initial fetch
  useEffect(() => {
    dispatch(clearUnreadCount());
    fetchNotifications(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchNotifications(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchFollowRequests = async () => {
    try {
      const res = await api.get('/api/users/follow-requests');
      if (res.data.success) {
        setFollowRequests(res.data.data);
      }
    } catch (e) {
      console.error("Failed to fetch follow requests", e);
    }
  };

  const handleAcceptRequest = async (id) => {
    try {
      await api.post(`/api/users/follow-requests/${id}/accept`);
      setFollowRequests(prev => prev.filter(r => r._id !== id));
    } catch (e) {
      console.error("Failed to accept request", e);
    }
  };

  const handleDeclineRequest = async (id) => {
    try {
      await api.post(`/api/users/follow-requests/${id}/decline`);
      setFollowRequests(prev => prev.filter(r => r._id !== id));
    } catch (e) {
      console.error("Failed to decline request", e);
    }
  };

  const fetchNotifications = async (pageNum) => {
    pageNum === 1 ? setLoading(true) : setFetchingMore(true);
    try {
      if (pageNum === 1) {
        fetchFollowRequests();
      }
      const res = await api.get(`/api/notifications?page=${pageNum}&limit=15`);
      if (res.data.success) {
        if (pageNum === 1) {
          setNotifications(res.data.data);
        } else {
          setNotifications(prev => [...prev, ...res.data.data]);
        }
        setUnreadCount(res.data.unreadCount);
        setHasMore(res.data.pagination.hasMore);
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkingRead(true);
    try {
      await api.put("/api/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("Failed to mark notifications as read", e);
    } finally {
      setMarkingRead(false);
    }
  };

  const handleMarkOneRead = async (e, id) => {
    e.stopPropagation();
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (e) {
      console.error("Failed to delete notification", e);
    }
  };

  const handleNotificationClick = async (notif) => {
    const idsToMark = notif.ids || [notif._id];
    
    if (!notif.read) {
      setNotifications(prev => prev.map(n => idsToMark.includes(n._id) ? { ...n, read: true } : n));
      Promise.all(idsToMark.map(id => api.put(`/api/notifications/${id}/read`))).catch(()=>console.error('Failed to mark read'));
    }

    if (notif.post) {
      navigate(`/app/profile/${notif.sender?._id || notif.sender}`); 
    } else if (notif.sender) {
      navigate(`/app/profile/${notif.sender?._id || notif.sender}`);
    }
  };

  const groupedNotifications = groupNotifications(notifications);
  const categorized = categorizeNotifications(groupedNotifications);

  return (
    <div className="w-full max-w-xl mx-auto pb-safe-20 lg:pb-8 bg-bg-base min-h-screen">
      {/* Sticky Instagram Header */}
      <div className="sticky top-0 z-30 bg-bg-base/95 backdrop-blur-xl border-b border-border-soft/50 px-4 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-primary-500/20 text-primary-500 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingRead}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-500 hover:text-primary-400 bg-primary-500/10 hover:bg-primary-500/20 px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Content */}
      {loading && page === 1 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : groupedNotifications.length === 0 && followRequests.length === 0 ? (
        <div className="text-center py-24 px-4">
          <div className="w-16 h-16 rounded-full bg-bg-surface border border-border-soft flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-text-secondary" />
          </div>
          <p className="font-bold text-text-primary text-base">No notifications yet</p>
          <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto">
            When someone follows you, likes your posts, or mentions you, you'll see it here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border-soft/30">
          {/* Follow Requests */}
          {followRequests.length > 0 && (
            <div className="py-2">
              <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider px-4 py-2">
                Follow Requests ({followRequests.length})
              </h2>
              <div className="divide-y divide-border-soft/20">
                {followRequests.map((req) => (
                  <div key={req._id} className="flex items-center justify-between px-4 py-3 hover:bg-bg-surface-hover/60 transition-colors">
                    <Link to={`/app/profile/${req._id}`} className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar src={req.profilePicture || req.avatar} fallback={req.username?.charAt(0)} className="w-11 h-11 rounded-full object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-text-primary text-sm truncate">@{req.username}</p>
                        <p className="text-xs text-text-secondary truncate">{req.fullName || 'Requested to follow you'}</p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button
                        onClick={() => handleAcceptRequest(req._id)}
                        className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(req._id)}
                        className="px-3 py-1.5 bg-bg-surface border border-border-soft text-text-primary text-xs font-bold rounded-lg hover:bg-bg-surface-hover transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categorized Sections: Today, This Week, Earlier */}
          {['Today', 'This Week', 'Earlier'].map((sectionTitle) => {
            let sectionItems = [];
            if (sectionTitle === 'Today') sectionItems = categorized.today;
            if (sectionTitle === 'This Week') sectionItems = categorized.thisWeek;
            if (sectionTitle === 'Earlier') sectionItems = categorized.earlier;

            if (sectionItems.length === 0) return null;

            return (
              <div key={sectionTitle} className="py-2">
                <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider px-4 py-2">
                  {sectionTitle}
                </h2>
                <div className="divide-y divide-border-soft/20">
                  {sectionItems.map((group, idx) => (
                    <NotificationItem
                      key={group._id}
                      group={group}
                      isLast={sectionTitle === 'Earlier' && idx === sectionItems.length - 1}
                      lastNotificationRef={lastNotificationRef}
                      handleNotificationClick={handleNotificationClick}
                      handleMarkOneRead={handleMarkOneRead}
                      handleDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {fetchingMore && (
            <div className="py-4 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
