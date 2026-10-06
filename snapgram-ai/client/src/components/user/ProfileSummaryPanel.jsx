import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Settings, ArrowUpRight, Grid3x3 } from "lucide-react";
import api from "../../services/api";
import { SpatialPanel } from "../ui/spatial/SpatialPanel";
import { SpatialAvatar } from "../ui/spatial/SpatialAvatar";
import { SpatialIconButton } from "../ui/spatial/SpatialIconButton";
import { StoryHighlightsRow } from "../profile/StoryHighlightsRow";

// Left-column "Profile" glass panel shown on the Home page (desktop, xl+).
// Mirrors the real profile's stats/bio/grid using the same endpoints as ProfilePage.
export const ProfileSummaryPanel = () => {
  const { user: authUser } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser?._id) return;
    let cancelled = false;

    Promise.all([
      api.get(`/api/users/${authUser._id}`),
      api.get(`/api/posts/user/${authUser._id}?status=published`),
    ])
      .then(([profileRes, postsRes]) => {
        if (cancelled) return;
        if (profileRes.data.success) setProfile(profileRes.data.data);
        const fetchedPosts = postsRes.data?.data?.posts || postsRes.data?.data || [];
        setPosts(fetchedPosts.slice(0, 6));
      })
      .catch((err) => console.error("Failed to load profile summary", err))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [authUser?._id]);

  const displayUser = profile || authUser;
  const postsCount = profile?.postsCount ?? posts.length;
  const followersCount = profile?.followers?.length ?? authUser?.followers?.length ?? 0;
  const followingCount = profile?.following?.length ?? authUser?.following?.length ?? 0;

  return (
    <SpatialPanel
      className="h-full"
      header={
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary tracking-tight">Profile</h2>
          <div className="flex items-center gap-2">
            <Link to="/app/settings" aria-label="Settings">
              <SpatialIconButton size="sm" variant="ghost" tooltip="Settings">
                <Settings className="w-4 h-4" />
              </SpatialIconButton>
            </Link>
            <Link to="/app/profile" aria-label="Open full profile">
              <SpatialIconButton size="sm" variant="ghost" tooltip="Open profile">
                <ArrowUpRight className="w-4 h-4" />
              </SpatialIconButton>
            </Link>
          </div>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center gap-3">
        <Link to="/app/profile">
          <SpatialAvatar
            src={displayUser?.profilePicture || displayUser?.avatar}
            alt={displayUser?.username}
            size="xl"
            fallback={displayUser?.username?.charAt(0)?.toUpperCase() || "U"}
          />
        </Link>

        <div>
          <h3 className="font-bold text-text-primary text-base leading-tight">
            {displayUser?.fullName || displayUser?.username}
          </h3>
          <p className="text-text-secondary text-sm">@{displayUser?.username}</p>
        </div>

        <div className="flex items-center justify-center gap-6 w-full py-1">
          {[
            { label: "Posts", value: postsCount },
            { label: "Followers", value: followersCount },
            { label: "Following", value: followingCount },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="font-bold text-text-primary text-sm">{stat.value}</span>
              <span className="text-text-secondary text-[11px]">{stat.label}</span>
            </div>
          ))}
        </div>

        {displayUser?.bio && (
          <p className="text-text-secondary text-xs leading-relaxed px-2">{displayUser.bio}</p>
        )}
      </div>

      {authUser?._id && (
        <div className="mt-4 -mx-1">
          <StoryHighlightsRow userId={authUser._id} isOwnProfile />
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-black/8 dark:border-white/10">
        <div className="flex items-center gap-1.5 text-text-secondary text-xs font-semibold mb-3">
          <Grid3x3 className="w-3.5 h-3.5" />
          <span>Recent posts</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-white/8 animate-pulse" />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1.5">
            {posts.map((post) => {
              const thumb = post.media?.[0]?.url || post.mediaUrl;
              return (
                <Link
                  key={post._id}
                  to={`/app/post/${post._id}`}
                  className="aspect-square rounded-lg overflow-hidden bg-white/8 hover:opacity-85 transition-opacity"
                >
                  {thumb && (
                    <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-text-secondary text-xs text-center py-4">No posts yet</p>
        )}
      </div>
    </SpatialPanel>
  );
};
