import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ImageGalleryProps {
  images: string[];
}

/** Indicador de foco de teclado sobre fondo oscuro (lightbox). */
const FOCUS_RING_DARK = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-white';

const ImageGallery: React.FC<ImageGalleryProps> = memo(({ images }) => {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Los hooks van antes de cualquier return (antes había un return temprano
  // por encima de los useCallback: rompía el orden de hooks si `images` se vaciaba).
  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // Keyboard navigation + body scroll lock + foco retenido en el diálogo
  useEffect(() => {
    if (!lightboxOpen) return;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button'));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !dialogRef.current.contains(active))) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
      // Devuelve el foco a la miniatura que abrió el visor
      openerRef.current?.focus();
    };
  }, [lightboxOpen, closeLightbox, goToPrevious, goToNext]);

  if (images.length === 0) return null;

  const openLightbox = (index: number) => {
    openerRef.current = document.activeElement as HTMLElement | null;
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const imageLabel = (n: number) => (isEs ? `Imagen ${n} de ${images.length}` : `Image ${n} of ${images.length}`);

  // Grid layout based on number of images
  const getGridClass = () => (images.length === 1 ? 'grid-cols-1' : 'grid-cols-2');

  return (
    <>
      {/* Image Grid */}
      <div className={`grid ${getGridClass()} gap-0.5`}>
        {images.slice(0, 4).map((url, index) => (
          <button
            key={index}
            type="button"
            className={`relative cursor-pointer overflow-hidden block w-full p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cv-blue dark:focus-visible:ring-cv-blue-light ${
              images.length === 3 && index === 0 ? 'row-span-2' : ''
            } ${
              images.length === 1 ? 'max-h-96' : 'aspect-square'
            }`}
            onClick={() => openLightbox(index)}
            aria-label={`${isEs ? 'Ampliar' : 'Enlarge'}: ${imageLabel(index + 1)}`}
          >
            <img
              src={url}
              alt=""
              className="w-full h-full object-cover hover:opacity-90 transition-opacity"
            />
            {/* Show +N overlay for more than 4 images */}
            {index === 3 && images.length > 4 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center" aria-hidden="true">
                <span className="text-white text-2xl font-bold">
                  +{images.length - 4}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={imageLabel(currentIndex + 1)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closeLightbox}
            aria-label={isEs ? 'Cerrar' : 'Close'}
            autoFocus
            className={`absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-10 ${FOCUS_RING_DARK}`}
          >
            <XMarkIcon className="w-8 h-8" />
          </button>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                aria-label={isEs ? 'Imagen anterior' : 'Previous image'}
                className={`absolute left-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors ${FOCUS_RING_DARK}`}
              >
                <ChevronLeftIcon className="w-8 h-8" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                aria-label={isEs ? 'Imagen siguiente' : 'Next image'}
                className={`absolute right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors ${FOCUS_RING_DARK}`}
              >
                <ChevronRightIcon className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Image */}
          <img
            src={images[currentIndex]}
            alt={imageLabel(currentIndex + 1)}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-full text-white text-sm" aria-hidden="true">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  );
});

ImageGallery.displayName = 'ImageGallery';
export default ImageGallery;
