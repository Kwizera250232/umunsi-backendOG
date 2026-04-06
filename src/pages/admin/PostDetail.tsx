import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  User,
  Tag,
  Star,
  Pin,
  MessageCircle,
  TrendingUp,
  Globe,
  Lock,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Clock,
  Share2,
  Bookmark
} from 'lucide-react';
import { apiClient, Post } from '../../services/api';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const postData = await apiClient.getPost(id!);
      setPost(postData);
    } catch (error: any) {
      console.error('Error fetching post:', error);
      setError('Failed to load article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    
    if (confirm(`Are you sure you want to delete "${post.title}"? This action cannot be undone.`)) {
      try {
        await apiClient.deletePosts([post.id]);
        navigate('/admin/posts');
      } catch (error: any) {
        console.error('Error deleting post:', error);
        setError('Failed to delete article. Please try again.');
      }
    }
  };

  const getServerBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return apiUrl.replace('/api', '');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#fcd535]/20 border-t-[#fcd535] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Article</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => fetchPost()}
              className="px-4 py-2 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-semibold rounded-xl hover:from-[#f0b90b] hover:to-[#d4a00a] transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/admin/posts')}
              className="px-4 py-2 bg-[#1e2329] text-gray-300 rounded-xl hover:bg-[#2b2f36] transition-colors"
            >
              Back to Posts
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Article Not Found</h2>
          <p className="text-gray-400 mb-4">The article you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => navigate('/admin/posts')}
            className="px-4 py-2 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-semibold rounded-xl hover:from-[#f0b90b] hover:to-[#d4a00a] transition-all"
          >
            Back to Posts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11]">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/admin/posts')}
              className="flex items-center text-gray-400 hover:text-[#fcd535] transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Posts
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate(`/admin/posts/edit/${post.id}`)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Article
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center px-4 py-2 bg-red-600/10 text-red-400 rounded-xl hover:bg-red-600/20 transition-colors text-sm border border-red-500/30"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
          
          {/* Title and Featured Image */}
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] overflow-hidden">
            {post.featuredImage && (
              <div className="relative h-64 md:h-80">
                  <img
                    src={`${getServerBaseUrl()}${post.featuredImage}`}
                    alt={post.title}
                  className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                <div className="absolute inset-0 bg-gradient-to-t from-[#181a20] via-transparent to-transparent"></div>
              </div>
            )}
            
            <div className="p-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${
                  post.status === 'PUBLISHED' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : post.status === 'DRAFT'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                }`}>
                  {post.status === 'PUBLISHED' ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                  {post.status}
                </span>
                {post.isFeatured && (
                  <span className="inline-flex items-center px-3 py-1 bg-[#fcd535]/10 text-[#fcd535] text-xs font-semibold rounded-lg border border-[#fcd535]/30">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </span>
                )}
                {post.isPinned && (
                  <span className="inline-flex items-center px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/30">
                    <Pin className="w-3 h-3 mr-1" />
                    Pinned
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                {post.title}
              </h1>
              
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <span>{post.author?.name || 'Unknown Author'}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{formatDate(post.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <Tag className="w-4 h-4 mr-2" />
                  <span>{post.category?.name || 'Uncategorized'}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  <span>{post.viewCount} views</span>
                </div>
                <div className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  <span>{post.commentCount} comments</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span>{post.likeCount} likes</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-[#fcd535]" />
                Article Content
              </h2>
            {post.content ? (
              <div 
                  className="prose prose-invert max-w-none text-gray-300 leading-relaxed"
                style={{ 
                  wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: post.content.replace(
                    /<img([^>]*)src="([^"]*)"([^>]*)>/gi, 
                    (match, before, src, after) => {
                      const correctedSrc = src.startsWith('/uploads/') 
                        ? `${getServerBaseUrl()}${src}`
                        : src.startsWith('http') 
                        ? src 
                        : `${getServerBaseUrl()}/uploads/${src}`;
                      
                        return `<img${before}src="${correctedSrc}"${after} class="max-w-full h-auto rounded-lg my-4 block" onerror="this.style.display='none'">`;
                    }
                  )
                }} 
              />
            ) : (
                <p className="text-gray-500 italic">No content available for this article.</p>
            )}
          </div>

            {/* Excerpt */}
            {post.excerpt && (
              <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-3">Excerpt</h3>
                <p className="text-gray-400">{post.excerpt}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-[#fcd535]" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-[#0b0e11] text-gray-300 rounded-lg text-sm border border-[#2b2f36]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Post Settings */}
            <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-[#fcd535]" />
                Article Settings
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36]">
                  <span className="text-gray-400 text-sm">Featured Article</span>
                  {post.isFeatured ? (
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  ) : (
                    <Star className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36]">
                  <span className="text-gray-400 text-sm">Pinned Article</span>
                  {post.isPinned ? (
                    <Pin className="w-5 h-5 text-blue-500 fill-current" />
                  ) : (
                    <Pin className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36]">
                  <span className="text-gray-400 text-sm">Allow Comments</span>
                  {post.allowComments ? (
                    <MessageCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <MessageCircle className="w-5 h-5 text-gray-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Post Information */}
            <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-[#fcd535]" />
                Article Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36]">
                  <span className="text-gray-500">ID</span>
                  <span className="font-mono text-gray-300 text-xs">{post.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36]">
                  <span className="text-gray-500">Slug</span>
                  <span className="font-mono text-gray-300 text-xs truncate max-w-[150px]">{post.slug}</span>
                </div>
                <div className="flex justify-between p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36]">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-300 text-xs">{formatDate(post.createdAt)}</span>
                </div>
                {post.updatedAt && (
                  <div className="flex justify-between p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36]">
                    <span className="text-gray-500">Updated</span>
                    <span className="text-gray-300 text-xs">{formatDate(post.updatedAt)}</span>
                  </div>
                )}
                {post.publishedAt && (
                  <div className="flex justify-between p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36]">
                    <span className="text-gray-500">Published</span>
                    <span className="text-gray-300 text-xs">{formatDate(post.publishedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SEO */}
            {(post.metaTitle || post.metaDescription) && (
              <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-[#fcd535]" />
                  SEO Information
                </h3>
                {post.metaTitle && (
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-2">Meta Title</label>
                    <p className="text-gray-300 text-sm p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36]">{post.metaTitle}</p>
                  </div>
                )}
                {post.metaDescription && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Meta Description</label>
                    <p className="text-gray-300 text-sm p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36]">{post.metaDescription}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
