import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AdsBannersState } from '../../services/api';

type SidebarBannerSlotKey = 'sidebar300x250' | 'square300x300' | 'skyscraper300x600';

interface SidebarBannerSlideProps {
  showAds: boolean;
  adsBanners: AdsBannersState | null;
  hasBannerContent: (slotKey: SidebarBannerSlotKey) => boolean;
  renderBanner: (slotKey: SidebarBannerSlotKey, label: string | null, className: string) => ReactNode;
}

const SLIDES: Array<{ key: SidebarBannerSlotKey; label: string; className: string }> = [
  { key: 'sidebar300x250', label: '300 x 250 px', className: 'aspect-[300/250] rounded-lg overflow-hidden bg-[#0b0e11]' },
  { key: 'square300x300', label: '300 x 300 px', className: 'aspect-square rounded-lg overflow-hidden bg-[#0b0e11]' },
  { key: 'skyscraper300x600', label: '300 x 600 px', className: 'aspect-[1/2] rounded-lg overflow-hidden bg-[#0b0e11]' },
];

const SidebarBannerSlide = ({ showAds, adsBanners, hasBannerContent, renderBanner }: SidebarBannerSlideProps) => {
  const availableSlides = useMemo(
    () => SLIDES.filter((slide) => hasBannerContent(slide.key)),
    [adsBanners, hasBannerContent]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [availableSlides.length]);

  useEffect(() => {
    if (availableSlides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % availableSlides.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [availableSlides.length]);

  if (!showAds || availableSlides.length === 0) return null;

  const currentSlide = availableSlides[activeIndex];

  return (
    <div className="bg-[#181a20] rounded-2xl overflow-hidden border border-[#2b2f36]">
      <div className="flex items-center justify-between border-b border-[#2b2f36] px-4 py-2">
        <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Kwamamaza</p>
        {availableSlides.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveIndex((current) => (current - 1 + availableSlides.length) % availableSlides.length)}
              className="rounded-full p-1 text-gray-400 hover:text-[#fcd535]"
              aria-label="Previous banner"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((current) => (current + 1) % availableSlides.length)}
              className="rounded-full p-1 text-gray-400 hover:text-[#fcd535]"
              aria-label="Next banner"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <div className="p-3">
        {renderBanner(currentSlide.key, currentSlide.label, currentSlide.className)}
        {availableSlides.length > 1 && (
          <div className="mt-3 flex justify-center gap-2">
            {availableSlides.map((slide, index) => (
              <button
                key={slide.key}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === activeIndex ? 'w-6 bg-[#fcd535]' : 'w-2 bg-[#2b2f36]'
                }`}
                aria-label={`Show banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarBannerSlide;
