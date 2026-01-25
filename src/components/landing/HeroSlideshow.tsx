import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Dynamically load images from public/slideshow folder
const getSlideImages = () => {
  // These images should be placed in public/slideshow/
  const images = [
    { id: 1, src: '/slideshow/Printer_2.png', alt: 'Bank grade security' },
    // { id: 1, src: '/slideshow/wallpaperflare.com_wallpaper.jpg', alt: 'School uniform printing' },
    // { id: 2, src: '/slideshow/wallpaperflare.com_wallpaper (1).jpg', alt: 'Professional quality prints' },
    // { id: 3, src: '/slideshow/wallpaperflare.com_wallpaper (2).jpg', alt: 'Fast and reliable service' },
    // { id: 4, src: '/slideshow/wallpaperflare.com_wallpaper (3).jpg', alt: 'Bank grade security' },
    // { id: 4, src: '/slideshow/wallpaperflare.com_wallpaper (3).jpg', alt: 'Bank grade security' },
  ];
  return images;
};

interface HeroSlideshowProps {
  images?: { id: number; src: string; alt: string }[];
  autoPlayInterval?: number;
  className?: string;
}

export function HeroSlideshow({ 
  images, 
  autoPlayInterval = 4000,
  className 
}: HeroSlideshowProps) {
  const slideImages = images || getSlideImages();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    // Pause autoplay briefly when manually navigating
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slideImages.length);
  }, [slideImages.length]);

  // Auto-play effect
  useEffect(() => {
    if (!isAutoPlaying || slideImages.length <= 1) return;

    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isAutoPlaying, autoPlayInterval, goToNext, slideImages.length]);

  if (slideImages.length === 0) {
    return null;
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      {/* Slides Container */}
      <div 
        className="absolute inset-0 flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slideImages.map((image) => (
          <div
            key={image.id}
            className="w-full h-full flex-shrink-0 relative"
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
        ))}
      </div>

      {/* Tint overlay for text visibility */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slideImages.map((_, index) => (
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
    </div>
  );
}
