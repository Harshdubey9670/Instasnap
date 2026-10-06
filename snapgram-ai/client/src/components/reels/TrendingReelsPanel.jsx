import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import api from "../../services/api";
import { ReelListItem } from "./ReelListItem";

export const TrendingReelsPanel = ({ activeReelId, onSelect }) => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/reels?page=1&limit=4&sort=trending");
        if (!cancelled && res.data.success) setReels(res.data.data);
      } catch {
        // Trending is a nice-to-have panel — fail silently, keep the rail usable.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && reels.length === 0) return null;

  return (
    <div className="warm-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary-500" />
        <h3 className="text-sm font-bold text-text-primary">Trending Reels</h3>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[4.75rem] rounded-xl bg-bg-surface-hover animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {reels.map((reel) => (
            <ReelListItem key={reel._id} reel={reel} size="sm" active={reel._id === activeReelId} onClick={() => onSelect(reel)} />
          ))}
        </div>
      )}
    </div>
  );
};
