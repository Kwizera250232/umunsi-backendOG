import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Plus,
  Eye,
  FileText,
  Calendar,
  User,
  Tag,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Zap,
  AlertCircle,
  X,
  Save,
  Image as ImageIcon,
  TrendingUp
} from 'lucide-react';
import { apiClient } from '../../services/api';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED';
  isFeatured: boolean;
  isBreaking: boolean;
  isTrending: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt?: string;
  createdAt: string;
  author: {
    username: string;
    firstName: string;
    lastName: string;
  };
  category: {
    name: string;
    color: string;
  };
  tags: Array<{
    name: string;
    slug: string;
  }>;
  featuredImage?: string; // Added featuredImage to the interface
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

const Articles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);

  // Modal and form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    categoryId: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    isFeatured: false,
    isBreaking: false,
    isTrending: false,
    featuredImage: '',
    imageFile: undefined as File | undefined
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, [currentPage, searchTerm, statusFilter, categoryFilter]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAddModal) {
        closeAddModal();
      }
    };

    if (showAddModal) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showAddModal]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page: currentPage,
        limit: 10
      };
      
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;

      const response = await apiClient.getArticles(params);
      
      if (response && response.data) {
        setArticles(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalArticles(response.pagination?.total || 0);
      } else {
        setArticles([]);
    setTotalPages(1);
        setTotalArticles(0);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError('Failed to fetch articles. Please try again.');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const categoriesData = await apiClient.getCategories();
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Don't set error for categories as it's not critical
    } finally {
      setCategoriesLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      case 'DELETED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return <CheckCircle className="w-4 h-4" />;
      case 'DRAFT': return <Clock className="w-4 h-4" />;
      case 'ARCHIVED': return <FileText className="w-4 h-4" />;
      case 'DELETED': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('rw-RW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleStatusChange = async (articleId: string, newStatus: string) => {
    try {
      // API call to update article status
      await apiClient.updateArticle(articleId, { status: newStatus as any });
      
      // Update local state
      setArticles(articles.map(article => 
        article.id === articleId ? { ...article, status: newStatus as any } : article
      ));
    } catch (error) {
      console.error('Error updating article status:', error);
      setError('Failed to update article status. Please try again.');
    }
  };

  const handleFeatureToggle = async (articleId: string, currentFeatured: boolean) => {
    try {
      // API call to toggle featured status
      await apiClient.updateArticle(articleId, { isFeatured: !currentFeatured });
      
      // Update local state
      setArticles(articles.map(article => 
        article.id === articleId ? { ...article, isFeatured: !currentFeatured } : article
      ));
    } catch (error) {
      console.error('Error toggling featured status:', error);
      setError('Failed to update featured status. Please try again.');
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await apiClient.deleteArticle(articleId);
        
        setArticles(articles.filter(article => article.id !== articleId));
        setTotalArticles(prev => prev - 1);
      } catch (error) {
        console.error('Error deleting article:', error);
        setError('Failed to delete article. Please try again.');
      }
    }
  };

  // Form handling functions
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFormError('Please select an image file (JPG, PNG, WebP)');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Image file size must be less than 5MB');
        return;
      }
      
      // Create preview URL
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ 
        ...prev, 
        featuredImage: imageUrl,
        imageFile: file 
      }));
      setFormError(null); // Clear any previous errors
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      title,
      slug: generateSlug(title)
    }));
  };

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
      data.append('isBreaking', formData.isBreaking.toString());
      data.append('isTrending', formData.isTrending.toString());
      
      console.log('FormData content:');
      for (let [key, value] of data.entries()) {
        console.log(key, value);
      }
      
      // Send with proper headers
      const newArticle = await apiClient.createArticle(data);

      // Add new article to the list
      setArticles(prev => [newArticle, ...prev]);
      setTotalArticles(prev => prev + 1);
      
      // Show success message
      setFormSuccess('Article created successfully!');
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        setShowAddModal(false);
        resetForm();
        setFormSuccess(null);
      }, 1500);
      
      setError(null); // Clear any previous errors
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

  const openAddModal = () => {
    setShowAddModal(true);
    setFormError(null);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      categoryId: '',
      status: 'DRAFT',
      isFeatured: false,
      isBreaking: false,
      isTrending: false,
      featuredImage: '',
      imageFile: undefined
    });
    setFormError(null);
    setFormSuccess(null);
    
    // Reset file input
    const fileInput = document.getElementById('articleImage') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const closeAddModal = () => {
    // Check if there are unsaved changes
    const hasChanges = formData.title || formData.content || formData.excerpt || formData.categoryId || formData.imageFile;
    
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        setShowAddModal(false);
        resetForm();
      }
    } else {
      setShowAddModal(false);
      resetForm();
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setCurrentPage(1);
  };

  if (loading && articles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Article Management</h1>
            <p className="text-gray-600">Manage articles, content, and publishing</p>
          </div>
          <button 
                    onClick={openAddModal}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
            <Plus className="w-4 h-4" />
            <span>New Article</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 shadow-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700">Total Articles</p>
              <p className="text-3xl font-bold text-yellow-800">{totalArticles}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl shadow-md">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Published</p>
              <p className="text-3xl font-bold text-green-800">
                {articles.filter(a => a.status === 'PUBLISHED').length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-400 to-green-500 rounded-xl shadow-md">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Drafts</p>
              <p className="text-3xl font-bold text-green-800">
                {articles.filter(a => a.status === 'DRAFT').length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-400 to-green-500 rounded-xl shadow-md">
              <Clock className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Total Views</p>
              <p className="text-3xl font-bold text-green-800">
                {articles.reduce((sum, a) => sum + (a.viewCount || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-400 to-green-500 rounded-xl shadow-md">
              <Eye className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="bg-gradient-to-r from-green-50 to-yellow-50 rounded-2xl p-6 shadow-lg border border-green-200 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
          <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
            <input
              type="text"
                placeholder="Search articles by title, excerpt, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white/80 backdrop-blur-sm"
            />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={openAddModal}
              className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span>Add Article</span>
            </button>
            
            <div className="flex items-center space-x-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white/80 backdrop-blur-sm"
          >
            <option value="all">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white/80 backdrop-blur-sm"
          >
            <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
          </select>

          {/* Clear Filters */}
          <button
                onClick={clearFilters}
                className="px-3 py-2 text-green-700 border border-green-300 rounded-lg hover:bg-green-100 text-sm transition-colors"
              >
                Clear
          </button>
            </div>
          </div>
        </div>
      </div>

      {/* Articles Display */}
      <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl p-6 shadow-lg border border-green-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-green-800">
            {loading ? 'Loading...' : `${articles.length} Articles Found`}
          </h2>
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <FileText className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading articles...</p>
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first article.</p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Article
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Article
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Published
                </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                  {articles.length > 0 ? (
                    articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                          <div className="flex items-start space-x-3">
                            {/* Article Image */}
                            {article.featuredImage && (
                              <div className="flex-shrink-0">
                                <img
                                  src={article.featuredImage}
                                  alt={article.title}
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* Article Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {article.title}
                          </h3>
                          {article.isFeatured && (
                                  <Star className="w-4 h-4 text-yellow-500" />
                          )}
                          {article.isBreaking && (
                                  <Zap className="w-4 h-4 text-red-500" />
                                )}
                                {article.isTrending && (
                                  <TrendingUp className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                                {article.tags && article.tags.length > 0 ? (
                                  article.tags.map((tag) => (
                            <span
                              key={tag.slug}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {tag.name}
                            </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-400">No tags</span>
                                )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                                {article.author?.firstName?.charAt(0) || 'A'}{article.author?.lastName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                                {article.author?.firstName || 'Unknown'} {article.author?.lastName || 'Author'}
                        </div>
                              <div className="text-sm text-gray-500">@{article.author?.username || 'unknown'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(article.status)}`}>
                      {getStatusIcon(article.status)}
                      <span className="ml-1">{article.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: article.category?.color || '#6B7280' }}
                      ></div>
                            <span className="text-sm text-gray-900">{article.category?.name || 'Uncategorized'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 text-gray-400 mr-1" />
                              <span>{article.viewCount?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-gray-400 mr-1" />
                              <span>{article.likeCount || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-gray-400 mr-1" />
                              <span>{article.commentCount || 0}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {article.publishedAt ? formatDate(article.publishedAt) : 'Not published'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {/* View article */}}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Article"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {/* Edit article */}}
                        className="text-green-600 hover:text-green-900 p-1"
                        title="Edit Article"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleFeatureToggle(article.id, article.isFeatured)}
                        className={`p-1 ${article.isFeatured ? 'text-yellow-600 hover:text-yellow-900' : 'text-gray-600 hover:text-gray-900'}`}
                        title={article.isFeatured ? 'Unfeature' : 'Feature'}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(article.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete Article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <FileText className="w-12 h-16 mx-auto mb-3 text-gray-300" />
                          <p className="text-lg font-medium">No articles found</p>
                          <p className="text-sm">Try adjusting your filters or create a new article.</p>
                        </div>
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
            {totalPages > 1 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(currentPage * 10, totalArticles)}</span> of{' '}
                        <span className="font-medium">{totalArticles}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
            )}
          </>
        )}

      {/* Add New Article Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Add New Article</h2>
                {formLoading && (
                  <div className="flex items-center mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                    <span className="text-sm text-green-600">Creating article...</span>
                  </div>
                )}
              </div>
              <button
                onClick={closeAddModal}
                disabled={formLoading}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Success Message */}
              {formSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    <p className="text-green-800 text-sm">{formSuccess}</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-4 text-red-400 mr-2" />
                    <p className="text-red-800 text-sm">{formError}</p>
                  </div>
                </div>
              )}

              {/* Form Validation Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-blue-400 mr-2" />
                    <p className="text-blue-800 text-sm font-medium">Form Requirements</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-blue-600">Progress:</span>
                    <div className="w-24 bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, 
                            ((formData.title ? 20 : 0) + 
                             (formData.content ? 40 : 0) + 
                             (formData.categoryId ? 20 : 0) + 
                             (formData.excerpt ? 10 : 0) + 
                             (formData.imageFile ? 10 : 0))
                          )}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-blue-600">
                      {Math.min(100, 
                        ((formData.title ? 20 : 0) + 
                         (formData.content ? 40 : 0) + 
                         (formData.categoryId ? 20 : 0) + 
                         (formData.excerpt ? 10 : 0) + 
                         (formData.imageFile ? 10 : 0))
                      )}%
                    </span>
                  </div>
                </div>
                <ul className="text-blue-700 text-xs space-y-1">
                  <li>• Title: Required, max 200 characters</li>
                  <li>• Content: Required</li>
                  <li>• Category: Required</li>
                  <li>• Excerpt: Optional, max 500 characters</li>
                  <li>• Image: Optional, max 5MB, JPG/PNG/WebP</li>
                </ul>
              </div>

              {/* Title and Slug */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    required
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter article title"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {formData.title.length}/200 characters
                    </span>
                    {formData.title.length > 180 && (
                      <span className="text-xs text-yellow-600">
                        {200 - formData.title.length} characters remaining
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    placeholder="Auto-generated from title"
                  />
                  <p className="text-xs text-gray-500 mt-1">Slug is automatically generated from the title</p>
                </div>
              </div>

              {/* Category and Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    required
                    disabled={categoriesLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {categoriesLoading ? 'Loading categories...' : 'Select a category'}
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {categoriesLoading && (
                    <div className="flex items-center mt-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-2"></div>
                      <span className="text-xs text-gray-500">Loading categories...</span>
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt
                </label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Brief summary of the article"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {formData.excerpt.length}/500 characters
                  </span>
                  {formData.excerpt.length > 450 && (
                    <span className="text-xs text-yellow-600">
                      {500 - formData.excerpt.length} characters remaining
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Article Content *
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Write your article content here..."
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {formData.content.length} characters
                  </span>
                  {formData.content.length > 1000 && (
                    <span className="text-xs text-green-600">
                      Good length for SEO
                    </span>
                  )}
                </div>
              </div>

              {/* Article Image */}
              <div>
                <label htmlFor="articleImage" className="block text-sm font-medium text-gray-700 mb-2">
                  Article Image
                </label>
                <div className="space-y-4">
                  {/* File Upload Input */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      id="articleImage"
                      name="articleImage"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-500 file:text-white hover:file:bg-green-600"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('articleImage')?.click()}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Choose File</span>
                    </button>
                  </div>
                  
                  {/* Image Preview */}
                  {formData.featuredImage && (
                    <div className="relative">
                      <img
                        src={formData.featuredImage}
                        alt="Article image preview"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                      
                      {/* Remove Image Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ 
                            ...prev, 
                            featuredImage: '',
                            imageFile: undefined 
                          }));
                          // Reset the file input
                          const fileInput = document.getElementById('articleImage') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Image Guidelines */}
                  <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium mb-1">Image Guidelines:</p>
                    <ul className="space-y-1">
                      <li>• Recommended size: 1200x630 pixels</li>
                      <li>• Supported formats: JPG, PNG, WebP</li>
                      <li>• Maximum file size: 5MB</li>
                      <li>• Use high-quality, relevant images</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Article Options */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-700">
                      Feature this article
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isBreaking"
                      name="isBreaking"
                      checked={formData.isBreaking}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isBreaking" className="ml-2 block text-sm text-gray-700">
                      Mark as breaking news
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isTrending"
                      name="isTrending"
                      checked={formData.isTrending}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isTrending" className="ml-2 block text-sm text-gray-700">
                      Mark as trending
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={formLoading}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {formLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating Article...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Create Article</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
              )}
      </div>
    </div>
  );
};

export default Articles;