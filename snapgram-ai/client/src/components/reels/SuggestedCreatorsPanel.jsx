import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { FollowButton } from "../profile/FollowButton";
import api from "../../services/api";

export const SuggestedCreatorsPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/users/suggested?limit=4");
        if (!cancelled && res.data.success) setUsers(res.data.data);
      } catch {
        // Non-critical panel — leave empty on failure.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && users.length === 0) return null;

  return (
    <div className="warm-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary-500" />
          <h3 className="text-sm font-bold text-text-primary">Suggested Creators</h3>
        </div>
        <Link to="/app/explore" className="text-xs font-semibold text-primary-500 hover:text-primary-600">
          See All
        </Link>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 rounded-xl bg-bg-surface-hover animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user._id} className="flex items-center justify-between gap-2">
              <Link to={`/app/profile/${user._id}`} className="flex items-center gap-2.5 min-w-0">
                <Avatar src={user.profilePicture || user.avatar} fallback={user.username?.charAt(0)?.toUpperCase()} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate leading-tight">@{user.username}</p>
                  <p className="text-xs text-text-secondary truncate">{user.category || "Suggested for you"}</p>
                </div>
              </Link>
              <FollowButton
                userId={user._id}
                targetUser={user}
                className="h-8 px-3 text-xs font-semibold rounded-full flex-shrink-0"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
