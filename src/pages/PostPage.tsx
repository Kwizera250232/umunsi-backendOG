import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Eye, 
  Calendar,
  User,
  Bookmark,
  Copy,
  Heart,
  MessageCircle,
  Share2,
  Clock,
  ChevronRight,
  AlertCircle,
  Send,
  Facebook,
  Twitter,
  Linkedin,
  ArrowLeft,
  Lock,
  Crown,
  PhoneCall,
  BadgeCheck,
  X
} from 'lucide-react';
import { apiClient, Post, resolveAssetUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
    instgrm?: { Embeds?: { process?: () => void } };
    twttr?: { widgets?: { load?: (el?: HTMLElement) => void } };
  }
}

const resolveArticleImageSrc = (src: string) => resolveAssetUrl(src) || src;


const extractFirstImageFromHtml = (html?: string) => {
  if (!html) return null;
  const match = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  if (!match || !match[1]) return null;
  return resolveArticleImageSrc(match[1].trim());
};

const hasBlockLevelMarkup = (html: string) => /<(p|div|h[1-6]|ul|ol|li|blockquote|figure|table|iframe|img|video|br)\b/i.test(html);

const getYouTubeVideoId = (url: string) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id || null;
    }

    if (host.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      if (id) return id;

      const parts = parsed.pathname.split('/').filter(Boolean);
      const markerIndex = parts.findIndex((part) => part === 'embed' || part === 'shorts');
      if (markerIndex !== -1 && parts[markerIndex + 1]) {
        return parts[markerIndex + 1];
      }
    }
  } catch {
    return null;
  }

  return null;
};

const isInstagramUrl = (url: string) => /(^https?:\/\/)?(www\.)?instagram\.com\//i.test(url);
const isXUrl = (url: string) => /(^https?:\/\/)?(www\.)?(x\.com|twitter\.com)\//i.test(url);

const renderStandaloneUrlBlock = (rawUrl: string) => {
  const url = rawUrl.replace(/&amp;/g, '&').trim();
  const youtubeId = getYouTubeVideoId(url);

  if (youtubeId) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://umunsi.com';
    const params = `rel=0&modestbranding=1&playsinline=1&origin=${encodeURIComponent(origin)}`;
    return `
      <div class="not-prose my-6 overflow-hidden rounded-xl border border-[#2b2f36] bg-[#0b0e11]">
        <iframe
          src="https://www.youtube-nocookie.com/embed/${youtubeId}?${params}"
          title="YouTube video"
          class="w-full aspect-video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
      </div>
    `;
  }

  if (isInstagramUrl(url)) {
    return `
      <blockquote class="instagram-media not-prose my-6" data-instgrm-permalink="${url}" data-instgrm-version="14">
        <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>
      </blockquote>
    `;
  }

  if (isXUrl(url)) {
    return `
      <blockquote class="twitter-tweet not-prose my-6">
        <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>
      </blockquote>
    `;
  }

  return `<p><a href="${url}" target="_blank" rel="noopener noreferrer" class="underline break-all">${url}</a></p>`;
};

const buildParagraphMarkup = (rawText: string) => {
  const normalized = rawText.replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';

  const byBlankLines = normalized
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const sourceParagraphs = byBlankLines.length > 1
    ? byBlankLines
    : (() => {
        const compact = normalized.replace(/\s+/g, ' ').trim();
        const sentences = compact
          .split(/(?<=[.!?])\s+/)
          .map((part) => part.trim())
          .filter(Boolean);

        if (sentences.length >= 4) {
          const grouped: string[] = [];
          for (let i = 0; i < sentences.length; i += 2) {
            grouped.push(sentences.slice(i, i + 2).join(' '));
          }
          return grouped;
        }

        return [compact];
      })();

  return sourceParagraphs
    .map((paragraph) => `<p>${paragraph.replace(/\n+/g, '<br />')}</p>`)
    .join('');
};

const normalizeArticleHtml = (content?: string) => {
  const raw = String(content || '').trim();
  if (!raw) return '';

  let html = raw.replace(/\[embed\]\s*(https?:\/\/[^\s\]]+)\s*\[\/embed\]/gi, (_match, url) => {
    const safeUrl = String(url || '').trim();
    if (!safeUrl) return '';
    return renderStandaloneUrlBlock(safeUrl);
  });

  if (!hasBlockLevelMarkup(html)) {
    html = buildParagraphMarkup(html);
  }

  html = html.replace(/<p>\s*((?:https?:\/\/)[^<\s]+)\s*<\/p>/gi, (_match, url) => renderStandaloneUrlBlock(url));

  return html.replace(
    /<img([^>]*)src="([^"]*)"([^>]*)>/gi,
    (match, before, src, after) => {
      const correctedSrc = resolveArticleImageSrc(src);
      return `<img${before}src="${correctedSrc}"${after} class="w-full h-auto rounded-lg my-4" onerror="this.style.display='none'">`;
    }
  );
};

const createArticleAdBlock = (slot: string, marker: string) => `
  <div class="article-inline-ad not-prose my-8" data-ad-marker="${marker}" style="text-align:center;overflow:visible;">
    <p style="font-size:0.7rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Advertisement</p>
    <ins class="adsbygoogle"
      style="display:block;min-height:100px;"
      data-ad-client="ca-pub-3584259871242471"
      data-ad-slot="${slot}"
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>
  </div>
`;

const EFFECTIVECPM_INVOKE_SRC =
  'https://pl18296531.effectivecpmnetwork.com/5b46e2d36f21bea432152fac20277690/invoke.js';
const EFFECTIVECPM_CONTAINER_ID = 'container-5b46e2d36f21bea432152fac20277690';

const createEffectiveCpmAdBlock = () => `
  <div class="article-effectivecpm-ad not-prose my-8" data-ad-marker="effectivecpm-paragraph-3" style="text-align:center;overflow:visible;">
    <p style="font-size:0.7rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Advertisement</p>
    <div id="${EFFECTIVECPM_CONTAINER_ID}" style="min-height:90px;"></div>
  </div>
`;

const ADSENSE_BEFORE_CONTENT_SLOT = '8081945273';
const ADSENSE_AFTER_PARAGRAPH_3_SLOT = '6489436663';
const ADSENSE_AFTER_PARAGRAPH_5_SLOT = '6849820312';
const ADSENSE_AFTER_PARAGRAPH_7_SLOT = '6385720225';
const ADSENSE_SIDEBAR_SLOT = '9267546505'; // Create a sidebar ad unit in your AdSense account and update this slot ID

const SUPPORT_WHATSAPP = '250791859465';
const SUPPORT_CALL = '0791859465';
const AUTHOR_APP_BADGE_IMAGE = 'https://www.umunsi.com/uploads/media/thumbnails/thumb_files-1776124536301-469177017.jpg';
const DEFAULT_AUTHOR_ACCOUNT_URL = 'https://www.umunsimedia.com/';
const SPECIAL_ADMIN_NAME = 'kwizera jean de dieu';
const SPECIAL_ADMIN_USERNAME = 'kwizerajeandedieu250';

const normalizeIdentityName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const normalizeExternalUrl = (url?: string) => {
  if (!url) return DEFAULT_AUTHOR_ACCOUNT_URL;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

const getCachedPost = (identifier?: string) => {
  if (!identifier || typeof window === 'undefined') return null;
  try {
    const cachedRaw = sessionStorage.getItem(`umunsi_post_${identifier}`);
    if (!cachedRaw) return null;
    const cached = JSON.parse(cachedRaw) as Post;
    return cached || null;
  } catch {
    return null;
  }
};

const cachePost = (value: Post) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`umunsi_post_${value.id}`, JSON.stringify(value));
    if (value.slug) {
      sessionStorage.setItem(`umunsi_post_${value.slug}`, JSON.stringify(value));
    }
  } catch {
    // Ignore cache write failures.
  }
};

const injectAdsAfterRequestedParagraphs = (html: string) => {
  if (!html) return '';

  if (typeof window === 'undefined') {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="article-root">${html}</div>`, 'text/html');
  const root = doc.getElementById('article-root');

  if (!root) {
    return html;
  }

  const requestedSlots = [
    ADSENSE_AFTER_PARAGRAPH_3_SLOT,
    ADSENSE_AFTER_PARAGRAPH_5_SLOT,
    ADSENSE_AFTER_PARAGRAPH_7_SLOT
  ];

  const hasExistingRequestedAds = requestedSlots.some((slot) =>
    root.querySelector(`ins.adsbygoogle[data-ad-slot="${slot}"]`)
  );

  if (hasExistingRequestedAds) {
    return root.innerHTML;
  }

  const contentBlocks = Array.from(root.querySelectorAll('p, div, blockquote, li')).filter((element) => {
    if (element.querySelector('img, video, iframe, table, ul, ol')) {
      return false;
    }
    return (element.textContent || '').trim().length > 25;
  });

  [
    { afterParagraph: 7, slot: ADSENSE_AFTER_PARAGRAPH_7_SLOT, marker: 'paragraph-7' },
    { afterParagraph: 5, slot: ADSENSE_AFTER_PARAGRAPH_5_SLOT, marker: 'paragraph-5' },
    { afterParagraph: 3, slot: ADSENSE_AFTER_PARAGRAPH_3_SLOT, marker: 'paragraph-3' }
  ].forEach(({ afterParagraph, slot, marker }) => {
    const targetBlock = contentBlocks[afterParagraph - 1];
    if (targetBlock) {
      if (afterParagraph === 3) {
        targetBlock.insertAdjacentHTML('afterend', createEffectiveCpmAdBlock());
      } else {
        targetBlock.insertAdjacentHTML('afterend', createArticleAdBlock(slot, marker));
      }
    }
  });

  return root.innerHTML;
};

const PostPage = () => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const postIdentifier = slug || id;
  const showAds = true;
  const canSeeViews = user?.role === 'ADMIN';
  const [post, setPost] = useState<Post | null>(() => getCachedPost(postIdentifier));
  const [error, setError] = useState<string | null>(null);
  const [hasResolvedInitialFetch, setHasResolvedInitialFetch] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [topUrlCopied, setTopUrlCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [authorAvatarLoadFailed, setAuthorAvatarLoadFailed] = useState(false);
  const [isAuthorProfileOpen, setIsAuthorProfileOpen] = useState(false);
  const [authorPosts, setAuthorPosts] = useState<Post[]>([]);
  const [loadingAuthorPosts, setLoadingAuthorPosts] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (postIdentifier) {
      const cached = getCachedPost(postIdentifier);
      if (cached) {
        setPost(cached);
        setLikeCount(cached.likeCount || 0);
        setShareCount(cached.shareCount || 0);
      }
      setError(null);
      setHasResolvedInitialFetch(false);
      fetchPost();
      window.scrollTo(0, 0);
    }
  }, [postIdentifier]);

  const normalizedContent = normalizeArticleHtml(post?.content);
  const fallbackFeaturedImage = useMemo(() => extractFirstImageFromHtml(normalizedContent), [normalizedContent]);
  const effectiveFeaturedImage = post?.featuredImage || fallbackFeaturedImage || '';
  const contentWithInlineAd = useMemo(() => {
    try {
      return injectAdsAfterRequestedParagraphs(normalizedContent);
    } catch (adInjectError) {
      console.error('Article ad injection failed:', adInjectError);
      return normalizedContent;
    }
  }, [normalizedContent]);

  const hasPremiumAccess = useMemo(() => {
    if (!user) return false;
    if (['ADMIN', 'EDITOR', 'AUTHOR'].includes(user.role)) return true;
    if (!user.isPremium) return false;
    if (!user.premiumUntil) return true;
    return new Date(user.premiumUntil) > new Date();
  }, [user]);

  const isPremiumLocked = Boolean(post?.isPremium) && !hasPremiumAccess;
  const returnToCurrentPost = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
  const authorDisplayName = `${post?.author?.firstName || ''} ${post?.author?.lastName || ''}`.trim() || post?.author?.username || 'Unknown';
  const authorInitial = (authorDisplayName || 'U').charAt(0).toUpperCase();
  const authorRole = (post?.author?.role || 'AUTHOR').toUpperCase();
  const normalizedAuthorUsername = normalizeIdentityName(post?.author?.username || '');
  const isSpecialAdmin =
    authorRole === 'ADMIN' &&
    (normalizeIdentityName(authorDisplayName) === SPECIAL_ADMIN_NAME || normalizedAuthorUsername === SPECIAL_ADMIN_USERNAME);
  const isVerifiedAuthor = (authorRole === 'AUTHOR' && Boolean(post?.author?.isVerified)) || isSpecialAdmin;
  const authorAccountUrl = normalizeExternalUrl(post?.author?.profileUrl);
  const canUseNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const authorMemberSinceDate = useMemo(() => {
    if (post?.author?.createdAt) {
      return post.author.createdAt;
    }
    if (authorPosts.length > 0) {
      const sorted = [...authorPosts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return sorted[0].createdAt;
    }
    return post?.createdAt || null;
  }, [post?.author?.createdAt, post?.createdAt, authorPosts]);

  const authorPostCount = useMemo(() => {
    const unique = new Set(authorPosts.map((item) => item.id));
    if (post?.id) unique.add(post.id);
    return unique.size;
  }, [authorPosts, post?.id]);

  useEffect(() => {
    if (!post?.id || typeof window === 'undefined') {
      setIsBookmarked(false);
      return;
    }

    const saved = JSON.parse(localStorage.getItem('umunsi_saved_articles') || '[]') as string[];
    setIsBookmarked(saved.includes(post.id));
  }, [post?.id]);

  useEffect(() => {
    setAuthorAvatarLoadFailed(false);
  }, [post?.author?.avatar, post?.author?.id]);

  useEffect(() => {
    if (!showAds || isPremiumLocked || typeof window === 'undefined') {
      return;
    }

    const existing = document.querySelector(`script[src="${EFFECTIVECPM_INVOKE_SRC}"]`);
    if (!existing) {
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = EFFECTIVECPM_INVOKE_SRC;
      document.body.appendChild(script);
    }
  }, [showAds, isPremiumLocked, contentWithInlineAd, post?.id]);

  useEffect(() => {
    if (!showAds || !contentWithInlineAd || typeof window === 'undefined') {
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;

    const tryRenderInlineAd = () => {
      if (cancelled) return;

      const adElements = Array.from(
        document.querySelectorAll('.article-before-content-ad ins.adsbygoogle, .article-inline-ad ins.adsbygoogle, .article-sidebar-ad ins.adsbygoogle')
      ) as HTMLElement[];

      if (adElements.length === 0) {
        if (attempts++ < maxAttempts) setTimeout(tryRenderInlineAd, 100);
        return;
      }

      const pendingAds = adElements.filter(
        (element) => element.dataset.adInitialized !== '1' && !element.getAttribute('data-ad-status')
      );

      if (pendingAds.length === 0) {
        return;
      }

      if (!window.adsbygoogle) {
        window.adsbygoogle = [];
      }

      try {
        pendingAds.forEach((element) => {
          (window.adsbygoogle as unknown as Array<Record<string, unknown>>).push({});
          element.dataset.adInitialized = '1';
        });
      } catch (error) {
        if (attempts++ < maxAttempts) {
          setTimeout(tryRenderInlineAd, 200);
          return;
        }
        console.error('AdSense inline ad render failed:', error);
      }
    };

    // Run immediately on next frame for fastest possible render
    requestAnimationFrame(() => tryRenderInlineAd());

    return () => {
      cancelled = true;
    };
  }, [contentWithInlineAd, showAds, post?.id]);

  useEffect(() => {
    if (typeof window === 'undefined' || !contentWithInlineAd) return;

    const processEmbeds = () => {
      window.instgrm?.Embeds?.process?.();
      window.twttr?.widgets?.load?.();
    };

    const loadScript = (id: string, src: string, onLoad?: () => void) => {
      let script = document.getElementById(id) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.src = src;
        script.async = true;
        if (onLoad) script.addEventListener('load', onLoad, { once: true });
        document.body.appendChild(script);
      } else if (onLoad) {
        onLoad();
      }
    };

    loadScript('instagram-embed-script', 'https://www.instagram.com/embed.js', processEmbeds);
    loadScript('twitter-widget-script', 'https://platform.twitter.com/widgets.js', processEmbeds);
    processEmbeds();
  }, [contentWithInlineAd]);

  useEffect(() => {
    if (!isAuthorProfileOpen || !post?.author?.id) {
      return;
    }

    let cancelled = false;
    const loadAuthorPosts = async () => {
      try {
        setLoadingAuthorPosts(true);
        const response = await apiClient.getPosts({
          author: post.author.id,
          status: 'PUBLISHED',
          limit: 100,
          sortBy: 'publishedAt',
          sortOrder: 'desc'
        });
        if (!cancelled) {
          setAuthorPosts(response?.data || []);
        }
      } catch (error) {
        if (!cancelled) {
          setAuthorPosts(post ? [post] : []);
        }
      } finally {
        if (!cancelled) {
          setLoadingAuthorPosts(false);
        }
      }
    };

    loadAuthorPosts();

    return () => {
      cancelled = true;
    };
  }, [isAuthorProfileOpen, post?.author?.id, post]);

  const fetchPost = async () => {
    try {
      setError(null);
      
      // Fetch post directly by ID or slug (backend supports both)
      const foundPost = await apiClient.getPost(postIdentifier!);
      
      if (foundPost) {
        setPost(foundPost);
        setLikeCount(foundPost.likeCount || 0);
        setShareCount(foundPost.shareCount || 0);
        cachePost(foundPost);
        
        // Fetch related posts and latest posts in parallel
        const postsResponse = await apiClient.getPosts({ limit: 20, status: 'PUBLISHED' });
        if (postsResponse?.data) {
          // Get latest posts for sidebar
          setLatestPosts(postsResponse.data.filter(p => p.id !== foundPost.id).slice(0, 5));
          
          // Get related posts from same category
          if (foundPost.category) {
            const related = postsResponse.data.filter(
              p => p.category?.id === foundPost.category?.id && p.id !== foundPost.id
            ).slice(0, 4);
            setRelatedPosts(related);
          }
        }
      } else {
        setPost(null);
        setError('Post not found');
      }
    } catch (error: unknown) {
      console.error('Error fetching post:', error);
      const cached = getCachedPost(postIdentifier);
      if (cached?.id && cached?.title) {
        setPost(cached);
        setLikeCount(cached.likeCount || 0);
        setShareCount(cached.shareCount || 0);
        setError(null);
      } else {
        setPost(null);
        setError('Failed to load article.');
      }
    } finally {
      setHasResolvedInitialFetch(true);
    }
  };

  const handleLike = () => {
    if (!isAuthenticated) {
      alert('Please login to like this article');
      return;
    }
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleWhatsAppPremiumRequest = () => {
    if (!isAuthenticated) {
      window.location.href = `/register?redirect=${returnToCurrentPost}`;
      return;
    }

    const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || 'Subscriber';
    const message = `Muraho Umunsi, nitwa ${fullName}. Nishyuriye premium article kandi nohereje proof. Nifuza gufungurirwa iyi nkuru: ${window.location.href}`;
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const recordShare = async (platform: string) => {
    const identifier = post?.slug || post?.id || postIdentifier;
    if (!identifier) return;

    try {
      const response = await apiClient.trackPostShare(identifier, platform);
      const nextShareCount = Number(response?.data?.shareCount || 0);
      setShareCount(nextShareCount);
      setPost((current) => {
        if (!current) return current;
        const updated = {
          ...current,
          shareCount: nextShareCount,
          shareBreakdown: response?.data?.shareBreakdown || current.shareBreakdown,
        };
        cachePost(updated);
        return updated;
      });
    } catch (error) {
      console.error('Failed to track article share:', error);
    }
  };

  const handleShare = (platform: string) => {
    void recordShare(platform);
    const url = window.location.href;
    const title = post?.title || '';
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank');
        break;
    }
    setShowShareMenu(false);
  };

  const handleNativeShare = async () => {
    const url = window.location.href;
    const title = post?.title || 'UMUNSI';
    const text = post?.excerpt || title;

    if (!canUseNativeShare) {
      await handleCopyTopArticleUrl();
      return;
    }

    try {
      await navigator.share({
        title,
        text,
        url,
      });
      await recordShare('native');
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Native share failed:', error);
      }
    } finally {
      setShowShareMenu(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    setSubmittingComment(true);
    const comment = {
      id: Date.now().toString(),
      content: newComment,
      author: { name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User' },
      createdAt: new Date().toISOString()
    };
    setComments(prev => [comment, ...prev]);
    setNewComment('');
    setSubmittingComment(false);
  };

  const handleToggleBookmark = () => {
    const premiumBookmarkMessage = 'Wifuza kubika iyi nkuru ukunze kugira ngo uze kongera kuyisoma nyuma ? Iyandikishe uyu  munsi kuri UMUNSI.COM Premium ukora konte.';

    if (!hasPremiumAccess) {
      if (post?.id && typeof window !== 'undefined') {
        const existingRequests = JSON.parse(localStorage.getItem('umunsi_premium_request_articles') || '[]') as Array<{
          id: string;
          title: string;
          slug?: string;
          url: string;
          requestedAt: string;
        }>;

        const hasSameRequest = existingRequests.some((item) => item.id === post.id);
        if (!hasSameRequest) {
          const requestItem = {
            id: post.id,
            title: post.title,
            slug: post.slug,
            url: `${window.location.origin}/post/${post.slug || post.id}`,
            requestedAt: new Date().toISOString()
          };
          localStorage.setItem('umunsi_premium_request_articles', JSON.stringify([requestItem, ...existingRequests].slice(0, 20)));
        }
      }

      const shouldRegister = window.confirm(premiumBookmarkMessage);
      if (shouldRegister) {
        if (isAuthenticated) {
          navigate('/subscriber/account');
        } else {
          navigate(`/register?redirect=${returnToCurrentPost}`);
        }
      }
      return;
    }

    if (!post?.id || typeof window === 'undefined') return;

    const saved = JSON.parse(localStorage.getItem('umunsi_saved_articles') || '[]') as string[];
    const alreadySaved = saved.includes(post.id);
    const next = alreadySaved ? saved.filter((savedId) => savedId !== post.id) : [...saved, post.id];

    localStorage.setItem('umunsi_saved_articles', JSON.stringify(next));
    setIsBookmarked(!alreadySaved);
  };

  const handleCopyTopArticleUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setTopUrlCopied(true);
      void recordShare('copy');
      setTimeout(() => setTopUrlCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy article URL:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('rw-RW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('rw-RW', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImageUrl = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&h=400&fit=crop';
    return resolveArticleImageSrc(url);
  };

  const getAuthorAvatarUrl = (avatar?: string) => {
    if (!avatar) return '';
    return resolveArticleImageSrc(avatar);
  };

  if (hasResolvedInitialFetch && (error || !post)) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Article Not Found</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link to="/" className="text-[#fcd535] hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return <div className="min-h-screen bg-[#0b0e11]" />;
  }

  return (
    <div className="min-h-screen bg-[#0b0e11]">
      {/* Breadcrumb */}
      <div className="bg-[#181a20] border-b border-[#2b2f36]">
        <div className="px-3 py-2 sm:py-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link to="/" className="hover:text-[#fcd535]">Ahabanza</Link>
            <ChevronRight className="w-4 h-4" />
            {post.category && (
              <>
                <Link to={`/category/${post.category.slug}`} className="hover:text-[#fcd535]">
                  {post.category.name}
                </Link>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
            <span className="text-gray-500 truncate max-w-[300px]">{post.title}</span>
          </div>
        </div>
      </div>

      <div className="px-0 sm:px-3 py-0 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Article Header */}
            <article className="bg-[#181a20] rounded-none sm:rounded-lg overflow-hidden">
              {/* Category & Date Header */}
              <div className="p-3 sm:p-4 pb-0">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  {post.category && (
                    <Link 
                      to={`/category/${post.category.slug}`}
                      className="bg-[#fcd535] text-[#0b0e11] text-xs font-bold px-3 py-1 rounded"
                    >
                      {post.category.name}
                    </Link>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(post.publishedAt || post.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(post.publishedAt || post.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
                  {post.title}
                </h1>

                {/* Author & Stats Row */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[#2b2f36]">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#fcd535] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {post.author?.avatar && !authorAvatarLoadFailed ? (
                        <img
                          src={getAuthorAvatarUrl(post.author.avatar)}
                          alt={authorDisplayName}
                          className="w-full h-full object-cover"
                          onError={() => setAuthorAvatarLoadFailed(true)}
                        />
                      ) : (
                        <span className="text-[#0b0e11] font-bold text-sm">{authorInitial}</span>
                      )}
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAuthorProfileOpen(true)}
                          className="inline-flex items-center gap-1.5 text-white text-sm font-medium hover:text-[#4ea1ff] transition-colors"
                        >
                          <span>{authorDisplayName}</span>
                          {isVerifiedAuthor && <BadgeCheck className="w-4 h-4 text-[#1d9bf0]" />}
                        </button>
                        {isVerifiedAuthor && (
                          <a
                            href={authorAccountUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Sura account ya writer"
                            className="inline-flex items-center justify-center rounded-full ring-1 ring-[#1d9bf0]/40 hover:ring-[#1d9bf0] transition-all overflow-hidden"
                          >
                            <img
                              src={AUTHOR_APP_BADGE_IMAGE}
                              alt="UmunsiMedia"
                              className="h-5 w-5 rounded-full object-cover bg-[#0b0e11]"
                            />
                          </a>
                        )}
                      </div>
                      {['ADMIN', 'EDITOR', 'AUTHOR'].includes(authorRole) && (
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                        <button
                          type="button"
                          onClick={handleToggleBookmark}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            isBookmarked
                              ? 'bg-[#fcd535] text-[#0b0e11] border-[#fcd535]'
                              : 'bg-transparent text-gray-300 border-[#3a4049] hover:border-[#fcd535] hover:text-[#fcd535]'
                          }`}
                          title={isBookmarked ? 'Remove from saved articles' : 'Save this article'}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                          {isBookmarked ? 'Saved with Love' : 'Save Article'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyTopArticleUrl}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-[#3a4049] text-gray-300 hover:border-[#fcd535] hover:text-[#fcd535] transition-all"
                          title="Copy article URL"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {topUrlCopied ? 'URL Copied' : 'Copy URL'}
                        </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {canSeeViews && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.viewCount}
                      </span>
                    )}
                    <span>{post.commentCount || comments.length} comments</span>
                  </div>
                </div>
              </div>

              {/* Social Share Bar */}
              <div className="px-4 py-3 border-b border-[#2b2f36] flex items-center justify-between">
                <span className="text-sm text-gray-400">Sangiza:</span>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <span className="min-w-[36px] px-2 py-1 rounded-full bg-[#0b0e11] border border-[#2b2f36] text-[#fcd535] text-sm font-semibold text-center">
                    {shareCount}
                  </span>
                  {canUseNativeShare && (
                    <button
                      onClick={handleNativeShare}
                      className="w-8 h-8 rounded-full bg-[#fcd535] flex items-center justify-center hover:opacity-80 transition-opacity"
                      title="Share using your phone apps"
                    >
                      <Share2 className="w-4 h-4 text-[#0b0e11]" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleShare('facebook')}
                    className="w-8 h-8 rounded-full bg-[#1877f2] flex items-center justify-center hover:opacity-80 transition-opacity"
                    title={`Facebook shares • total ${shareCount}`}
                  >
                    <Facebook className="w-4 h-4 text-white" />
                  </button>
                  <button 
                    onClick={() => handleShare('twitter')}
                    className="w-8 h-8 rounded-full bg-[#1da1f2] flex items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    <Twitter className="w-4 h-4 text-white" />
                  </button>
                  <button 
                    onClick={() => handleShare('whatsapp')}
                    className="w-8 h-8 rounded-full bg-[#25d366] flex items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleShare('linkedin')}
                    className="w-8 h-8 rounded-full bg-[#0077b5] flex items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    <Linkedin className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Article Content */}
              <div className="p-3 sm:p-5 md:p-6">
                {/* Featured Image - above ad */}
                {effectiveFeaturedImage && !isPremiumLocked && (
                  <div className="mb-4">
                    <img
                      src={getImageUrl(effectiveFeaturedImage)}
                      alt={post.title}
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                )}

                {showAds && !isPremiumLocked && (
                  <div key={`ad-before-${post?.id}`} className="article-before-content-ad not-prose mb-6" style={{ textAlign: 'center', overflow: 'visible' }}>
                    <p className="text-gray-500 text-[0.7rem] uppercase tracking-wide mb-1">Advertisement</p>
                    <ins
                      className="adsbygoogle"
                      style={{ display: 'block', minHeight: '100px' }}
                      data-ad-client="ca-pub-3584259871242471"
                      data-ad-slot={ADSENSE_BEFORE_CONTENT_SLOT}
                      data-ad-format="auto"
                      data-full-width-responsive="true"
                    ></ins>
                  </div>
                )}

                {post.excerpt && !isPremiumLocked && (
                  <p className="text-gray-200 text-lg sm:text-xl md:text-2xl leading-relaxed mb-6 font-medium border-l-4 border-[#fcd535] pl-3 sm:pl-4">
                    {post.excerpt}
                  </p>
                )}

                {isPremiumLocked ? (
                  <div className="daymode-contrast-card rounded-xl border border-[#fcd535]/30 bg-[#14181e] p-6 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#fcd535]/15 mb-4">
                      <Crown className="w-7 h-7 text-[#fcd535]" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">This is a Premium Article</h3>
                    {!isAuthenticated ? (
                      <>
                        <p className="text-gray-300 mb-5">Kora konte ubone gusoma inkuru yose</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Link
                            to={`/register?redirect=${returnToCurrentPost}`}
                            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#fcd535] text-[#0b0e11] font-semibold hover:bg-[#f0b90b]"
                          >
                            Fungura Konti
                          </Link>
                          <Link
                            to={`/subscriber-login?redirect=${returnToCurrentPost}`}
                            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#2b2f36] text-white font-semibold hover:bg-[#363a45]"
                          >
                            Injira
                          </Link>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-300 mb-5">
                          Banza wishyure, hanyuma wohereze proof kuri WhatsApp cyangwa uduhamagare. Nyuma yo kubyemeza, tuzaguha uburenganzira bwo gusoma iyi nkuru.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <button
                            type="button"
                            onClick={handleWhatsAppPremiumRequest}
                            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#25d366] text-white font-semibold hover:bg-[#1ebe57]"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp
                          </button>
                          <a
                            href={`tel:${SUPPORT_CALL.replace(/\s+/g, '')}`}
                            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#fcd535] text-[#0b0e11] font-semibold hover:bg-[#f0b90b]"
                          >
                            <PhoneCall className="w-4 h-4 mr-2" />
                            Hamagara {SUPPORT_CALL}
                          </a>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">Access ifungurwa nyuma yo kwemeza ubwishyu.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div 
                    className="article-content-readable prose prose-invert prose-xl max-w-none text-gray-200"
                    style={{ wordBreak: 'break-word', fontSize: 'clamp(1.08rem, 2.5vw, 1.3rem)' }}
                    dangerouslySetInnerHTML={{ __html: contentWithInlineAd }}
                  />
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-8 pt-4 border-t border-[#2b2f36]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-500 text-sm">Tags:</span>
                      {post.tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-[#2b2f36] text-gray-300 text-sm rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Like & Share Actions */}
              <div className="p-4 bg-[#0b0e11] flex items-center justify-between">
                <button 
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium transition-all ${
                    liked 
                      ? 'bg-red-500 text-white' 
                      : 'bg-[#2b2f36] text-gray-300 hover:bg-[#363a45]'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                  {liked ? 'Liked' : 'Like'} ({likeCount})
                </button>
                {canSeeViews && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Eye className="w-4 h-4" />
                    {post.viewCount} views
                  </div>
                )}
              </div>
            </article>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-0 sm:mt-6 bg-[#181a20] rounded-none sm:rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-[#fcd535] rounded"></span>
                  Andi makuru ajyanye
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedPosts.map((rPost) => (
                    <Link 
                      key={rPost.id}
                      to={`/post/${rPost.slug}`}
                      className="flex gap-3 group"
                    >
                      <img 
                        src={getImageUrl(rPost.featuredImage)}
                        alt={rPost.title}
                        className="w-24 h-20 object-cover rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm font-medium group-hover:text-[#fcd535] transition-colors line-clamp-2">
                          {rPost.title}
                        </h4>
                        <p className="text-gray-500 text-xs mt-1">
                          {formatDate(rPost.publishedAt || rPost.createdAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="mt-0 sm:mt-6 bg-[#181a20] rounded-none sm:rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#fcd535] rounded"></span>
                Ibitekerezo ({comments.length})
              </h3>

              {/* Comment Form */}
              <form onSubmit={handleSubmitComment} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={isAuthenticated ? "Andika igitekerezo cyawe..." : "Injira kugira ngo utange igitekerezo"}
                  disabled={!isAuthenticated}
                  className="w-full px-4 py-3 bg-[#0b0e11] border border-[#2b2f36] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fcd535] resize-none disabled:opacity-50"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment || !isAuthenticated}
                    className="flex items-center gap-2 px-4 py-2 bg-[#fcd535] text-[#0b0e11] font-semibold rounded-lg hover:bg-[#f0b90b] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Ohereza
                  </button>
                </div>
              </form>

              {/* Comments List */}
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-4 bg-[#0b0e11] rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#2b2f36] flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <span className="text-white text-sm font-medium">{comment.author?.name}</span>
                          <span className="text-gray-500 text-xs ml-2">{formatDate(comment.createdAt)}</span>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm pl-11">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6">Nta bitekerezo bihari. Ba uwa mbere!</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-4 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto pb-4 scrollbar-hide">
            {/* Latest News */}
            <div className="bg-[#181a20] rounded-lg p-4">
              <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-[#fcd535] rounded"></span>
                Amakuru Mashya
              </h3>
              <div className="space-y-3">
                {latestPosts.map((lPost, index) => (
                  <Link 
                    key={lPost.id}
                    to={`/post/${lPost.slug}`}
                    className="flex gap-2 group"
                  >
                    <span className="w-6 h-6 bg-[#fcd535] text-[#0b0e11] rounded flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-gray-300 text-sm group-hover:text-[#fcd535] transition-colors line-clamp-2 leading-snug">
                        {lPost.title}
                      </h4>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {formatDate(lPost.publishedAt || lPost.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sidebar AdSense */}
            {showAds && (
              <div key={`sidebar-ad-${post?.id}`} className="article-sidebar-ad bg-[#181a20] rounded-lg p-3 text-center" style={{ overflow: 'visible' }}>
                <p className="text-gray-500 text-[0.65rem] uppercase tracking-wider mb-2">Advertisement</p>
                <ins
                  className="adsbygoogle"
                  style={{ display: 'block', minHeight: '250px' }}
                  data-ad-client="ca-pub-3584259871242471"
                  data-ad-slot={ADSENSE_SIDEBAR_SLOT}
                  data-ad-format="auto"
                  data-full-width-responsive="true"
                ></ins>
              </div>
            )}

            {/* Back Links */}
            <div className="space-y-2">
              {post.category && (
                <Link 
                  to={`/category/${post.category.slug}`}
                  className="flex items-center justify-between w-full p-3 bg-[#181a20] rounded-lg text-gray-300 hover:text-[#fcd535] transition-colors text-sm"
                >
                  <span>Reba byose muri {post.category.name}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
              <Link 
                to="/"
                className="flex items-center gap-2 w-full p-3 bg-[#181a20] rounded-lg text-gray-300 hover:text-[#fcd535] transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Subira Ahabanza
              </Link>
            </div>
            </div>
          </div>
        </div>
      </div>

      {isAuthorProfileOpen && post?.author && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#181a20] border border-[#2b2f36] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2b2f36]">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold">Author Profile</h3>
                {isVerifiedAuthor && <BadgeCheck className="w-4 h-4 text-[#1d9bf0]" />}
              </div>
              <button
                type="button"
                onClick={() => setIsAuthorProfileOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#0b0e11] border border-[#2b2f36] rounded-lg p-4">
                <p className="text-white font-semibold flex items-center gap-2">
                  <span>{authorDisplayName}</span>
                  {isVerifiedAuthor && <BadgeCheck className="w-4 h-4 text-[#1d9bf0]" />}
                  {isVerifiedAuthor && (
                    <a
                      href={authorAccountUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Sura account ya writer"
                      className="inline-flex items-center justify-center rounded-full ring-1 ring-[#1d9bf0]/40 hover:ring-[#1d9bf0] transition-all overflow-hidden"
                    >
                      <img
                        src={AUTHOR_APP_BADGE_IMAGE}
                        alt="UmunsiMedia"
                        className="h-5 w-5 rounded-full object-cover bg-[#0b0e11]"
                      />
                    </a>
                  )}
                </p>
                <p className="text-gray-400 text-sm mt-1">Role: {authorRole === 'ADMIN' ? 'Admin' : authorRole === 'AUTHOR' ? 'Author' : authorRole}</p>
                <p className="text-gray-400 text-sm">Member Since: {authorMemberSinceDate ? new Date(authorMemberSinceDate).toLocaleDateString('rw-RW', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                <p className="text-[#4ea1ff] text-sm mt-1">Inkuru zose yanditse: {authorPostCount}</p>
              </div>

              {authorRole === 'AUTHOR' && (
                <div className="bg-[#0b0e11] border border-[#2b2f36] rounded-lg p-4">
                  <p className="text-white font-medium mb-3">Inkuru yanditse</p>
                  {loadingAuthorPosts ? (
                    <p className="text-gray-400 text-sm">Turimo kuzana inkuru...</p>
                  ) : authorPosts.length === 0 ? (
                    <p className="text-gray-400 text-sm">Nta nkuru zibonetse.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {authorPosts.map((authorPost) => (
                        <Link
                          key={authorPost.id}
                          to={`/post/${authorPost.slug}`}
                          onClick={() => setIsAuthorProfileOpen(false)}
                          className="block text-sm text-gray-300 hover:text-[#4ea1ff] transition-colors"
                        >
                          {authorPost.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click outside handlers */}
      {showShareMenu && <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />}
    </div>
  );
};

export default PostPage;
