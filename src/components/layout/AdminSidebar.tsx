import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api';
import { 
  LayoutDashboard, 
  FileText, 
  Users as UsersIcon, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  X,
  User,
  Home,
  FolderOpen,
  Activity,
  Image,
  Sparkles,
  Star,
  TrendingUp,
  Shield,
  Database,
  Cloud,
  Globe,
  Bell,
  Search,
  Plus,
  Eye,
  Clock,
  BookOpen,
  Layers,
  PieChart,
  Target,
  Award,
  Zap,
  Crown,
  Menu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardStats } from '../../hooks/useDashboardStats';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  color?: string;
  description?: string;
  isPremium?: boolean;
  category?: string;
  subItems?: SidebarItem[];
  adminOnly?: boolean;
}

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  user?: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
  } | null;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isCollapsed, onToggleCollapse, user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { stats, loading: statsLoading } = useDashboardStats();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdownData, setBreakdownData] = useState<{title: string, data: { label: string; count: number; color: string }[]} | null>(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['Posts', 'Media', 'User Management']));
  const [dbCounts, setDbCounts] = useState({
    posts: 0,
    media: 0,
    users: 0,
    categories: 0
  });
  const [countsLoading, setCountsLoading] = useState(true);

  // Fetch database counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setCountsLoading(true);
        const [postsStats, mediaStats, usersStats, categoriesStats] = await Promise.all([
          apiClient.getPostStats().catch(() => ({ totalPosts: 0 })),
          apiClient.getMediaStats().catch(() => ({ totalMedia: 0 })),
          apiClient.getUsers().catch(() => ({ data: [], pagination: { total: 0 } })),
          apiClient.getCategories().catch(() => [])
        ]);

        setDbCounts({
          posts: postsStats.totalPosts || 0,
          media: mediaStats.totalMedia || 0,
          users: usersStats.pagination?.total || 0,
          categories: categoriesStats.length || 0
        });
      } catch (error) {
        console.error('Error fetching database counts:', error);
      } finally {
        setCountsLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const sidebarItems: SidebarItem[] = [
    // Main Dashboard
    { 
      name: 'Dashboard', 
      path: '/admin', 
      icon: LayoutDashboard, 
      category: 'main',
      color: 'from-[#fcd535] to-[#f0b90b]'
    },
    
    // Posts Management
    { 
      name: 'Posts', 
      path: '/admin/posts', 
      icon: FileText, 
      badge: countsLoading ? '...' : dbCounts.posts,
      category: 'content',
      color: 'from-blue-500 to-blue-600',
      subItems: [
        {
          name: 'All Posts',
          path: '/admin/posts',
          icon: FileText,
          badge: countsLoading ? '...' : dbCounts.posts,
      color: 'from-blue-500 to-blue-600'
    },
    { 
          name: 'Add New',
          path: '/admin/posts/add',
          icon: Plus,
          color: 'from-emerald-500 to-emerald-600'
        }
      ]
    },
    { 
      name: 'Categories', 
      path: '/admin/categories', 
      icon: FolderOpen, 
      badge: countsLoading ? '...' : dbCounts.categories,
      category: 'content',
      color: 'from-purple-500 to-purple-600'
    },
    
    // Media Management
    { 
      name: 'Media', 
      path: '/admin/media', 
      icon: Image, 
      badge: countsLoading ? '...' : dbCounts.media,
      category: 'media',
      color: 'from-orange-500 to-orange-600',
      subItems: [
        {
          name: 'Library',
          path: '/admin/media/library',
          icon: Database,
          badge: countsLoading ? '...' : dbCounts.media,
          color: 'from-orange-500 to-orange-600'
        },
        {
          name: 'Upload',
          path: '/admin/media/add',
          icon: Plus,
          color: 'from-emerald-500 to-emerald-600'
        }
      ]
    },
    
    // User Management
    { 
      name: 'User Management', 
      path: '/admin/users', 
      icon: UsersIcon, 
      badge: countsLoading ? '...' : dbCounts.users,
      category: 'users',
      color: 'from-cyan-500 to-cyan-600',
      subItems: [
        {
          name: 'All Users',
          path: '/admin/users',
          icon: UsersIcon,
          badge: countsLoading ? '...' : dbCounts.users,
          color: 'from-cyan-500 to-cyan-600'
        },
    { 
          name: 'Roles',
      path: '/admin/roles', 
      icon: Shield, 
          color: 'from-rose-500 to-rose-600',
          adminOnly: true
        }
      ]
    },
    
    // Analytics & Insights
    { 
      name: 'Analytics', 
      path: '/admin/analytics', 
      icon: BarChart3, 
      category: 'analytics',
      color: 'from-violet-500 to-violet-600',
      subItems: [
        {
          name: 'Overview',
          path: '/admin/analytics',
          icon: BarChart3,
          color: 'from-violet-500 to-violet-600'
    },
    { 
      name: 'Reports', 
      path: '/admin/reports', 
      icon: PieChart, 
          color: 'from-pink-500 to-pink-600'
    },
    { 
      name: 'Performance', 
      path: '/admin/performance', 
      icon: Target, 
          color: 'from-amber-500 to-amber-600'
        }
      ]
    },
    
    // System & Tools (Admin Only)
    { 
      name: 'Settings', 
      path: '/admin/settings', 
      icon: Settings, 
      category: 'system',
      color: 'from-gray-500 to-gray-600',
      adminOnly: true,
      subItems: [
        {
          name: 'General',
          path: '/admin/settings',
          icon: Settings,
          color: 'from-gray-500 to-gray-600'
    },
    { 
      name: 'Security', 
      path: '/admin/security', 
          icon: Shield, 
          color: 'from-red-500 to-red-600'
    },
    { 
      name: 'Backup', 
      path: '/admin/backup', 
      icon: Cloud, 
          color: 'from-sky-500 to-sky-600'
    },
    { 
      name: 'Logs', 
      path: '/admin/logs', 
      icon: Activity, 
          color: 'from-emerald-500 to-emerald-600'
        }
      ]
    }
  ];

  // Filter out admin-only items for non-admin users
  const isAdmin = user?.role === 'ADMIN';
  const filteredSidebarItems = sidebarItems.filter(item => !item.adminOnly || isAdmin);

  const getCategoryItems = (category: string) => {
    return filteredSidebarItems.filter(item => item.category === category);
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleExpanded = (itemName: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedItems(newExpanded);
  };

  const handleBadgeClick = async (item: SidebarItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setBreakdownLoading(true);
    setShowBreakdown(true);
    
    try {
      if (item.name === 'Categories') {
        const categoriesResponse = await apiClient.getCategories();
        const categories = categoriesResponse || [];
        const activeCategories = categories.filter(cat => cat.isActive !== false).length;
        const categoriesWithArticles = categories.filter(cat => (cat._count?.news || 0) > 0).length;
        
        setBreakdownData({
          title: 'Categories Breakdown',
          data: [
            { label: 'Active Categories', count: activeCategories, color: 'emerald' },
            { label: 'Total Categories', count: stats.totalCategories, color: 'blue' },
            { label: 'With Articles', count: categoriesWithArticles, color: 'purple' },
            { label: 'Inactive', count: stats.totalCategories - activeCategories, color: 'red' }
          ]
        });
      } else if (item.name === 'All Posts' || item.name === 'Posts') {
        const articlesResponse = await apiClient.getArticles({ page: 1, limit: 1000 });
        const articles = articlesResponse?.data || [];
        
        const publishedArticles = articles.filter(article => article.status === 'PUBLISHED').length;
        const draftArticles = articles.filter(article => article.status === 'DRAFT').length;
        const pendingArticles = articles.filter(article => article.status === 'PENDING').length;
        
        setBreakdownData({
          title: 'Posts Breakdown',
          data: [
            { label: 'Total Posts', count: stats.totalArticles, color: 'blue' },
            { label: 'Published', count: publishedArticles, color: 'emerald' },
            { label: 'Draft', count: draftArticles, color: 'amber' },
            { label: 'Pending', count: pendingArticles, color: 'orange' }
          ]
        });
      } else if (item.name === 'User Management' || item.name === 'All Users') {
        const usersResponse = await apiClient.getUsers({ page: 1, limit: 1000 });
        const users = usersResponse?.data || [];
        
        const adminUsers = users.filter(user => user.role === 'ADMIN').length;
        const authorUsers = users.filter(user => user.role === 'AUTHOR').length;
        const regularUsers = users.filter(user => user.role === 'USER').length;
        
        setBreakdownData({
          title: 'Users Breakdown',
          data: [
            { label: 'Total Users', count: stats.totalUsers, color: 'blue' },
            { label: 'Admins', count: adminUsers, color: 'amber' },
            { label: 'Authors', count: authorUsers, color: 'purple' },
            { label: 'Users', count: regularUsers, color: 'gray' }
          ]
        });
      } else if (item.name === 'Media' || item.name === 'Library') {
        setBreakdownData({
          title: 'Media Breakdown',
          data: [
            { label: 'Total Files', count: stats.totalMedia || 0, color: 'blue' },
            { label: 'Images', count: Math.floor((stats.totalMedia || 0) * 0.7), color: 'emerald' },
            { label: 'Videos', count: Math.floor((stats.totalMedia || 0) * 0.2), color: 'purple' },
            { label: 'Documents', count: Math.floor((stats.totalMedia || 0) * 0.1), color: 'orange' }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching breakdown data:', error);
        setBreakdownData({
        title: 'Error',
        data: [{ label: 'Unable to load data', count: 0, color: 'red' }]
        });
    } finally {
      setBreakdownLoading(false);
    }
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      emerald: 'bg-emerald-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      red: 'bg-red-500',
      amber: 'bg-amber-500',
      orange: 'bg-orange-500',
      gray: 'bg-gray-500',
      cyan: 'bg-cyan-500'
    };
    return colors[color] || colors.blue;
  };

  const categories = [
    { key: 'main', label: 'Main' },
    { key: 'content', label: 'Content' },
    { key: 'media', label: 'Media' },
    { key: 'users', label: 'Users' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'system', label: 'System' }
  ];

  const getRoleIcon = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return <Crown className="w-3 h-3 text-amber-400" />;
      case 'EDITOR':
        return <Shield className="w-3 h-3 text-blue-400" />;
      case 'AUTHOR':
        return <BookOpen className="w-3 h-3 text-purple-400" />;
      default:
        return <User className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <>
      <div className={`h-full bg-[#0b0e11] text-gray-300 transition-all duration-300 ease-in-out border-r border-[#2b2f36] flex flex-col ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-[#2b2f36]">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] rounded-xl blur opacity-30"></div>
                  <div className="relative bg-[#fcd535] p-2 rounded-xl">
                    <Layers className="w-5 h-5 text-[#0b0e11]" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Umunsi</h1>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              </div>
            )}
            
            {isCollapsed && (
              <div className="mx-auto">
                <div className="bg-[#fcd535] p-2 rounded-xl">
                  <Layers className="w-5 h-5 text-[#0b0e11]" />
                </div>
              </div>
            )}
            
            <button
              onClick={() => onToggleCollapse(!isCollapsed)}
              className={`p-2 rounded-lg hover:bg-[#1e2329] transition-colors text-gray-400 hover:text-white ${isCollapsed ? 'mx-auto mt-3' : ''}`}
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#1e2329] border border-[#2b2f36] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#fcd535]/50 transition-all"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2b2f36] scrollbar-track-transparent">
          {categories.map((category, catIndex) => {
            const categoryItems = getCategoryItems(category.key);
            if (categoryItems.length === 0) return null;
            
            return (
              <div key={category.key} className={catIndex > 0 ? 'mt-6' : ''}>
                {!isCollapsed && (
                  <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                    {category.label}
                  </h3>
                )}
                
                <div className="space-y-1">
                  {categoryItems.map((item) => {
                    const Icon = item.icon;
                    const isItemActive = isActive(item.path);
                    const filteredSubItems = item.subItems?.filter(sub => !sub.adminOnly || isAdmin) || [];
                    const hasSubItems = filteredSubItems.length > 0;
                    const isExpanded = expandedItems.has(item.name);
                    
                    return (
                      <div key={item.path}>
                        {/* Main Item */}
                        <div
                        className={`
                            group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 relative cursor-pointer
                            ${isItemActive && !hasSubItems
                              ? 'bg-[#1e2329] text-[#fcd535]' 
                              : 'text-gray-400 hover:bg-[#1e2329] hover:text-white'
                          }
                        `}
                          onClick={() => {
                            if (hasSubItems) {
                              toggleExpanded(item.name);
                            } else {
                              navigate(item.path);
                            }
                          }}
                      >
                        {/* Active indicator */}
                          {isItemActive && !hasSubItems && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#fcd535] rounded-r-full" />
                        )}
                        
                          {/* Icon */}
                          <div className={`p-2 rounded-lg transition-all duration-200 ${
                            isItemActive && !hasSubItems
                              ? 'bg-[#fcd535]/10 text-[#fcd535]' 
                              : 'bg-[#2b2f36]/50 text-gray-400 group-hover:bg-[#2b2f36] group-hover:text-white'
                        }`}>
                            <Icon className="w-4 h-4" />
                        </div>
                        
                        {!isCollapsed && (
                          <div className="ml-3 flex-1 flex items-center justify-between">
                              <span className="text-sm font-medium">{item.name}</span>
                            <div className="flex items-center space-x-2">
                                {item.badge && !hasSubItems && (
                                <button
                                  onClick={(e) => handleBadgeClick(item, e)}
                                    className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all ${
                                    isItemActive 
                                        ? 'bg-[#fcd535]/20 text-[#fcd535]' 
                                        : 'bg-[#2b2f36] text-gray-400 hover:bg-[#363a45]'
                                  }`}
                                >
                                  {item.badge}
                                </button>
                              )}
                                {hasSubItems && (
                                  <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                      <ChevronDown className="w-4 h-4 text-gray-500" />
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                        </div>

                        {/* Sub Items */}
                        {hasSubItems && isExpanded && !isCollapsed && (
                          <div className="ml-4 mt-1 space-y-1 pl-4 border-l border-[#2b2f36]">
                            {item.subItems!.filter(sub => !sub.adminOnly || isAdmin).map((subItem) => {
                              const SubIcon = subItem.icon;
                              const isSubItemActive = location.pathname === subItem.path;
                              
                              return (
                                <Link
                                  key={subItem.path}
                                  to={subItem.path}
                                  className={`
                                    group flex items-center px-3 py-2 rounded-lg transition-all duration-200 relative
                                    ${isSubItemActive 
                                      ? 'bg-[#1e2329] text-[#fcd535]' 
                                      : 'text-gray-500 hover:bg-[#1e2329] hover:text-white'
                                    }
                                  `}
                                >
                                  {isSubItemActive && (
                                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#fcd535] rounded-r-full" />
                                  )}
                                  
                                  <SubIcon className={`w-3.5 h-3.5 transition-all ${
                                    isSubItemActive ? 'text-[#fcd535]' : 'text-gray-500 group-hover:text-white'
                                    }`} />
                                  
                                  <span className="ml-3 text-xs font-medium">{subItem.name}</span>
                                  
                                    {subItem.badge && (
                                    <span className={`ml-auto px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                                        isSubItemActive 
                                        ? 'bg-[#fcd535]/20 text-[#fcd535]' 
                                        : 'bg-[#2b2f36] text-gray-500'
                                      }`}>
                                        {subItem.badge}
                                      </span>
                                    )}
                      </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-[#2b2f36] bg-[#0b0e11]">
          {!isCollapsed && user && (
            <div className="mb-4 p-3 bg-[#1e2329] rounded-xl border border-[#2b2f36]">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#fcd535] to-[#f0b90b] rounded-xl flex items-center justify-center">
                    <span className="text-sm font-bold text-[#0b0e11]">
                      {user?.firstName?.[0] || 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1e2329]"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <div className="flex items-center space-x-1">
                    {getRoleIcon(user?.role || '')}
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-1">
            <Link
              to="/"
              className={`flex items-center px-3 py-2.5 text-gray-400 hover:bg-[#1e2329] hover:text-white rounded-xl transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="p-2 bg-[#2b2f36]/50 rounded-lg">
                <Home className="w-4 h-4" />
              </div>
              {!isCollapsed && <span className="ml-3 text-sm font-medium">View Site</span>}
            </Link>
            
            <button
              onClick={handleLogout}
              className={`w-full flex items-center px-3 py-2.5 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="p-2 bg-[#2b2f36]/50 rounded-lg group-hover:bg-red-500/10">
                <LogOut className="w-4 h-4" />
              </div>
              {!isCollapsed && <span className="ml-3 text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Category Breakdown Modal */}
      {showBreakdown && breakdownData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#181a20] rounded-2xl shadow-2xl w-full max-w-md border border-[#2b2f36] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#2b2f36]">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#fcd535]/10 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-[#fcd535]" />
                </div>
                <h2 className="text-lg font-bold text-white">{breakdownData.title}</h2>
              </div>
              <button
                onClick={() => setShowBreakdown(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#2b2f36] rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Breakdown Data */}
            <div className="p-6">
              {breakdownLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="w-10 h-10 border-2 border-[#fcd535]/20 border-t-[#fcd535] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400 text-sm">Loading data...</p>
                  </div>
                </div>
              ) : breakdownData && breakdownData.data.length > 0 ? (
                <div className="space-y-3">
                  {breakdownData.data.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-[#1e2329] rounded-xl border border-[#2b2f36]">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-8 rounded-full ${getColorClass(item.color)}`}></div>
                        <span className="text-sm font-medium text-gray-300">{item.label}</span>
                      </div>
                      <span className="text-xl font-bold text-white">{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No data available</p>
                </div>
              )}
              
              {/* Close Button */}
              <div className="mt-6">
                <button
                  onClick={() => setShowBreakdown(false)}
                  className="w-full px-4 py-3 bg-[#fcd535] text-[#0b0e11] font-semibold rounded-xl hover:bg-[#f0b90b] transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
