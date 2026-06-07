import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Smartphone } from 'lucide-react';
import { AdsBannersState } from '../../services/api';

type PromoSlotKey = 'homeStory600x100' | 'adminSidebar240x320' | 'leaderboardTop970x120' | 'sidebar300x250';

interface HomeAppPromoSlideProps {
  showAds: boolean;
  adsBanners: AdsBannersState | null;
  hasBannerContent: (slotKey: keyof AdsBannersState['slots']) => boolean;
  renderBanner: (slotKey: keyof AdsBannersState['slots'], label: string | null, className: string) => ReactNode;
}

const PROMO_SLOTS: Array<{ key: PromoSlotKey; label: string; className: string }> = [
  { key: 'homeStory600x100', label: 'Umunsi Apps', className: 'w-full aspect-[16/7] md:aspect-[970/220] rounded-xl overflow-hidden bg-[#0b0e11]' },
  { key: 'adminSidebar240x320', label: 'Umunsi Mobile', className: 'w-full max-w-[720px] mx-auto aspect-[16/10] rounded-xl overflow-hidden bg-[#0b0e11]' },
  { key: 'leaderboardTop970x120', label: 'Umunsi Promo', className: 'w-full aspect-[970/120] rounded-xl overflow-hidden bg-[#0b0e11]' },
  { key: 'sidebar300x250', label: 'Umunsi App', className: 'w-full max-w-[560px] mx-auto aspect-[300/250] rounded-xl overflow-hidden bg-[#0b0e11]' },
];

const slotHasVideo = (adsBanners: AdsBannersState | null, slotKey: PromoSlotKey) => {
  const adCode = adsBanners?.slots?.[slotKey]?.adCode || '';
  return /(<video\b|<iframe\b|\.mp4|youtube\.com|youtu\.be)/i.test(adCode);
};

const HomeAppPromoSlide = ({ showAds, adsBanners, hasBannerContent, renderBanner }: HomeAppPromoSlideProps) => {
  const slides = useMemo(
    () => PROMO_SLOTS.filter((slide) => hasBannerContent(slide.key)),
    [adsBanners, hasBannerContent]
  );

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!showAds) return null;

  if (slides.length === 0) {
    return (
      <div className="mb-6 bg-[#181a20] rounded-2xl overflow-hidden border border-[#2b2f36]">
        <div className="px-4 py-2 border-b border-[#2b2f36] bg-[#1e2329] flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-[#fcd535]" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#fcd535]">Umunsi Apps &amp; Promo</p>
        </div>
        <div className="p-6 text-center">
          <p className="text-white font-semibold">Kurikirana Umunsi kuri telefone yawe</p>
          <p className="text-gray-400 text-sm mt-1">Promo slides zagaragara hano iyo zishyizwe muri Ads Management.</p>
        </div>
      </div>
    );
  }

  const currentSlide = slides[activeIndex];
  const isVideoSlide = slotHasVideo(adsBanners, currentSlide.key);

  return (
    <div className="mb-6 bg-[#181a20] rounded-2xl overflow-hidden border border-[#2b2f36] shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2b2f36] bg-[#1e2329]">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-[#fcd535]" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#fcd535]">Umunsi Apps &amp; Promo</p>
          {isVideoSlide && (
            <span className="text-[10px] uppercase tracking-wider text-gray-400 hidden sm:inline">Video slide</span>
          )}
        </div>
        {slides.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveIndex((current) => (current - 1 + slides.length) % slides.length)}
              className="rounded-full p-1.5 text-gray-400 hover:text-[#fcd535]"
              aria-label="Previous promo slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((current) => (current + 1) % slides.length)}
              className="rounded-full p-1.5 text-gray-400 hover:text-[#fcd535]"
              aria-label="Next promo slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="p-3 md:p-4">
        {renderBanner(currentSlide.key, currentSlide.label, currentSlide.className)}

        {slides.length > 1 && (
          <div className="mt-3 flex justify-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.key}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === activeIndex ? 'w-7 bg-[#fcd535]' : 'w-2 bg-[#2b2f36] hover:bg-[#fcd535]/40'
                }`}
                aria-label={`Show promo slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeAppPromoSlide;
