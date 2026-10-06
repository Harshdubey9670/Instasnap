import { UploadCloud, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Media upload zone shared by desktop and mobile Create Post layouts.
 * Empty state: drag-and-drop dropzone. Populated state: a large active
 * preview (desktop only, via `hidden lg:flex`) plus a thumbnail strip that's
 * the primary view on mobile.
 */
export const MediaDropzone = ({
  previews,
  currentIndex,
  setCurrentIndex,
  isDragging,
  setIsDragging,
  fileInputRef,
  onFileChange,
  onDrop,
  onRemove,
  maxFiles = 10,
}) => {
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div>
      <input
        type="file"
        multiple
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
        onChange={onFileChange}
      />

      {previews.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center text-center rounded-3xl border-2 border-dashed cursor-pointer transition-colors",
            "px-6 py-10 lg:py-16",
            isDragging ? "border-primary-500 bg-primary-500/5" : "border-border-soft bg-bg-surface-hover hover:border-primary-400/60"
          )}
        >
          <div className="w-14 h-14 rounded-full bg-bg-surface border border-border-soft flex items-center justify-center mb-4">
            <UploadCloud className="w-6 h-6 text-primary-500" />
          </div>
          <p className="text-text-primary font-semibold mb-1">Drag &amp; drop your photos or videos here</p>
          <p className="text-text-secondary text-sm mb-5">or</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="orange-btn text-sm"
          >
            Select from device
          </button>
          <p className="text-text-secondary text-xs mt-5">Supports JPG, PNG, MP4, MOV · Max 100MB each</p>
        </div>
      ) : (
        <div>
          {/* Large active preview — desktop only */}
          <div className="hidden lg:flex relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black/5 border border-border-soft group">
            {previews[currentIndex].type === "image" ? (
              <img src={previews[currentIndex].url} alt="Preview" className="w-full h-full object-contain" />
            ) : (
              <video src={previews[currentIndex].url} controls className="w-full h-full object-contain" />
            )}

            <button
              type="button"
              onClick={() => onRemove(currentIndex)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100 z-10"
              aria-label="Remove media"
            >
              <X className="w-4 h-4" />
            </button>

            {previews.length > 1 && (
              <>
                {currentIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(currentIndex - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {currentIndex < previews.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Thumbnail strip — always visible, primary view on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mt-3 lg:mt-3 pb-1">
            {previews.map((p, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors",
                  currentIndex === i ? "border-primary-500" : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                {p.type === "image" ? (
                  <img src={p.url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <video src={p.url} className="w-full h-full object-cover" />
                )}
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(i);
                  }}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5" />
                </span>
              </button>
            ))}
            {previews.length < maxFiles && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-border-soft flex items-center justify-center text-text-secondary hover:border-primary-500 hover:text-primary-500 transition-colors"
                aria-label="Add more media"
              >
                +
              </button>
            )}
          </div>
          <p className="text-text-secondary text-xs mt-2">{previews.length}/{maxFiles} added</p>
        </div>
      )}
    </div>
  );
};
