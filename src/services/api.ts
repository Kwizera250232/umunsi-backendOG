import { buildCacheKey, cachedRequest, invalidateCachePrefix } from '../lib/requestCache';

// API Base Configuration
const PRIMARY_PROD_API_URL = '/api';
const FALLBACK_PROD_API_URL = 'https://api.umunsi.com/api';

const normalizeApiBaseUrl = (configuredUrl?: string) => {
  const fallbackUrl = import.meta.env.PROD ? PRIMARY_PROD_API_URL : 'http://localhost:5000/api';

  if (import.meta.env.PROD) {
    return PRIMARY_PROD_API_URL;
  }

  const candidate = (configuredUrl || fallbackUrl).trim();

  if (!candidate) return fallbackUrl;

  try {
    const parsed = new URL(candidate);
    if (parsed.hostname === 'www.umunsi.com') {
      parsed.hostname = 'umunsi.com';
    }

    const normalized = parsed.toString().replace(/\/$/, '');
    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
  } catch {
    const normalized = candidate
      .replace(/^https:\/\/www\.umunsi\.com/i, 'https://umunsi.com')
      .replace(/\/$/, '');

    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
  }
};

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

export const getApiBaseUrl = () => API_BASE_URL;

export const getServerBaseUrl = () =>
  API_BASE_URL.replace(/\/api\/?$/, '') || (typeof window !== 'undefined' ? window.location.origin : 'https://www.umunsi.com');

export const resolveAssetUrl = (url?: string | null) => {
  if (!url) return '';

  const rawValue = String(url).trim();
  if (!rawValue) return '';

  if (rawValue.startsWith('data:') || rawValue.startsWith('blob:')) return rawValue;
  if (rawValue.startsWith('//')) return `https:${rawValue}`;

  const serverBaseUrl = getServerBaseUrl();
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://www.umunsi.com';
  const proxiedUploadsBase = `${currentOrigin}/api/uploads`;
  const toProxiedUploadsUrl = (pathname: string, search = '', hash = '') => {
    if (!pathname.startsWith('/uploads/')) return `${currentOrigin}${pathname}${search}${hash}`;
    return `${proxiedUploadsBase}${pathname.replace(/^\/uploads/, '')}${search}${hash}`;
  };

  try {
    const parsed = rawValue.startsWith('http://') || rawValue.startsWith('https://')
      ? new URL(rawValue)
      : new URL(rawValue.startsWith('/') ? rawValue : `/${rawValue.replace(/^\.?\//, '')}`, serverBaseUrl);

    const host = parsed.hostname.toLowerCase();
    const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
    const isUmunsiHost = host === 'umunsi.com' || host === 'www.umunsi.com';

    if ((isLocalHost || isUmunsiHost) && parsed.pathname.startsWith('/uploads/')) {
      return toProxiedUploadsUrl(parsed.pathname, parsed.search, parsed.hash);
    }

    if (isLocalHost) {
      return `${serverBaseUrl}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    return parsed.toString();
  } catch {
    if (rawValue.startsWith('/uploads/')) return toProxiedUploadsUrl(rawValue);
    if (rawValue.startsWith('/')) return `${currentOrigin}${rawValue}`;
    if (rawValue.startsWith('uploads/')) return `${proxiedUploadsBase}/${rawValue.replace(/^uploads\//, '')}`;
    if (rawValue.startsWith('images/')) return `${currentOrigin}/${rawValue}`;
    if (!rawValue.includes('/')) {
      return toProxiedUploadsUrl(`/uploads/media/${rawValue}`);
    }
    return toProxiedUploadsUrl(`/uploads/${rawValue.replace(/^\.?\//, '')}`);
  }
};

export const extractFirstImageFromHtml = (html?: string | null) => {
  if (!html) return '';

  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return resolveAssetUrl(match?.[1]);
};

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  users?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    currentPage?: number;
    totalItems?: number;
    itemsPerPage?: number;
  };
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profileUrl?: string;
  role?: 'AUTHOR' | 'USER';
  authorInviteKey?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isPremium?: boolean;
    premiumSince?: string;
    premiumUntil?: string;
    isActive: boolean;
    profileUrl?: string;
    lastLogin?: string;
  };
  token: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  email: string;
  code: string;
  password: string;
}

export interface ChangePasswordWithEmailPayload {
  email: string;
  oldPassword: string;
  newPassword: string;
}

export interface PasswordFlowResponse {
  success: boolean;
  message: string;
  resetLink?: string;
  resetToken?: string;
  debugCode?: string;
}

// News Types
export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isFeatured: boolean;
  isBreaking: boolean;
  isTrending: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  articleCount?: number;
  _count?: {
    news: number;
  };
}

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'USER';
  isActive: boolean;
  isVerified: boolean;
  isPremium?: boolean;
  premiumUntil?: string | null;
  avatar?: string;
  bio?: string;
  phone?: string;
  profileUrl?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    news: number;
    posts: number;
  };
}

// Media Types
export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  category: string;
  tags: string[];
  description?: string;
  uploadedBy: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  isFeatured: boolean;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED';
  isPremium?: boolean;
  isLocked?: boolean;
  publishedAt?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount?: number;
  shareBreakdown?: Record<string, number>;
  isFeatured: boolean;
  isPinned: boolean;
  allowComments: boolean;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
    profileUrl?: string;
    role?: 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'USER';
    isVerified?: boolean;
    createdAt?: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
    color?: string;
  };
}

export interface PremiumDashboardPost {
  id: string;
  title: string;
  slug: string;
  featuredImage?: string;
  publishedAt?: string;
  createdAt: string;
  hasAccess: boolean;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
    color?: string;
  };
}

export interface UserPremiumPostAccess {
  id: string;
  userId: string;
  postId: string;
  grantedBy?: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  post?: {
    id: string;
    title: string;
    slug: string;
    isPremium: boolean;
    status: string;
  };
}

// Analytics Types
export interface DashboardStats {
  totalUsers: number;
  totalArticles: number;
  totalCategories: number;
  totalComments: number;
  totalMedia: number;
  totalPosts: number;
  totalViews: number;
  todayViews: number;
  dailyViews?: Array<{
    date: string;
    views: number;
  }>;
  totalLikes: number;
  userGrowthPercentage: number;
  articleGrowthPercentage: number;
  recentArticles?: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    status: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    createdAt: string;
    publishedAt?: string;
    author: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
    };
    category?: {
      id: string;
      name: string;
      slug: string;
      color: string;
    };
  }>;
  recentUsers?: Array<{
    id: string;
    username: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
  }>;
}

export interface AnalyticsData {
  period: string;
  totalViews: number;
  uniqueVisitors: number;
  newUsers: number;
  returningUsers: number;
  averageSessionDuration: number;
  bounceRate: number;
  topArticles: Array<{
    id: string;
    title: string;
    views: number;
  }>;
  topCategories: Array<{
    name: string;
    views: number;
    color: string;
  }>;
  userGrowth: Array<{
    date: string;
    users: number;
  }>;
  articleGrowth: Array<{
    date: string;
    articles: number;
  }>;
}

export interface MaintenanceStatus {
  success: boolean;
  enabled: boolean;
  message: string;
  updatedAt: string;
}

export interface SupportPayment {
  id: string;
  provider: string;
  purpose: string;
  amount: number;
  currency: string;
  status: string;
  txRef: string;
  paidAt?: string;
  createdAt: string;
}

export interface PaymentsProfileResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      isPremium: boolean;
      premiumSince?: string;
      premiumUntil?: string;
    };
    payments: SupportPayment[];
  };
}

export interface KpayInitializePayload {
  msisdn: string;
  pmethod?: 'momo' | 'cc' | 'spenn';
  amount?: number;
}

export interface KpayInitializeResponse {
  success: boolean;
  message: string;
  data: {
    paymentId: string;
    txRef: string;
    amount: number;
    currency: string;
    checkoutUrl: string | null;
    providerReply?: Record<string, any>;
    premium?: {
      id: string;
      isPremium: boolean;
      premiumSince?: string;
      premiumUntil?: string;
    } | null;
  };
}

export interface KpayVerifyResponse {
  success: boolean;
  message: string;
  data: {
    payment: {
      id: string;
      status: string;
      txRef: string;
      amount: number;
      currency: string;
      paidAt?: string;
    };
    premium: {
      id: string;
      isPremium: boolean;
      premiumSince?: string;
      premiumUntil?: string;
    } | null;
    providerReply?: Record<string, any>;
  };
}

export interface AdBannerSlot {
  enabled: boolean;
  adCode?: string;
  imageUrl: string;
  targetUrl: string;
  altText: string;
  size: string;
  label: string;
}

export interface AdsBannersState {
  success?: boolean;
  updatedAt: string;
  slots: {
    leaderboardTop970x120: AdBannerSlot;
    business728x250: AdBannerSlot;
    homeStory600x100: AdBannerSlot;
    sidebar300x250: AdBannerSlot;
    adminSidebar240x320: AdBannerSlot;
    square300x300: AdBannerSlot;
    skyscraper300x600: AdBannerSlot;
    leaderboardBottom970x120: AdBannerSlot;
  };
}

export type ClassifiedCategory = 'cyamunara' | 'akazi' | 'guhinduza' | 'ibindi';
export type ClassifiedStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ClassifiedAd {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: ClassifiedCategory;
  title: string;
  description: string;
  phone: string;
  email: string;
  attachmentName?: string;
  attachmentUrl?: string;
  durationDays: number;
  priceRwf: number;
  status: ClassifiedStatus;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassifiedBroadcast {
  id: string;
  message: string;
  createdAt: string;
  createdBy: string;
}

export interface ClassifiedDispatchResult {
  broadcastId: string;
  totalTargets: number;
  emailsSent: number;
  emailError?: string | null;
  smsSent: number;
  smsError?: string | null;
  sentAt: string;
  phoneTargets: Array<{
    userId: string;
    name: string;
    phone?: string;
    whatsappUrl: string;
  }>;
}


const parseCategoriesResponse = (payload: unknown): Category[] => {
  if (!payload || typeof payload !== 'object') return [];
  const body = payload as Record<string, unknown>;
  if (Array.isArray(body.categories)) return body.categories as Category[];
  if (Array.isArray(body.data)) return body.data as Category[];
  const nested = body.data;
  if (nested && typeof nested === 'object' && Array.isArray((nested as Record<string, unknown>).categories)) {
    return (nested as Record<string, unknown>).categories as Category[];
  }
  return [];
};

const isValidPost = (value: Post | null | undefined): value is Post =>
  Boolean(value?.id && value?.title);

const parsePostResponse = (payload: unknown): Post | null => {
  if (!payload || typeof payload !== 'object') return null;
  const body = payload as Record<string, unknown>;
  if (body.data && typeof body.data === 'object') return body.data as Post;
  if (body.post && typeof body.post === 'object') return body.post as Post;
  if (typeof body.id === 'string' && typeof body.title === 'string') return body as Post;
  return null;
};

const parsePostsListResponse = (payload: unknown): { data: Post[]; pagination: Record<string, unknown> } => {
  if (!payload || typeof payload !== 'object') {
    return { data: [], pagination: {} };
  }
  const body = payload as Record<string, unknown>;
  const pagination = (body.pagination as Record<string, unknown>) || {};
  if (Array.isArray(body.data)) {
    return { data: body.data as Post[], pagination };
  }
  if (Array.isArray(body.posts)) {
    return { data: body.posts as Post[], pagination };
  }
  const nested = body.data;
  if (nested && typeof nested === 'object') {
    const nestedBody = nested as Record<string, unknown>;
    if (Array.isArray(nestedBody.data)) {
      return { data: nestedBody.data as Post[], pagination: (nestedBody.pagination as Record<string, unknown>) || pagination };
    }
    if (Array.isArray(nestedBody.posts)) {
      return { data: nestedBody.posts as Post[], pagination: (nestedBody.pagination as Record<string, unknown>) || pagination };
    }
  }
  return { data: [], pagination };
};

const isPublicReadEndpoint = (endpoint: string, method = 'GET') => {
  const verb = method.toUpperCase();
  if (verb !== 'GET' && verb !== 'HEAD') return false;
  return (
    /^\/posts(\/|\?|$)/.test(endpoint) ||
    /^\/categories(\/|\?|$)/.test(endpoint) ||
    /^\/news(\/|\?|$)/.test(endpoint)
  );
};

const AUTH_FREE_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/change-password-with-email'
];

// API Client Class
class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = null;

    try {
      this.token = localStorage.getItem('umunsi_token') || sessionStorage.getItem('umunsi_token');
    } catch {
      this.token = null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const shouldSkipAuthRedirect = AUTH_FREE_ENDPOINTS.some((path) => endpoint.startsWith(path));
    const canUseProdFallback = import.meta.env.PROD
      && this.baseURL !== FALLBACK_PROD_API_URL
      && endpoint.startsWith('/');

    if (!this.token) {
      try {
        this.token = localStorage.getItem('umunsi_token') || sessionStorage.getItem('umunsi_token');
      } catch {
        this.token = null;
      }
    }
    
    const headers: HeadersInit = {};

    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Add any custom headers from options
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      const isPublicRead = isPublicReadEndpoint(endpoint, options.method);

      // Public reads must never redirect to login (expired editor tokens should not break the site).
      if (response.status === 401 && isPublicRead) {
        if (retryCount === 0 && this.token) {
          this.token = null;
          try {
            localStorage.removeItem('umunsi_token');
            sessionStorage.removeItem('umunsi_token');
          } catch {
            // Ignore storage removal failures.
          }
          return this.request<T>(endpoint, options, retryCount + 1);
        }
        const authError = new Error(data.error || data.message || 'Unable to load content.');
        (authError as Error & { status?: number }).status = 401;
        throw authError;
      }

      // Handle token expiration for protected routes
      if (response.status === 401 && retryCount === 0 && this.token && !shouldSkipAuthRedirect) {
        try {
          await this.refreshToken();
          return this.request(endpoint, options, retryCount + 1);
        } catch (refreshError) {
          this.token = null;
          try {
            localStorage.removeItem('umunsi_token');
            sessionStorage.removeItem('umunsi_token');
          } catch {
            // Ignore storage removal failures.
          }
          window.location.href = '/subscriber-login';
          throw new Error('Session expired. Please login again.');
        }
      } else if (response.status === 401 && !this.token && !shouldSkipAuthRedirect) {
        window.location.href = '/subscriber-login';
        throw new Error('Authentication required. Please login.');
      }

      if (response.status === 429) {
        const rateMessage =
          data.error || data.message || 'Too many requests. Please wait a moment and try again.';
        if (retryCount < 3) {
          const delay = Math.min(800 * 2 ** retryCount + Math.random() * 400, 6000);
          await new Promise((resolve) => window.setTimeout(resolve, delay));
          return this.request<T>(endpoint, options, retryCount + 1);
        }
        const rateError = new Error(rateMessage);
        (rateError as Error & { status?: number }).status = 429;
        throw rateError;
      }

      if (!response.ok) {
        const failError = new Error(data.error || data.message || data.details || 'API request failed');
        (failError as Error & { status?: number }).status = response.status;
        throw failError;
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error || '');
      const isNetworkStyleError = /fetch|network|load failed|failed to fetch/i.test(errorMessage);

      if (canUseProdFallback && isNetworkStyleError) {
        const previousBaseUrl = this.baseURL;
        this.baseURL = FALLBACK_PROD_API_URL;

        try {
          return await this.request<T>(endpoint, options, retryCount);
        } finally {
          this.baseURL = previousBaseUrl;
        }
      }

      throw error;
    }
  }

  // Auth Methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.token) {
      this.token = response.token;
      try {
        localStorage.setItem('umunsi_token', response.token);
        sessionStorage.setItem('umunsi_token', response.token);
      } catch {
        // Ignore storage write failures.
      }
    }
    
    return response;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.success && response.token) {
      this.token = response.token;
      try {
        localStorage.setItem('umunsi_token', response.token);
        sessionStorage.setItem('umunsi_token', response.token);
      } catch {
        // Ignore storage write failures.
      }
    }
    
    return response;
  }

  async forgotPassword(payload: ForgotPasswordPayload): Promise<PasswordFlowResponse> {
    return this.request<PasswordFlowResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async resetPassword(payload: ResetPasswordPayload): Promise<PasswordFlowResponse> {
    return this.request<PasswordFlowResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async changePasswordWithEmail(payload: ChangePasswordWithEmailPayload): Promise<PasswordFlowResponse> {
    return this.request<PasswordFlowResponse>('/auth/change-password-with-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.token = null;
      try {
        localStorage.removeItem('umunsi_token');
        sessionStorage.removeItem('umunsi_token');
      } catch {
        // Ignore storage removal failures.
      }
    }
  }

  // Profile Methods
  async getProfile(): Promise<{ success: boolean; user: User }> {
    const response = await this.request<{ success: boolean; user: User }>('/auth/me');
    return response;
  }

  async updateProfile(profileData: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
    profileUrl?: string;
  }): Promise<{ success: boolean; user: User; message?: string }> {
    const response = await this.request<{ success: boolean; user: User; message?: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return response;
  }

  async uploadAvatar(file: File): Promise<{ success: boolean; avatar: string; user: User; message?: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${this.baseURL}/auth/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload avatar');
    }

    return response.json();
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    const response = await this.request<{ success: boolean; message?: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return response;
  }

  async getCurrentUser(): Promise<AuthResponse['user']> {
    const response = await this.request<AuthResponse['user']>('/auth/me');
    return response;
  }

  async refreshToken(): Promise<void> {
    if (!this.token) {
      throw new Error('No token available to refresh');
    }
    
    const response = await this.request<{ success: boolean; token: string }>('/auth/refresh', {
      method: 'POST'
    });
    
    if (response.success && response.token) {
      this.token = response.token;
      localStorage.setItem('umunsi_token', response.token);
    }
  }

  async initializeKpaySupportPayment(payload: KpayInitializePayload): Promise<KpayInitializeResponse> {
    return this.request<KpayInitializeResponse>('/payments/kpay/initialize', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async verifyKpaySupportPayment(txRef: string): Promise<KpayVerifyResponse> {
    return this.request<KpayVerifyResponse>(`/payments/kpay/verify/${encodeURIComponent(txRef)}`);
  }

  async getPaymentsProfile(): Promise<PaymentsProfileResponse> {
    return this.request<PaymentsProfileResponse>('/payments/me');
  }

  // Token management methods
  setToken(token: string): void {
    this.token = token;
    try {
      localStorage.setItem('umunsi_token', token);
      sessionStorage.setItem('umunsi_token', token);
    } catch {
      // Ignore storage write failures.
    }
  }

  clearToken(): void {
    this.token = null;
    try {
      localStorage.removeItem('umunsi_token');
      sessionStorage.removeItem('umunsi_token');
    } catch {
      // Ignore storage removal failures.
    }
  }

  // Health check method
  async healthCheck(): Promise<any> {
    return await this.request('/health');
  }

  // News Methods
  async getArticles(params?: {
    page?: number;
    limit?: number;
    category?: string;
    categoryId?: string;
    search?: string;
    status?: string;
    isBreaking?: boolean;
    isFeatured?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Article>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.category) searchParams.append('category', params.category);
    if (params?.categoryId) searchParams.append('category', params.categoryId);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.isBreaking !== undefined) searchParams.append('isBreaking', params.isBreaking.toString());
    if (params?.isFeatured !== undefined) searchParams.append('isFeatured', params.isFeatured.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const response = await this.request<{news: Article[], pagination: any}>(
      `/news?${searchParams.toString()}`
    );
    return {
      data: response.news,
      pagination: response.pagination
    };
  }

  async getArticle(id: string): Promise<Article> {
    const response = await this.request<Article>(`/news/${id}`);
    return response;
  }

  async createArticle(articleData: Partial<Article> | FormData): Promise<Article> {
    let options: RequestInit = { method: 'POST' };
    
    if (articleData instanceof FormData) {
      // Handle file upload with FormData
      options.body = articleData;
      // Don't set Content-Type header for FormData (browser sets it automatically with boundary)
    } else {
      // Handle regular JSON data
      options.body = JSON.stringify(articleData);
      options.headers = { 'Content-Type': 'application/json' };
    }

    const response = await this.request<Article>('/news', options);
    return response;
  }

  async updateArticle(id: string, articleData: Partial<Article>): Promise<Article> {
    const response = await this.request<Article>(`/news/${id}`, {
      method: 'PUT',
      body: JSON.stringify(articleData),
    });
    return response;
  }

  async deleteArticle(id: string): Promise<void> {
    await this.request(`/news/${id}`, { method: 'DELETE' });
  }

  // Categories Methods
  async getCategories(options?: { includeInactive?: boolean }): Promise<Category[]> {
    const includeInactive = Boolean(options?.includeInactive);
    const cacheKey = buildCacheKey('categories', { includeInactive });
    const persistKey = includeInactive ? 'umunsi_categories_all_v1' : 'umunsi_categories_v1';

    return cachedRequest(
      cacheKey,
      async () => {
        const params = new URLSearchParams();
        if (includeInactive) {
          params.append('includeInactive', 'true');
        }
        const queryString = params.toString();
        const url = queryString ? `/categories?${queryString}` : '/categories';
        const response = await this.request<unknown>(url);
        return parseCategoriesResponse(response);
      },
      { ttlMs: 90_000, persistKey },
    );
  }

  async createCategory(categoryData: Partial<Category>): Promise<{ success: boolean; category: Category; message?: string }> {
    const response = await this.request<{ success: boolean; category: Category; message?: string }>('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
    invalidateCachePrefix('categories');
    return response;
  }

  async updateCategory(id: string, categoryData: Partial<Category>): Promise<{ success: boolean; category: Category; message?: string }> {
    const response = await this.request<{ success: boolean; category: Category; message?: string }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
    invalidateCachePrefix('categories');
    return response;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.request(`/categories/${id}`, { method: 'DELETE' });
    invalidateCachePrefix('categories');
  }

  // Users Methods
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<PaginatedResponse<User>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.status) searchParams.append('status', params.status);

    const response = await this.request<PaginatedResponse<User> & { users?: User[] }>(
      `/users?${searchParams.toString()}`
    );

    const users = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.users)
        ? response.users
        : [];

    const rawPagination = response.pagination || ({} as PaginatedResponse<User>['pagination']);
    const page = Number(rawPagination.page ?? rawPagination.currentPage ?? params?.page ?? 1);
    const fallbackLimit = params?.limit ?? (users.length > 0 ? users.length : 10);
    const limit = Number(rawPagination.limit ?? rawPagination.itemsPerPage ?? fallbackLimit);
    const total = Number(rawPagination.total ?? rawPagination.totalItems ?? users.length);
    const totalPages = Number(rawPagination.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, limit))));

    return {
      ...response,
      data: users,
      users,
      pagination: {
        ...rawPagination,
        page,
        limit,
        total,
        totalPages,
        currentPage: page,
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  async createUser(userData: {
    email: string;
    password: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    profileUrl?: string;
    role?: 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'USER';
  }): Promise<{ success: boolean; user: User; message?: string }> {
    const response = await this.request<{ success: boolean; user: User; message?: string }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<{ success: boolean; user: User; message?: string }> {
    const response = await this.request<{ success: boolean; user: User; message?: string }>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return response;
  }

  async deleteUser(id: string): Promise<void> {
    await this.request(`/admin/users/${id}`, { method: 'DELETE' });
  }

  async grantUserPremiumPostAccess(userId: string, payload: { postId: string; expiresAt?: string | null }): Promise<{ success: boolean; message?: string; data: UserPremiumPostAccess }> {
    return this.request<{ success: boolean; message?: string; data: UserPremiumPostAccess }>(`/admin/users/${userId}/premium-posts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getUserPremiumPostAccess(userId: string): Promise<{ success: boolean; data: UserPremiumPostAccess[] }> {
    return this.request<{ success: boolean; data: UserPremiumPostAccess[] }>(`/admin/users/${userId}/premium-posts`);
  }

  async revokeUserPremiumPostAccess(userId: string, postId: string): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(`/admin/users/${userId}/premium-posts/${postId}`, {
      method: 'DELETE',
    });
  }

  // Analytics Methods
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.request<DashboardStats>('/admin/dashboard');
    return response;
  }

  async getAnalytics(period: string = '30d'): Promise<AnalyticsData> {
    const response = await this.request<AnalyticsData>(`/analytics?period=${period}`);
    return response;
  }

  async getMaintenanceStatus(): Promise<MaintenanceStatus> {
    const response = await this.request<MaintenanceStatus>('/admin/maintenance');
    return response;
  }

  async updateMaintenanceStatus(payload: { enabled: boolean; message: string }): Promise<MaintenanceStatus> {
    const response = await this.request<MaintenanceStatus>('/admin/maintenance', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response;
  }

  async getAdsBanners(): Promise<AdsBannersState> {
    const response = await this.request<AdsBannersState>('/ads-banners');
    return response;
  }

  async getClassifiedAds(params?: { category?: ClassifiedCategory; status?: ClassifiedStatus }): Promise<ClassifiedAd[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.status) query.append('status', params.status);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await this.request<{ success: boolean; data: ClassifiedAd[] }>(`/classifieds${suffix}`);
    return response.data || [];
  }

  async getMyClassifiedAds(): Promise<ClassifiedAd[]> {
    const response = await this.request<{ success: boolean; data: ClassifiedAd[] }>('/classifieds/mine');
    return response.data || [];
  }

  async getAllClassifiedAds(): Promise<ClassifiedAd[]> {
    const response = await this.request<{ success: boolean; data: ClassifiedAd[] }>('/classifieds/all');
    return response.data || [];
  }

  async getClassifiedAdsByUser(userId: string): Promise<ClassifiedAd[]> {
    const response = await this.request<{ success: boolean; data: ClassifiedAd[] }>(`/classifieds/user/${userId}`);
    return response.data || [];
  }

  async submitClassifiedAd(payload: {
    category: ClassifiedCategory;
    title: string;
    description: string;
    phone: string;
    email: string;
    attachmentName?: string;
    attachmentUrl?: string;
    durationDays: number;
    priceRwf: number;
  }): Promise<ClassifiedAd> {
    const response = await this.request<{ success: boolean; data: ClassifiedAd }>('/classifieds', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  }

  async updateClassifiedStatus(id: string, status: 'APPROVED' | 'REJECTED', reviewNote?: string): Promise<ClassifiedAd> {
    const response = await this.request<{ success: boolean; data: ClassifiedAd }>(`/classifieds/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reviewNote }),
    });
    return response.data;
  }

  async updateClassifiedAd(
    id: string,
    payload: Partial<{
      category: ClassifiedCategory;
      title: string;
      description: string;
      phone: string;
      email: string;
      attachmentName: string;
      attachmentUrl: string;
      durationDays: number;
      priceRwf: number;
      status: ClassifiedStatus;
      reviewNote: string;
    }>
  ): Promise<ClassifiedAd> {
    const response = await this.request<{ success: boolean; data: ClassifiedAd }>(`/classifieds/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response.data;
  }

  async getClassifiedBroadcasts(): Promise<ClassifiedBroadcast[]> {
    const response = await this.request<{ success: boolean; data: ClassifiedBroadcast[] }>('/classifieds/broadcasts/list');
    return response.data || [];
  }

  async createClassifiedBroadcast(message: string): Promise<ClassifiedBroadcast> {
    const response = await this.request<{ success: boolean; data: ClassifiedBroadcast }>('/classifieds/broadcasts', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return response.data;
  }

  async dispatchClassifiedBroadcast(payload: {
    message: string;
    userIds?: string[];
    sendEmail?: boolean;
    sendPhone?: boolean;
    sendSms?: boolean;
    subject?: string;
  }): Promise<ClassifiedDispatchResult> {
    const response = await this.request<{ success: boolean; data: ClassifiedDispatchResult }>('/classifieds/broadcasts/dispatch', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  }

  async getAdminAdsBanners(): Promise<AdsBannersState> {
    const response = await this.request<AdsBannersState>('/admin/ads-banners');
    return response;
  }

  async updateAdminAdsBanners(payload: { slots: AdsBannersState['slots'] }): Promise<AdsBannersState> {
    const response = await this.request<AdsBannersState>('/admin/ads-banners', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response;
  }

  // Posts Methods
  async getPosts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    author?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: Post[]; pagination: any }> {
    const cacheKey = buildCacheKey('posts', params || {});
    const persistKey = params?.category
      ? `umunsi_posts_cat_${params.category}_${params.status || 'any'}_v1`
      : undefined;

    return cachedRequest(
      cacheKey,
      async () => {
        const queryParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
              queryParams.append(key, value.toString());
            }
          });
        }
        const response = await this.request<unknown>(`/posts?${queryParams}`);
        return parsePostsListResponse(response);
      },
      { ttlMs: 45_000, persistKey },
    );
  }

  async getPost(id: string): Promise<Post> {
    const encodedId = encodeURIComponent(id);
    const cacheKey = buildCacheKey('post', { id });
    const persistKey = `umunsi_post_entry_${id}`;
    return cachedRequest(
      cacheKey,
      async () => {
        try {
          const response = await this.request<unknown>(`/posts/${encodedId}`);
          const parsed = parsePostResponse(response);
          if (isValidPost(parsed)) return parsed;
        } catch (directError) {
          const status = (directError as { status?: number })?.status;
          if (status && status !== 404 && status !== 429) throw directError;
        }

        const list = await this.getPosts({ status: 'PUBLISHED', search: id, limit: 10 });
        let match = list.data.find(
          (post) => post.slug === id || post.id === id || encodeURIComponent(post.slug || '') === encodedId,
        );
        if (!match) {
          const recent = await this.getPosts({ status: 'PUBLISHED', limit: 100 });
          match = recent.data.find(
            (post) => post.slug === id || post.id === id,
          );
        }
        if (isValidPost(match)) return match;

        const notFound = new Error('Post not found');
        (notFound as Error & { status?: number }).status = 404;
        throw notFound;
      },
      { ttlMs: 60_000, persistKey },
    );
  }

  async trackPostShare(id: string, platform: string): Promise<{ success: boolean; data: { postId: string; platform: string; shareCount: number; shareBreakdown?: Record<string, number> } }> {
    return this.request(`/posts/${encodeURIComponent(id)}/share`, {
      method: 'POST',
      body: JSON.stringify({ platform }),
    });
  }

  async getPremiumDashboardPosts(): Promise<{ success: boolean; data: PremiumDashboardPost[] }> {
    return this.request<{ success: boolean; data: PremiumDashboardPost[] }>('/posts/premium-dashboard');
  }

  async createPost(data: {
    title: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED';
    isPremium?: boolean;
    categoryId?: string;
    isFeatured?: boolean;
    isPinned?: boolean;
    allowComments?: boolean;
    tags?: string[];
    metaTitle?: string;
    metaDescription?: string;
  }): Promise<Post> {
    const response = await this.request<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    invalidateCachePrefix('posts');
    return response;
  }

  async updatePost(id: string, data: Partial<{
    title: string;
    content: string;
    excerpt: string;
    featuredImage: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED';
    isPremium: boolean;
    categoryId: string;
    isFeatured: boolean;
    isPinned: boolean;
    allowComments: boolean;
    tags: string[];
    metaTitle: string;
    metaDescription: string;
  }>): Promise<Post> {
    const response = await this.request<Post>(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    invalidateCachePrefix('posts');
    return response;
  }

  async deletePost(id: string): Promise<void> {
    await this.request(`/posts/${id}`, {
      method: 'DELETE',
    });
    invalidateCachePrefix('posts');
  }

  async deletePosts(ids: string[]): Promise<void> {
    await this.request('/posts/bulk-delete', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
    invalidateCachePrefix('posts');
  }

  async getPostStats(): Promise<{
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    featuredPosts: number;
    totalViews: number;
    totalLikes: number;
  }> {
    const response = await this.request<{
      success: boolean;
      data: {
        totalPosts: number;
        publishedPosts: number;
        draftPosts: number;
        featuredPosts: number;
        totalViews: number;
        totalLikes: number;
      };
    }>('/posts/stats');
    return response.data;
  }

  // Media Methods
  async getMediaFiles(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    type?: string;
  }): Promise<MediaFile[]> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.category) searchParams.append('category', params.category);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.type) searchParams.append('type', params.type);

    const response = await this.request<{media: MediaFile[]}>(
      `/media?${searchParams.toString()}`
    );
    return response.media || [];
  }

  async getMediaFile(id: string): Promise<MediaFile> {
    const response = await this.request<MediaFile>(`/media/${id}`);
    return response;
  }

  async uploadMediaFiles(formData: FormData): Promise<MediaFile[]> {
    const response = await this.request<{media: MediaFile[]}>('/media/upload', {
      method: 'POST',
      body: formData,
    });
    return response.media || [];
  }

  async updateMediaFile(id: string, mediaData: Partial<MediaFile>): Promise<MediaFile> {
    const response = await this.request<MediaFile>(`/media/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mediaData),
    });
    return response;
  }

  async deleteMediaFiles(ids: string[]): Promise<void> {
    await this.request('/media/bulk-delete', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
  }

  async deleteMediaFile(id: string): Promise<void> {
    await this.request(`/media/${id}`, { method: 'DELETE' });
  }

  async getMediaStats(): Promise<{
    totalMedia: number;
    totalImages: number;
    totalVideos: number;
    totalDocuments: number;
    totalSize: number;
  }> {
    const response = await this.request<{
      success: boolean;
      stats: {
        totalFiles: number;
        imagesCount: number;
        videosCount: number;
        documentsCount: number;
        audioCount: number;
        totalSize: number;
      };
    }>('/media/stats');
    return {
      totalMedia: response.stats.totalFiles,
      totalImages: response.stats.imagesCount,
      totalVideos: response.stats.videosCount,
      totalDocuments: response.stats.documentsCount,
      totalSize: response.stats.totalSize
    };
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);
