import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import api from "../services/api";
import { useToast } from "../components/ui/Toast";
import { updateSavedReels } from "../store/authSlice";

export const formatCount = (n = 0) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

/**
 * Shared like / share / download logic for a single reel, used by both the
 * immersive mobile feed and the desktop player so the two surfaces can never
 * drift out of sync on behavior.
 */
export const useReelActions = (reel) => {
  const { user: authUser } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const [liked, setLiked] = useState(
    reel.likes?.some((id) => id === authUser?._id || id?._id === authUser?._id)
  );
  const [likesCount, setLikesCount] = useState(reel.likes?.length ?? 0);
  const [saved, setSaved] = useState(
    authUser?.savedReels?.some((id) => (id?._id || id)?.toString() === reel._id) ?? false
  );
  const [downloading, setDownloading] = useState(false);

  const triggerLike = async () => {
    setLiked(true);
    setLikesCount((c) => c + 1);
    try {
      await api.put(`/api/reels/${reel._id}/like`);
    } catch {
      setLiked(false);
      setLikesCount((c) => c - 1);
    }
  };

  const toggleLike = async () => {
    if (liked) {
      setLiked(false);
      setLikesCount((c) => c - 1);
      try {
        await api.put(`/api/reels/${reel._id}/like`);
      } catch {
        setLiked(true);
        setLikesCount((c) => c + 1);
      }
    } else {
      triggerLike();
    }
  };

  const toggleSave = async () => {
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      const res = await api.put(`/api/reels/${reel._id}/save`);
      if (res.data.success) {
        dispatch(updateSavedReels(res.data.data));
        toast({ title: wasSaved ? "Removed from saved" : "Saved reel" });
      }
    } catch {
      setSaved(wasSaved);
      toast({ variant: "error", title: "Action Failed", description: "Could not save reel." });
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await api.post(`/api/reels/${reel._id}/download`);
      const { downloadUrl } = res.data;
      if (!downloadUrl) throw new Error("No download URL returned");

      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reel-${reel._id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: "Reel downloaded successfully" });
    } catch (err) {
      if (err.response?.status === 403) {
        toast({
          variant: "error",
          title: "Download Restricted",
          description: err.response.data?.message || "The creator has disabled downloads for this reel",
        });
      } else {
        toast({
          variant: "error",
          title: "Download Failed",
          description: "Could not download reel. Please try again.",
        });
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      await api.put(`/api/reels/${reel._id}/share`);
      const shareUrl = `${window.location.origin}/app/reels?reel=${reel._id}`;
      if (navigator.share) {
        await navigator.share({ title: reel.caption, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied!" });
      }
    } catch {}
  };

  return {
    liked,
    likesCount,
    toggleLike,
    triggerLike,
    saved,
    toggleSave,
    downloading,
    handleDownload,
    handleShare,
  };
};
