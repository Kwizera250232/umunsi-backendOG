import { apiClient, extractFirstImageFromHtml, type Category, type Post } from '../services/api';

export type CategoryPageBundle = {
  category: Category | null;
  posts: Post[];
  allCategories: Category[];
};

type PostWithCategoryId = Post & { categoryId?: string };

export const normalizeCategorySlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const findCategoryBySlug = (categories: Category[], slug: string) => {
  const normalizedSlug = normalizeCategorySlug(slug);
  return (
    categories.find((cat) => cat.slug === slug) ||
    categories.find(
      (cat) =>
        normalizeCategorySlug(cat.slug || '') === normalizedSlug ||
        normalizeCategorySlug(cat.name) === normalizedSlug,
    ) ||
    null
  );
};

const preparePosts = (posts: Post[]) =>
  posts.map((post) => ({
    ...post,
    featuredImage: post.featuredImage || extractFirstImageFromHtml(post.content) || undefined,
  }));

const postMatchesCategory = (post: Post, category: Category, slug: string) => {
  const extended = post as PostWithCategoryId;
  const normalizedSlug = normalizeCategorySlug(slug);
  const normalizedCategoryName = normalizeCategorySlug(category.name);

  if (extended.categoryId === category.id) return true;
  if (post.category?.id === category.id) return true;
  if (normalizeCategorySlug(post.category?.slug || '') === normalizedSlug) return true;
  if (normalizeCategorySlug(post.category?.name || '') === normalizedCategoryName) return true;

  return false;
};

const filterPostsForCategory = (posts: Post[], category: Category, slug: string) =>
  preparePosts(posts.filter((post) => postMatchesCategory(post, category, slug)));

export const readHomeCacheForCategory = (slug: string): CategoryPageBundle | null => {
  if (typeof sessionStorage === 'undefined' || !slug) return null;

  try {
    const raw = sessionStorage.getItem('umunsi_home_cache_v1');
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      posts?: Post[];
      categories?: Category[];
      savedAt?: number;
    };

    if (parsed.savedAt && Date.now() - parsed.savedAt > 5 * 60_000) return null;

    const allCategories = parsed.categories || [];
    const category = findCategoryBySlug(allCategories, slug);
    if (!category) return null;

    const posts = filterPostsForCategory(parsed.posts || [], category, slug);

    return { category, posts, allCategories };
  } catch {
    return null;
  }
};

export const readCategoryPageCache = (slug: string): CategoryPageBundle | null => {
  if (typeof sessionStorage === 'undefined' || !slug) return null;

  try {
    const raw = sessionStorage.getItem(`umunsi_category_page_${slug}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CategoryPageBundle & { expires?: number };
    if (parsed.expires && parsed.expires < Date.now()) {
      sessionStorage.removeItem(`umunsi_category_page_${slug}`);
      return null;
    }
    return {
      category: parsed.category,
      posts: preparePosts(parsed.posts || []),
      allCategories: parsed.allCategories || [],
    };
  } catch {
    return null;
  }
};

export const writeCategoryPageCache = (slug: string, bundle: CategoryPageBundle) => {
  if (typeof sessionStorage === 'undefined' || !slug) return;

  try {
    sessionStorage.setItem(
      `umunsi_category_page_${slug}`,
      JSON.stringify({ ...bundle, expires: Date.now() + 5 * 60_000 }),
    );
  } catch {
    // Ignore quota errors.
  }
};

export const getInitialCategoryBundle = (slug?: string): CategoryPageBundle | null => {
  if (!slug) return null;
  return readCategoryPageCache(slug) || readHomeCacheForCategory(slug);
};

export const isRateLimitError = (error: unknown) => {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  const status = (error as { status?: number })?.status;
  return status === 429 || /too many requests/i.test(message);
};

/** Load posts for a category — minimal API calls, then filter / session cache fallbacks. */
export const fetchPostsForCategory = async (category: Category, slug: string): Promise<Post[]> => {
  const categoryParams = [category.id, category.slug].filter(Boolean);

  for (const categoryParam of categoryParams) {
    try {
      const response = await apiClient.getPosts({
        status: 'PUBLISHED',
        limit: 60,
        category: categoryParam,
      });
      const rows = response?.data || [];
      if (rows.length > 0) {
        const matched = filterPostsForCategory(rows, category, slug);
        return matched.length > 0 ? matched : preparePosts(rows);
      }
    } catch {
      // Try next param or fall through.
    }
  }

  try {
    const response = await apiClient.getPosts({ status: 'PUBLISHED', limit: 150 });
    const matched = filterPostsForCategory(response?.data || [], category, slug);
    if (matched.length > 0) return matched;
  } catch {
    // Fall through to session caches.
  }

  const fromCategoryPage = readCategoryPageCache(slug);
  if (fromCategoryPage?.posts?.length) return fromCategoryPage.posts;

  const fromHome = readHomeCacheForCategory(slug);
  if (fromHome?.posts?.length) return fromHome.posts;

  return [];
};
