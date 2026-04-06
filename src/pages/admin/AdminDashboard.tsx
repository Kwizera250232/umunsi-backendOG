import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Activity, 
  TrendingUp, 
  Eye,
  Clock,
  Star,
  Settings,
  Plus,
  Calendar,
  Target,
  Zap,
  Award,
  CheckCircle,
  User,
  Tag,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { apiClient } from '../../services/api';

interface DashboardStats {
  totalUsers: number;
  totalArticles: number;
  totalViews: number;
  totalLikes: number;
}

interface RecentActivity {
  action: string;
  user: string;
  time: string;
  type: string;
  icon: any;
  color: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalArticles: 0,
    totalViews: 0,
    totalLikes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch articles for stats
      const articlesResponse = await apiClient.getArticles({ page: 1, limit: 1000 });
      const articles = articlesResponse?.data || [];

      // Calculate stats from articles
      const totalViews = articles.reduce((sum, article) => sum + (article.viewCount || 0), 0);
      const totalLikes = articles.reduce((sum, article) => sum + (article.likeCount || 0), 0);

      // Fetch categories for additional context
      const categoriesResponse = await apiClient.getCategories();
      const categories = categoriesResponse || [];

      setStats({
        totalUsers: 0, // Will be updated when user stats endpoint is available
        totalArticles: articles.length,
        totalViews,
        totalLikes
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const recentActivities: RecentActivity[] = [
    { action: 'New article published', user: 'John Doe', time: '2 minutes ago', type: 'article', icon: FileText, color: 'text-green-600' },
    { action: 'User registered', user: 'Jane Smith', time: '5 minutes ago', type: 'user', icon: Users, color: 'text-yellow-600' },
    { action: 'Category updated', user: 'Admin', time: '10 minutes ago', type: 'category', icon: Settings, color: 'text-green-600' },
    { action: 'Analytics report generated', user: 'System', time: '15 minutes ago', type: 'analytics', icon: BarChart3, color: 'text-yellow-600' },
  ];

  const quickActions = [
    { title: 'New Article', description: 'Create a new article', icon: Plus, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Manage Users', description: 'View and edit users', icon: Users, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50' },
    { title: 'Analytics', description: 'View site analytics', icon: BarChart3, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50' },
    { title: 'Settings', description: 'Configure site settings', icon: Settings, color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50' },
  ];

  if (loading) {
  return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
              </div>
            </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

          return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-yellow-50 p-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 via-yellow-400 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-green-700 via-yellow-600 to-green-800 bg-clip-text text-transparent">
                    Dashboard Overview
                  </h1>
                  <p className="text-lg text-gray-600 mt-2">Welcome back! Here's what's happening with your site today.</p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-full">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 px-4 py-2 rounded-full">
                  <Target className="w-4 h-4" />
                  <span className="font-medium">All systems operational</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-6xl font-bold text-green-100">📊</div>
              <p className="text-sm text-gray-500 mt-2">Real-time insights</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-8 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-red-800 font-medium">{error}</p>
              <p className="text-red-600 text-sm mt-1">Please try again or contact support if the issue persists.</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="ml-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl"></div>
          <div className="relative bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-50 rounded-3xl p-8 shadow-2xl border border-yellow-200/50 hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">Total Articles</p>
                <p className="text-4xl font-bold text-yellow-800">{stats.totalArticles}</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-yellow-600">Live data</span>
                </div>
                  </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl shadow-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500">
                  <FileText className="w-8 h-8 text-white" />
                  </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-yellow-800">📝</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl"></div>
          <div className="relative bg-gradient-to-br from-green-50 via-green-100 to-green-50 rounded-3xl p-8 shadow-2xl border border-green-200/50 hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Total Views</p>
                <p className="text-4xl font-bold text-green-800">{stats.totalViews}</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Growing</span>
                </div>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500">
                  <Eye className="w-8 h-8 text-white" />
          </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-green-800">👁️</span>
                    </div>
                    </div>
          </div>
        </div>
      </div>

        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl"></div>
          <div className="relative bg-gradient-to-br from-green-50 via-green-100 to-green-50 rounded-3xl p-8 shadow-2xl border border-green-200/50 hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Total Likes</p>
                <p className="text-4xl font-bold text-green-800">{stats.totalLikes}</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Engaging</span>
          </div>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-green-800">⭐</span>
                </div>
              </div>
            </div>
              </div>
            </div>
        
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl"></div>
          <div className="relative bg-gradient-to-br from-green-50 via-green-100 to-green-50 rounded-3xl p-8 shadow-2xl border border-green-200/50 hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Categories</p>
                <p className="text-4xl font-bold text-green-800">8</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Organized</span>
                </div>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-green-800">📊</span>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>

      {/* Quick Actions Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-green-50 via-yellow-50 to-green-50 rounded-3xl p-8 shadow-2xl border border-green-200/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
          </div>
              <div>
                <h2 className="text-2xl font-bold text-green-800">Quick Actions</h2>
                <p className="text-green-600">Access common tasks and features</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl">🚀</div>
              <p className="text-xs text-green-600">Fast access</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <div key={index} className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} shadow-lg`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {index === 0 ? '✍️' : index === 1 ? '👥' : index === 2 ? '📈' : '⚙️'}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{action.description}</p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Click to access</span>
                      <div className="w-2 h-2 bg-green-400 rounded-full group-hover:animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-gradient-to-br from-white via-green-50/30 to-yellow-50/30 rounded-3xl p-8 shadow-2xl border border-white/20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
              <div>
              <h2 className="text-2xl font-bold text-green-800">Recent Activities</h2>
              <p className="text-green-600">Latest updates and system activities</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl">⏰</div>
            <p className="text-xs text-green-600">Last updated: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
        
        {recentActivities.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Activity className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No recent activities</h3>
            <p className="text-gray-500 mb-6">Activities will appear here as they happen in real-time.</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600">Monitoring for new activities...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-100/50">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${activity.color} bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300`}>
                      <activity.icon className={`w-5 h-5 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-lg group-hover:text-green-800 transition-colors duration-300">{activity.action}</p>
                      <p className="text-gray-600 group-hover:text-green-700 transition-colors duration-300">by <span className="font-medium">{activity.user}</span></p>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                        <span className="text-sm text-green-600 font-medium">{activity.type}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500 group-hover:text-green-600 transition-colors duration-300">{activity.time}</span>
                      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;