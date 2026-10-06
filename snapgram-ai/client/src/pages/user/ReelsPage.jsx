import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "../../services/api";
import { useIsDesktop } from "../../hooks/useMediaQuery";
import { DesktopReelsView } from "../../components/reels/DesktopReelsView";
import { MobileReelsFeed } from "../../components/reels/MobileReelsFeed";

/**
 * Entry point for /app/reels and /app/spotlight. Fetches the reel feed once
 * and hands it to whichever surface matches the current viewport:
 * - >= lg (desktop website): DesktopReelsView, a browse-then-watch 3-column layout
 * - < lg (mobile app / responsive mobile web): MobileReelsFeed, the immersive swipe feed
 * Both surfaces share the same data, like/save/share logic (useReelActions)
 * and Following/For You tabs so behavior never drifts between them.
 */
const ReelsPage = () => {
  const isDesktop = useIsDesktop();
  const { user: authUser } = useSelector((s) => s.auth);
  const [searchParams] = useSearchParams();
  const targetReelId = searchParams.get('id');

  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState("forYou");

  // Mobile immersive feed state
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef(null);

  // Desktop browser state
  const [activeReel, setActiveReel] = useState(null);

  const fetchReels = useCallback(async (pageNum) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const res = await api.get(`/api/reels?page=${pageNum}&limit=8`);
      if (res.data.success) {
        setReels((prev) => (pageNum === 1 ? res.data.data : [...prev, ...res.data.data]));
        setHasMore(res.data.pagination.hasMore);
      }
    } catch (err) {
      console.error("Failed to load reels:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchReels(1);
  }, [fetchReels]);

  // Handle deep-linking to a specific reel from notifications or shared links
  useEffect(() => {
    if (!targetReelId) return;
    const match = reels.find((r) => r._id === targetReelId);
    if (match) {
      if (isDesktop) {
        setActiveReel(match);
      } else {
        const idx = reels.findIndex((r) => r._id === targetReelId);
        if (idx !== -1) setActiveIndex(idx);
      }
    } else if (!loading) {
      // If target reel is not in the initially loaded batch, fetch it directly
      api.get(`/api/reels/${targetReelId}`).then((res) => {
        if (res.data?.success && res.data.data) {
          setReels((prev) => [res.data.data, ...prev.filter((r) => r._id !== targetReelId)]);
          if (isDesktop) {
            setActiveReel(res.data.data);
          } else {
            setActiveIndex(0);
          }
        }
      }).catch((err) => console.error("Failed to load target reel:", err));
    }
  }, [targetReelId, reels, loading, isDesktop]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setPage((p) => {
      const next = p + 1;
      fetchReels(next);
      return next;
    });
  }, [hasMore, loadingMore, fetchReels]);

  // "Following" filters the loaded feed down to people the viewer already
  // follows (real Redux data) — no separate backend endpoint needed.
  const followingIds = useMemo(
    () => new Set((authUser?.following || []).map((id) => (id?._id || id)?.toString())),
    [authUser?.following]
  );
  const filteredReels = useMemo(() => {
    if (tab !== "following") return reels;
    return reels.filter((r) => followingIds.has((r.user?._id || r.user)?.toString()));
  }, [reels, tab, followingIds]);

  // Keep the desktop player pointed at a reel that's actually in the current list.
  useEffect(() => {
    if (!isDesktop) return;
    if (!filteredReels.length) {
      setActiveReel(null);
      return;
    }
    if (!activeReel || !filteredReels.some((r) => r._id === activeReel._id)) {
      setActiveReel(filteredReels[0]);
    }
  }, [isDesktop, filteredReels, activeReel]);

  const handleReelDeleted = useCallback((id) => {
    setReels((prev) => prev.filter((r) => r._id !== id));
    setActiveReel((prev) => (prev?._id === id ? null : prev));
  }, []);

  // Mobile: IntersectionObserver drives active-video tracking, view counting
  // and infinite scroll off the actual scroll container.
  useEffect(() => {
    if (isDesktop) return;
    const items = containerRef.current?.querySelectorAll("[data-reel-item]");
    if (!items?.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.dataset.reelIndex, 10);
            setActiveIndex(idx);

            if (entry.target.dataset.reelId) {
              api.put(`/api/reels/${entry.target.dataset.reelId}/view`).catch(() => {});
            }

            if (idx >= filteredReels.length - 2) {
              loadMore();
            }
          }
        });
      },
      { root: containerRef.current, threshold: 0.6 }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [isDesktop, filteredReels, loadMore]);

  if (loading) {
    return isDesktop ? (
      <div className="hidden lg:flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    ) : (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-40">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  if (isDesktop) {
    return (
      <DesktopReelsView
        reels={filteredReels}
        tab={tab}
        onTabChange={setTab}
        activeReel={activeReel}
        onSelectReel={setActiveReel}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
        onReelDeleted={handleReelDeleted}
      />
    );
  }

  return (
    <MobileReelsFeed
      reels={filteredReels}
      loadingMore={loadingMore}
      tab={tab}
      onTabChange={setTab}
      containerRef={containerRef}
      activeIndex={activeIndex}
      isMuted={isMuted}
      onMuteToggle={() => setIsMuted((m) => !m)}
    />
  );
};

export default ReelsPage;
