import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  Eye, 
  ArrowLeft, 
  Upload, 
  X, 
  Plus, 
  Tag,
  Calendar,
  User,
  FolderOpen,
  Star,
  Pin,
  MessageCircle,
  Globe,
  Lock,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { apiClient, Category, MediaFile } from '../../services/api';
import RichTextEditor from '../../components/RichTextEditor';
import MediaLibraryModal from '../../components/MediaLibraryModal';

const AddPost: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED',
    categoryId: '',
    isFeatured: false,
    isPinned: false,
    allowComments: true,
    tags: [] as string[],
    metaTitle: '',
    metaDescription: ''
  });
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [selectedFeaturedImage, setSelectedFeaturedImage] = useState<MediaFile | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.getCategories();
      setCategories(response);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

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

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === e.currentTarget) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (formData.excerpt && formData.excerpt.length > 500) {
      newErrors.excerpt = 'Excerpt must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.createPost({
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || undefined,
        featuredImage: formData.featuredImage || undefined,
        status: formData.status,
        categoryId: formData.categoryId || undefined,
        isFeatured: formData.isFeatured,
        isPinned: formData.isPinned,
        allowComments: formData.allowComments,
        tags: formData.tags,
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined
      });

      navigate('/admin/posts');
    } catch (error) {
      console.error('Error creating post:', error);
      setErrors({ submit: 'Failed to create post. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const generateExcerpt = () => {
    if (formData.content) {
      const plainText = formData.content.replace(/<[^>]*>/g, '');
      const excerpt = plainText.substring(0, 150);
      setFormData(prev => ({
        ...prev,
        excerpt: excerpt + (plainText.length > 150 ? '...' : '')
      }));
    }
  };

  const generateMetaTitle = () => {
    if (formData.title) {
      setFormData(prev => ({
        ...prev,
        metaTitle: formData.title
      }));
    }
  };

  const generateMetaDescription = () => {
    if (formData.excerpt) {
      setFormData(prev => ({
        ...prev,
        metaDescription: formData.excerpt
      }));
    }
  };

  const handleFeaturedImageSelect = (media: MediaFile) => {
    setSelectedFeaturedImage(media);
    const getServerBaseUrl = () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      return apiUrl.replace('/api', '');
    };
    setFormData(prev => ({
      ...prev,
      featuredImage: `${getServerBaseUrl()}${media.url}`
    }));
  };

  const removeFeaturedImage = () => {
    setSelectedFeaturedImage(null);
    setFormData(prev => ({
      ...prev,
      featuredImage: ''
    }));
  };

  return (
    <div className="p-6 bg-[#0b0e11] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/posts')}
              className="flex items-center text-gray-400 hover:text-[#fcd535] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Posts
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-[#fcd535]/20 to-[#f0b90b]/20 rounded-xl">
                  <Sparkles className="w-6 h-6 text-[#fcd535]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Create New Article</h1>
                  <p className="text-gray-300 mt-1">Write and publish a new news article</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center px-4 py-2.5 text-gray-300 border border-[#2b2f36] rounded-xl hover:bg-[#1e2329] transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button
              type="submit"
              form="post-form"
              disabled={loading}
              className="flex items-center px-6 py-2.5 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-semibold rounded-xl hover:from-[#f0b90b] hover:to-[#d4a00a] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#fcd535]/20"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0b0e11] mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Saving...' : 'Publish Article'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errors.submit && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center">
          <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
          <span className="text-red-400">{errors.submit}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36]">
            <form id="post-form" onSubmit={handleSubmit} className="p-6">
              {/* Title */}
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
                  Article Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-[#0b0e11] border rounded-xl focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535] text-white placeholder-gray-500 text-lg ${
                    errors.title ? 'border-red-500' : 'border-[#2b2f36]'
                  }`}
                  placeholder="Enter article title..."
                  maxLength={200}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-400">{errors.title}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  {formData.title.length}/200 characters
                </p>
              </div>

              {/* Content */}
              <div className="mb-6">
                <label htmlFor="content" className="block text-sm font-medium text-white mb-2">
                  Content *
                </label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                  placeholder="Write your article content here..."
                  className={errors.content ? 'border-red-500' : ''}
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-400">{errors.content}</p>
                )}
              </div>

              {/* Excerpt */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="excerpt" className="block text-sm font-medium text-white">
                    Excerpt
                  </label>
                  <button
                    type="button"
                    onClick={generateExcerpt}
                    className="text-sm text-[#fcd535] hover:text-[#f0b90b] transition-colors"
                  >
                    Generate from content
                  </button>
                </div>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-4 py-3 bg-[#0b0e11] border rounded-xl focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535] text-white placeholder-gray-500 ${
                    errors.excerpt ? 'border-red-500' : 'border-[#2b2f36]'
                  }`}
                  placeholder="Brief description of your article..."
                  maxLength={500}
                />
                {errors.excerpt && (
                  <p className="mt-1 text-sm text-red-400">{errors.excerpt}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  {formData.excerpt.length}/500 characters
                </p>
              </div>

              {/* Featured Image */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">
                  Featured Image
                </label>
                
                {selectedFeaturedImage ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <img
                        src={`${import.meta.env.VITE_API_URL || ''}${selectedFeaturedImage.url}`}
                        alt="Featured image preview"
                        className="w-full h-48 object-cover rounded-xl border border-[#2b2f36]"
                        onError={(e) => {
                          console.error('Failed to load featured image:', e);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={removeFeaturedImage}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36]">
                      <div>
                        <p className="text-sm font-medium text-white">{selectedFeaturedImage.originalName}</p>
                        <p className="text-xs text-gray-500">
                          {(selectedFeaturedImage.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMediaLibrary(true)}
                        className="text-sm text-[#fcd535] hover:text-[#f0b90b] transition-colors"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-[#2b2f36] rounded-xl p-6 text-center hover:border-[#fcd535]/50 transition-colors bg-[#0b0e11]">
                    <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-white mb-2">No featured image selected</p>
                    <button
                      type="button"
                      onClick={() => setShowMediaLibrary(true)}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-semibold rounded-xl hover:from-[#f0b90b] hover:to-[#d4a00a] transition-all"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Select from Media Library
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-[#fcd535]" />
              Publish Settings
            </h3>
            
            <div className="space-y-4">
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-white mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535] text-white"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-white mb-2">
                  Category
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535] text-white"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36] cursor-pointer hover:border-[#fcd535]/50 transition-colors">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#fcd535] bg-[#0b0e11] border-[#2b2f36] rounded focus:ring-[#fcd535]"
                  />
                  <Star className="w-4 h-4 ml-3 text-yellow-500" />
                  <span className="ml-2 text-sm text-white">Featured Article</span>
                </label>

                <label className="flex items-center p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36] cursor-pointer hover:border-[#fcd535]/50 transition-colors">
                  <input
                    type="checkbox"
                    name="isPinned"
                    checked={formData.isPinned}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#fcd535] bg-[#0b0e11] border-[#2b2f36] rounded focus:ring-[#fcd535]"
                  />
                  <Pin className="w-4 h-4 ml-3 text-blue-500" />
                  <span className="ml-2 text-sm text-white">Pinned Article</span>
                </label>

                <label className="flex items-center p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36] cursor-pointer hover:border-[#fcd535]/50 transition-colors">
                  <input
                    type="checkbox"
                    name="allowComments"
                    checked={formData.allowComments}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#fcd535] bg-[#0b0e11] border-[#2b2f36] rounded focus:ring-[#fcd535]"
                  />
                  <MessageCircle className="w-4 h-4 ml-3 text-emerald-500" />
                  <span className="ml-2 text-sm text-white">Allow Comments</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-[#fcd535]" />
              Tags
            </h3>
            
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-3 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535] text-white placeholder-gray-500 text-sm"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2.5 bg-[#fcd535] text-[#0b0e11] rounded-xl hover:bg-[#f0b90b] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1.5 bg-[#fcd535]/10 text-[#fcd535] text-sm rounded-lg border border-[#fcd535]/30"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-[#fcd535] hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SEO Settings */}
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-[#fcd535]" />
              SEO Settings
            </h3>
            
            <div className="space-y-4">
              {/* Meta Title */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="metaTitle" className="block text-sm font-medium text-white">
                    Meta Title
                  </label>
                  <button
                    type="button"
                    onClick={generateMetaTitle}
                    className="text-sm text-[#fcd535] hover:text-[#f0b90b] transition-colors"
                  >
                    Use title
                  </button>
                </div>
                <input
                  type="text"
                  id="metaTitle"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535] text-white placeholder-gray-500 text-sm"
                  placeholder="SEO title for search engines..."
                />
              </div>

              {/* Meta Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="metaDescription" className="block text-sm font-medium text-white">
                    Meta Description
                  </label>
                  <button
                    type="button"
                    onClick={generateMetaDescription}
                    className="text-sm text-[#fcd535] hover:text-[#f0b90b] transition-colors"
                  >
                    Use excerpt
                  </button>
                </div>
                <textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535] text-white placeholder-gray-500 text-sm"
                  placeholder="SEO description for search engines..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Library Modal for Featured Image */}
      <MediaLibraryModal
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={handleFeaturedImageSelect}
        title="Select Featured Image"
        mode="select"
        type="image"
      />
    </div>
  );
};

export default AddPost;
