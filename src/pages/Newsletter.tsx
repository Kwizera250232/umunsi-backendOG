import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, CheckCircle, Bell, Newspaper, TrendingUp, Clock, Eye, ChevronRight } from 'lucide-react';
import { apiClient, Post, Category } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const getServerBaseUrl = () => {
  if (import.meta.env.DEV) {
    return (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
  }
  return (import.meta.env.VITE_API_URL || '').replace('/api', '');
};

const Newsletter = () => {
  const { user } = useAuth();
  const showAds = user?.role !== 'ADMIN';
  const canSeeViews = user?.role === 'ADMIN';

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const postsResponse = await apiClient.getPosts({ status: 'PUBLISHED', limit: 10 });
      if (postsResponse?.data) {
        setPosts(postsResponse.data);
      }
      const categoriesResponse = await apiClient.getCategories({ includeInactive: false });
      if (categoriesResponse) {
        setCategories(categoriesResponse);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSubscribed(true);
    setLoading(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Ubu';
    const date = new Date(dateString);
    return date.toLocaleDateString('rw-RW', { month: 'short', day: 'numeric' });
  };

  const getImageUrl = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&h=300&fit=crop';
    if (url.startsWith('http')) return url;
    return `${getServerBaseUrl()}${url}`;
  };

  const trendingPosts = [...posts].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#0b0e11]">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#181a20] via-[#1e2329] to-[#181a20] border-b border-[#2b2f36]">
        <div className="max-w-7xl mx-auto px-3 py-8">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link to="/" className="hover:text-[#fcd535] transition-colors">Ahabanza</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#fcd535]">Kumenyekanisha</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#fcd535] to-[#f0b90b] flex items-center justify-center">
              <Mail className="w-6 h-6 text-[#0b0e11]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Kumenyekanisha ibikorwa byawe</h1>
              <p className="text-gray-400">Tangaza ubucuruzi bwawe kuri Umunsi</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 py-6">
        {showAds && (
          <div className="mb-6 bg-[#181a20] rounded-lg overflow-hidden">
            <div className="p-2 border-b border-[#2b2f36]">
              <p className="text-gray-500 text-[10px] text-center uppercase tracking-wider">Kwamamaza</p>
            </div>
            <div className="p-4">
              <div className="bg-[#0b0e11] rounded-lg border-2 border-dashed border-[#2b2f36] flex flex-col items-center justify-center h-[100px] hover:border-[#fcd535]/50 transition-colors">
                <p className="text-gray-400 text-sm font-medium">Leaderboard Banner</p>
                <p className="text-[#fcd535] text-xs font-bold">970 x 90 px</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Advertising Request Form */}
            <div className="bg-[#181a20] rounded-lg overflow-hidden border border-[#2b2f36]">
              <div className="p-6 md:p-8">
                {!subscribed ? (
                  <>
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#fcd535]/20 to-[#f0b90b]/20 flex items-center justify-center">
                        <Newspaper className="w-10 h-10 text-[#fcd535]" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">Kumenyekanisha ibikorwa byawe</h2>
                      <p className="text-gray-400 max-w-md mx-auto">
                        Tangaza ubucuruzi bwawe ku rubuga rwacu. Tugera ku bantu benshi buri munsi!
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Izina ry'ikigo cyawe</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Andika izina ry'ikigo"
                          className="w-full px-4 py-3 bg-[#0b0e11] border border-[#2b2f36] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fcd535]/50 transition-colors"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Email yawe</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@example.com"
                          className="w-full px-4 py-3 bg-[#0b0e11] border border-[#2b2f36] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fcd535]/50 transition-colors"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Telefone</label>
                        <input
                          type="tel"
                          placeholder="+250 7XX XXX XXX"
                          className="w-full px-4 py-3 bg-[#0b0e11] border border-[#2b2f36] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fcd535]/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Ubutumwa</label>
                        <textarea
                          placeholder="Andika ubutumwa bwawe..."
                          rows={3}
                          className="w-full px-4 py-3 bg-[#0b0e11] border border-[#2b2f36] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fcd535]/50 transition-colors resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-bold rounded-lg hover:from-[#f0b90b] hover:to-[#fcd535] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-[#0b0e11]/30 border-t-[#0b0e11] rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Ohereza
                          </>
                        )}
                      </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-[#2b2f36]">
                      <p className="text-center text-gray-500 text-sm mb-4">Impamvu yo gutangaza natwe:</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-[#0b0e11] rounded-lg">
                          <Eye className="w-5 h-5 text-[#fcd535]" />
                          <span className="text-gray-300 text-sm">Abantu 10,000+</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-[#0b0e11] rounded-lg">
                          <TrendingUp className="w-5 h-5 text-emerald-500" />
                          <span className="text-gray-300 text-sm">Ibiciro byiza</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-[#0b0e11] rounded-lg">
                          <Bell className="w-5 h-5 text-blue-500" />
                          <span className="text-gray-300 text-sm">Serivisi nziza</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Murakoze!</h2>
                    <p className="text-gray-400 mb-6">
                      Twabonye ubutumwa bwawe. Tuzagusubiza vuba.
                    </p>
                    <Link
                      to="/"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#fcd535] text-[#0b0e11] font-bold rounded-lg hover:bg-[#f0b90b] transition-all"
                    >
                      Subira Ahabanza
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {showAds && (
              <div className="bg-[#181a20] rounded-lg overflow-hidden">
                <div className="p-2 border-b border-[#2b2f36]">
                  <p className="text-gray-500 text-[10px] text-center uppercase tracking-wider">Kwamamaza</p>
                </div>
                <div className="p-4">
                  <div className="bg-[#0b0e11] rounded-lg border-2 border-dashed border-[#2b2f36] flex flex-col items-center justify-center h-[250px] hover:border-[#fcd535]/50 transition-colors">
                    <p className="text-gray-400 text-sm font-medium">Large Rectangle</p>
                    <p className="text-[#fcd535] text-xs font-bold">336 x 280 px</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Articles */}
            <div className="bg-[#181a20] rounded-lg overflow-hidden">
              <div className="p-4 border-b border-[#2b2f36]">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-1 h-6 bg-[#fcd535] rounded"></span>
                  Amakuru Mashya
                </h2>
              </div>
              
              <div className="divide-y divide-[#2b2f36]">
                {posts.slice(0, 5).map((post) => (
                  <Link key={post.id} to={`/post/${post.slug}`} className="flex gap-4 p-4 hover:bg-[#1e2329] transition-colors group">
                    <img 
                      src={getImageUrl(post.featuredImage)} 
                      alt={post.title}
                      className="w-24 h-18 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold group-hover:text-[#fcd535] transition-colors line-clamp-2 text-sm">
                        {post.title}
                      </h3>
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
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {showAds && (
              <div className="bg-[#181a20] rounded-lg overflow-hidden">
                <div className="p-2 border-b border-[#2b2f36]">
                  <p className="text-gray-500 text-[10px] text-center uppercase tracking-wider">Kwamamaza</p>
                </div>
                <div className="p-3">
                  <div className="bg-[#0b0e11] rounded-lg border-2 border-dashed border-[#2b2f36] flex flex-col items-center justify-center h-[250px] hover:border-[#fcd535]/50 transition-colors">
                    <p className="text-gray-400 text-xs font-medium">Medium Rectangle</p>
                    <p className="text-[#fcd535] text-[10px] font-bold">300 x 250 px</p>
                  </div>
                </div>
              </div>
            )}

            {/* Trending */}
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
                    <span className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      index < 3 ? 'bg-[#fcd535] text-[#0b0e11]' : 'bg-[#2b2f36] text-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                    <h3 className="text-gray-300 text-sm group-hover:text-[#fcd535] transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-[#181a20] rounded-lg overflow-hidden">
              <div className="p-4 border-b border-[#2b2f36]">
                <h2 className="text-lg font-bold text-white">Ibyiciro</h2>
              </div>
              
              <div className="p-2">
                {categories.slice(0, 6).map((cat) => (
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

            {showAds && (
              <div className="bg-[#181a20] rounded-lg overflow-hidden">
                <div className="p-2 border-b border-[#2b2f36]">
                  <p className="text-gray-500 text-[10px] text-center uppercase tracking-wider">Kwamamaza</p>
                </div>
                <div className="p-3">
                  <div className="bg-[#0b0e11] rounded-lg border-2 border-dashed border-[#2b2f36] flex flex-col items-center justify-center h-[400px] hover:border-[#fcd535]/50 transition-colors">
                    <p className="text-gray-400 text-xs font-medium">Skyscraper</p>
                    <p className="text-[#fcd535] text-[10px] font-bold">160 x 600 px</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showAds && (
          <div className="mt-6 bg-[#181a20] rounded-lg overflow-hidden">
            <div className="p-2 border-b border-[#2b2f36]">
              <p className="text-gray-500 text-[10px] text-center uppercase tracking-wider">Kwamamaza</p>
            </div>
            <div className="p-4">
              <div className="bg-[#0b0e11] rounded-lg border-2 border-dashed border-[#2b2f36] flex flex-col items-center justify-center h-[120px] hover:border-[#fcd535]/50 transition-colors">
                <p className="text-gray-400 text-sm font-medium">Leaderboard Banner</p>
                <p className="text-[#fcd535] text-xs font-bold">970 x 120 px</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Newsletter;

