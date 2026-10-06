import { useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/ui/Toast";

const VALID_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "video/quicktime"];
const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * All state + submit logic for the Create Post page, shared by the desktop
 * and mobile layouts so both surfaces stay behaviorally identical. On mount
 * it also resumes the author's most recent real draft (a persisted Post
 * with status:'draft'), replacing the old localStorage-only draft restore.
 */
export const useCreatePostFlow = () => {
  const { user: authUser } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { toast } = useToast();

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]); // { url, type, altText }
  const [currentIndex, setCurrentIndex] = useState(0);

  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [audience, setAudience] = useState("everyone"); // 'everyone' | 'closeFriends'
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [hideLikes, setHideLikes] = useState(false);

  const [postOption, setPostOption] = useState("now"); // 'now' | 'schedule' | 'draft'
  const [scheduledAt, setScheduledAt] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resumedDraftId, setResumedDraftId] = useState(null);

  const fileInputRef = useRef(null);
  const previewsRef = useRef(previews);
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  // Revoke any outstanding object URLs when the page unmounts.
  useEffect(() => () => previewsRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  // Prefill from router state — e.g. the AI Copilot's "Create Post" action
  // hands off an already-uploaded (Cloudinary-hosted) image plus its prompt.
  // Marked `alreadyUploaded` so handleSubmit skips re-uploading it.
  useEffect(() => {
    const prefillMedia = routerLocation.state?.prefillMedia;
    if (!prefillMedia?.length) return;
    setFiles((prev) => [...prev, ...prefillMedia.map(() => null)]);
    setPreviews((prev) => [
      ...prev,
      ...prefillMedia.map((m) => ({ url: m.url, type: m.type || "image", altText: "", alreadyUploaded: true, public_id: m.public_id })),
    ]);
    if (routerLocation.state?.prefillCaption) setCaption(routerLocation.state.prefillCaption);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resume the most recent draft, if any — media can't be restored (it was
  // never uploaded), but caption/location/tags/audience pick up where the
  // author left off. Skipped when arriving with an explicit prefill (e.g.
  // from the AI Copilot) so it doesn't clobber that intent.
  useEffect(() => {
    if (!authUser?._id || routerLocation.state?.prefillMedia?.length) return;
    let cancelled = false;
    api
      .get(`/api/posts/user/${authUser._id}?status=draft&limit=1`)
      .then((res) => {
        if (cancelled || !res.data.success) return;
        const draft = res.data.data.posts?.[0];
        if (!draft) return;
        setResumedDraftId(draft._id);
        setCaption(draft.caption || "");
        setLocation(draft.location || "");
        setAudience(draft.audience || "everyone");
        setCommentsEnabled(draft.settings?.commentsEnabled ?? true);
        setHideLikes(draft.settings?.hideLikes ?? false);
        setTags(draft.hashtags || []);
        toast.info("Resumed your last draft", "Add media to finish it, or start fresh below.");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?._id]);

  const processFiles = useCallback(
    (selectedFiles) => {
      if (!selectedFiles || selectedFiles.length === 0) return;

      const newFiles = Array.from(selectedFiles).filter((file) => {
        if (!VALID_TYPES.includes(file.type)) {
          toast.error(`Invalid file type: ${file.name}`);
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`File too large: ${file.name}`);
          return false;
        }
        return true;
      });
      if (newFiles.length === 0) return;

      setFiles((prev) => [...prev, ...newFiles].slice(0, MAX_FILES));
      setPreviews((prev) => {
        const additions = newFiles.map((file) => ({
          url: URL.createObjectURL(file),
          type: file.type.startsWith("video/") ? "video" : "image",
          altText: "",
        }));
        const next = [...prev, ...additions].slice(0, MAX_FILES);
        if (prev.length === 0) setCurrentIndex(0);
        return next;
      });
    },
    [toast]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e) => processFiles(e.target.files);

  const removeMedia = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
    setCurrentIndex((idx) => (idx >= previews.length - 1 && idx > 0 ? idx - 1 : idx));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateAltText = (index, text) => {
    setPreviews((prev) => prev.map((p, i) => (i === index ? { ...p, altText: text } : p)));
  };

  const addTagsFromInput = () => {
    const raw = tagInput.trim();
    if (!raw) return;
    const parsed = raw
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, "").toLowerCase())
      .filter(Boolean);
    setTags((prev) => [...new Set([...prev, ...parsed])]);
    setTagInput("");
  };

  const removeTag = (idx) => setTags((prev) => prev.filter((_, i) => i !== idx));

  const buildFinalCaption = () => {
    const tagLine = tags.length ? tags.map((t) => `#${t}`).join(" ") : "";
    return [caption.trim(), tagLine].filter(Boolean).join("\n\n");
  };

  const handleSubmit = async (mode /* 'now' | 'schedule' | 'draft' */) => {
    const effectiveMode = mode || postOption;

    if (files.length === 0 && !caption.trim()) {
      toast.error("Please add a photo/video or write a caption.");
      return;
    }
    if (effectiveMode === "schedule" && !scheduledAt) {
      toast.error("Pick a date and time to schedule this post.");
      return;
    }
    if (effectiveMode === "schedule" && new Date(scheduledAt).getTime() <= Date.now()) {
      toast.error("Scheduled time must be in the future.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    try {
      let mediaData = [];
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          // Prefilled media (e.g. an AI-generated image) is already hosted —
          // skip re-uploading it and use its existing URL as-is.
          if (previews[i]?.alreadyUploaded) {
            mediaData.push({
              url: previews[i].url,
              public_id: previews[i].public_id,
              type: previews[i].type,
              altText: previews[i].altText || "",
            });
            continue;
          }
          const formData = new FormData();
          formData.append("image", files[i]);
          const uploadRes = await api.post("/api/upload", formData, {
            onUploadProgress: (evt) => {
              const base = (i / files.length) * 90;
              const current = (evt.loaded * 100) / evt.total;
              setUploadProgress(base + (current / files.length) * 0.9);
            },
          });
          if (!uploadRes.data.success) throw new Error(`Failed to upload media item ${i + 1}`);
          const { url, public_id, resource_type } = uploadRes.data.data;
          mediaData.push({
            url,
            public_id,
            type: resource_type === "video" ? "video" : "image",
            altText: previews[i]?.altText || "",
          });
        }
      }

      setUploadProgress(95);

      const status = effectiveMode === "now" ? "published" : effectiveMode === "schedule" ? "scheduled" : "draft";

      const res = await api.post("/api/posts", {
        caption: buildFinalCaption(),
        location,
        mediaData,
        status,
        scheduledAt: effectiveMode === "schedule" ? scheduledAt : undefined,
        audience,
        settings: { commentsEnabled, hideLikes, sharingEnabled: true },
      });

      if (res.data.success) {
        setUploadProgress(100);
        window.dispatchEvent(new Event("postCreated"));

        if (status === "published") {
          toast.success("Post published!", "Your post is now live.");
          navigate("/app");
        } else if (status === "scheduled") {
          toast.success("Post scheduled", `We'll keep it queued for ${new Date(scheduledAt).toLocaleString()}.`);
          navigate("/app/profile");
        } else {
          toast.success("Saved as draft", "Pick up right where you left off next time.");
          navigate("/app/profile");
        }
      }
    } catch (error) {
      toast.error("Failed to create post", error.response?.data?.message || "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    authUser,
    files,
    previews,
    currentIndex,
    setCurrentIndex,
    caption,
    setCaption,
    location,
    setLocation,
    tagInput,
    setTagInput,
    tags,
    addTagsFromInput,
    removeTag,
    audience,
    setAudience,
    commentsEnabled,
    setCommentsEnabled,
    hideLikes,
    setHideLikes,
    postOption,
    setPostOption,
    scheduledAt,
    setScheduledAt,
    isDragging,
    setIsDragging,
    isSubmitting,
    uploadProgress,
    resumedDraftId,
    fileInputRef,
    handleDrop,
    handleFileSelect,
    removeMedia,
    updateAltText,
    handleSubmit,
    buildFinalCaption,
  };
};
