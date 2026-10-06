import { Megaphone, MapPin, Lock, Loader2, Send, Save, CalendarClock } from "lucide-react";
import { MediaDropzone } from "../../components/create/MediaDropzone";
import { TagsInput } from "../../components/create/TagsInput";
import { PostPreviewCard } from "../../components/create/PostPreviewCard";
import { useCreatePostFlow } from "../../hooks/useCreatePostFlow";
import { cn } from "../../utils/cn";

const POST_OPTIONS = [
  { id: "now", label: "Post now" },
  { id: "schedule", label: "Schedule" },
  { id: "draft", label: "Save as draft" },
];

const CreatePostPage = () => {
  const {
    authUser,
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
    postOption,
    setPostOption,
    scheduledAt,
    setScheduledAt,
    isDragging,
    setIsDragging,
    isSubmitting,
    uploadProgress,
    fileInputRef,
    handleDrop,
    handleFileSelect,
    removeMedia,
    handleSubmit,
    buildFinalCaption,
  } = useCreatePostFlow();

  const primaryLabel = postOption === "schedule" ? "Schedule Post" : postOption === "draft" ? "Save Draft" : "Publish";
  const primaryIcon = postOption === "schedule" ? CalendarClock : postOption === "draft" ? Save : Send;
  const PrimaryIcon = primaryIcon;

  const canSubmit = !isSubmitting && (previews.length > 0 || caption.trim().length > 0);

  return (
    <div className="w-full max-w-[1400px] mx-auto pb-safe-24 lg:pb-10">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:items-start lg:px-4 lg:pt-4">
        {/* Center: form */}
        <div className="min-w-0 bg-bg-base lg:bg-bg-surface lg:border lg:border-border-soft lg:rounded-[28px] lg:p-6 px-4 py-4 lg:px-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Megaphone className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-extrabold text-text-primary tracking-tight">Create a Post</h1>
                <p className="text-xs lg:text-sm text-text-secondary mt-0.5">Share your moments and inspire the world ✨</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={isSubmitting || (previews.length === 0 && !caption.trim())}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-text-primary bg-bg-surface-hover border border-border-soft hover:bg-bg-surface px-3.5 py-2 rounded-full transition-colors disabled:opacity-40 shrink-0"
            >
              <Save className="w-3.5 h-3.5" /> Save as Draft
            </button>
          </div>

          <div className="space-y-6">
            {/* Media */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-sm font-bold text-text-primary">Media</h2>
                  <p className="text-xs text-text-secondary">Add photos or videos (up to 10 files)</p>
                </div>
                {previews.length > 0 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-primary-500 hover:text-primary-600"
                  >
                    + Add More
                  </button>
                )}
              </div>
              <MediaDropzone
                previews={previews}
                currentIndex={currentIndex}
                setCurrentIndex={setCurrentIndex}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                fileInputRef={fileInputRef}
                onFileChange={handleFileSelect}
                onDrop={handleDrop}
                onRemove={removeMedia}
              />
              {isSubmitting && uploadProgress > 0 && (
                <div className="mt-3">
                  <div className="w-full h-1.5 bg-bg-surface-hover rounded-full overflow-hidden">
                    <div className="h-full hero-gradient transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Caption */}
            <div>
              <h2 className="text-sm font-bold text-text-primary mb-2">Caption</h2>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Golden hours, good vibes, and a little more of this life..."
                maxLength={2200}
                rows={4}
                disabled={isSubmitting}
                className="w-full resize-none bg-bg-surface-hover border border-border-soft rounded-xl px-3.5 py-3 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:border-primary-500 transition-colors"
              />
              <p className={cn("text-right text-xs mt-1", caption.length >= 2200 ? "text-red-500" : "text-text-secondary")}>
                {caption.length}/2,200
              </p>
            </div>

            {/* Location + Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm font-semibold text-text-primary">Location</span>
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location"
                  disabled={isSubmitting}
                  className="w-full bg-bg-surface-hover border border-border-soft rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <TagsInput tagInput={tagInput} setTagInput={setTagInput} tags={tags} addTagsFromInput={addTagsFromInput} removeTag={removeTag} />
            </div>

            {/* Audience */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-text-secondary" />
                <span className="text-sm font-semibold text-text-primary">Audience</span>
              </div>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                disabled={isSubmitting}
                className="w-full sm:w-64 bg-bg-surface-hover border border-border-soft rounded-xl px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-primary-500 transition-colors"
              >
                <option value="everyone">Everyone</option>
                <option value="closeFriends">Close Friends</option>
              </select>
              <p className="text-xs text-text-secondary mt-1.5">
                {audience === "closeFriends" ? "Only your Close Friends list can see this post." : "Anyone can see this post."}
              </p>
            </div>

            {/* Post Options */}
            <div>
              <h2 className="text-sm font-bold text-text-primary mb-2">Post Options</h2>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {POST_OPTIONS.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                    <input
                      type="radio"
                      name="postOption"
                      checked={postOption === opt.id}
                      onChange={() => setPostOption(opt.id)}
                      className="w-4 h-4 accent-primary-500"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              {postOption === "schedule" && (
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)}
                  className="mt-3 w-full sm:w-64 bg-bg-surface-hover border border-border-soft rounded-xl px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-primary-500 transition-colors"
                />
              )}
            </div>

            {/* Primary action */}
            <button
              type="button"
              onClick={() => handleSubmit(postOption)}
              disabled={!canSubmit}
              className="orange-btn w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-40 disabled:pointer-events-none"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PrimaryIcon className="w-4 h-4" />}
              {isSubmitting ? "Publishing..." : primaryLabel}
            </button>
          </div>
        </div>

        {/* Right: live preview — desktop only */}
        <div className="hidden lg:block sticky top-4">
          <p className="text-sm font-bold text-text-primary mb-1">Post Preview</p>
          <p className="text-xs text-text-secondary mb-3">Here's how your post will look</p>
          <PostPreviewCard authUser={authUser} previews={previews} caption={buildFinalCaption()} location={location} audience={audience} />
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;
