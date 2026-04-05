import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  FileText, 
  Calendar, 
  RefreshCw,
  BarChart3,
  TrendingUp,
  X,
  Save,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon?: string;
  articleCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  parentId?: string;
  children?: Category[];
}

const Categories = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', isActive: true });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', isActive: true });
  const [editFormLoading, setEditFormLoading] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteText, setDeleteText] = useState('');
  const [deleteFormLoading, setDeleteFormLoading] = useState(false);
  const [deleteFormError, setDeleteFormError] = useState<string | null>(null);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      // Include inactive categories for admin management
      const response = await apiClient.getCategories({ includeInactive: true });
      
      if (response && Array.isArray(response)) {
        const transformedCategories = response.map(category => ({
          ...category,
          description: category.description || '',
          articleCount: category._count?.news || 0,
          isActive: category.isActive !== false
        }));
        setCategories(transformedCategories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    if (!isAuthenticated) {
      setError('You must be logged in to create categories');
      return;
    }
    setShowAddModal(true);
    setFormError(null);
    setFormData({ name: '', description: '', isActive: true });
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setFormError(null);
    setFormData({ name: '', description: '', isActive: true });
  };

  const openEditModal = (category: Category) => {
    if (!isAuthenticated) {
      setError('You must be logged in to edit categories');
      return;
    }
    setEditingCategory(category);
    setEditFormData({ name: category.name, description: category.description, isActive: category.isActive });
    setShowEditModal(true);
    setEditFormError(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingCategory(null);
    setEditFormError(null);
    setEditFormData({ name: '', description: '', isActive: true });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEditFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !editingCategory || !editFormData.name.trim() || !editFormData.description.trim()) {
      setEditFormError('Please fill in all required fields');
      return;
    }

    try {
      setEditFormLoading(true);
      setEditFormError(null);
      const response = await apiClient.updateCategory(editingCategory.id, {
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
        isActive: editFormData.isActive
      });
      
      if (response?.success && response?.category) {
        setCategories(prev => prev.map(cat => 
          cat.id === editingCategory.id ? { ...response.category, articleCount: editingCategory.articleCount } : cat
        ));
        closeEditModal();
      } else {
        setEditFormError('Failed to update category. Please try again.');
      }
    } catch (error) {
      setEditFormError(error instanceof Error ? error.message : 'Failed to update category');
    } finally {
      setEditFormLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !formData.name.trim() || !formData.description.trim()) {
      setFormError('Please fill in all required fields');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);
      const response = await apiClient.createCategory({
        name: formData.name.trim(),
        description: formData.description.trim(),
        isActive: formData.isActive
      });
      
      if (response?.success && response?.category) {
        setCategories(prev => [{ ...response.category, articleCount: 0 } as Category, ...prev]);
        closeAddModal();
      } else {
        setFormError('Failed to create category. Please try again.');
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to create category');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (togglingStatusId) return; // Prevent multiple simultaneous toggles
    
    try {
      setTogglingStatusId(id);
      
      // Find the category to get its current data
      const category = categories.find(c => c.id === id);
      if (!category) {
        setTogglingStatusId(null);
        return;
      }

      // Make API call to persist the change
      const response = await apiClient.updateCategory(id, {
        name: category.name,
        description: category.description,
        isActive: !currentStatus
      });

      // Update local state on success
      if (response?.success && response?.category) {
        setCategories(prev => prev.map(cat => 
          cat.id === id ? { ...cat, isActive: response.category.isActive } : cat
    ));
      } else {
        setError('Failed to update category status');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update category status');
    } finally {
      setTogglingStatusId(null);
    }
  };

  const openViewModal = (category: Category) => {
    setViewingCategory(category);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingCategory(null);
  };

  const openDeleteModal = (category: Category) => {
    if (!isAuthenticated) {
      setError('You must be logged in to delete categories');
      return;
    }
    setDeletingCategory(category);
    setDeleteText('');
    setDeleteFormError(null);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingCategory(null);
    setDeleteText('');
    setDeleteFormError(null);
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !deletingCategory || deleteText !== 'DELETE') {
      setDeleteFormError('Please type DELETE exactly as shown');
      return;
    }

    try {
      setDeleteFormLoading(true);
      setDeleteFormError(null);
      await apiClient.deleteCategory(deletingCategory.id);
      setCategories(prev => prev.filter(cat => cat.id !== deletingCategory.id));
      closeDeleteModal();
    } catch (error) {
      setDeleteFormError(error instanceof Error ? error.message : 'Failed to delete category');
    } finally {
      setDeleteFormLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || (loading && categories.length === 0)) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[#fcd535]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#fcd535] animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[#fcd535] animate-pulse" />
          </div>
          <p className="text-gray-400">{authLoading ? 'Checking authentication...' : 'Loading categories...'}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Authentication Required</h3>
          <p className="text-gray-400 mb-4">You must be logged in to access this page</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-[#fcd535] text-[#0b0e11] font-medium rounded-lg hover:bg-[#f0b90b] transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-[#0b0e11] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Categories</h1>
            <p className="text-gray-400 mt-1">Organize and manage article categories</p>
            {user && (
              <p className="text-xs text-gray-500 mt-1">
                Logged in as: <span className="text-[#fcd535]">{user.firstName} {user.lastName}</span> ({user.role})
              </p>
            )}
          </div>
          <div className="text-sm text-gray-500">{loading ? 'Loading...' : `${categories.length} categories`}</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            <span className="text-red-400">{error}</span>
              </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X className="w-5 h-5" />
            </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Categories</p>
              <p className="text-2xl font-bold text-white">{categories.length}</p>
            </div>
            <div className="p-3 bg-[#fcd535]/10 rounded-xl">
              <FolderOpen className="w-6 h-6 text-[#fcd535]" />
            </div>
          </div>
        </div>
        
        <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active</p>
              <p className="text-2xl font-bold text-white">{categories.filter(c => c.isActive).length}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Articles</p>
              <p className="text-2xl font-bold text-white">{categories.reduce((sum, c) => sum + c.articleCount, 0)}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Articles</p>
              <p className="text-2xl font-bold text-white">
                {categories.length > 0 ? Math.round(categories.reduce((sum, c) => sum + c.articleCount, 0) / categories.length) : 0}
              </p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] p-4 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 max-w-md w-full">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-[#fcd535]" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#fcd535]/50"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={openAddModal}
              className="px-4 py-2.5 bg-[#fcd535] text-[#0b0e11] font-semibold rounded-xl hover:bg-[#f0b90b] transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
            <button
              onClick={fetchCategories}
              disabled={loading}
              className="p-2.5 bg-[#2b2f36] text-gray-400 rounded-xl hover:bg-[#363a45] hover:text-white disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2b2f36] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{filteredCategories.length} Categories</h2>
          <span className="text-xs text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-[#fcd535]/20 border-t-[#fcd535] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading categories...</p>
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[#2b2f36] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No categories found</h3>
            <p className="text-gray-400 mb-4">{searchTerm ? 'Try adjusting your search.' : 'Create your first category.'}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#1e2329] border-b border-[#2b2f36]">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Articles</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-[#2b2f36]">
                {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-[#1e2329] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#fcd535] to-[#f0b90b] rounded-xl flex items-center justify-center">
                        <span className="text-[#0b0e11] font-bold text-sm">{category.name.charAt(0)}</span>
                        </div>
                        <div>
                        <p className="text-sm font-medium text-white">{category.name}</p>
                        <p className="text-xs text-gray-500">/{category.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                    <p className="text-sm text-gray-400 max-w-xs truncate">{category.description}</p>
                    </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-white">{category.articleCount}</span>
                      </div>
                    </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${
                        category.isActive 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{formatDate(category.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => openViewModal(category)}
                        className="p-1.5 text-gray-500 hover:text-[#fcd535] hover:bg-[#2b2f36] rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openEditModal(category)}
                        className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-[#2b2f36] rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(category.id, category.isActive)}
                          disabled={togglingStatusId === category.id}
                          className={`p-1.5 hover:bg-[#2b2f36] rounded-lg transition-colors disabled:opacity-50 ${
                            category.isActive ? 'text-emerald-400' : 'text-red-400'
                          }`}
                          title={category.isActive ? 'Click to deactivate' : 'Click to activate'}
                        >
                          {togglingStatusId === category.id ? (
                            <div className="w-4 h-4 border-2 border-gray-400/20 border-t-gray-400 rounded-full animate-spin"></div>
                          ) : (
                            category.isActive ? '🟢' : '🔴'
                          )}
                        </button>
                        <button 
                          onClick={() => openDeleteModal(category)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-[#2b2f36] rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-[#2b2f36]">
              <h2 className="text-xl font-bold text-white">Add New Category</h2>
              <button onClick={closeAddModal} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-400 mr-2" />
                  <p className="text-red-400 text-sm">{formError}</p>
                </div>
              )}

                <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                  onChange={handleInputChange}
                    required
                  className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#fcd535]/50"
                    placeholder="Enter category name"
                  />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                  className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#fcd535]/50 resize-none"
                  placeholder="Describe this category..."
                  />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded bg-[#2b2f36] border-[#2b2f36] text-[#fcd535] focus:ring-[#fcd535]/50"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-300">Category is active</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#2b2f36]">
                <button type="button" onClick={closeAddModal} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-[#fcd535] text-[#0b0e11] font-semibold rounded-lg hover:bg-[#f0b90b] disabled:opacity-50 transition-all flex items-center space-x-2"
                >
                  {formLoading ? (
                    <><div className="w-4 h-4 border-2 border-[#0b0e11]/20 border-t-[#0b0e11] rounded-full animate-spin"></div><span>Creating...</span></>
                  ) : (
                    <><Save className="w-4 h-4" /><span>Create</span></>
                    )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-[#2b2f36]">
              <h2 className="text-xl font-bold text-white">Edit Category</h2>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editFormError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-400 mr-2" />
                  <p className="text-red-400 text-sm">{editFormError}</p>
                </div>
              )}

                <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    required
                  className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
                  />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                  <textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditInputChange}
                    required
                    rows={3}
                  className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50 resize-none"
                  />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  name="isActive"
                  checked={editFormData.isActive}
                  onChange={handleEditInputChange}
                  className="w-4 h-4 rounded bg-[#2b2f36] border-[#2b2f36] text-[#fcd535]"
                />
                <label htmlFor="edit-isActive" className="ml-2 text-sm text-gray-300">Category is active</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#2b2f36]">
                <button type="button" onClick={closeEditModal} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={editFormLoading} className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2">
                  {editFormLoading ? <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div><span>Updating...</span></> : <><Save className="w-4 h-4" /><span>Update</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Category Modal */}
      {showViewModal && viewingCategory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#2b2f36]">
              <h2 className="text-xl font-bold text-white">Category Details</h2>
              <button onClick={closeViewModal} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-[#1e2329] rounded-xl p-6 border border-[#2b2f36]">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#fcd535] to-[#f0b90b] rounded-xl flex items-center justify-center">
                    <FolderOpen className="w-8 h-8 text-[#0b0e11]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{viewingCategory.name}</h3>
                    <p className="text-gray-400 mt-1">{viewingCategory.description}</p>
                    <div className="flex items-center space-x-3 mt-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${viewingCategory.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                        {viewingCategory.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {viewingCategory.articleCount} Articles
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1e2329] rounded-xl p-4 border border-[#2b2f36]">
                  <p className="text-xs text-gray-500 mb-1">Category ID</p>
                  <p className="text-sm text-white font-mono">{viewingCategory.id}</p>
                  </div>
                <div className="bg-[#1e2329] rounded-xl p-4 border border-[#2b2f36]">
                  <p className="text-xs text-gray-500 mb-1">Slug</p>
                  <p className="text-sm text-white font-mono">{viewingCategory.slug}</p>
                  </div>
                <div className="bg-[#1e2329] rounded-xl p-4 border border-[#2b2f36]">
                  <p className="text-xs text-gray-500 mb-1">Created</p>
                  <p className="text-sm text-white">{formatDate(viewingCategory.createdAt)}</p>
                  </div>
                <div className="bg-[#1e2329] rounded-xl p-4 border border-[#2b2f36]">
                  <p className="text-xs text-gray-500 mb-1">Updated</p>
                  <p className="text-sm text-white">{formatDate(viewingCategory.updatedAt)}</p>
                    </div>
                  </div>
                  
              <div className="flex items-center space-x-3 pt-4 border-t border-[#2b2f36]">
                <button onClick={() => { closeViewModal(); openEditModal(viewingCategory); }} className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 flex items-center space-x-2">
                  <Edit className="w-4 h-4" /><span>Edit</span>
                  </button>
                <button onClick={() => { closeViewModal(); openDeleteModal(viewingCategory); }} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 flex items-center space-x-2">
                  <Trash2 className="w-4 h-4" /><span>Delete</span>
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {showDeleteModal && deletingCategory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-red-500/30 bg-red-500/5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Delete Category</h2>
                  <p className="text-xs text-red-400">This action cannot be undone</p>
                </div>
              </div>
              <button onClick={closeDeleteModal} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-red-400 text-sm">
                  You are about to permanently delete "<strong>{deletingCategory.name}</strong>". 
                  This will affect {deletingCategory.articleCount} article(s).
                </p>
              </div>

              <form onSubmit={handleDeleteSubmit} className="space-y-4">
                {deleteFormError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center">
                    <AlertCircle className="w-4 h-4 text-red-400 mr-2" />
                    <p className="text-red-400 text-sm">{deleteFormError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type "DELETE" to confirm</label>
                  <input
                    type="text"
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white text-center font-mono tracking-wider focus:outline-none focus:border-red-500/50"
                    placeholder="DELETE"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-[#2b2f36]">
                  <button type="button" onClick={closeDeleteModal} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                  <button
                    type="submit"
                    disabled={deleteFormLoading || deleteText !== 'DELETE'}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {deleteFormLoading ? <><div className="w-4 h-4 border-2 border-red-400/20 border-t-red-400 rounded-full animate-spin"></div><span>Deleting...</span></> : <><Trash2 className="w-4 h-4" /><span>Delete</span></>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
