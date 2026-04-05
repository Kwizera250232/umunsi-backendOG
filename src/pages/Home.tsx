import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, ChevronRight, Loader2, Heart, TrendingUp, Zap, AlertCircle, Mail, Calendar, MapPin, CloudSun, Send, ThumbsUp } from 'lucide-react';
import { apiClient, Post, Category } from '../services/api';

const getServerBaseUrl = () => {
  if (import.meta.env.DEV) {
    return (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
  }
  return (import.meta.env.VITE_API_URL || '').replace('/api', '');
};

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredPost, setFeaturedPost] = useState<Post | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchHomeData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      
      const postsResponse = await apiClient.getPosts({ 
        status: 'PUBLISHED', 
        limit: 30 
      });
      
      if (postsResponse?.data) {
        setPosts(postsResponse.data);
        const featured = postsResponse.data.find(p => p.isFeatured || p.isPinned) || postsResponse.data[0];
        setFeaturedPost(featured);
      }

      const categoriesResponse = await apiClient.getCategories({ includeInactive: false });
      if (categoriesResponse) {
        setCategories(categoriesResponse);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
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

  const getPostsByCategory = (categoryId: string) => {
    return posts.filter(p => p.category?.id === categoryId).slice(0, 4);
  };

  const filteredPosts = activeTab === 'all' 
    ? posts 
    : posts.filter(p => p.category?.id === activeTab);

  const formatFullDate = () => {
    const days = ['Ku cyumweru', 'Ku wa mbere', 'Ku wa kabiri', 'Ku wa gatatu', 'Ku wa kane', 'Ku wa gatanu', 'Ku wa gatandatu'];
    const months = ['Mutarama', 'Gashyantare', 'Werurwe', 'Mata', 'Gicurasi', 'Kamena', 'Nyakanga', 'Kanama', 'Nzeri', 'Ukwakira', 'Ugushyingo', 'Ukuboza'];
    return `${days[currentTime.getDay()]}, ${currentTime.getDate()} ${months[currentTime.getMonth()]} ${currentTime.getFullYear()}`;
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Murakoze kwiyandikisha!');
    setEmail('');
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

  const otherPosts = posts.filter(p => p.id !== featuredPost?.id);
  const topPosts = otherPosts.slice(0, 4);
  const trendingPosts = [...posts].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 6);
  const latestPosts = activeTab === 'all' ? otherPosts.slice(0, 8) : filteredPosts.slice(0, 8);
  const breakingNews = posts.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#0b0e11]">
      {/* Breaking News Ticker */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-2 overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full flex-shrink-0">
            <AlertCircle className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-bold uppercase">Inkuru zigezweho</span>
          </div>
          <div className="overflow-hidden flex-1">
            <div className="animate-marquee whitespace-nowrap flex gap-8">
              {breakingNews.map((news, i) => (
                <Link key={i} to={`/post/${news.slug}`} className="hover:underline inline-flex items-center gap-2">
                  <span className="text-sm">{news.title}</span>
                  <span className="text-emerald-300">•</span>
                </Link>
              ))}
              {breakingNews.map((news, i) => (
                <Link key={`dup-${i}`} to={`/post/${news.slug}`} className="hover:underline inline-flex items-center gap-2">
                  <span className="text-sm">{news.title}</span>
                  <span className="text-emerald-300">•</span>
                </Link>
              ))}
            </div>
          </div>
              </div>
            </div>

      {/* Date & Weather Bar */}
      <div className="bg-[#181a20] border-b border-[#2b2f36] py-2">
        <div className="max-w-7xl mx-auto px-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-4 text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-[#fcd535]" />
              {formatFullDate()}
            </span>
            <span className="hidden md:flex items-center gap-1">
              <Clock className="w-4 h-4 text-[#fcd535]" />
              {currentTime.toLocaleTimeString('rw-RW', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-[#fcd535]" />
              Kigali
            </span>
            <span className="flex items-center gap-1">
              <CloudSun className="w-4 h-4 text-[#fcd535]" />
              24°C
            </span>
                </div>
              </div>
                      </div>

      <div className="max-w-7xl mx-auto px-3 py-4">
        {/* Hero Section - Featured + Top Stories */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
          {/* Main Featured Article */}
          <div className="lg:col-span-7">
            {featuredPost && (
              <Link to={`/post/${featuredPost.slug}`} className="block group">
                <div className="relative rounded-lg overflow-hidden bg-[#181a20]">
                  <img 
                    src={getImageUrl(featuredPost.featuredImage)} 
                    alt={featuredPost.title}
                    className="w-full h-[300px] md:h-[400px] object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    {featuredPost.category && (
                      <span className="inline-block bg-[#fcd535] text-[#0b0e11] text-xs font-bold px-3 py-1 rounded mb-3">
                        {featuredPost.category.name}
                      </span>
                    )}
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 group-hover:text-[#fcd535] transition-colors line-clamp-3">
                      {featuredPost.title}
                    </h2>
                    <p className="text-gray-300 text-sm line-clamp-2 mb-2 hidden md:block">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(featuredPost.publishedAt || featuredPost.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {featuredPost.viewCount}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Secondary Stories */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {topPosts.map((post) => (
              <Link key={post.id} to={`/post/${post.slug}`} className="block group">
                <div className="relative rounded-lg overflow-hidden bg-[#181a20] h-full">
                  <img 
                    src={getImageUrl(post.featuredImage)} 
                    alt={post.title}
                    className="w-full h-[140px] md:h-[190px] object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    {post.category && (
                      <span className="inline-block bg-[#fcd535] text-[#0b0e11] text-[10px] font-bold px-2 py-0.5 rounded mb-2">
                        {post.category.name}
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-white group-hover:text-[#fcd535] transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                  </div>
                </div>
              </Link>
                ))}
              </div>
            </div>

        {/* Category Tabs */}
        <div className="mb-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 pb-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === 'all' 
                  ? 'bg-[#fcd535] text-[#0b0e11]' 
                  : 'bg-[#181a20] text-gray-400 hover:bg-[#1e2329] hover:text-white'
              }`}
            >
              Byose
            </button>
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === cat.id 
                    ? 'bg-[#fcd535] text-[#0b0e11]' 
                    : 'bg-[#181a20] text-gray-400 hover:bg-[#1e2329] hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Top Full Width Ad - Before Posts */}
        <div className="mb-6 bg-[#181a20] rounded-lg overflow-hidden">
          <div className="p-2 border-b border-[#2b2f36]">
            <p className="text-gray-500 text-[10px] text-center uppercase tracking-wider">Kwamamaza</p>
          </div>
          <div className="p-4">
            <div className="bg-[#0b0e11] rounded-lg border-2 border-dashed border-[#2b2f36] flex flex-col items-center justify-center h-[120px] hover:border-[#fcd535]/50 transition-colors">
              <div className="text-center">
                <span className="text-3xl mb-2 block">🎯</span>
                <p className="text-gray-400 text-sm font-medium">Leaderboard Banner</p>
                <p className="text-[#fcd535] text-xs font-bold">970 x 120 px</p>
              </div>
            </div>
          </div>
                </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Content - Articles */}
          <div className="lg:col-span-8 space-y-6">
            {/* Latest News Section */}
            <div className="bg-[#181a20] rounded-lg overflow-hidden">
              <div className="p-4 border-b border-[#2b2f36] flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-1 h-6 bg-[#fcd535] rounded"></span>
                  {activeTab === 'all' ? 'Amakuru Mashya' : categories.find(c => c.id === activeTab)?.name || 'Amakuru'}
                </h2>
                <Link to="/news" className="text-[#fcd535] text-sm hover:underline flex items-center gap-1">
                  Reba Yose <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="divide-y divide-[#2b2f36]">
                {latestPosts.map((post) => (
                  <Link key={post.id} to={`/post/${post.slug}`} className="flex gap-4 p-4 hover:bg-[#1e2329] transition-colors group">
                    <div className="relative flex-shrink-0">
                      <img 
                        src={getImageUrl(post.featuredImage)} 
                        alt={post.title}
                        className="w-28 h-20 md:w-36 md:h-24 object-cover rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      {post.category && (
                        <span className="inline-block text-[#fcd535] text-xs font-medium mb-1">
                          {post.category.name}
                        </span>
                      )}
                      <h3 className="text-white font-semibold group-hover:text-[#fcd535] transition-colors line-clamp-2 text-sm md:text-base">
                        {post.title}
                      </h3>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-1 hidden md:block">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(post.publishedAt || post.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.viewCount}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Advertisement Banner */}
            <div className="bg-[#181a20] rounded-lg overflow-hidden">
              <div className="p-2 border-b border-[#2b2f36]">
                <p className="text-gray-500 text-xs text-center uppercase tracking-wider">Kwamamaza</p>
              </div>
                    <div className="p-4">
                <div className="bg-[#0b0e11] rounded-lg border-2 border-dashed border-[#2b2f36] flex flex-col items-center justify-center h-[250px] hover:border-[#fcd535]/50 transition-colors">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#1e2329] flex items-center justify-center">
                      <span className="text-2xl">🎬</span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-1">Ahantu h'Ubucuruzi</p>
                    <p className="text-[#fcd535] text-xs font-bold mb-2">GIF / Banner Ad</p>
                    <p className="text-gray-500 text-xs">728 x 250 px</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Categories with Posts */}
            {categories.slice(0, 2).map((category) => {
              const categoryPosts = getPostsByCategory(category.id);
              if (categoryPosts.length === 0) return null;
              
              return (
                <div key={category.id} className="bg-[#181a20] rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-[#2b2f36] flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-1 h-6 bg-[#fcd535] rounded"></span>
                      {category.name}
                    </h2>
                    <Link to={`/category/${category.slug}`} className="text-[#fcd535] text-sm hover:underline flex items-center gap-1">
                      Reba Yose <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    {categoryPosts.map((post) => (
                      <Link key={post.id} to={`/post/${post.slug}`} className="group">
                        <div className="relative rounded-lg overflow-hidden mb-2">
                          <img 
                            src={getImageUrl(post.featuredImage)} 
                            alt={post.title}
                            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <h3 className="text-white font-semibold group-hover:text-[#fcd535] transition-colors line-clamp-2 text-sm">
                          {post.title}
                        </h3>
                        <p className="text-gray-500 text-xs mt-1">
                          {formatDate(post.publishedAt || post.createdAt)}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Newsletter Signup */}
            <div className="bg-gradient-to-br from-[#fcd535] to-[#f0b90b] rounded-lg p-4 text-[#0b0e11]">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5" />
                <h3 className="font-bold">Iyandikishe ku makuru</h3>
              </div>
              <p className="text-sm mb-3 opacity-80">Akura amakuru mashya buri munsi.</p>
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 rounded bg-white/90 text-[#0b0e11] placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#0b0e11]/20"
                  required
                />
                <button type="submit" className="w-full bg-[#0b0e11] text-white py-2 rounded font-medium text-sm hover:bg-[#181a20] transition-colors flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Iyandikishe
                </button>
              </form>
            </div>

            {/* Trending Posts */}
            <div className="bg-[#181a20] rounded-lg overflow-hidden">
              <div className="p-4 border-b border-[#2b2f36]">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#fcd535]" />
                  Ibisomwa Cyane
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
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Eye className="w-3 h-3" />
                        {post.viewCount}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sidebar Ad Space - Rectangle */}
            <div className="bg-[#181a20] rounded-lg overflow-hidden">
              <div className="p-2 border-b border-[#2b2f36]">
                <p className="text-gray-500 text-[10px] text-center uppercase tracking-wider">Kwamamaza</p>
              </div>
              <div className="p-3">
                <div className="bg-[#0b0e11] rounded-lg border-2 border-dashed border-[#2b2f36] flex flex-col items-center justify-center h-[200px] hover:border-[#fcd535]/50 transition-colors">
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">🎬</span>
                    <p className="text-gray-400 text-xs font-medium">GIF / Banner</p>
                    <p className="text-[#fcd535] text-[10px] font-bold">300 x 250 px</p>
            </div>
          </div>
              </div>
            </div>

            {/* Categories List */}
            <div className="bg-[#181a20] rounded-lg overflow-hidden">
              <div className="p-4 border-b border-[#2b2f36]">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#fcd535]" />
                  Ibyiciro
                </h2>
                  </div>

              <div className="p-2">
                {categories.map((category) => (
                  <Link 
                    key={category.id}
                    to={`/category/${category.slug}`}
                    className="flex items-center justify-between p-3 hover:bg-[#1e2329] rounded-lg transition-colors group"
                  >
                    <span className="text-gray-300 group-hover:text-[#fcd535] transition-colors text-sm">
                      {category.name}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#fcd535]" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Sidebar Ad Space 1 - Square */}
            <div className="bg-[#181a20] rounded-lg overflow-hidden">
              <div className="p-2 border-b border-[#2b2f36]">
                <p className="text-gray-500 text-[10px] text-center uppercase tracking-wider">Kwamamaza</p>
                    </div>
              <div className="p-3">
                <div className="bg-[#0b0e11] rounded-lg border-2 border-dashed border-[#2b2f36] flex flex-col items-center justify-center aspect-square hover:border-[#fcd535]/50 transition-colors">
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">📢</span>
                    <p className="text-gray-400 text-xs font-medium">Square Ad</p>
                    <p className="text-[#fcd535] text-[10px] font-bold">300 x 300 px</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Liked in Sidebar */}
            <div className="bg-[#181a20] rounded-lg overflow-hidden">
              <div className="p-4 border-b border-[#2b2f36]">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-emerald-500" />
                  Ibyashimwe
                </h2>
              </div>
              
              <div className="divide-y divide-[#2b2f36]">
                {[...posts].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0)).slice(0, 5).map((post) => (
                  <Link key={post.id} to={`/post/${post.slug}`} className="flex gap-3 p-4 hover:bg-[#1e2329] transition-colors group">
                    <img 
                      src={getImageUrl(post.featuredImage)} 
                      alt={post.title}
                      className="w-16 h-16 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-300 text-sm group-hover:text-[#fcd535] transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Heart className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                        {post.likeCount || 0}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sidebar Ad Space 2 - Vertical */}
            <div className="bg-[#181a20] rounded-lg overflow-hidden">
              <div className="p-2 border-b border-[#2b2f36]">
                <p className="text-gray-500 text-[10px] text-center uppercase tracking-wider">Kwamamaza</p>
              </div>
              <div className="p-3">
                <div className="bg-[#0b0e11] rounded-lg border-2 border-dashed border-[#2b2f36] flex flex-col items-center justify-center h-[400px] hover:border-[#fcd535]/50 transition-colors">
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">🎯</span>
                    <p className="text-gray-400 text-xs font-medium">Skyscraper Ad</p>
                    <p className="text-[#fcd535] text-[10px] font-bold">300 x 600 px</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Amatangazo - Classifieds Section */}
        <div className="mt-6 bg-[#181a20] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#2b2f36] flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-[#fcd535] rounded"></span>
              Amatangazo
            </h2>
            <Link to="/amatangazo" className="text-[#fcd535] text-sm hover:underline flex items-center gap-1">
              Reba Yose <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
            {/* Cyamunara - Auctions */}
            <Link to="/amatangazo/cyamunara" className="group">
              <div className="bg-[#0b0e11] rounded-lg px-4 py-3 border border-[#2b2f36] hover:border-orange-500/50 hover:bg-[#1e2329] transition-all text-center">
                <h3 className="text-white font-semibold text-sm group-hover:text-orange-400 transition-colors">Cyamunara</h3>
              </div>
            </Link>

            {/* Akazi - Jobs */}
            <Link to="/amatangazo/akazi" className="group">
              <div className="bg-[#0b0e11] rounded-lg px-4 py-3 border border-[#2b2f36] hover:border-blue-500/50 hover:bg-[#1e2329] transition-all text-center">
                <h3 className="text-white font-semibold text-sm group-hover:text-blue-400 transition-colors">Akazi</h3>
              </div>
            </Link>

            {/* Guhinduza amakuru - Change Info */}
            <Link to="/amatangazo/guhinduza" className="group">
              <div className="bg-[#0b0e11] rounded-lg px-4 py-3 border border-[#2b2f36] hover:border-emerald-500/50 hover:bg-[#1e2329] transition-all text-center">
                <h3 className="text-white font-semibold text-sm group-hover:text-emerald-400 transition-colors">Guhinduza amakuru</h3>
              </div>
            </Link>

            {/* Andi matangazo - Others */}
            <Link to="/amatangazo/ibindi" className="group">
              <div className="bg-[#0b0e11] rounded-lg px-4 py-3 border border-[#2b2f36] hover:border-purple-500/50 hover:bg-[#1e2329] transition-all text-center">
                <h3 className="text-white font-semibold text-sm group-hover:text-purple-400 transition-colors">Andi matangazo</h3>
              </div>
            </Link>
          </div>

          {/* Recent Announcements Preview - Show latest posts */}
          <div className="border-t border-[#2b2f36] p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {posts.slice(0, 3).map((post, index) => (
                <Link 
                  key={post.id} 
                  to={`/post/${post.slug}`}
                  className={`p-3 bg-[#0b0e11] rounded-lg border border-[#2b2f36] hover:border-[#fcd535]/30 transition-colors ${index === 2 ? 'hidden lg:block' : ''}`}
                >
                  <p className="text-white text-sm font-medium line-clamp-1">{post.title}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {post.category?.name || 'Amakuru'} • {formatDate(post.publishedAt || post.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Full Width Leaderboard Ad */}
        <div className="mt-6 bg-[#181a20] rounded-lg overflow-hidden">
          <div className="p-2 border-b border-[#2b2f36]">
            <p className="text-gray-500 text-[10px] text-center uppercase tracking-wider">Kwamamaza</p>
          </div>
          <div className="p-4">
            <div className="bg-[#0b0e11] rounded-lg border-2 border-dashed border-[#2b2f36] flex flex-col items-center justify-center h-[120px] hover:border-[#fcd535]/50 transition-colors">
              <div className="text-center">
                <span className="text-3xl mb-2 block">📢</span>
                <p className="text-gray-400 text-sm font-medium">Leaderboard Banner</p>
                <p className="text-[#fcd535] text-xs font-bold">970 x 120 px</p>
              </div>
            </div>
          </div>
        </div>

        {/* More Articles Grid */}
        {posts.length > 12 && (
          <div className="mt-6 bg-[#181a20] rounded-lg overflow-hidden">
            <div className="p-4 border-b border-[#2b2f36]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-[#fcd535] rounded"></span>
                Andi Makuru
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
              {posts.slice(12, 20).map((post) => (
                <Link key={post.id} to={`/post/${post.slug}`} className="group">
                  <div className="relative rounded-lg overflow-hidden mb-2">
                    <img 
                      src={getImageUrl(post.featuredImage)} 
                      alt={post.title}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {post.category && (
                      <span className="absolute top-2 left-2 bg-[#fcd535] text-[#0b0e11] text-[10px] font-bold px-2 py-0.5 rounded">
                        {post.category.name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-white text-sm font-medium group-hover:text-[#fcd535] transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CSS for marquee animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Home;
