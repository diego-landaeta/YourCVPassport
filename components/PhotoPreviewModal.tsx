import React, { useState, useRef, useCallback } from 'react';

interface PhotoPreviewModalProps {
  imageUrl: string;
  onConfirm: (file: File, cropData: CropData) => void;
  onCancel: () => void;
  originalFile: File;
}

export interface CropData {
  scale: number;
  x: number;
  y: number;
}

const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  imageUrl,
  onConfirm,
  onCancel,
  originalFile,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        setPosition({
          x: touch.clientX - dragStart.x,
          y: touch.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      // Mouse events
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      // Touch events
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchcancel', handleTouchEnd);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
        window.removeEventListener('touchcancel', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Block body scroll when modal is open
  React.useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.1));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleConfirm = async () => {
    // Create a canvas to crop the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to desired output (square for profile photo)
    const outputSize = 512;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Load the image
    const img = new Image();
    img.src = imageUrl;

    await new Promise<void>((resolve) => {
      img.onload = () => {
        // Calculate the dimensions
        const containerWidth = imageRef.current?.offsetWidth || 400;
        const containerHeight = imageRef.current?.offsetHeight || 400;

        // Calculate scaled image dimensions
        const scaledWidth = img.naturalWidth * scale;
        const scaledHeight = img.naturalHeight * scale;

        // Calculate the position of the image within the container
        const imgX = (containerWidth - scaledWidth) / 2 + position.x;
        const imgY = (containerHeight - scaledHeight) / 2 + position.y;

        // Calculate the circular crop area (80% of container as per the guide)
        const cropRadius = (containerWidth * 0.4); // 80% diameter = 40% radius
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;

        // Calculate source coordinates (what part of the scaled image to crop)
        const sourceX = centerX - cropRadius - imgX;
        const sourceY = centerY - cropRadius - imgY;
        const sourceDiameter = cropRadius * 2;

        // Draw circular clipping path
        ctx.beginPath();
        ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw the image
        ctx.drawImage(
          img,
          sourceX / scale,
          sourceY / scale,
          sourceDiameter / scale,
          sourceDiameter / scale,
          0,
          0,
          outputSize,
          outputSize
        );

        resolve();
      };
    });

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], originalFile.name, {
          type: 'image/png',
          lastModified: Date.now(),
        });
        onConfirm(croppedFile, { scale, x: position.x, y: position.y });
      }
    }, 'image/png', 0.95);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-75 overflow-hidden">
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl max-w-lg w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-dark-border sticky top-0 bg-white dark:bg-dark-bg-secondary z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Ajusta tu foto de perfil
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                Centra y ajusta el zoom de tu imagen
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="p-3 sm:p-4">
          <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            {/* Circular Crop Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <defs>
                  <mask id="circleMask">
                    <rect width="100" height="100" fill="white" />
                    <circle cx="50" cy="50" r="40" fill="black" />
                  </mask>
                </defs>
                <rect width="100" height="100" fill="rgba(0,0,0,0.5)" mask="url(#circleMask)" />
              </svg>
            </div>

            {/* Draggable Image */}
            <div
              ref={imageRef}
              className="absolute inset-0 flex items-center justify-center cursor-move touch-none"
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <img
                src={imageUrl}
                alt="Preview"
                className="max-w-none select-none"
                draggable={false}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                }}
              />
            </div>

            {/* Circle Guide */}
            <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
              <div className="w-4/5 h-4/5 rounded-full border-2 border-white border-dashed"></div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
            {/* Zoom Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Zoom
                </label>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(scale * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Alejar"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                  </svg>
                </button>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Acercar"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="flex items-start gap-2 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
                Arrastra la imagen para centrarla y usa el zoom para ajustar el tamaño
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg-tertiary sticky bottom-0">
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleReset}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-primary transition-colors"
            >
              Restablecer
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-cv-blue hover:bg-cv-blue-dark rounded-lg transition-colors shadow-sm"
            >
              Aplicar foto
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default PhotoPreviewModal;
