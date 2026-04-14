// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://umunsi.com/api' : 'http://localhost:5000/api');

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
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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
    isActive: boolean;
    lastLogin?: string;
  };
  token: string;
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
  isVerified?: boolean;
  avatar?: string;
  bio?: string;
  phone?: string;
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
  };
  category?: {
    id: string;
    name: string;
    slug: string;
    color?: string;
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

export interface AdBannerSlot {
  enabled: boolean;
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
    sidebar300x250: AdBannerSlot;
    adminSidebar240x320: AdBannerSlot;
    square300x300: AdBannerSlot;
    skyscraper300x600: AdBannerSlot;
    leaderboardBottom970x120: AdBannerSlot;
  };
}

// API Client Class
class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('umunsi_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
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

      const data = await response.json();

      // Handle token expiration
      if (response.status === 401 && retryCount === 0 && this.token) {
        try {
          // Try to refresh the token
          await this.refreshToken();
          // Retry the original request
          return this.request(endpoint, options, retryCount + 1);
        } catch (refreshError) {
          // If refresh fails, clear token and redirect to login
          this.token = null;
          localStorage.removeItem('umunsi_token');
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
      } else if (response.status === 401 && !this.token) {
        // No token available, redirect to login
        window.location.href = '/login';
        throw new Error('Authentication required. Please login.');
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'API request failed');
      }

      return data;
    } catch (error) {
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
      localStorage.setItem('umunsi_token', response.token);
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
      localStorage.setItem('umunsi_token', response.token);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.token = null;
      localStorage.removeItem('umunsi_token');
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

  // Token management methods
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('umunsi_token', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('umunsi_token');
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
    const params = new URLSearchParams();
    if (options?.includeInactive) {
      params.append('includeInactive', 'true');
    }
    const queryString = params.toString();
    const url = queryString ? `/categories?${queryString}` : '/categories';
    const response = await this.request<{categories: Category[]}>(url);
    // The API returns {success: true, categories: [...]}
    return response.categories || [];
  }

  async createCategory(categoryData: Partial<Category>): Promise<{ success: boolean; category: Category; message?: string }> {
    const response = await this.request<{ success: boolean; category: Category; message?: string }>('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
    return response;
  }

  async updateCategory(id: string, categoryData: Partial<Category>): Promise<{ success: boolean; category: Category; message?: string }> {
    const response = await this.request<{ success: boolean; category: Category; message?: string }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
    return response;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.request(`/categories/${id}`, { method: 'DELETE' });
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
    role?: 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'USER';
  }): Promise<{ success: boolean; user: User; message?: string }> {
    const response = await this.request<{ success: boolean; user: User; message?: string }>('/auth/register', {
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
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const response = await this.request<{ data: Post[]; pagination: any }>(`/posts?${queryParams}`);
    return response;
  }

  async getPost(id: string): Promise<Post> {
    const response = await this.request<{ success: boolean; data: Post }>(`/posts/${id}`);
    return response.data;
  }

  async createPost(data: {
    title: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED';
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
    return response;
  }

  async updatePost(id: string, data: Partial<{
    title: string;
    content: string;
    excerpt: string;
    featuredImage: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED';
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
    return response;
  }

  async deletePost(id: string): Promise<void> {
    await this.request(`/posts/${id}`, {
      method: 'DELETE',
    });
  }

  async deletePosts(ids: string[]): Promise<void> {
    await this.request('/posts/bulk-delete', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
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
