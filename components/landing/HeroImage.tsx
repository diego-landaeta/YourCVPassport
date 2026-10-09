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

    // Dimensiones intrinsecas acordes a cada proporcion: el navegador reserva el hueco
    // antes de que llegue la imagen (sin saltos de maquetacion / CLS)
    const intrinsicSize = {
        square: { width: 800, height: 800 },
        video: { width: 800, height: 450 },
        wide: { width: 840, height: 360 }
    };

    return (
        <div className={`relative overflow-hidden rounded-2xl shadow-2xl ${className}`}>
            <div className={`w-full ${aspectRatioClasses[aspectRatio]} bg-gradient-to-br from-cv-blue/10 to-cv-light-gray dark:from-dark-bg-secondary dark:to-dark-bg-primary`}>
                <img
                    src={src}
                    alt={alt}
                    className={`w-full h-full object-cover object-${position} transition-transform duration-500 hover:scale-105`}
                    // Es la imagen principal (LCP) de la cabecera de la pagina: carga inmediata y prioritaria
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    width={intrinsicSize[aspectRatio].width}
                    height={intrinsicSize[aspectRatio].height}
                />
            </div>
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-cv-dark-gray/10 to-transparent pointer-events-none" />
        </div>
    );
};

export default HeroImage;
