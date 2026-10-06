import { AtSign, Heart, UserPlus, MessageCircle, Send, Download, Bell } from "lucide-react";

/**
 * Shared type -> icon / action-verb mapping for notification-shaped data.
 * Used by the full Notifications page and by smaller previews (e.g. the
 * profile page's Recent Activity card) so a given notification type always
 * reads the same way everywhere.
 */
export const notificationTypeIcon = (type) => {
  switch (type) {
    case "mention":
    case "tag": return <AtSign className="w-3 h-3 text-primary-300" />;
    case "like":
    case "story_like": return <Heart className="w-3 h-3 text-red-500 fill-red-500" />;
    case "follow":
    case "follow_accepted":
    case "accept_request":
    case "follow_request": return <UserPlus className="w-3 h-3 text-emerald-400" />;
    case "comment":
    case "reply": return <MessageCircle className="w-3 h-3 text-primary-400" />;
    case "story_reply":
    case "story":
    case "reel": return <Send className="w-3 h-3 text-primary-400" />;
    case "story_downloaded":
    case "reel_downloaded": return <Download className="w-3 h-3 text-primary-400" />;
    case "save": return <Heart className="w-3 h-3 text-amber-400 fill-amber-400" />;
    case "system": return <Bell className="w-3 h-3 text-primary-400" />;
    default: return <Bell className="w-3 h-3 text-text-secondary" />;
  }
};

export const notificationActionText = (type) => {
  switch (type) {
    case "mention": return "mentioned you in a post.";
    case "tag": return "tagged you in a post.";
    case "like": return "liked your post.";
    case "story_like": return "liked your story.";
    case "follow": return "started following you.";
    case "follow_request": return "requested to follow you.";
    case "accept_request": return "accepted your follow request.";
    case "follow_accepted": return "accepted your follow request.";
    case "comment": return "commented on your post.";
    case "reply": return "replied to your comment.";
    case "story_reply": return "replied to your story.";
    case "story": return "mentioned you in their story.";
    case "reel": return "shared a reel with you.";
    case "save": return "saved your post.";
    case "system": return "sent a system update.";
    default: return "sent you a notification.";
  }
};
