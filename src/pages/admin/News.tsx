import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Eye, Clock, Calendar, User, AlertTriangle,
  TrendingUp, Zap, Star, Search, RefreshCw, MoreVertical, CheckCircle,
  XCircle, Pause, X, Filter, Grid3X3, List, Settings, Newspaper
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';

interface NewsArticle {
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
  isBreaking: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  categoryId: string;
  author: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    color: string;
    icon: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  isActive: boolean;
}

const News: React.FC = () => {
  const { user } = useAuth();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    categoryId: '',
    status: 'DRAFT' as const,
    isFeatured: false,
    isBreaking: false,
    isTrending: false,
    imageFile: null as File | null
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getArticles({ 
        page: currentPage, 
        limit: itemsPerPage,
        search: searchTerm,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        category: categoryFilter === 'ALL' ? undefined : categoryFilter,
        sortBy,
        sortOrder
      });
      
      if (response?.data) {
        let filteredNews = response.data;
        
        if (typeFilter !== 'ALL') {
          filteredNews = filteredNews.filter(article => {
            if (typeFilter === 'BREAKING') return article.isBreaking;
            if (typeFilter === 'FEATURED') return article.isFeatured;
            if (typeFilter === 'TRENDING') return article.isTrending;
            return true;
          });
        }
        
        setNews(filteredNews);
        setTotalPages(Math.ceil((response.total || 0) / itemsPerPage));
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.getCategories();
      if (response) {
        setCategories(response);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [currentPage, searchTerm, statusFilter, categoryFilter, typeFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Image file size must be less than 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, imageFile: file }));
      setFormError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    const errors = [];
    if (!formData.title.trim()) errors.push('Title is required');
    if (!formData.content.trim()) errors.push('Content is required');
    if (!formData.categoryId) errors.push('Category is required');
    
    if (errors.length > 0) {
      setFormError(`Please fix the following errors: ${errors.join(', ')}`);
      setFormLoading(false);
      return;
    }

    try {
      const data = new FormData();
      if (formData.imageFile) data.append('image', formData.imageFile);
      data.append('title', formData.title);
      data.append('content', formData.content);
      data.append('excerpt', formData.excerpt);
      data.append('categoryId', formData.categoryId);
      data.append('status', formData.status);
      data.append('isFeatured', formData.isFeatured.toString());
      data.append('isBreaking', formData.isBreaking.toString());
      data.append('isTrending', formData.isTrending.toString());

      const newArticle = await apiClient.createArticle(data);
      setNews(prev => [newArticle, ...prev]);
      setFormSuccess('News article created successfully!');
      
      setTimeout(() => {
        setShowAddModal(false);
        resetForm();
        setFormSuccess(null);
      }, 1500);
    } catch (error: any) {
      setFormError(`Failed to create article: ${error.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', content: '', excerpt: '', categoryId: '', status: 'DRAFT',
      isFeatured: false, isBreaking: false, isTrending: false, imageFile: null
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteArticle(id);
      setNews(prev => prev.filter(article => article.id !== id));
      setShowDeleteModal(false);
      setSelectedArticle(null);
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await apiClient.updateArticle(id, { status: newStatus });
      setNews(prev => prev.map(article => 
        article.id === id ? { ...article, status: newStatus as any } : article
      ));
    } catch (error) {
      console.error('Error updating article status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
      DRAFT: { color: 'bg-amber-500/10 text-amber-400 border border-amber-500/30', icon: Clock },
      PUBLISHED: { color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30', icon: CheckCircle },
      ARCHIVED: { color: 'bg-gray-500/10 text-gray-400 border border-gray-500/30', icon: Pause },
      DELETED: { color: 'bg-red-500/10 text-red-400 border border-red-500/30', icon: XCircle }
    };
    
    const { color, icon: Icon } = config[status] || config.DRAFT;
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const getTypeBadges = (article: NewsArticle) => {
    const badges = [];
    if (article.isBreaking) {
      badges.push(
        <span key="breaking" className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30 mr-1">
          <Zap className="w-3 h-3 mr-1" />
          Breaking
        </span>
      );
    }
    if (article.isFeatured) {
      badges.push(
        <span key="featured" className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-[#fcd535]/10 text-[#fcd535] border border-[#fcd535]/30 mr-1">
          <Star className="w-3 h-3 mr-1" />
          Featured
        </span>
      );
    }
    if (article.isTrending) {
      badges.push(
        <span key="trending" className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30 mr-1">
          <TrendingUp className="w-3 h-3 mr-1" />
          Trending
        </span>
      );
    }
    return badges;
  };

  return (
    <div className="min-h-screen bg-[#0b0e11]">
      {/* Header */}
      <div className="bg-[#181a20] border-b border-[#2b2f36]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl">
                <Newspaper className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">News Management</h1>
                <p className="text-sm text-gray-400">Manage all types of news articles</p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30">
                    <Newspaper className="w-3 h-3 mr-1" />
                    {news.length} Articles
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-semibold rounded-xl hover:from-[#f0b90b] hover:to-[#d4a00a] transition-all shadow-lg shadow-[#fcd535]/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add News Article
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-[#181a20] border-b border-[#2b2f36]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search news articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-gray-300 text-sm focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]"
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-gray-300 text-sm focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]"
              >
                <option value="ALL">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-gray-300 text-sm focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]"
              >
                <option value="ALL">All Types</option>
                <option value="BREAKING">Breaking News</option>
                <option value="FEATURED">Featured News</option>
                <option value="TRENDING">Trending News</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-gray-300 text-sm focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]"
              >
                <option value="createdAt">Date Created</option>
                <option value="updatedAt">Date Updated</option>
                <option value="title">Title</option>
                <option value="viewCount">Views</option>
              </select>

              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-gray-300 hover:bg-[#1e2329] text-sm"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>

              <button
                onClick={fetchNews}
                className="px-3 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-gray-300 hover:bg-[#1e2329] text-sm"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex border border-[#2b2f36] rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-[#fcd535]/10 text-[#fcd535]' : 'bg-[#0b0e11] text-gray-400 hover:bg-[#1e2329]'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-[#fcd535]/10 text-[#fcd535]' : 'bg-[#0b0e11] text-gray-400 hover:bg-[#1e2329]'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#fcd535]/20 border-t-[#fcd535] rounded-full animate-spin"></div>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-600" />
            <h3 className="mt-2 text-sm font-medium text-white">No news articles</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first news article.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-semibold rounded-xl hover:from-[#f0b90b] hover:to-[#d4a00a] transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add News Article
              </button>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {news.map((article) => (
              <div key={article.id} className={`bg-[#181a20] rounded-2xl border border-[#2b2f36] overflow-hidden hover:border-[#fcd535]/30 transition-all ${viewMode === 'list' ? 'flex' : ''}`}>
                {/* Article Image */}
                <div className={`${viewMode === 'list' ? 'w-32 h-32 flex-shrink-0' : 'w-full h-48'}`}>
                  {article.featuredImage ? (
                    <img
                      className="w-full h-full object-cover"
                      src={article.featuredImage}
                      alt={article.title}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#0b0e11] flex items-center justify-center">
                      <Newspaper className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Article Content */}
                <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  {/* Badges */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-wrap gap-1">
                      {getStatusBadge(article.status)}
                      {getTypeBadges(article)}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-medium text-white mb-2 line-clamp-2">
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  {article.excerpt && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {article.author.firstName} {article.author.lastName}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(article.createdAt)}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span className="flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      {article.viewCount} views
                    </span>
                    <span className="flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {article.likeCount} likes
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#2b2f36]">
                    <button
                      onClick={() => toggleStatus(article.id, article.status)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        article.status === 'PUBLISHED'
                          ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      {article.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    </button>

                    <div className="flex items-center space-x-1">
                      <button className="p-1.5 text-gray-500 hover:text-white hover:bg-[#2b2f36] rounded-lg transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedArticle(article);
                          setShowDeleteModal(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 text-gray-500 hover:text-white hover:bg-[#2b2f36] rounded-lg transition-colors">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-[#2b2f36] rounded-xl text-sm font-medium text-gray-300 bg-[#181a20] hover:bg-[#1e2329] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-[#2b2f36] rounded-xl text-sm font-medium text-gray-300 bg-[#181a20] hover:bg-[#1e2329] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-[#181a20] rounded-2xl border border-[#2b2f36] shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#2b2f36]">
              <h3 className="text-lg font-semibold text-white">Add News Article</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
            {formSuccess && (
                <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
                {formSuccess}
              </div>
            )}

            {formError && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]"
                  placeholder="Enter article title"
                  required
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Content *</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={4}
                    className="w-full px-4 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]"
                  placeholder="Enter article content"
                  required
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Excerpt</label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  rows={2}
                    className="w-full px-4 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]"
                  placeholder="Enter article excerpt (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Featured Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                    className="w-full px-4 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#fcd535] file:text-[#0b0e11] file:font-medium file:cursor-pointer"
                />
              </div>

                <div className="flex items-center space-x-6">
                  <label className="flex items-center p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36] cursor-pointer hover:border-[#fcd535]/50 transition-colors">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                      className="w-4 h-4 text-[#fcd535] bg-[#0b0e11] border-[#2b2f36] rounded focus:ring-[#fcd535]"
                  />
                    <Star className="w-4 h-4 ml-2 text-yellow-400" />
                    <span className="ml-2 text-sm text-gray-300">Featured</span>
                </label>

                  <label className="flex items-center p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36] cursor-pointer hover:border-[#fcd535]/50 transition-colors">
                  <input
                    type="checkbox"
                    name="isBreaking"
                    checked={formData.isBreaking}
                    onChange={handleInputChange}
                      className="w-4 h-4 text-[#fcd535] bg-[#0b0e11] border-[#2b2f36] rounded focus:ring-[#fcd535]"
                  />
                    <Zap className="w-4 h-4 ml-2 text-red-400" />
                    <span className="ml-2 text-sm text-gray-300">Breaking</span>
                </label>

                  <label className="flex items-center p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36] cursor-pointer hover:border-[#fcd535]/50 transition-colors">
                  <input
                    type="checkbox"
                    name="isTrending"
                    checked={formData.isTrending}
                    onChange={handleInputChange}
                      className="w-4 h-4 text-[#fcd535] bg-[#0b0e11] border-[#2b2f36] rounded focus:ring-[#fcd535]"
                  />
                    <TrendingUp className="w-4 h-4 ml-2 text-blue-400" />
                    <span className="ml-2 text-sm text-gray-300">Trending</span>
                </label>
              </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-[#2b2f36]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 border border-[#2b2f36] rounded-xl text-sm font-medium text-gray-300 bg-[#0b0e11] hover:bg-[#1e2329] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-semibold rounded-xl hover:from-[#f0b90b] hover:to-[#d4a00a] transition-all disabled:opacity-50"
                >
                  {formLoading ? 'Creating...' : 'Create Article'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedArticle && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#181a20] rounded-2xl border border-[#2b2f36] shadow-2xl">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-500/10 mb-4">
                <AlertTriangle className="h-7 w-7 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Delete Article</h3>
              <p className="text-sm text-gray-400 mb-6">
                  Are you sure you want to delete "{selectedArticle.title}"? This action cannot be undone.
                </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2.5 border border-[#2b2f36] rounded-xl text-sm font-medium text-gray-300 bg-[#0b0e11] hover:bg-[#1e2329] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(selectedArticle.id)}
                  className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;
