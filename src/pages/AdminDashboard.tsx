import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Eye, 
  Heart, 
  MessageSquare, 
  Calendar,
  Star,
  Zap,
  BarChart3,
  Activity,
  Plus,
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  ChevronRight,
  Flame,
  Sparkles,
  Layers,
  BookOpen,
  Crown,
  Shield,
  MoreHorizontal
} from 'lucide-react';
import { apiClient } from '../services/api';

interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalCategories: number;
  totalComments: number;
  totalViews: number;
  totalLikes: number;
}

interface RecentPost {
  id: string;
  title: string;
  author: string;
  views: number;
  likes: number;
  comments: number;
  status: string;
  publishedAt: string;
}

interface RecentUser {
  id: string;
  username: string;
  email: string;
  role: string;
  lastActive: string;
  status: string;
}

interface SystemStatus {
  database: string;
  server: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalCategories: 0,
    totalComments: 0,
    totalViews: 0,
    totalLikes: 0
  });

  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);

  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'checking',
    server: 'checking'
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats and posts/users in parallel
      const [dashboardResponse, postsResponse, usersResponse] = await Promise.all([
        apiClient.getDashboardStats().catch(() => null),
        apiClient.getPosts({ limit: 5 }).catch(() => null),
        apiClient.getUsers({ limit: 5 }).catch(() => null)
      ]);
      
      // Set stats from dashboard response or calculate from direct API responses
      const totalPostsFromResponse = postsResponse?.pagination?.total || postsResponse?.data?.length || 0;
      const totalUsersFromResponse = usersResponse?.pagination?.total || usersResponse?.users?.length || 0;
      
        setStats({
        totalUsers: dashboardResponse?.totalUsers || totalUsersFromResponse,
        totalPosts: dashboardResponse?.totalArticles || dashboardResponse?.totalPosts || totalPostsFromResponse,
        totalCategories: dashboardResponse?.totalCategories || 0,
        totalComments: dashboardResponse?.totalComments || 0,
        totalViews: dashboardResponse?.totalViews || 0,
        totalLikes: dashboardResponse?.totalLikes || 0
      });

      // Get posts from dashboard response OR direct posts API
      let postsData = dashboardResponse?.recentArticles || [];
      if (postsData.length === 0 && postsResponse?.data) {
        postsData = postsResponse.data;
      }
      
      if (postsData.length > 0) {
        const formattedPosts = postsData.map((post: any) => ({
          id: post.id,
          title: post.title,
          author: post.author 
            ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || post.author.username || 'Unknown'
            : 'Unknown Author',
          views: post.viewCount || 0,
          likes: post.likeCount || 0,
          comments: post.commentCount || post._count?.comments || 0,
          status: post.status?.toLowerCase() || 'draft',
          publishedAt: post.publishedAt || post.createdAt || new Date().toISOString()
        }));
        setRecentPosts(formattedPosts);
      }

      // Get users from dashboard response OR direct users API
      let usersData = dashboardResponse?.recentUsers || [];
      if (usersData.length === 0 && usersResponse?.users) {
        usersData = usersResponse.users;
      }
      
      if (usersData.length > 0) {
        const formattedUsers = usersData.map((user: any) => ({
          id: user.id,
          username: user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
          email: user.email || '',
          role: user.role || 'USER',
          lastActive: user.lastLogin || user.createdAt || new Date().toISOString(),
          status: user.isActive !== false ? 'active' : 'inactive'
        }));
        setRecentUsers(formattedUsers);
      }

      // Check system health
      try {
        await apiClient.healthCheck();
        setSystemStatus({ database: 'healthy', server: 'healthy' });
      } catch {
        setSystemStatus({ database: 'error', server: 'error' });
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set fallback data on error
      setStats({
        totalUsers: 0,
        totalPosts: 0,
        totalCategories: 0,
        totalComments: 0,
        totalViews: 0,
        totalLikes: 0
      });
      setRecentPosts([]);
      setRecentUsers([]);
      setSystemStatus({ database: 'error', server: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'published': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'draft': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'pending': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'active': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'inactive': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return styles[status] || styles.pending;
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'checking':
        return <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return <Crown className="w-3.5 h-3.5 text-amber-400" />;
      case 'EDITOR':
        return <Shield className="w-3.5 h-3.5 text-blue-400" />;
      case 'AUTHOR':
        return <BookOpen className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <User className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#fcd535]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#fcd535] animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-[#fcd535] animate-pulse" />
          </div>
          <p className="text-gray-400 text-lg font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] p-6 lg:p-8">
      {/* Welcome Banner */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-[#181a20] via-[#1e2329] to-[#181a20] border border-[#2b2f36]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMmIyZjM2IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#fcd535]/10 to-transparent rounded-full blur-3xl"></div>
        <div className="relative px-8 py-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <span className="px-3 py-1 bg-[#fcd535]/20 text-[#fcd535] text-xs font-semibold rounded-full border border-[#fcd535]/30">
                  LIVE
                </span>
                <span className="text-gray-500 text-sm">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Welcome back, Admin!</h2>
              <p className="text-gray-400 max-w-lg">
                Your dashboard is looking great. Here's what's happening with your content platform today.
              </p>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <button 
                onClick={() => navigate('/admin/posts/add')}
                className="px-5 py-3 bg-[#fcd535] text-[#181a20] font-semibold rounded-xl hover:bg-[#f0b90b] transition-all active:scale-95 flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>New Post</span>
              </button>
              <button className="px-5 py-3 bg-[#2b2f36] text-white font-medium rounded-xl hover:bg-[#363a45] transition-all border border-[#2b2f36] flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div 
          onClick={() => navigate('/admin/users')}
          className="group relative bg-[#181a20] rounded-2xl border border-[#2b2f36] overflow-hidden hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">{formatNumber(stats.totalUsers)}</p>
              <p className="text-sm text-gray-500 group-hover:text-gray-400">Total Users</p>
            </div>
            </div>
          </div>

        {/* Total Posts */}
        <div 
          onClick={() => navigate('/admin/posts')}
          className="group relative bg-[#181a20] rounded-2xl border border-[#2b2f36] overflow-hidden hover:border-purple-500/50 transition-all duration-300 cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">{formatNumber(stats.totalPosts)}</p>
              <p className="text-sm text-gray-500 group-hover:text-gray-400">Total Posts</p>
            </div>
              </div>
            </div>

        {/* Total Views */}
        <div 
          onClick={() => navigate('/admin/analytics')}
          className="group relative bg-[#181a20] rounded-2xl border border-[#2b2f36] overflow-hidden hover:border-emerald-500/50 transition-all duration-300 cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                <Eye className="w-6 h-6 text-emerald-400" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-emerald-400 transition-colors" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">{formatNumber(stats.totalViews)}</p>
              <p className="text-sm text-gray-500 group-hover:text-gray-400">Total Views</p>
            </div>
            </div>
          </div>

        {/* Engagement */}
        <div 
          onClick={() => navigate('/admin/analytics')}
          className="group relative bg-[#181a20] rounded-2xl border border-[#2b2f36] overflow-hidden hover:border-[#fcd535]/50 transition-all duration-300 cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#fcd535]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#fcd535]/10 rounded-xl group-hover:bg-[#fcd535]/20 transition-colors">
                <Flame className="w-6 h-6 text-[#fcd535]" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#fcd535] transition-colors" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">{formatNumber(stats.totalLikes + stats.totalComments)}</p>
              <p className="text-sm text-gray-500 group-hover:text-gray-400">Total Engagement</p>
            </div>
            </div>
          </div>
        </div>

      {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Posts */}
        <div className="xl:col-span-2 bg-[#181a20] rounded-2xl border border-[#2b2f36] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#2b2f36] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#fcd535]/10 rounded-lg">
                <FileText className="w-5 h-5 text-[#fcd535]" />
                </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Recent Posts</h3>
                <p className="text-xs text-gray-500">Latest published content</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/admin/posts')}
              className="flex items-center space-x-1 text-[#fcd535] hover:text-[#f0b90b] text-sm font-medium transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="divide-y divide-[#2b2f36]">
            {recentPosts.length > 0 ? (
              recentPosts.map((post, index) => (
                <div 
                  key={post.id} 
                  className="group px-6 py-4 hover:bg-[#1e2329] transition-colors cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => navigate(`/admin/posts/${post.id}`)}
                >
                    <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 className="text-white font-medium group-hover:text-[#fcd535] transition-colors line-clamp-1 mb-2">
                        {post.title}
                      </h4>
                      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm">
                        <span className="flex items-center space-x-1.5 text-gray-500">
                          <User className="w-3.5 h-3.5" />
                          <span>{post.author}</span>
                          </span>
                        <span className="flex items-center space-x-1.5 text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(post.publishedAt)}</span>
                          </span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                          <span>{formatNumber(post.views)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Heart className="w-4 h-4" />
                          <span>{formatNumber(post.likes)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MessageSquare className="w-4 h-4" />
                          <span>{formatNumber(post.comments)}</span>
                          </span>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${getStatusBadge(post.status)}`}>
                        {post.status}
                        </span>
                      <button className="p-1.5 text-gray-500 hover:text-white hover:bg-[#2b2f36] rounded-lg transition-all opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
              <div className="px-6 py-16 text-center">
                <div className="w-16 h-16 bg-[#2b2f36] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-500 mb-4">No posts found</p>
                <button 
                  onClick={() => navigate('/admin/posts/add')}
                  className="px-4 py-2 bg-[#fcd535] text-[#181a20] font-medium text-sm rounded-lg hover:bg-[#f0b90b] transition-all"
                >
                  Create First Post
                </button>
              </div>
            )}
              </div>
            </div>

        {/* Right Column */}
          <div className="space-y-6">
            {/* Recent Users */}
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] overflow-hidden">
            <div className="px-6 py-5 border-b border-[#2b2f36] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Recent Users</h3>
              </div>
              <button 
                onClick={() => navigate('/admin/users')}
                className="text-[#fcd535] hover:text-[#f0b90b] text-sm font-medium transition-colors"
              >
                View All
              </button>
            </div>
            
            <div className="p-4 space-y-2">
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className="group flex items-center space-x-3 p-3 hover:bg-[#1e2329] rounded-xl transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#2b2f36] to-[#363a45] rounded-xl flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">
                          {user.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#181a20] ${user.status === 'active' ? 'bg-emerald-500' : 'bg-gray-500'}`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-[#fcd535] transition-colors">
                          {user.username}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    <div className="flex items-center space-x-1.5 px-2 py-1 bg-[#2b2f36] rounded-lg">
                      {getRoleIcon(user.role)}
                      <span className="text-xs font-medium text-gray-400">{user.role}</span>
                    </div>
                    </div>
                  ))
                ) : (
                <div className="py-8 text-center">
                  <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No users found</p>
                  </div>
                )}
              </div>
            </div>

            {/* System Status */}
          <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] overflow-hidden">
            <div className="px-6 py-5 border-b border-[#2b2f36]">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">System Status</h3>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
                {Object.entries(systemStatus).map(([key, status]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-[#1e2329] rounded-xl">
                    <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      status === 'healthy' ? 'bg-emerald-500' :
                      status === 'warning' ? 'bg-amber-500' :
                      status === 'checking' ? 'bg-gray-500' : 'bg-red-500'
                    } ${status === 'healthy' ? 'animate-pulse' : ''}`}></div>
                    <span className="text-sm font-medium text-gray-300 capitalize">{key}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getHealthIcon(status)}
                    <span className={`text-xs font-medium capitalize ${
                      status === 'healthy' ? 'text-emerald-400' :
                      status === 'warning' ? 'text-amber-400' :
                      status === 'checking' ? 'text-gray-400' : 'text-red-400'
                      }`}>
                        {status}
                      </span>
                    </div>
                    </div>
                  ))}
            </div>
          </div>

            {/* Quick Actions */}
          <div className="relative bg-gradient-to-br from-[#1e2329] to-[#181a20] rounded-2xl border border-[#2b2f36] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#fcd535]/5 to-transparent"></div>
            <div className="relative p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-[#fcd535]" />
                <span>Quick Actions</span>
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/admin/posts/add')}
                  className="w-full flex items-center space-x-3 p-4 bg-[#2b2f36]/50 hover:bg-[#2b2f36] rounded-xl transition-all group border border-transparent hover:border-[#fcd535]/30"
                >
                  <div className="p-2 bg-[#fcd535]/10 rounded-lg group-hover:bg-[#fcd535]/20 transition-colors">
                    <Plus className="w-5 h-5 text-[#fcd535]" />
                  </div>
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Create New Post</span>
                </button>
                <button 
                  onClick={() => navigate('/admin/users')}
                  className="w-full flex items-center space-x-3 p-4 bg-[#2b2f36]/50 hover:bg-[#2b2f36] rounded-xl transition-all group border border-transparent hover:border-blue-500/30"
                >
                  <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Manage Users</span>
                </button>
                <button 
                  onClick={() => navigate('/admin/analytics')}
                  className="w-full flex items-center space-x-3 p-4 bg-[#2b2f36]/50 hover:bg-[#2b2f36] rounded-xl transition-all group border border-transparent hover:border-purple-500/30"
                >
                  <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">View Analytics</span>
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>

      {/* Activity Stats Row */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Categories */}
        <div 
          onClick={() => navigate('/admin/categories')}
          className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6 group hover:border-orange-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl group-hover:from-orange-500/30 group-hover:to-red-500/30 transition-colors">
              <Layers className="w-6 h-6 text-orange-400" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-orange-400 transition-colors" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.totalCategories}</p>
          <p className="text-sm text-gray-500 group-hover:text-gray-400">Categories</p>
        </div>

        {/* Comments */}
        <div 
          onClick={() => navigate('/admin/posts')}
          className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6 group hover:border-cyan-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-colors">
              <MessageSquare className="w-6 h-6 text-cyan-400" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-cyan-400 transition-colors" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{formatNumber(stats.totalComments)}</p>
          <p className="text-sm text-gray-500 group-hover:text-gray-400">Comments</p>
        </div>

        {/* Likes */}
        <div 
          onClick={() => navigate('/admin/analytics')}
          className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6 group hover:border-pink-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-xl group-hover:from-pink-500/30 group-hover:to-rose-500/30 transition-colors">
              <Heart className="w-6 h-6 text-pink-400" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-pink-400 transition-colors" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{formatNumber(stats.totalLikes)}</p>
          <p className="text-sm text-gray-500 group-hover:text-gray-400">Total Likes</p>
        </div>

        {/* Avg. Engagement */}
        <div 
          onClick={() => navigate('/admin/analytics')}
          className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-6 group hover:border-[#fcd535]/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-[#fcd535]/20 to-amber-500/20 rounded-xl group-hover:from-[#fcd535]/30 group-hover:to-amber-500/30 transition-colors">
              <Star className="w-6 h-6 text-[#fcd535]" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#fcd535] transition-colors" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {stats.totalPosts > 0 ? ((stats.totalLikes + stats.totalComments) / stats.totalPosts).toFixed(1) : '0'}
          </p>
          <p className="text-sm text-gray-500 group-hover:text-gray-400">Avg. Engagement / Post</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
