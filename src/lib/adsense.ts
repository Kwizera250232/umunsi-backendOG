import { ADSENSE_CLIENT } from '../constants/adsense';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

const INITIALIZED_ATTR = 'data-umunsi-ad-init';

export const isAdSlotPending = (element: HTMLElement) =>
  element.dataset.umunsiAdInit !== '1' && !element.getAttribute('data-ad-status');

export const markAdSlotInitialized = (element: HTMLElement) => {
  element.dataset.umunsiAdInit = '1';
};

/** Push AdSense fill requests for every uninitialized slot in the document (or root). */
export const pushAdSenseSlots = (root: ParentNode = document) => {
  if (typeof window === 'undefined') return 0;

  const queue = window.adsbygoogle;
  if (!queue) return 0;

  const slots = Array.from(root.querySelectorAll('ins.adsbygoogle')) as HTMLElement[];
  let pushed = 0;

  for (const slot of slots) {
    if (!isAdSlotPending(slot)) continue;
    try {
      queue.push({});
      markAdSlotInitialized(slot);
      pushed += 1;
    } catch {
      // Slot may not be measurable yet; observer/route change will retry.
    }
  }

  return pushed;
};

let observer: MutationObserver | null = null;

/** Watch DOM for new ad slots (SPA navigation, article HTML injection). */
export const startAdSlotObserver = () => {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return () => {};

  if (!observer) {
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== 'childList') continue;
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches?.('ins.adsbygoogle') && isAdSlotPending(node)) {
              pushAdSenseSlots(node.parentElement || document);
            } else {
              pushAdSenseSlots(node);
            }
          }
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  return () => {
    observer?.disconnect();
    observer = null;
  };
};

export const prefetchAdSenseScript = () => {
  if (typeof document === 'undefined') return;
  const href = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  if (document.querySelector(`link[rel="preload"][href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'script';
  link.href = href;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
};
