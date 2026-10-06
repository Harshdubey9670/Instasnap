import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { cn } from "../../utils/cn";

const DetailVideo = ({ src }) => (
  <video src={src} controls autoPlay loop muted playsInline className="w-full h-full object-contain" />
);

/**
 * Large immersive media viewer for the Post Detail page — bigger and with
 * always-visible controls + a thumbnail strip, unlike the compact feed
 * carousel (PostMediaCarousel) which stays optimized for card density.
 */
export const PostDetailMediaViewer = ({ mediaItems, title, location, showThumbnails = true }) => {
  const [index, setIndex] = useState(0);
  const isCarousel = mediaItems.length > 1;
  const active = mediaItems[index];

  return (
    <div>
      <div className="relative w-full aspect-[4/5] lg:aspect-square bg-black rounded-2xl lg:rounded-3xl overflow-hidden group">
        {active?.type === "video" ? (
          <DetailVideo src={active.url} />
        ) : (
          <img src={active?.url} alt={active?.altText || "Post media"} className="w-full h-full object-contain" />
        )}

        {isCarousel && (
          <>
            {index > 0 && (
              <button
                onClick={() => setIndex((i) => i - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                aria-label="Previous media"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {index < mediaItems.length - 1 && (
              <button
                onClick={() => setIndex((i) => i + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                aria-label="Next media"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <span className="absolute top-3 right-3 text-[11px] font-semibold text-white bg-black/55 rounded-full px-2.5 py-1 z-10">
              {index + 1}/{mediaItems.length}
            </span>
          </>
        )}

        {(title || location) && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pt-10 pb-3.5 pointer-events-none">
            {title && <p className="text-white font-bold text-base drop-shadow">{title}</p>}
            {location && (
              <p className="text-white/85 text-xs flex items-center gap-1 mt-0.5 drop-shadow">
                <MapPin className="w-3 h-3" /> {location}
              </p>
            )}
          </div>
        )}
      </div>

      {showThumbnails && isCarousel && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mt-3">
          {mediaItems.map((m, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={cn(
                "relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors",
                index === i ? "border-primary-500" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              {m.type === "video" ? (
                <video src={m.url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={m.url} className="w-full h-full object-cover" alt="" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
