import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

// This component will dynamically load images from a folder
// For now, we'll use placeholder images that can be replaced
const slideshowImages = [
  { id: 1, src: '/slideshow/slide1.jpg', alt: 'School uniform printing' },
  { id: 2, src: '/slideshow/slide2.jpg', alt: 'Professional quality prints' },
  { id: 3, src: '/slideshow/slide3.jpg', alt: 'Fast and reliable service' },
];

interface HeroSlideshowProps {
  images?: { id: number; src: string; alt: string }[];
  autoPlayInterval?: number;
  className?: string;
}

export function HeroSlideshow({ 
  images = slideshowImages, 
  autoPlayInterval = 4000,
  className 
}: HeroSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    // Pause autoplay briefly when manually navigating
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  // Auto-play effect
  useEffect(() => {
    if (!isAutoPlaying || images.length <= 1) return;

    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isAutoPlaying, autoPlayInterval, goToNext, images.length]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className={cn("relative w-full overflow-hidden rounded-2xl", className)}>
      {/* Slides Container */}
      <div 
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image) => (
          <div
            key={image.id}
            className="w-full flex-shrink-0"
          >
            <div className="relative aspect-[16/9] bg-muted">
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder on error
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              index === currentIndex
                ? "bg-white w-8 shadow-lg"
                : "bg-white/50 hover:bg-white/80"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-white transition-all duration-300"
          style={{ 
            width: `${((currentIndex + 1) / images.length) * 100}%` 
          }}
        />
      </div>
    </div>
  );
}
