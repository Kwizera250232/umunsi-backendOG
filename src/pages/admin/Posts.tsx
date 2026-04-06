import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  User,
  Tag,
  MoreVertical,
  Star,
  Pin,
  MessageCircle,
  TrendingUp,
  FileText,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { apiClient, Post, Category } from '../../services/api';

const Posts: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const getServerBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return apiUrl.replace('/api', '');
  };

  const getImageUrl = (imagePath: string) => {
    let fixedPath = imagePath;
    if (imagePath.includes('/api/uploads/')) {
      fixedPath = imagePath.replace('/api/uploads/', '/uploads/');
    }
    if (fixedPath.startsWith('http://') || fixedPath.startsWith('https://')) {
      return fixedPath;
    }
    return `${getServerBaseUrl()}${fixedPath}`;
  };

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postsToDelete, setPostsToDelete] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = [
    { value: 'all', label: 'All Posts' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'ARCHIVED', label: 'Archived' }
  ];

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [currentPage, selectedStatus, selectedCategory, searchTerm]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, unknown> = { page: currentPage, limit: 12 };
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;

      const response = await apiClient.getPosts(params);
      setPosts(response.data);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.getCategories();
      setCategories(response);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDeletePosts = async (postIds: string[]) => {
    setPostsToDelete(postIds);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await apiClient.deletePosts(postsToDelete);
      await fetchPosts();
      setSelectedPosts([]);
      setShowDeleteConfirm(false);
      setPostsToDelete([]);
    } catch (error: unknown) {
      console.error('Error deleting posts:', error);
      if (error instanceof Error && error.message?.includes('Post not found')) {
        setError('Some posts may have already been deleted. Refreshing the list...');
        await fetchPosts();
      } else {
        setError('Failed to delete posts. Please try again.');
      }
      setShowDeleteConfirm(false);
      setPostsToDelete([]);
    }
  };

  const togglePostSelection = (postId: string) => {
    setSelectedPosts(prev => 
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const selectAllPosts = () => setSelectedPosts(posts.map(post => post.id));
  const clearSelection = () => setSelectedPosts([]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'PUBLISHED': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'DRAFT': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'ARCHIVED': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return styles[status] || styles.DRAFT;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[#fcd535]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#fcd535] animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[#fcd535] animate-pulse" />
          </div>
          <p className="text-gray-400">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Posts</h1>
            <p className="text-gray-400 mt-1">Manage your blog posts and articles</p>
          </div>
          <button 
            onClick={() => navigate('/admin/posts/add')}
            className="inline-flex items-center px-5 py-2.5 bg-[#fcd535] text-[#0b0e11] font-semibold rounded-xl hover:bg-[#f0b90b] transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-[#fcd535]" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#fcd535]/50"
              />
            </div>
          </div>

          <div className="lg:w-44">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="lg:w-44">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-[#2b2f36] rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#fcd535] text-[#0b0e11]' : 'text-gray-400 hover:text-white'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#fcd535] text-[#0b0e11]' : 'text-gray-400 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPosts.length > 0 && (
        <div className="bg-[#fcd535]/10 border border-[#fcd535]/30 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-[#fcd535] font-medium">
              {selectedPosts.length} post{selectedPosts.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleDeletePosts(selectedPosts)}
                className="flex items-center px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center">
          <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
          <span className="text-red-400">{error}</span>
          <button
            onClick={() => fetchPosts()}
            className="ml-auto px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Posts Grid/List */}
      {posts.length === 0 ? (
        <div className="text-center py-16 bg-[#181a20] rounded-2xl border border-[#2b2f36]">
          <div className="w-16 h-16 bg-[#2b2f36] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-500" />
        </div>
          <h3 className="text-lg font-medium text-white mb-2">No posts found</h3>
          <p className="text-gray-400 mb-4">Get started by creating your first post.</p>
          <button
            onClick={() => navigate('/admin/posts/add')}
            className="px-4 py-2 bg-[#fcd535] text-[#0b0e11] font-medium rounded-lg hover:bg-[#f0b90b] transition-all"
          >
            Create First Post
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className={`bg-[#181a20] rounded-xl border-2 transition-all cursor-pointer group ${
                selectedPosts.includes(post.id) 
                  ? 'border-[#fcd535]' 
                  : 'border-[#2b2f36] hover:border-[#fcd535]/30'
              }`}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('input[type="checkbox"]') || 
                    (e.target as HTMLElement).closest('button')) return;
                navigate(`/admin/posts/${post.id}`);
              }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post.id)}
                      onChange={() => togglePostSelection(post.id)}
                      className="w-4 h-4 rounded bg-[#2b2f36] border-[#2b2f36] text-[#fcd535] focus:ring-[#fcd535]/50"
                    />
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${getStatusBadge(post.status)}`}>
                      {post.status}
                      </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {post.isFeatured && <Star className="w-4 h-4 text-[#fcd535]" />}
                    {post.isPinned && <Pin className="w-4 h-4 text-blue-400" />}
                  </div>
                </div>

                <div className="mb-3 relative overflow-hidden rounded-lg aspect-video bg-[#2b2f36]">
                    {post.featuredImage ? (
                      <img
                        src={getImageUrl(post.featuredImage)}
                        alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-600" />
                </div>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2 group-hover:text-[#fcd535] transition-colors">
                  {post.title}
                </h3>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                    <span>{post.author.firstName} {post.author.lastName}</span>
                    </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                  
                <div className="flex items-center justify-between text-xs text-gray-500">
                    {post.category && (
                    <span className="px-2 py-0.5 bg-[#2b2f36] rounded text-gray-400">
                          {post.category.name}
                        </span>
                  )}
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center"><Eye className="w-3 h-3 mr-1" />{post.viewCount}</span>
                    <span className="flex items-center"><MessageCircle className="w-3 h-3 mr-1" />{post.commentCount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2b2f36]">
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => navigate(`/admin/posts/${post.id}`)}
                      className="p-1.5 text-gray-500 hover:text-[#fcd535] hover:bg-[#2b2f36] rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => navigate(`/admin/posts/edit/${post.id}`)}
                      className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-[#2b2f36] rounded-lg transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeletePosts([post.id])}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-[#2b2f36] rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] overflow-hidden">
            <table className="w-full">
            <thead className="bg-[#1e2329] border-b border-[#2b2f36]">
                <tr>
                <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                    checked={selectedPosts.length === posts.length && posts.length > 0}
                    onChange={selectedPosts.length === posts.length ? clearSelection : selectAllPosts}
                    className="w-4 h-4 rounded bg-[#2b2f36] border-[#2b2f36] text-[#fcd535]"
                    />
                  </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Post</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Author</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Stats</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-[#2b2f36]">
              {posts.map((post) => (
                  <tr 
                    key={post.id} 
                  className="hover:bg-[#1e2329] cursor-pointer transition-colors"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('input[type="checkbox"]') || 
                        (e.target as HTMLElement).closest('button')) return;
                      navigate(`/admin/posts/${post.id}`);
                    }}
                  >
                  <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(post.id)}
                        onChange={() => togglePostSelection(post.id)}
                      className="w-4 h-4 rounded bg-[#2b2f36] border-[#2b2f36] text-[#fcd535]"
                      />
                    </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-[#2b2f36] rounded-lg overflow-hidden flex-shrink-0">
                          {post.featuredImage ? (
                          <img src={getImageUrl(post.featuredImage)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                        </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate flex items-center">
                          {post.title}
                          {post.isFeatured && <Star className="w-3 h-3 text-[#fcd535] ml-2" />}
                        </p>
                        {post.excerpt && <p className="text-xs text-gray-500 truncate">{post.excerpt}</p>}
                      </div>
                      </div>
                    </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getStatusBadge(post.status)}`}>
                      {post.status}
                    </span>
                    </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{post.author.firstName} {post.author.lastName}</td>
                  <td className="px-4 py-3">
                      {post.category ? (
                      <span className="px-2 py-1 bg-[#2b2f36] rounded text-xs text-gray-400">{post.category.name}</span>
                      ) : (
                      <span className="text-gray-600 text-xs">No category</span>
                      )}
                    </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span className="flex items-center"><Eye className="w-3 h-3 mr-1" />{post.viewCount}</span>
                      <span className="flex items-center"><MessageCircle className="w-3 h-3 mr-1" />{post.commentCount}</span>
                      </div>
                    </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{formatDate(post.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => navigate(`/admin/posts/${post.id}`)}
                        className="p-1.5 text-gray-500 hover:text-[#fcd535] hover:bg-[#2b2f36] rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/admin/posts/edit/${post.id}`)}
                        className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-[#2b2f36] rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeletePosts([post.id])}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-[#2b2f36] rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-[#181a20] rounded-xl border border-[#2b2f36] p-4">
          <div className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-[#2b2f36] text-gray-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#363a45] hover:text-white transition-colors flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-[#2b2f36] text-gray-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#363a45] hover:text-white transition-colors flex items-center"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mr-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Delete {postsToDelete.length === 1 ? 'Post' : 'Posts'}
                </h3>
                <p className="text-sm text-gray-400">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-300 mb-6">
                Are you sure you want to delete {postsToDelete.length === 1 ? 'this post' : `these ${postsToDelete.length} posts`}? 
              </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-[#2b2f36] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Posts;
