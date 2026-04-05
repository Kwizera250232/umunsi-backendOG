import { Search, Menu, X, Calendar, Thermometer, Bell, User, ChevronDown, TrendingUp, Loader2, MoreHorizontal, LogOut, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient, Category } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Fetch only active categories from database
      const response = await apiClient.getCategories({ includeInactive: false });
      if (response && Array.isArray(response)) {
        // Filter to ensure only active categories are shown
        const activeCategories = response.filter(cat => cat.isActive !== false);
        setCategories(activeCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Show first 7 categories in navbar, rest in dropdown
  const visibleCategories = categories.slice(0, 7);
  const moreCategories = categories.slice(7);

  return (
    <header className="bg-[#0b0e11] sticky top-0 z-50 border-b border-[#2b2f36]">
      {/* Top Bar - Breaking News / Trending */}
      <div className="bg-gradient-to-r from-[#181a20] via-[#1e2329] to-[#181a20] border-b border-[#2b2f36]">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              {/* Date & Weather */}
              <div className="flex items-center space-x-3 text-gray-400">
                <div className="flex items-center space-x-1.5">
                  <Calendar size={14} className="text-[#fcd535]" />
                  <span>{new Date().toLocaleDateString('rw-RW', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="h-3 w-px bg-[#2b2f36]"></div>
                <div className="flex items-center space-x-1.5">
                  <Thermometer size={14} className="text-[#fcd535]" />
                  <span>22°C Kigali</span>
                </div>
              </div>

              {/* Categories count indicator */}
              {!loading && categories.length > 0 && (
                <div className="hidden md:flex items-center space-x-2">
                  <div className="h-3 w-px bg-[#2b2f36]"></div>
                  <TrendingUp size={14} className="text-[#fcd535]" />
                  <span className="text-gray-400">{categories.length} Categories</span>
                </div>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              <Link 
                to="/newsletter" 
                className="flex items-center space-x-1.5 text-gray-400 hover:text-[#fcd535] transition-colors group"
              >
                <Bell size={14} className="group-hover:animate-bounce" />
                <span className="hidden sm:inline">Inyandiko</span>
              </Link>
              <div className="h-3 w-px bg-[#2b2f36]"></div>
              
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-[#1e2329] border border-[#2b2f36] rounded-lg hover:border-[#fcd535]/50 transition-all"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-[#fcd535] to-[#f0b90b] rounded-full flex items-center justify-center">
                      <span className="text-[#0b0e11] text-xs font-bold">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </span>
                    </div>
                    <span className="text-gray-300 text-xs hidden sm:inline">{user.firstName}</span>
                    <ChevronDown size={12} className="text-gray-500" />
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#181a20] border border-[#2b2f36] rounded-xl shadow-xl overflow-hidden z-50">
                      <div className="p-3 border-b border-[#2b2f36]">
                        <p className="text-white text-sm font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-gray-500 text-xs">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link 
                          to="/profile" 
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:bg-[#1e2329] hover:text-[#fcd535] transition-colors"
                        >
                          <User size={14} />
                          <span>Profile</span>
                        </Link>
                        {(user.role === 'ADMIN' || user.role === 'EDITOR') && (
                          <Link 
                            to="/admin" 
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:bg-[#1e2329] hover:text-[#fcd535] transition-colors"
                          >
                            <Settings size={14} />
                            <span>Admin Dashboard</span>
                          </Link>
                        )}
                        <button 
                          onClick={() => { logout(); setIsUserMenuOpen(false); navigate('/'); }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:bg-[#1e2329] hover:text-red-400 transition-colors"
                        >
                          <LogOut size={14} />
                          <span>Gusohoka</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-semibold rounded-lg hover:from-[#f0b90b] hover:to-[#fcd535] transition-all transform hover:scale-105"
                >
                  <User size={14} />
                  <span>Kwinjira</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#fcd535]/20 to-[#f0b90b]/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <img src="/images/logo.png" alt="Umunsi Logo" className="h-10 md:h-12 relative" />
            </div>
          </Link>

          {/* Desktop Navigation - All active categories from database */}
          <nav className="hidden lg:flex items-center space-x-1">
            {loading ? (
              <div className="flex items-center space-x-2 px-4 py-2 text-gray-400">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading categories...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="px-4 py-2 text-gray-500 text-sm">No categories available</div>
            ) : (
              <>
                {/* Visible categories */}
                {visibleCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className="group relative px-3 py-2 text-gray-300 hover:text-white font-medium transition-all duration-200 rounded-lg hover:bg-[#1e2329]"
                  >
                    <span className="text-sm">{cat.name}</span>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] group-hover:w-3/4 transition-all duration-300 rounded-full"></div>
                  </Link>
                ))}

                {/* More dropdown for additional categories */}
                {moreCategories.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setIsMoreOpen(!isMoreOpen)}
                      className="group relative px-3 py-2 text-gray-300 hover:text-white font-medium transition-all duration-200 rounded-lg hover:bg-[#1e2329] flex items-center space-x-1.5"
                    >
                      <MoreHorizontal size={16} className="opacity-70 group-hover:opacity-100" />
                      <span className="text-sm">More</span>
                      <span className="bg-[#fcd535] text-[#0b0e11] text-xs px-1.5 rounded-full font-bold">{moreCategories.length}</span>
                    </button>

                    {isMoreOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-[#181a20] shadow-2xl rounded-xl border border-[#2b2f36] py-2 z-50">
                        {moreCategories.map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/category/${cat.slug}`}
                            onClick={() => setIsMoreOpen(false)}
                            className="block px-4 py-2.5 text-gray-300 hover:bg-[#1e2329] hover:text-[#fcd535] transition-colors text-sm"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </nav>

          {/* Right Side - Search & Mobile Menu */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2.5 text-gray-400 hover:text-[#fcd535] transition-colors hover:bg-[#1e2329] rounded-lg"
              >
                <Search size={20} />
              </button>

              {/* Search Dropdown */}
              {isSearchOpen && (
                <div className="absolute right-0 top-full mt-2 w-screen max-w-xs md:max-w-md bg-[#181a20] shadow-2xl rounded-xl border border-[#2b2f36] p-4 z-50">
                  <form onSubmit={handleSearch}>
                    <div className="flex items-center space-x-3 bg-[#1e2329] rounded-lg p-3 border border-[#2b2f36] focus-within:border-[#fcd535]/50 transition-colors">
                      <Search size={18} className="text-gray-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Shakisha amakuru..."
                        className="flex-1 outline-none text-sm bg-transparent text-white placeholder-gray-500"
                        autoFocus
                      />
                      <button 
                        type="submit"
                        className="bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] px-4 py-2 rounded-lg text-sm font-semibold hover:from-[#f0b90b] hover:to-[#fcd535] transition-all transform hover:scale-105"
                      >
                        Shakisha
                      </button>
                    </div>
                  </form>
                  {/* All Categories in search dropdown */}
                  {categories.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">All Categories ({categories.length})</p>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {categories.map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/category/${cat.slug}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="px-2 py-1 bg-[#1e2329] text-gray-400 text-xs rounded-lg hover:bg-[#2b2f36] hover:text-[#fcd535] cursor-pointer transition-all"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2.5 text-gray-400 hover:text-[#fcd535] transition-colors hover:bg-[#1e2329] rounded-lg"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer - All active categories from database */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4">
            <nav className="space-y-1 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-4 text-gray-400">
                  <Loader2 size={20} className="animate-spin mr-2" />
                  <span>Loading categories...</span>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No categories available</div>
              ) : (
                <>
                  <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">
                    All Categories ({categories.length})
                  </div>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#1e2329] hover:text-white transition-colors font-medium rounded-xl group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>{cat.name}</span>
                      <ChevronDown size={16} className="ml-auto text-gray-500 group-hover:text-[#fcd535] transform -rotate-90" />
                    </Link>
                  ))}
                </>
              )}
            </nav>
            
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mt-4 px-4">
              <div className="flex items-center space-x-3 bg-[#1e2329] rounded-xl p-3 border border-[#2b2f36]">
                <Search size={18} className="text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Shakisha amakuru..."
                  className="flex-1 outline-none text-sm bg-transparent text-white placeholder-gray-500"
                />
                <button 
                  type="submit"
                  className="bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] px-3 py-1.5 rounded-lg text-sm font-semibold"
                >
                  Go
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(isMoreOpen || isSearchOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsMoreOpen(false);
            setIsSearchOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;
