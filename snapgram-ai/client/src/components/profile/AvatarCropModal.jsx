import { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ZoomIn, ZoomOut, RotateCcw, Check, X } from 'lucide-react';

export const AvatarCropModal = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const CROP_SIZE = 260; // preview diameter in px

  // Reset zoom and offset when a new image is loaded
  useEffect(() => {
    if (isOpen && imageSrc) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setImageLoaded(false);
    }
  }, [isOpen, imageSrc]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(3, Math.max(1, +(prev + delta).toFixed(2))));
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleSaveCrop = () => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const outputSize = 512; // High-res square output
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const imgAspect = img.naturalWidth / img.naturalHeight;
    let baseW, baseH;
    if (imgAspect > 1) {
      baseH = CROP_SIZE;
      baseW = CROP_SIZE * imgAspect;
    } else {
      baseW = CROP_SIZE;
      baseH = CROP_SIZE / imgAspect;
    }

    const currentW = baseW * zoom;
    const currentH = baseH * zoom;

    const imgCenterX = centerX + offset.x;
    const imgCenterY = centerY + offset.y;

    const relCropX = (centerX - (imgCenterX - currentW / 2)) * (img.naturalWidth / currentW);
    const relCropY = (centerY - (imgCenterY - currentH / 2)) * (img.naturalHeight / currentH);
    const relCropSize = CROP_SIZE * (img.naturalWidth / currentW);

    ctx.drawImage(
      img,
      relCropX,
      relCropY,
      relCropSize,
      relCropSize,
      0,
      0,
      outputSize,
      outputSize
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedUrl = URL.createObjectURL(blob);
          onCropComplete(blob, croppedUrl);
          onClose();
        }
      },
      'image/jpeg',
      0.95
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adjust Profile Picture">
      <div className="flex flex-col items-center py-2 space-y-5 select-none">
        <p className="text-xs text-text-secondary text-center">
          Drag to position your photo and use the slider to zoom in or out.
        </p>

        {/* Viewport / Crop area container */}
        <div
          ref={containerRef}
          className="relative w-72 h-72 rounded-2xl bg-neutral-950 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing border border-border-soft shadow-inner"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          {/* Target image */}
          {imageSrc && (
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop preview"
              draggable={false}
              onLoad={() => setImageLoaded(true)}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.08s ease-out',
                maxHeight: CROP_SIZE,
                maxWidth: 'none',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
              className="object-contain"
            />
          )}

          {/* Dark mask overlay outside the circle */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle ${CROP_SIZE / 2}px at center, transparent ${CROP_SIZE / 2 - 1}px, rgba(0, 0, 0, 0.72) ${CROP_SIZE / 2}px)`,
            }}
          />

          {/* Circle border guideline */}
          <div
            className="absolute rounded-full border-2 border-white/80 pointer-events-none shadow-lg"
            style={{
              width: `${CROP_SIZE}px`,
              height: `${CROP_SIZE}px`,
            }}
          />
        </div>

        {/* Zoom controls & slider */}
        <div className="w-full max-w-xs space-y-3 px-2">
          <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
            <span>Zoom</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(1, +(prev - 0.15).toFixed(2)))}
              className="p-1.5 rounded-lg bg-bg-surface border border-border-soft hover:bg-bg-surface-hover text-text-primary"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-purple-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />

            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3, +(prev + 0.15).toFixed(2)))}
              className="p-1.5 rounded-lg bg-bg-surface border border-border-soft hover:bg-bg-surface-hover text-text-primary"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-bg-surface border border-border-soft hover:bg-bg-surface-hover text-text-secondary hover:text-text-primary"
              title="Reset position and zoom"
              aria-label="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 w-full pt-2 border-t border-border-soft">
          <Button type="button" variant="outline" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSaveCrop}
            size="sm"
            className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Check className="w-4 h-4" />
            Set Picture
          </Button>
        </div>
      </div>
    </Modal>
  );
};
