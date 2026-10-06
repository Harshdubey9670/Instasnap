import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Repeat, Download, Volume2, VolumeX, Trash2, Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";
import { useReelActions } from "../../hooks/useReelActions";
import api from "../../services/api";
import { useToast } from "../ui/Toast";

/**
 * The "•••" overflow menu on the desktop player — houses Remix / Download /
 * Mute (and Delete, for the reel's own author) so the visible action rail
 * can stay to the clean 4-icon set the desktop layout uses.
 */
export const ReelMoreMenu = ({ reel, isMuted, onMuteToggle, onDeleted, className }) => {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser } = useSelector((s) => s.auth);
  const { downloading, handleDownload } = useReelActions(reel);

  const isOwner = authUser?._id && reel.user?._id === authUser._id;

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/api/reels/${reel._id}`);
      toast({ title: "Reel deleted" });
      onDeleted?.(reel._id);
    } catch {
      toast({ variant: "error", title: "Could not delete reel" });
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  };

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="More options"
        aria-label="More options"
        className="w-9 h-9 rounded-full bg-black/30 hover:bg-black/45 backdrop-blur-md flex items-center justify-center text-white transition-colors"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-20 w-52 rounded-2xl bg-bg-surface border border-border-soft shadow-[0_16px_40px_rgba(0,0,0,0.18)] py-1.5 overflow-hidden">
          <button
            onClick={() => { setOpen(false); navigate(`/app/reels/create?remix=${reel._id}`); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-bg-surface-hover transition-colors"
          >
            <Repeat className="w-4 h-4" /> Remix this reel
          </button>
          <button
            onClick={() => { handleDownload(); setOpen(false); }}
            disabled={downloading}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-bg-surface-hover transition-colors disabled:opacity-60"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Save to device
          </button>
          <button
            onClick={() => { onMuteToggle(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-bg-surface-hover transition-colors"
          >
            {isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {isMuted ? "Unmute" : "Mute"}
          </button>
          {isOwner && (
            <>
              <div className="my-1 border-t border-border-soft" />
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-60"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete reel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
