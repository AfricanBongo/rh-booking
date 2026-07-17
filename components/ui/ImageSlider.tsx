"use client";

import { useState, useRef } from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";

interface ImageSliderProps {
  images: string[];
  alt: string;
  transitionName?: string;
  onImageClick?: (index: number) => void;
  className?: string;
}

export function ImageSlider({
  images,
  alt,
  transitionName,
  onImageClick,
  className = "",
}: ImageSliderProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  };

  const scrollTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  const goNext = () => {
    if (images.length <= 1) return;
    const next = (activeIndex + 1) % images.length;
    scrollTo(next);
  };

  const goPrev = () => {
    if (images.length <= 1) return;
    const prev = (activeIndex - 1 + images.length) % images.length;
    scrollTo(prev);
  };

  if (images.length === 0) {
    return <div className={`bg-surface-secondary rounded-xl ${className}`} />;
  }

  if (images.length === 1) {
    return (
      <button
        type="button"
        onClick={() => onImageClick?.(0)}
        className={`rounded-xl overflow-hidden bg-surface-secondary cursor-zoom-in ${className}`}
        style={{ viewTransitionName: transitionName ? `${transitionName}-0` : undefined }}
      >
        <img src={images[0]} alt={alt} className="w-full h-full object-cover" />
      </button>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl group ${className}`}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex h-full" style={{ width: `${images.length * 100}%` }}>
          {images.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onImageClick?.(i)}
              className="h-full snap-center cursor-zoom-in"
              style={{
                width: `${100 / images.length}%`,
                viewTransitionName: activeIndex === i && transitionName ? `${transitionName}-${i}` : undefined,
              }}
            >
              <img src={url} alt={`${alt} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); goPrev(); }}
        className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/40 hover:bg-black/60 items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        <CaretLeftIcon size={10} weight="bold" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); goNext(); }}
        className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/40 hover:bg-black/60 items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        <CaretRightIcon size={10} weight="bold" />
      </button>

      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
        {images.map((_, i) => (
          <div
            key={i}
            className={[
              "w-1.5 h-1.5 rounded-full transition-all duration-200",
              i === activeIndex ? "bg-white scale-125" : "bg-white/50",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}
