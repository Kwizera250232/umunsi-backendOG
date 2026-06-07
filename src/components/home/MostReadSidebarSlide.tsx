import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Flame, Eye } from 'lucide-react';
import { Post, resolveAssetUrl } from '../../services/api';

interface MostReadSidebarSlideProps {
  posts: Post[];
  canSeeViews?: boolean;
  formatDate: (dateString?: string) => string;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&h=500&fit=crop';

const getImageUrl = (url?: string) => resolveAssetUrl(url) || DEFAULT_IMAGE;

const MostReadSidebarSlide = ({ posts, canSeeViews = false, formatDate }: MostReadSidebarSlideProps) => {
  const slides = useMemo(
    () => [...posts].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 6),
    [posts]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6 text-center text-gray-500 text-sm">
        Nta makuru y&apos;ibisomwa cyane ubu.
      </div>
    );
  }

  const activePost = slides[activeIndex];
  const queuePosts = slides.filter((_, index) => index !== activeIndex).slice(0, 3);

  const goTo = (index: number) => {
    if (index < 0) {
      setActiveIndex(slides.length - 1);
      return;
    }
    setActiveIndex(index % slides.length);
  };

  return (
    <div className="bg-[#181a20] rounded-2xl overflow-hidden border border-[#2b2f36] shadow-lg">
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0b0e11] via-[#12161c] to-[#0b0e11] px-4 py-4 border-b border-[#2b2f36]">
        <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-[#fcd535]/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fcd535]/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#fcd535]">
              <Flame className="h-3.5 w-3.5" />
              Live Trend
            </div>
            <h2 className="mt-2 text-xl md:text-2xl font-black uppercase tracking-tight text-white">
              Ibisomwa Cyane
            </h2>
            <p className="mt-1 text-xs md:text-sm text-gray-400">
              Abantu barisomeye cyane — ntucikwe! ⚽🔥
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              className="rounded-full border border-[#2b2f36] p-2 text-gray-300 hover:border-[#fcd535]/50 hover:text-[#fcd535] transition-colors"
              aria-label="Previous story"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              className="rounded-full border border-[#2b2f36] p-2 text-gray-300 hover:border-[#fcd535]/50 hover:text-[#fcd535] transition-colors"
              aria-label="Next story"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-4">
        <Link
          to={`/post/${activePost.slug}`}
          className="group block overflow-hidden rounded-xl border border-[#2b2f36] bg-[#0b0e11] hover:border-[#fcd535]/40 transition-colors"
        >
          <div className="relative overflow-hidden">
            <img
              src={getImageUrl(activePost.featuredImage)}
              alt={activePost.title}
              className="h-44 md:h-52 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <span className="absolute left-3 top-3 rounded bg-[#fcd535] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#0b0e11]">
              #{activeIndex + 1} Trend
            </span>
          </div>
          <div className="p-3 md:p-4">
            {activePost.category?.name && (
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#fcd535]">
                {activePost.category.name}
              </p>
            )}
            <h3 className="mt-1 text-base md:text-lg font-black leading-snug text-white group-hover:text-[#fcd535] transition-colors line-clamp-3">
              {activePost.title}
            </h3>
            <div className="mt-2 flex items-center gap-3 text-[11px] uppercase tracking-wide text-gray-500">
              <span>{formatDate(activePost.publishedAt || activePost.createdAt)}</span>
              {canSeeViews && (
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {activePost.viewCount || 0}
                </span>
              )}
            </div>
          </div>
        </Link>

        {queuePosts.length > 0 && (
          <div className="mt-3 space-y-2">
            {queuePosts.map((post) => {
              const index = slides.findIndex((item) => item.id === post.id);
              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="flex w-full gap-3 rounded-xl border border-transparent bg-[#0b0e11] p-2 text-left hover:border-[#fcd535]/30 transition-colors"
                >
                  <img
                    src={getImageUrl(post.featuredImage)}
                    alt={post.title}
                    className="h-14 w-20 flex-shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      #{index + 1} · {formatDate(post.publishedAt || post.createdAt)}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-300 line-clamp-2">
                      {post.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-center justify-center gap-2">
          {slides.map((post, index) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === activeIndex ? 'w-7 bg-[#fcd535]' : 'w-2.5 bg-[#2b2f36] hover:bg-[#fcd535]/40'
              }`}
              aria-label={`Go to story ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MostReadSidebarSlide;
