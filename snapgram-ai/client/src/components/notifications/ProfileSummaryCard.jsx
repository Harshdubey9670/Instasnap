import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Settings } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import api from "../../services/api";

export const ProfileSummaryCard = () => {
  const { user: authUser } = useSelector((s) => s.auth);
  const [postsCount, setPostsCount] = useState(null);

  useEffect(() => {
    if (!authUser?._id) return;
    let cancelled = false;
    api
      .get(`/api/posts/user/${authUser._id}?page=1&limit=1`)
      .then((res) => {
        if (!cancelled && res.data.success) setPostsCount(res.data.data.pagination.total);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [authUser?._id]);

  if (!authUser) return null;

  return (
    <div className="warm-card p-4">
      <div className="flex items-center justify-between gap-3">
        <Link to="/app/profile" className="flex items-center gap-3 min-w-0">
          <Avatar src={authUser.profilePicture || authUser.avatar} fallback={authUser.username?.charAt(0)?.toUpperCase()} size="lg" />
          <div className="min-w-0">
            <p className="font-bold text-text-primary text-sm truncate">{authUser.fullName || authUser.username}</p>
            <p className="text-xs text-text-secondary truncate">@{authUser.username}</p>
          </div>
        </Link>
        <Link
          to="/app/settings"
          className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-primary-500 hover:bg-bg-surface-hover transition-colors shrink-0"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border-soft text-center">
        <div>
          <p className="font-bold text-text-primary text-sm">{postsCount ?? "–"}</p>
          <p className="text-[11px] text-text-secondary">Posts</p>
        </div>
        <div>
          <p className="font-bold text-text-primary text-sm">{authUser.followers?.length ?? 0}</p>
          <p className="text-[11px] text-text-secondary">Followers</p>
        </div>
        <div>
          <p className="font-bold text-text-primary text-sm">{authUser.following?.length ?? 0}</p>
          <p className="text-[11px] text-text-secondary">Following</p>
        </div>
      </div>
    </div>
  );
};
