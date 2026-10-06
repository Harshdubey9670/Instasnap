import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Activity } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import api from "../../services/api";
import { notificationTypeIcon, notificationActionText } from "../../utils/notificationText";

const shortTimeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

/**
 * Own-profile-only preview of the last few things that happened on your
 * content — a small window into the real Notification feed, not a separate
 * activity system.
 */
export const RecentActivityCard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/api/notifications?page=1&limit=5")
      .then((res) => {
        if (!cancelled && res.data.success) setItems(res.data.data);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <div className="warm-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-500" /> Recent Activity
        </h3>
        <Link to="/app/notifications" className="text-xs font-semibold text-primary-500 hover:text-primary-600">
          See All
        </Link>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 rounded-xl bg-bg-surface-hover animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n._id} className="flex items-center gap-2.5">
              <div className="relative shrink-0">
                <Avatar src={n.sender?.profilePicture || n.sender?.avatar} fallback={n.sender?.username?.charAt(0)?.toUpperCase()} size="sm" />
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-bg-surface border border-bg-surface flex items-center justify-center">
                  {notificationTypeIcon(n.type)}
                </span>
              </div>
              <p className="text-xs text-text-primary leading-snug min-w-0">
                <span className="font-semibold">{n.sender?.username}</span> {notificationActionText(n.type)}{" "}
                <span className="text-text-secondary">{shortTimeAgo(n.createdAt)}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
