import React from 'react';

interface HeroImageProps {
    src: string;
    alt: string;
    position?: 'left' | 'right' | 'center';
    className?: string;
    aspectRatio?: 'square' | 'video' | 'wide';
}

const HeroImage: React.FC<HeroImageProps> = ({
    src,
    alt,
    position = 'center',
    className = '',
    aspectRatio = 'video'
}) => {
    const aspectRatioClasses = {
        square: 'aspect-square',
        video: 'aspect-video',
        wide: 'aspect-[21/9]'
    };

    return (
        <div className={`relative overflow-hidden rounded-2xl shadow-2xl ${className}`}>
            <div className={`w-full ${aspectRatioClasses[aspectRatio]} bg-gradient-to-br from-cv-blue/10 to-cv-light-gray dark:from-dark-bg-secondary dark:to-dark-bg-primary`}>
                <img
                    src={src}
                    alt={alt}
                    className={`w-full h-full object-cover object-${position} transition-transform duration-500 hover:scale-105`}
                    loading="lazy"
                />
            </div>
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-cv-dark-gray/10 to-transparent pointer-events-none" />
        </div>
    );
};

export default HeroImage;
