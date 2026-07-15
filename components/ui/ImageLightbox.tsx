"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { XIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  transitionName?: string;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex, transitionName, onClose }: ImageLightboxProps): React.ReactElement {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStart = useRef<number | null>(null);

  const navigate = useCallback((index: number, dir: "left" | "right") => {
    if (isAnimating) return;
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setDirection(null);
      setIsAnimating(false);
    }, 250);
  }, [isAnimating]);

  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    navigate((currentIndex + 1) % images.length, "left");
  }, [currentIndex, images.length, navigate]);

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    navigate((currentIndex - 1 + images.length) % images.length, "right");
  }, [currentIndex, images.length, navigate]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    touchStart.current = null;
    if (Math.abs(diff) < 50) return;
    if (diff > 0) goNext();
    else goPrev();
  };

  const slideClass = direction === "left"
    ? "-translate-x-8 opacity-0"
    : direction === "right"
      ? "translate-x-8 opacity-0"
      : "translate-x-0 opacity-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
      >
        <XIcon size={20} weight="bold" />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <CaretLeftIcon size={20} weight="bold" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <CaretRightIcon size={20} weight="bold" />
          </button>
        </>
      )}

      <div
        className="relative z-10 max-w-[90vw] max-h-[80vh]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1} of ${images.length}`}
          className={`max-w-full max-h-[80vh] object-contain rounded-2xl transition-all duration-250 ease-out ${slideClass}`}
          style={{ viewTransitionName: transitionName ? `${transitionName}-${currentIndex}` : undefined }}
        />
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => navigate(i, i > currentIndex ? "left" : "right")}
              className={[
                "w-2 h-2 rounded-full transition-all duration-200",
                i === currentIndex ? "bg-white scale-125" : "bg-white/50 hover:bg-white/70",
              ].join(" ")}
            />
          ))}
        </div>
      )}

      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white/70 text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
