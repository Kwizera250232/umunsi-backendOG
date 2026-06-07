import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
    __umunsiAutoAdsInitialized?: boolean;
  }
}

const ADS_CLIENT = 'ca-pub-3584259871242471';
const ADS_SCRIPT_ID = 'umunsi-adsbygoogle-script';
const ADS_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CLIENT}`;

const ensureAdSenseScript = () => {
  const existing = document.getElementById(ADS_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) return;

  const script = document.createElement('script');
  script.id = ADS_SCRIPT_ID;
  script.async = true;
  script.src = ADS_SCRIPT_SRC;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
};

const AdSenseManager = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (location.pathname.startsWith('/admin')) return;

    let cancelled = false;
    ensureAdSenseScript();

    const run = () => {
      if (cancelled) return;

      const queue = window.adsbygoogle;
      if (!queue) {
        setTimeout(run, 250);
        return;
      }

      // Only fill explicit <ins class="adsbygoogle"> slots — no page-level overlays that hide articles.
      const slots = Array.from(document.querySelectorAll('ins.adsbygoogle')) as HTMLElement[];
      slots
        .filter((slot) => slot.dataset.adInitialized !== '1' && !slot.getAttribute('data-ad-status'))
        .forEach((slot) => {
          try {
            queue.push({});
            slot.dataset.adInitialized = '1';
          } catch {
            // Slot can fail if not yet in layout; PostPage and future route changes will retry.
          }
        });
    };

    const timer = window.setTimeout(run, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [location.pathname]);

  return null;
};

export default AdSenseManager;
