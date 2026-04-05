import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Eye, 
  Calendar,
  User,
  Heart,
  MessageCircle,
  Share2,
  Clock,
  ChevronRight,
  Loader2,
  AlertCircle,
  Send,
  Facebook,
  Twitter,
  Linkedin,
  Link2,
  Check,
  ArrowLeft
} from 'lucide-react';
import { apiClient, Post } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const getServerBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace('/api', '');
};

const PostPage = () => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Get the identifier (either slug or id)
  const postIdentifier = slug || id;

  useEffect(() => {
    if (postIdentifier) {
      fetchPost();
      window.scrollTo(0, 0);
    }
  }, [postIdentifier]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch post directly by ID or slug (backend supports both)
      const foundPost = await apiClient.getPost(postIdentifier!);
      
      if (foundPost) {
        setPost(foundPost);
        setLikeCount(foundPost.likeCount || 0);
        
        // Fetch related posts and latest posts in parallel
        const postsResponse = await apiClient.getPosts({ limit: 20, status: 'PUBLISHED' });
        if (postsResponse?.data) {
          // Get latest posts for sidebar
          setLatestPosts(postsResponse.data.filter(p => p.id !== foundPost.id).slice(0, 5));
          
          // Get related posts from same category
          if (foundPost.category) {
            const related = postsResponse.data.filter(
              p => p.category?.id === foundPost.category?.id && p.id !== foundPost.id
            ).slice(0, 4);
            setRelatedPosts(related);
          }
        }
      } else {
        setError('Post not found');
      }
    } catch (error: any) {
      console.error('Error fetching post:', error);
      setError('Failed to load article.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = () => {
    if (!isAuthenticated) {
      alert('Please login to like this article');
      return;
    }
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || '';
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
    }
    setShowShareMenu(false);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    setSubmittingComment(true);
    const comment = {
      id: Date.now().toString(),
      content: newComment,
      author: { name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User' },
      createdAt: new Date().toISOString()
    };
    setComments(prev => [comment, ...prev]);
    setNewComment('');
    setSubmittingComment(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('rw-RW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('rw-RW', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImageUrl = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&h=400&fit=crop';
    if (url.startsWith('http')) return url;
    return `${getServerBaseUrl()}${url}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#fcd535] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Article Not Found</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link to="/" className="text-[#fcd535] hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11]">
      {/* Breadcrumb */}
      <div className="bg-[#181a20] border-b border-[#2b2f36]">
        <div className="max-w-7xl mx-auto px-3 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link to="/" className="hover:text-[#fcd535]">Ahabanza</Link>
            <ChevronRight className="w-4 h-4" />
            {post.category && (
              <>
                <Link to={`/category/${post.category.slug}`} className="hover:text-[#fcd535]">
                  {post.category.name}
                </Link>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
            <span className="text-gray-500 truncate max-w-[300px]">{post.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Article Header */}
            <article className="bg-[#181a20] rounded-lg overflow-hidden">
              {/* Category & Date Header */}
              <div className="p-4 pb-0">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  {post.category && (
                    <Link 
                      to={`/category/${post.category.slug}`}
                      className="bg-[#fcd535] text-[#0b0e11] text-xs font-bold px-3 py-1 rounded"
                    >
                      {post.category.name}
                    </Link>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(post.publishedAt || post.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(post.publishedAt || post.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-4">
                  {post.title}
                </h1>

                {/* Author & Stats Row */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[#2b2f36]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#fcd535] flex items-center justify-center">
                      <User className="w-5 h-5 text-[#0b0e11]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {post.author?.firstName} {post.author?.lastName}
                      </p>
                      <p className="text-gray-500 text-xs">Author</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {post.viewCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {likeCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {post.commentCount || comments.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Featured Image */}
              {post.featuredImage && (
                <div className="px-4 py-4">
                  <img
                    src={getImageUrl(post.featuredImage)}
                    alt={post.title}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}

              {/* Social Share Bar */}
              <div className="px-4 py-3 border-b border-[#2b2f36] flex items-center justify-between">
                <span className="text-sm text-gray-400">Sangiza:</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleShare('facebook')}
                    className="w-8 h-8 rounded-full bg-[#1877f2] flex items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    <Facebook className="w-4 h-4 text-white" />
                  </button>
                  <button 
                    onClick={() => handleShare('twitter')}
                    className="w-8 h-8 rounded-full bg-[#1da1f2] flex items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    <Twitter className="w-4 h-4 text-white" />
                  </button>
                  <button 
                    onClick={() => handleShare('whatsapp')}
                    className="w-8 h-8 rounded-full bg-[#25d366] flex items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleShare('linkedin')}
                    className="w-8 h-8 rounded-full bg-[#0077b5] flex items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    <Linkedin className="w-4 h-4 text-white" />
                  </button>
                  <button 
                    onClick={() => handleShare('copy')}
                    className="w-8 h-8 rounded-full bg-[#2b2f36] flex items-center justify-center hover:bg-[#363a45] transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
              </div>

              {/* Article Content */}
              <div className="p-4">
                {post.excerpt && (
                  <p className="text-gray-300 text-lg leading-relaxed mb-6 font-medium border-l-4 border-[#fcd535] pl-4">
                    {post.excerpt}
                  </p>
                )}

                <div 
                  className="prose prose-invert prose-lg max-w-none text-gray-300"
                  style={{ wordBreak: 'break-word' }}
                  dangerouslySetInnerHTML={{ 
                    __html: post.content?.replace(
                      /<img([^>]*)src="([^"]*)"([^>]*)>/gi, 
                      (match, before, src, after) => {
                        const correctedSrc = src.startsWith('/uploads/') 
                          ? `${getServerBaseUrl()}${src}`
                          : src.startsWith('http') ? src : `${getServerBaseUrl()}/uploads/${src}`;
                        return `<img${before}src="${correctedSrc}"${after} class="w-full h-auto rounded-lg my-4" onerror="this.style.display='none'">`;
                      }
                    ) || ''
                  }} 
                />

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-8 pt-4 border-t border-[#2b2f36]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-500 text-sm">Tags:</span>
                      {post.tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-[#2b2f36] text-gray-300 text-sm rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Like & Share Actions */}
              <div className="p-4 bg-[#0b0e11] flex items-center justify-between">
                <button 
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium transition-all ${
                    liked 
                      ? 'bg-red-500 text-white' 
                      : 'bg-[#2b2f36] text-gray-300 hover:bg-[#363a45]'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                  {liked ? 'Liked' : 'Like'} ({likeCount})
                </button>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Eye className="w-4 h-4" />
                  {post.viewCount} views
                </div>
              </div>
            </article>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-6 bg-[#181a20] rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-[#fcd535] rounded"></span>
                  Andi makuru ajyanye
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedPosts.map((rPost) => (
                    <Link 
                      key={rPost.id}
                      to={`/post/${rPost.slug}`}
                      className="flex gap-3 group"
                    >
                      <img 
                        src={getImageUrl(rPost.featuredImage)}
                        alt={rPost.title}
                        className="w-24 h-20 object-cover rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm font-medium group-hover:text-[#fcd535] transition-colors line-clamp-2">
                          {rPost.title}
                        </h4>
                        <p className="text-gray-500 text-xs mt-1">
                          {formatDate(rPost.publishedAt || rPost.createdAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="mt-6 bg-[#181a20] rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#fcd535] rounded"></span>
                Ibitekerezo ({comments.length})
              </h3>

              {/* Comment Form */}
              <form onSubmit={handleSubmitComment} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={isAuthenticated ? "Andika igitekerezo cyawe..." : "Injira kugira ngo utange igitekerezo"}
                  disabled={!isAuthenticated}
                  className="w-full px-4 py-3 bg-[#0b0e11] border border-[#2b2f36] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fcd535] resize-none disabled:opacity-50"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment || !isAuthenticated}
                    className="flex items-center gap-2 px-4 py-2 bg-[#fcd535] text-[#0b0e11] font-semibold rounded-lg hover:bg-[#f0b90b] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Ohereza
                  </button>
                </div>
              </form>

              {/* Comments List */}
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-4 bg-[#0b0e11] rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#2b2f36] flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <span className="text-white text-sm font-medium">{comment.author?.name}</span>
                          <span className="text-gray-500 text-xs ml-2">{formatDate(comment.createdAt)}</span>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm pl-11">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6">Nta bitekerezo bihari. Ba uwa mbere!</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Latest News */}
            <div className="bg-[#181a20] rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#fcd535] rounded"></span>
                Amakuru Mashya
              </h3>
              <div className="space-y-4">
                {latestPosts.map((lPost, index) => (
                  <Link 
                    key={lPost.id}
                    to={`/post/${lPost.slug}`}
                    className="flex gap-3 group"
                  >
                    <span className="w-8 h-8 bg-[#fcd535] text-[#0b0e11] rounded flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-gray-300 text-sm group-hover:text-[#fcd535] transition-colors line-clamp-2">
                        {lPost.title}
                      </h4>
                      <p className="text-gray-500 text-xs mt-1">
                        {formatDate(lPost.publishedAt || lPost.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Ad Space */}
            <div className="bg-[#181a20] rounded-lg p-4 text-center">
              <p className="text-gray-500 text-xs mb-2">ADVERTISEMENT</p>
              <div className="bg-[#0b0e11] rounded-lg h-60 flex items-center justify-center border border-dashed border-[#2b2f36]">
                <span className="text-gray-600">Ad Space</span>
              </div>
            </div>

            {/* Back Links */}
            <div className="space-y-2">
              {post.category && (
                <Link 
                  to={`/category/${post.category.slug}`}
                  className="flex items-center justify-between w-full p-3 bg-[#181a20] rounded-lg text-gray-300 hover:text-[#fcd535] transition-colors"
                >
                  <span>Reba byose muri {post.category.name}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
              <Link 
                to="/"
                className="flex items-center gap-2 w-full p-3 bg-[#181a20] rounded-lg text-gray-300 hover:text-[#fcd535] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Subira Ahabanza
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside handlers */}
      {showShareMenu && <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />}
    </div>
  );
};

export default PostPage;
