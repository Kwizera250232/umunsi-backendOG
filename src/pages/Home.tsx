import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, ChevronRight, Loader2, Heart, TrendingUp, Zap, AlertCircle, Mail, Calendar, MapPin, CloudSun, Send, ThumbsUp } from 'lucide-react';
import { apiClient, Post, Category, AdsBannersState } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const getServerBaseUrl = () => {
  if (import.meta.env.DEV) {
    return (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
  }
  return (import.meta.env.VITE_API_URL || '').replace('/api', '');
};

const Home = () => {
  const { user } = useAuth();
  // Ads should remain visible even for admin accounts so placements can be verified after updates.
  const showAds = true;
  const canSeeViews = user?.role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredPost, setFeaturedPost] = useState<Post | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [email, setEmail] = useState('');
  const [adsBanners, setAdsBanners] = useState<AdsBannersState | null>(null);

  useEffect(() => {
    fetchHomeData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadAdsBanners = async () => {
      try {
        const banners = await apiClient.getAdsBanners();
        setAdsBanners(banners);
      } catch (error) {
        console.error('Failed to load ads banners:', error);
      }
    };

    loadAdsBanners();
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

  const getBannerImageUrl = (url?: string) => {
    if (!url) return '';
    const upgradedUrl = url.includes('/thumbnails/') ? url.replace('/thumbnails/', '/images/') : url;
    if (upgradedUrl.startsWith('http://') || upgradedUrl.startsWith('https://') || upgradedUrl.startsWith('//')) return upgradedUrl;
    if (upgradedUrl.startsWith('/')) return `${getServerBaseUrl()}${upgradedUrl}`;
    return `${getServerBaseUrl()}/${upgradedUrl}`;
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

  const renderBannerSlot = (
    slotKey: keyof AdsBannersState['slots'],
    placeholderLabel: string,
    className: string
  ) => {
    const slot = adsBanners?.slots?.[slotKey];

    if (slot?.enabled && slot.imageUrl) {
      const bannerImage = (
        <img
          src={getBannerImageUrl(slot.imageUrl)}
          alt={slot.altText || slot.label}
          className="w-full h-full object-contain"
          style={{ imageRendering: 'auto' }}
          loading="lazy"
        />
      );

      return (
        <div className={className}>
          {slot.targetUrl ? (
            <a href={slot.targetUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
              {bannerImage}
            </a>
          ) : (
            bannerImage
          )}
        </div>
      );
    }

    return (
      <div className={`${className} bg-[#0b0e11] rounded-lg border-2 border-dashed border-[#2b2f36] flex flex-col items-center justify-center hover:border-[#fcd535]/50 transition-colors`}>
        <div className="text-center">
          <p className="text-gray-400 text-sm font-medium">Kwamamaza</p>
          <p className="text-[#fcd535] text-xs font-bold">{placeholderLabel}</p>
        </div>
      </div>
    );
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

  const mainHighlight = featuredPost || posts[0] || null;
  const topSectionPool = posts.filter((p) => p.id !== mainHighlight?.id);
  const leftPrimary = topSectionPool[0] || null;
  const leftSecondary = topSectionPool[1] || null;
  const middleTop = topSectionPool[2] || null;
  const middleBottom = topSectionPool[3] || null;
  const rightColumnPosts = topSectionPool.slice(4, 9);
  const otherPosts = posts.filter(p => p.id !== mainHighlight?.id);
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
        {/* First Section - Inkuru Nyamukuru */}
        <div className="mb-6 rounded-lg overflow-hidden border border-[#2b2f36] bg-[#181a20]">
          <div className="bg-emerald-700 text-white px-4 py-2">
            <h2 className="text-sm md:text-base font-extrabold uppercase tracking-wide">Inkuru Nyamukuru</h2>
          </div>

          <div className="p-3 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
            <div className="lg:col-span-3 space-y-3">
              {leftPrimary && (
                <Link to={`/post/${leftPrimary.slug}`} className="block group bg-[#0b0e11] rounded">
                  <img
                    src={getImageUrl(leftPrimary.featuredImage)}
                    alt={leftPrimary.title}
                    className="w-full h-44 object-cover"
                  />
                  <div className="p-2">
                    <h3 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-[#fcd535] transition-colors">
                      {leftPrimary.title}
                    </h3>
                  </div>
                </Link>
              )}

              {leftSecondary && (
                <Link to={`/post/${leftSecondary.slug}`} className="flex gap-2 bg-[#0b0e11] p-2 rounded group">
                  <img
                    src={getImageUrl(leftSecondary.featuredImage)}
                    alt={leftSecondary.title}
                    className="w-20 h-16 object-cover flex-shrink-0"
                  />
                  <h4 className="text-gray-300 text-sm line-clamp-2 group-hover:text-[#fcd535] transition-colors">
                    {leftSecondary.title}
                  </h4>
                </Link>
              )}

              {showAds && adsBanners?.slots?.adminSidebar240x320?.enabled && adsBanners.slots.adminSidebar240x320.imageUrl && (
                <div className="bg-[#0b0e11] rounded p-2 flex justify-center">
                  {renderBannerSlot('adminSidebar240x320', 'Home Left Banner', 'w-full max-w-[320px] aspect-[4/3] rounded-lg overflow-hidden bg-[#0b0e11]')}
                </div>
              )}

            </div>

            <div className="lg:col-span-6 space-y-3">
              {middleTop && (
                <Link to={`/post/${middleTop.slug}`} className="block bg-[#0b0e11] rounded p-2 group">
                  <h3 className="text-white font-semibold text-base line-clamp-2 group-hover:text-[#fcd535] transition-colors">
                    {middleTop.title}
                  </h3>
                </Link>
              )}

              {mainHighlight && (
                <Link to={`/post/${mainHighlight.slug}`} className="block group">
                  <div className="relative overflow-hidden bg-[#0b0e11] rounded">
                    <img
                      src={getImageUrl(mainHighlight.featuredImage)}
                      alt={mainHighlight.title}
                      className="w-full h-[260px] md:h-[340px] object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/45 px-3 py-3">
                      <h2 className="text-white text-lg md:text-2xl font-bold leading-tight line-clamp-2 group-hover:text-[#fcd535] transition-colors">
                        {mainHighlight.title}
                      </h2>
                    </div>
                  </div>
                </Link>
              )}

              {middleBottom && (
                <Link to={`/post/${middleBottom.slug}`} className="flex gap-2 bg-[#0b0e11] p-2 rounded group">
                  <img
                    src={getImageUrl(middleBottom.featuredImage)}
                    alt={middleBottom.title}
                    className="w-24 h-16 object-cover flex-shrink-0"
                  />
                  <h4 className="text-gray-300 text-sm line-clamp-2 group-hover:text-[#fcd535] transition-colors">
                    {middleBottom.title}
                  </h4>
                </Link>
              )}
            </div>

            <div className="lg:col-span-3 space-y-2">
              {rightColumnPosts.map((post) => (
                <Link key={post.id} to={`/post/${post.slug}`} className="flex gap-2 bg-[#0b0e11] p-2 rounded group">
                  <img
                    src={getImageUrl(post.featuredImage)}
                    alt={post.title}
                    className="w-24 h-16 object-cover flex-shrink-0"
                  />
                  <h4 className="text-gray-300 text-sm line-clamp-3 group-hover:text-[#fcd535] transition-colors">
                    {post.title}
                  </h4>
                </Link>
              ))}
            </div>
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

        {showAds && (
          <div className="mb-6 bg-[#181a20] rounded-lg overflow-hidden">
            <div className="p-2 border-b border-[#2b2f36]">
              <p className="text-gray-500 text-[10px] text-center uppercase tracking-wider">Kwamamaza</p>
            </div>
            <div className="p-4">
              {renderBannerSlot('leaderboardTop970x120', '970 x 120 px', 'aspect-[970/120] rounded-lg overflow-hidden bg-[#0b0e11]')}
            </div>
          </div>
        )}

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
                        {canSeeViews && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.viewCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {showAds && (
              <div className="bg-[#181a20] rounded-lg overflow-hidden">
                <div className="p-2 border-b border-[#2b2f36]">
                  <p className="text-gray-500 text-xs text-center uppercase tracking-wider">Kwamamaza</p>
                </div>
                <div className="p-4">
                  {renderBannerSlot('business728x250', "Ahantu h'Ubucuruzi - 728 x 250 px", 'aspect-[728/250] rounded-lg overflow-hidden bg-[#0b0e11]')}
                </div>
              </div>
            )}

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
                      {canSeeViews && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Eye className="w-3 h-3" />
                          {post.viewCount}
                        </div>
                      )}
                    </div>
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
                  {renderBannerSlot('sidebar300x250', '300 x 250 px', 'aspect-[300/250] rounded-lg overflow-hidden bg-[#0b0e11]')}
                </div>
              </div>
            )}

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

            {showAds && (
              <div className="bg-[#181a20] rounded-lg overflow-hidden">
                <div className="p-2 border-b border-[#2b2f36]">
                  <p className="text-gray-500 text-[10px] text-center uppercase tracking-wider">Kwamamaza</p>
                </div>
                <div className="p-3">
                  {renderBannerSlot('square300x300', '300 x 300 px', 'aspect-square rounded-lg overflow-hidden')}
                </div>
              </div>
            )}

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

            {showAds && (
              <div className="bg-[#181a20] rounded-lg overflow-hidden">
                <div className="p-2 border-b border-[#2b2f36]">
                  <p className="text-gray-500 text-[10px] text-center uppercase tracking-wider">Kwamamaza</p>
                </div>
                <div className="p-3">
                  {renderBannerSlot('skyscraper300x600', '300 x 600 px', 'aspect-[300/600] rounded-lg overflow-hidden bg-[#0b0e11]')}
                </div>
              </div>
            )}
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

        {showAds && (
          <div className="mt-6 bg-[#181a20] rounded-lg overflow-hidden">
            <div className="p-2 border-b border-[#2b2f36]">
              <p className="text-gray-500 text-[10px] text-center uppercase tracking-wider">Kwamamaza</p>
            </div>
            <div className="p-4">
              {renderBannerSlot('leaderboardBottom970x120', '970 x 120 px', 'aspect-[970/120] rounded-lg overflow-hidden bg-[#0b0e11]')}
            </div>
          </div>
        )}

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
