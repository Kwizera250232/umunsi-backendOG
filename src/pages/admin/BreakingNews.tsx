import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  Calendar, 
  Tag, 
  User, 
  AlertTriangle,
  TrendingUp,
  Zap,
  Filter,
  Search,
  RefreshCw,
  MoreVertical,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Star,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';

interface BreakingNews {
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

const BreakingNews: React.FC = () => {
  const { user } = useAuth();
  const [breakingNews, setBreakingNews] = useState<BreakingNews[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState<BreakingNews | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    categoryId: '',
    status: 'DRAFT' as const,
    isFeatured: false,
    isBreaking: true, // Always true for breaking news
    isTrending: false,
    imageFile: null as File | null
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch breaking news articles
  const fetchBreakingNews = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getArticles({ 
        page: currentPage, 
        limit: itemsPerPage,
        isBreaking: true,
        search: searchTerm,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        categoryId: categoryFilter === 'ALL' ? undefined : categoryFilter,
        sortBy,
        sortOrder
      });
      
      if (response?.data) {
        setBreakingNews(response.data);
        setTotalPages(Math.ceil((response.total || 0) / itemsPerPage));
      }
    } catch (error) {
      console.error('Error fetching breaking news:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await apiClient.getCategories();
      if (response) {
        setCategories(response);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchBreakingNews();
  }, [currentPage, searchTerm, statusFilter, categoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFormError('Please select an image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Image file size must be less than 5MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        imageFile: file
      }));
      setFormError(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    // Enhanced validation
    const errors = [];
    
    if (!formData.title.trim()) {
      errors.push('Title is required');
    } else if (formData.title.trim().length > 200) {
      errors.push('Title must be less than 200 characters');
    }
    
    if (!formData.content.trim()) {
      errors.push('Content is required');
    }
    
    if (!formData.categoryId) {
      errors.push('Category is required');
    }
    
    if (formData.excerpt && formData.excerpt.trim().length > 500) {
      errors.push('Excerpt must be less than 500 characters');
    }
    
    if (errors.length > 0) {
      setFormError(`Please fix the following errors: ${errors.join(', ')}`);
      setFormLoading(false);
      return;
    }

    try {
      // Create FormData object
      const data = new FormData();
      
      // Append file if selected
      if (formData.imageFile) {
        data.append('image', formData.imageFile);
      }
      
      // Append other fields
      data.append('title', formData.title);
      data.append('content', formData.content);
      data.append('excerpt', formData.excerpt);
      data.append('categoryId', formData.categoryId);
      data.append('status', formData.status);
      data.append('isFeatured', formData.isFeatured.toString());
      data.append('isBreaking', 'true'); // Always true for breaking news
      data.append('isTrending', formData.isTrending.toString());
      
      console.log('FormData content:');
      for (let [key, value] of data.entries()) {
        console.log(key, value);
      }
      
      // Send with proper headers
      const newArticle = await apiClient.createArticle(data);

      // Add new article to the list
      setBreakingNews(prev => [newArticle, ...prev]);
      
      // Show success message
      setFormSuccess('Breaking news article created successfully!');
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        setShowAddModal(false);
        resetForm();
        setFormSuccess(null);
      }, 1500);
      
      setFormError(null); // Clear any previous errors
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Handle specific error types
      if (error.message) {
        if (error.message.includes('category')) {
          setFormError('Invalid category selected. Please choose a valid category.');
        } else if (error.message.includes('title')) {
          setFormError('Article title issue. Please check the title and try again.');
        } else if (error.message.includes('file')) {
          setFormError('File upload issue. Please check the image file and try again.');
        } else {
          setFormError(`Failed to create article: ${error.message}`);
        }
      } else {
        setFormError('Failed to create article. Please try again.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      categoryId: '',
      status: 'DRAFT',
      isFeatured: false,
      isBreaking: true,
      isTrending: false,
      imageFile: null
    });
    setFormError(null);
    setFormSuccess(null);
  };

  // Close add modal
  const closeAddModal = () => {
    if (formData.title || formData.content || formData.excerpt || formData.imageFile) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        setShowAddModal(false);
        resetForm();
      }
    } else {
      setShowAddModal(false);
      resetForm();
    }
  };

  // Delete article
  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteArticle(id);
      setBreakingNews(prev => prev.filter(article => article.id !== id));
      setShowDeleteModal(false);
      setSelectedNews(null);
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  // Toggle article status
  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await apiClient.updateArticle(id, { status: newStatus });
      setBreakingNews(prev => prev.map(article => 
        article.id === id ? { ...article, status: newStatus as any } : article
      ));
    } catch (error) {
      console.error('Error updating article status:', error);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      PUBLISHED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      ARCHIVED: { color: 'bg-gray-100 text-gray-800', icon: Pause },
      DELETED: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  // Get category badge
  const getCategoryBadge = (category: any) => {
    return (
      <span 
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        style={{ 
          backgroundColor: `${category.color}20`, 
          color: category.color,
          border: `1px solid ${category.color}40`
        }}
      >
        <span className="mr-1">{category.icon}</span>
        {category.name}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Breaking News</h1>
                <p className="text-sm text-gray-600">Manage urgent and time-sensitive news articles</p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <Zap className="w-3 h-3 mr-1" />
                    {breakingNews.length} Articles
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Breaking News
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search breaking news..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="createdAt">Date Created</option>
              <option value="updatedAt">Date Updated</option>
              <option value="title">Title</option>
              <option value="viewCount">Views</option>
            </select>

            {/* Sort Order */}
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-yellow-500 focus:border-yellow-500"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>

            {/* Refresh */}
            <button
              onClick={fetchBreakingNews}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
          </div>
        ) : breakingNews.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No breaking news</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first breaking news article.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Breaking News
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {breakingNews.map((article) => (
                <li key={article.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {article.featuredImage ? (
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={article.featuredImage}
                              alt={article.title}
                            />
                          ) : (
                            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                              <Zap className="w-6 h-6 text-yellow-600" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            {getStatusBadge(article.status)}
                            {getCategoryBadge(article.category)}
                            {article.isFeatured && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {article.title}
                          </h3>
                          
                          {article.excerpt && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {article.excerpt}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {article.author.firstName} {article.author.lastName}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(article.createdAt)}
                            </span>
                            <span className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {article.viewCount} views
                            </span>
                            <span className="flex items-center">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {article.likeCount} likes
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleStatus(article.id, article.status)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          article.status === 'PUBLISHED'
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {article.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedNews(article);
                          setShowEditModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedNews(article);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {showAddModal ? 'Add Breaking News' : 'Edit Breaking News'}
              </h3>
              <button
                onClick={closeAddModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {formSuccess && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
                {formSuccess}
              </div>
            )}

            {formError && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Enter breaking news title"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/200 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Enter breaking news content"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Excerpt
                </label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Enter article excerpt (optional)"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.excerpt.length}/500 characters
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Featured Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Accepted formats: JPG, PNG, GIF. Max size: 5MB
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Featured Article</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isTrending"
                    checked={formData.isTrending}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Trending</span>
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Form Requirements:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Title is required and must be less than 200 characters</li>
                  <li>• Content is required</li>
                  <li>• Category selection is required</li>
                  <li>• Excerpt is optional but must be less than 500 characters</li>
                  <li>• Image files must be less than 5MB</li>
                  <li>• Breaking news articles are automatically marked as breaking</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {showAddModal ? 'Creating...' : 'Updating...'}
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Zap className="w-4 h-4 mr-2" />
                      {showAddModal ? 'Create Breaking News' : 'Update Breaking News'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedNews && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Breaking News</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{selectedNews.title}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 px-4 py-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(selectedNews.id)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700"
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

export default BreakingNews;
