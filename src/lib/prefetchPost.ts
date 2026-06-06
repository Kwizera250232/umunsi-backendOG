import { apiClient, type Post } from '../services/api';

const cachePost = (value: Post) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`umunsi_post_${value.id}`, JSON.stringify(value));
    if (value.slug) {
      sessionStorage.setItem(`umunsi_post_${value.slug}`, JSON.stringify(value));
    }
  } catch {
    // Ignore quota errors.
  }
};

const inflight = new Set<string>();

export const prefetchPostBySlug = (slug: string) => {
  if (!slug || inflight.has(slug)) return;
  if (typeof window === 'undefined') return;

  try {
    if (sessionStorage.getItem(`umunsi_post_${slug}`)) return;
  } catch {
    // Continue.
  }

  inflight.add(slug);
  void apiClient
    .getPost(slug)
    .then((post) => {
      if (post) cachePost(post);
    })
    .catch(() => {
      // Ignore prefetch failures.
    })
    .finally(() => {
      inflight.delete(slug);
    });
};

export const attachPostPrefetchListeners = () => {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const anchor = target.closest('a[href]');
    if (!(anchor instanceof HTMLAnchorElement)) return;

    const href = anchor.getAttribute('href');
    if (!href?.startsWith('/post/')) return;

    const slug = href.slice('/post/'.length).split(/[?#]/)[0];
    if (slug) prefetchPostBySlug(slug);
  };

  document.addEventListener('mouseover', handler, { passive: true });
  document.addEventListener('touchstart', handler, { passive: true });

  return () => {
    document.removeEventListener('mouseover', handler);
    document.removeEventListener('touchstart', handler);
  };
};
