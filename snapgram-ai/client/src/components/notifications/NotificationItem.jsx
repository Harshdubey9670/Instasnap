import React from 'react';
import { Link } from 'react-router-dom';
import { AtSign, Heart, UserPlus, MessageCircle, Send, Bell, Trash2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { FollowButton } from '../profile/FollowButton';

export const notificationIcon = (type) => {
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

export const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
};

export const formatGroupedText = (senders, type) => {
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

export const NotificationItem = ({
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
