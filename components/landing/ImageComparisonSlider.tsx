import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ImageComparisonSliderProps {
    before?: string;
    after?: string;
    beforeComponent?: React.ReactNode;
    afterComponent?: React.ReactNode;
}

const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({ before, after, beforeComponent, afterComponent }) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = useCallback((clientX: number) => {
        if (!isDragging || !containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percent = (x / rect.width) * 100;
        
        setSliderPosition(percent);
    }, [isDragging]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        handleMove(e.clientX);
    }, [handleMove]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        handleMove(e.touches[0].clientX);
    }, [handleMove]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging, handleMouseMove, handleTouchMove, handleMouseUp, handleTouchEnd]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };
    
    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
    };
    
    return (
        <div
            ref={containerRef}
            className="relative w-full max-w-4xl mx-auto select-none rounded-lg overflow-hidden shadow-2xl cursor-e-resize"
        >
            {/* After image/component */}
            {afterComponent ? (
                <div className="block w-full pointer-events-none overflow-hidden">
                    {afterComponent}
                </div>
            ) : (
                <img
                    src={after}
                    alt="After"
                    className="block w-full h-auto pointer-events-none"
                />
            )}

            {/* Before image/component with clip */}
            <div
                className="absolute top-0 left-0 h-full w-full pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`, overflow: 'hidden' }}
            >
                {beforeComponent ? (
                    <div className="block w-full overflow-hidden">
                        {beforeComponent}
                    </div>
                ) : (
                    <img
                        src={before}
                        alt="Before"
                        className="block w-full h-auto max-w-none pointer-events-none"
                        style={{ width: containerRef.current?.offsetWidth }}
                    />
                )}
            </div>
             <div
                className="absolute top-0 bottom-0 bg-white dark:bg-dark-bg-secondary w-1 pointer-events-none"
                style={{ left: `calc(${sliderPosition}% - 2px)` }}
            >
                <div 
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-12 w-12 rounded-full bg-white dark:bg-dark-bg-secondary shadow-lg flex items-center justify-center cursor-e-resize pointer-events-auto"
                    aria-label="Drag to compare"
                >
                    <svg className="w-6 h-6 text-cv-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default ImageComparisonSlider;
