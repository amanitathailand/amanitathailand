'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X, Maximize2 } from 'lucide-react';

type LightboxImage = {
  src: string;
  alt?: string;
  caption?: string;
};

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  imageClassName?: string;
  triggerClassName?: string;
  label?: string;
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  imageClassName = 'w-full h-auto object-cover',
  triggerClassName = 'group relative block w-full cursor-zoom-in',
  label = 'เปิดรูปภาพขนาดใหญ่',
}: ImageLightboxProps) {
  const validImages = images.filter((image) => Boolean(image?.src));
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const activeImage = validImages[activeIndex] || validImages[0];

  const close = () => {
    setIsOpen(false);
    setZoom(1);
  };

  const open = () => {
    setActiveIndex(Math.min(Math.max(initialIndex, 0), Math.max(validImages.length - 1, 0)));
    setZoom(1);
    setIsOpen(true);
  };

  const move = (direction: 1 | -1) => {
    if (validImages.length < 2) return;
    setActiveIndex((current) => (current + direction + validImages.length) % validImages.length);
    setZoom(1);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') move(1);
      if (event.key === 'ArrowLeft') move(-1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, validImages.length]);

  if (!activeImage) return null;

  return (
    <>
      <button type="button" onClick={open} className={triggerClassName} aria-label={label}>
        <img src={activeImage.src} alt={activeImage.alt || ''} className={imageClassName} />
        <span className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#2b2d42]/90 px-2.5 py-1.5 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 className="h-3.5 w-3.5" />
          ขยายรูป
        </span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2b2d42]/95 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="แสดงรูปภาพขนาดใหญ่"
          onClick={close}
        >
          <div className="absolute inset-x-3 top-3 flex items-center justify-between sm:inset-x-6 sm:top-6">
            <div className="rounded-full bg-white/10 px-3 py-2 text-xs font-mono text-white backdrop-blur">
              {validImages.length > 1 ? `${activeIndex + 1} / ${validImages.length}` : 'รูปภาพขนาดใหญ่'}
            </div>
            <button type="button" onClick={close} className="rounded-full bg-white/10 p-2.5 text-white transition hover:bg-[#d90429]" aria-label="ปิดรูปภาพ">
              <X className="h-5 w-5" />
            </button>
          </div>

          {validImages.length > 1 && (
            <>
              <button type="button" onClick={(event) => { event.stopPropagation(); move(-1); }} className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-[#d90429] sm:left-6" aria-label="รูปก่อนหน้า">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button type="button" onClick={(event) => { event.stopPropagation(); move(1); }} className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-[#d90429] sm:right-6" aria-label="รูปถัดไป">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div className="flex max-h-[calc(100dvh-7rem)] max-w-[calc(100vw-2rem)] flex-col items-center justify-center gap-3 sm:max-w-[calc(100vw-8rem)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex max-h-[78dvh] max-w-full items-center justify-center overflow-auto rounded-xl">
              <img
                src={activeImage.src}
                alt={activeImage.alt || ''}
                className="max-h-[78dvh] max-w-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              />
            </div>
            <div className="flex items-center gap-1 rounded-full bg-white/10 p-1.5 text-white backdrop-blur">
              <button type="button" onClick={() => setZoom((value) => Math.max(1, value - 0.25))} className="rounded-full p-2 transition hover:bg-white/15" aria-label="ซูมออก"><Minus className="h-4 w-4" /></button>
              <button type="button" onClick={() => setZoom(1)} className="rounded-full p-2 text-[10px] font-mono transition hover:bg-white/15" aria-label="รีเซ็ตการซูม"><RotateCcw className="h-4 w-4" /></button>
              <span className="min-w-12 text-center text-[10px] font-mono">{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom((value) => Math.min(3, value + 0.25))} className="rounded-full p-2 transition hover:bg-white/15" aria-label="ซูมเข้า"><Plus className="h-4 w-4" /></button>
            </div>
            {activeImage.caption && <p className="max-w-2xl text-center text-xs leading-relaxed text-white/85">{activeImage.caption}</p>}
          </div>
        </div>
      )}
    </>
  );
}
