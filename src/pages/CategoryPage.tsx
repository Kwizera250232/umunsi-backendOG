import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Eye, Heart, ChevronRight, ArrowLeft, Loader2, TrendingUp, Calendar, User } from 'lucide-react';
import { apiClient, Post, Category } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const getServerBaseUrl = () => {
  if (import.meta.env.DEV) {
    return (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
  }
  return (import.meta.env.VITE_API_URL || '').replace('/api', '');
};

const CategoryPage = () => {
  const { user } = useAuth();
  const showAds = user?.role !== 'ADMIN';
  const canSeeViews = user?.role === 'ADMIN';

  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (slug) {
      fetchCategoryData();
    }
  }, [slug]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      const categoriesResponse = await apiClient.getCategories({ includeInactive: false });
      if (categoriesResponse && Array.isArray(categoriesResponse)) {
        setAllCategories(categoriesResponse);
        const currentCategory = categoriesResponse.find(cat => cat.slug === slug);
        setCategory(currentCategory || null);

        if (currentCategory) {
          const postsResponse = await apiClient.getPosts({
            status: 'PUBLISHED',
            category: currentCategory.id,
            limit: 50
          });
          if (postsResponse?.data) {
            setPosts(postsResponse.data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Ubu';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Ubu';
    if (diffHours < 24) return `Amasaha ${diffHours} ashize`;
    if (diffDays < 7) return `Iminsi ${diffDays} ishize`;
    return date.toLocaleDateString('rw-RW', { month: 'short', day: 'numeric' });
  };

  const getImageUrl = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&h=400&fit=crop';
    if (url.startsWith('http')) return url;
    return `${getServerBaseUrl()}${url}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#fcd535] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Category Not Found</h1>
          <p className="text-gray-400 mb-6">The category "{slug}" does not exist.</p>
          <Link 
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#fcd535] text-[#0b0e11] font-bold rounded-lg hover:bg-[#f0b90b] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const featuredPost = posts[0];
  const secondaryPosts = posts.slice(1, 5);
  const firstBatchPosts = posts.slice(5, 10);
  const secondBatchPosts = posts.slice(10);
  const trendingPosts = [...posts].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#0b0e11]">
      {/* Category Header Banner */}
      <div className="bg-gradient-to-r from-[#181a20] via-[#1e2329] to-[#181a20] border-b border-[#2b2f36]">
        <div className="max-w-7xl mx-auto px-3 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link to="/" className="hover:text-[#fcd535] transition-colors">Ahabanza</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#fcd535] font-medium">{category.name}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{category.name}</h1>
              {category.description && (
                <p className="text-gray-400">{category.description}</p>
              )}
            </div>
            <div className="hidden md:flex items-center gap-2 text-gray-400 text-sm">
              <span className="px-3 py-1 bg-[#0b0e11] rounded-full border border-[#2b2f36]">
                {posts.length} Inkuru
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 py-6">
        {posts.length > 0 ? (
          <>
            {/* Hero Section - Featured + Secondary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
              {/* Main Featured Article */}
              {featuredPost && (
                <div className="lg:col-span-7">
                  <Link to={`/post/${featuredPost.slug}`} className="block group">
                    <div className="relative rounded-lg overflow-hidden bg-[#181a20] h-full">
                      <img 
                        src={getImageUrl(featuredPost.featuredImage)} 
                        alt={featuredPost.title}
                        className="w-full h-[280px] md:h-[380px] object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                        <span className="inline-block bg-[#fcd535] text-[#0b0e11] text-xs font-bold px-3 py-1 rounded mb-3">
                          {category.name}
                        </span>
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-[#fcd535] transition-colors line-clamp-3">
                          {featuredPost.title}
                        </h2>
                        {featuredPost.excerpt && (
                          <p className="text-gray-300 text-sm line-clamp-2 mb-3 hidden md:block">
                            {featuredPost.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-300">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(featuredPost.publishedAt || featuredPost.createdAt)}
                          </span>
                          {canSeeViews && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {featuredPost.viewCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Secondary Stories */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                {secondaryPosts.map((post) => (
                  <Link key={post.id} to={`/post/${post.slug}`} className="block group">
                    <div className="relative rounded-lg overflow-hidden bg-[#181a20] h-full">
                      <img 
                        src={getImageUrl(post.featuredImage)} 
                        alt={post.title}
                        className="w-full h-[130px] md:h-[180px] object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-sm font-bold text-white group-hover:text-[#fcd535] transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-gray-400 text-xs mt-1">
                          {formatDate(post.publishedAt || post.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Content - Articles */}
              <div className="lg:col-span-8 space-y-6">
                {/* First Batch - Article List */}
                {firstBatchPosts.length > 0 && (
                  <div className="bg-[#181a20] rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-[#2b2f36]">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#fcd535] rounded"></span>
                        Inkuru za {category.name}
                      </h2>
                    </div>
                    
                    <div className="divide-y divide-[#2b2f36]">
                      {firstBatchPosts.map((post) => (
                        <Link key={post.id} to={`/post/${post.slug}`} className="flex gap-4 p-4 hover:bg-[#1e2329] transition-colors group">
                          <img 
                            src={getImageUrl(post.featuredImage)} 
                            alt={post.title}
                            className="w-28 h-20 md:w-36 md:h-24 object-cover rounded flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold group-hover:text-[#fcd535] transition-colors line-clamp-2 text-sm md:text-base">
                              {post.title}
                            </h3>
                            {post.excerpt && (
                              <p className="text-gray-500 text-xs mt-1 line-clamp-1 hidden md:block">
                                {post.excerpt}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(post.publishedAt || post.createdAt)}
                              </span>
                              {canSeeViews && (
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {post.viewCount}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {post.likeCount || 0}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {posts.length <= 5 && (
                  <div className="bg-[#181a20] rounded-lg p-8 text-center text-gray-500">
                    Nta makuru menshi ahari muri iyi category
                  </div>
                )}

                {showAds && (
                  <div className="bg-[#181a20] rounded-lg overflow-hidden">
                    <div className="p-2 border-b border-[#2b2f36]">
                      <p className="text-gray-500 text-[10px] text-center uppercase tracking-wider">Kwamamaza</p>
                    </div>
                    <div className="p-4">
                      <div className="bg-[#0b0e11] rounded-lg border-2 border-dashed border-[#2b2f36] flex flex-col items-center justify-center h-[100px] hover:border-[#fcd535]/50 transition-colors">
                        <p className="text-gray-400 text-sm font-medium">Banner Ad</p>
                        <p className="text-[#fcd535] text-xs font-bold">728 x 90 px</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Second Batch - More Articles After Ad */}
                {secondBatchPosts.length > 0 && (
                  <div className="bg-[#181a20] rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-[#2b2f36]">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#fcd535] rounded"></span>
                        Izindi Nkuru
                      </h2>
                    </div>
                    
                    <div className="divide-y divide-[#2b2f36]">
                      {secondBatchPosts.map((post) => (
                        <Link key={post.id} to={`/post/${post.slug}`} className="flex gap-4 p-4 hover:bg-[#1e2329] transition-colors group">
                          <img 
                            src={getImageUrl(post.featuredImage)} 
                            alt={post.title}
                            className="w-28 h-20 md:w-36 md:h-24 object-cover rounded flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold group-hover:text-[#fcd535] transition-colors line-clamp-2 text-sm md:text-base">
                              {post.title}
                            </h3>
                            {post.excerpt && (
                              <p className="text-gray-500 text-xs mt-1 line-clamp-1 hidden md:block">
                                {post.excerpt}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(post.publishedAt || post.createdAt)}
                              </span>
                              {canSeeViews && (
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {post.viewCount}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {post.likeCount || 0}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-4 space-y-6">
                {/* Trending in Category */}
                <div className="bg-[#181a20] rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-[#2b2f36]">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#fcd535]" />
                      Ibisomwa cyane
                    </h2>
                  </div>
                  
                  <div className="divide-y divide-[#2b2f36]">
                    {trendingPosts.map((post, index) => (
                      <Link key={post.id} to={`/post/${post.slug}`} className="flex gap-3 p-4 hover:bg-[#1e2329] transition-colors group">
                        <span className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                          index < 3 ? 'bg-[#fcd535] text-[#0b0e11]' : 'bg-[#2b2f36] text-gray-400'
                        }`}>
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-300 text-sm group-hover:text-[#fcd535] transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          {canSeeViews && (
                            <p className="text-gray-500 text-xs mt-1">
                              <Eye className="w-3 h-3 inline mr-1" />
                              {post.viewCount}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Other Categories */}
                <div className="bg-[#181a20] rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-[#2b2f36]">
                    <h2 className="text-lg font-bold text-white">Izindi Category</h2>
                  </div>
                  
                  <div className="p-2">
                    {allCategories.filter(cat => cat.slug !== slug).slice(0, 8).map((cat) => (
                      <Link 
                        key={cat.id}
                        to={`/category/${cat.slug}`}
                        className="flex items-center justify-between p-3 hover:bg-[#1e2329] rounded-lg transition-colors group"
                      >
                        <span className="text-gray-300 group-hover:text-[#fcd535] transition-colors text-sm">
                          {cat.name}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#fcd535]" />
                      </Link>
                    ))}
                  </div>
                </div>

                {showAds && (
                  <div className="bg-[#181a20] rounded-lg overflow-hidden">
                    <div className="p-2 border-b border-[#2b2f36]">
                      <p className="text-gray-500 text-[10px] text-center uppercase tracking-wider">Kwamamaza</p>
                    </div>
                    <div className="p-3">
                      <div className="bg-[#0b0e11] rounded-lg border-2 border-dashed border-[#2b2f36] flex flex-col items-center justify-center aspect-square hover:border-[#fcd535]/50 transition-colors">
                        <p className="text-gray-400 text-xs font-medium">Square Ad</p>
                        <p className="text-[#fcd535] text-[10px] font-bold">300 x 300 px</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Back to Home */}
                <Link 
                  to="/"
                  className="flex items-center justify-center gap-2 w-full p-4 bg-[#181a20] rounded-lg border border-[#2b2f36] text-gray-300 hover:text-[#fcd535] hover:border-[#fcd535]/30 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Subira Ahabanza
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-[#181a20] rounded-lg border border-[#2b2f36] p-12 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Nta Makuru</h3>
            <p className="text-gray-400 mb-6">Nta makuru ahari muri iyi category.</p>
            <Link 
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#fcd535] text-[#0b0e11] font-bold rounded-lg hover:bg-[#f0b90b] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Subira Ahabanza
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
