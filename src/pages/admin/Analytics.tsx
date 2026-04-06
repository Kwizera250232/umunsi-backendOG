import { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  FileText, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';

interface AnalyticsData {
  period: string;
  totalViews: number;
  todayViews: number;
  dailyViews: Array<{
    date: string;
    views: number;
  }>;
  uniqueVisitors: number;
  newUsers: number;
  returningUsers: number;
  averageSessionDuration: number;
  bounceRate: number;
  topArticles: Array<{
    id: string;
    title: string;
    views: number;
  }>;
  topCategories: Array<{
    name: string;
    views: number;
    color: string;
  }>;
  userGrowth: Array<{
    date: string;
    users: number;
  }>;
  articleGrowth: Array<{
    date: string;
    articles: number;
  }>;
}

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const dashboard = await apiClient.getDashboardStats().catch(() => null);

      const mockData: AnalyticsData = {
        period: '30d',
        totalViews: dashboard?.totalViews || 45678,
        todayViews: dashboard?.todayViews || 0,
        dailyViews: dashboard?.dailyViews || [],
        uniqueVisitors: Math.round((dashboard?.totalViews || 45678) * 0.32),
        newUsers: dashboard?.userGrowthPercentage ? Math.round((dashboard.totalUsers * dashboard.userGrowthPercentage) / 100) : 2345,
        returningUsers: Math.max((dashboard?.totalUsers || 0) - (dashboard?.userGrowthPercentage ? Math.round((dashboard.totalUsers * dashboard.userGrowthPercentage) / 100) : 0), 0),
        averageSessionDuration: 245,
        bounceRate: 35.2,
        topArticles: (dashboard?.recentArticles || []).slice(0, 5).map((article) => ({
          id: article.id,
          title: article.title,
          views: article.viewCount || 0,
        })),
        topCategories: [
          { name: 'Siporo', views: 4500, color: '#fcd535' },
          { name: 'Iyobokamana', views: 3800, color: '#3b82f6' },
          { name: 'Umuziki', views: 3200, color: '#a855f7' },
          { name: 'Politiki', views: 2800, color: '#ef4444' },
          { name: 'Ubuzima', views: 2200, color: '#10b981' }
        ],
        userGrowth: [
          { date: '2024-01-01', users: 1000 },
          { date: '2024-01-08', users: 1200 },
          { date: '2024-01-15', users: 1350 },
          { date: '2024-01-22', users: 1500 },
          { date: '2024-01-29', users: 1650 }
        ],
        articleGrowth: [
          { date: '2024-01-01', articles: 50 },
          { date: '2024-01-08', articles: 65 },
          { date: '2024-01-15', articles: 78 },
          { date: '2024-01-22', articles: 85 },
          { date: '2024-01-29', articles: 92 }
        ]
      };

      setAnalyticsData(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[#fcd535]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#fcd535] animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[#fcd535] animate-pulse" />
          </div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-gray-400 mt-1">Monitor website performance and user behavior</p>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2.5 bg-[#2b2f36] border border-[#2b2f36] rounded-xl text-white focus:outline-none focus:border-[#fcd535]/50"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Eye className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex items-center space-x-1 text-emerald-400 text-sm font-medium">
              <ArrowUpRight className="w-4 h-4" />
              <span>+12.5%</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{formatNumber(analyticsData?.totalViews || 0)}</p>
          <p className="text-sm text-gray-500">Total Views</p>
        </div>

        <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <Users className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex items-center space-x-1 text-emerald-400 text-sm font-medium">
              <ArrowUpRight className="w-4 h-4" />
              <span>+8.3%</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{formatNumber(analyticsData?.uniqueVisitors || 0)}</p>
          <p className="text-sm text-gray-500">Unique Visitors</p>
        </div>

        <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl">
              <Calendar className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex items-center space-x-1 text-cyan-400 text-sm font-medium">
              <ArrowUpRight className="w-4 h-4" />
              <span>Today</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{formatNumber(analyticsData?.todayViews || 0)}</p>
          <p className="text-sm text-gray-500">Daily Views</p>
        </div>

        <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex items-center space-x-1 text-emerald-400 text-sm font-medium">
              <ArrowUpRight className="w-4 h-4" />
              <span>+5.2%</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{formatDuration(analyticsData?.averageSessionDuration || 0)}</p>
          <p className="text-sm text-gray-500">Avg. Session</p>
        </div>

        <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#fcd535]/10 rounded-xl">
              <BarChart3 className="w-6 h-6 text-[#fcd535]" />
            </div>
            <div className="flex items-center space-x-1 text-red-400 text-sm font-medium">
              <ArrowDownRight className="w-4 h-4" />
              <span>-2.1%</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{(analyticsData?.bounceRate || 0).toFixed(1)}%</p>
          <p className="text-sm text-gray-500">Bounce Rate</p>
        </div>
      </div>

      <div className="mb-6 bg-[#181a20] rounded-xl border border-[#2b2f36] p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Reading Trend (Last 7 Days)</h3>
        {(analyticsData?.dailyViews?.length || 0) > 0 ? (
          <div className="space-y-3">
            {analyticsData?.dailyViews.map((day) => {
              const maxViews = Math.max(...(analyticsData?.dailyViews || []).map((d) => d.views), 1);
              const width = `${Math.max((day.views / maxViews) * 100, 6)}%`;

              return (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-gray-400">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-[#2b2f36] overflow-hidden">
                    <div className="h-2 rounded-full bg-gradient-to-r from-[#fcd535] to-cyan-400" style={{ width }} />
                  </div>
                  <span className="w-16 text-right text-sm text-white">{formatNumber(day.views)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No daily view data yet.</p>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Articles */}
        <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2b2f36] flex items-center space-x-3">
            <div className="p-2 bg-[#fcd535]/10 rounded-lg">
              <FileText className="w-5 h-5 text-[#fcd535]" />
            </div>
            <h3 className="text-lg font-semibold text-white">Top Performing Articles</h3>
          </div>
          <div className="p-6 space-y-4">
              {analyticsData?.topArticles.map((article, index) => (
              <div key={article.id} className="flex items-center justify-between group">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="w-7 h-7 bg-[#2b2f36] rounded-lg flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
                      {index + 1}
                    </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate group-hover:text-[#fcd535] transition-colors">
                        {article.title}
                      </p>
                      <p className="text-xs text-gray-500">{formatNumber(article.views)} views</p>
                    </div>
                  </div>
                <div className="w-24 bg-[#2b2f36] rounded-full h-2 ml-4 flex-shrink-0">
                    <div 
                    className="bg-[#fcd535] h-2 rounded-full transition-all"
                      style={{ width: `${(article.views / analyticsData.topArticles[0].views) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2b2f36] flex items-center space-x-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <PieChart className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Popular Categories</h3>
          </div>
          <div className="p-6 space-y-4">
            {analyticsData?.topCategories.map((category) => (
              <div key={category.name} className="flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                    <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <div>
                    <p className="text-sm font-medium text-white group-hover:text-[#fcd535] transition-colors">{category.name}</p>
                      <p className="text-xs text-gray-500">{formatNumber(category.views)} views</p>
                    </div>
                  </div>
                <div className="w-24 bg-[#2b2f36] rounded-full h-2">
                    <div 
                    className="h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(category.views / analyticsData.topCategories[0].views) * 100}%`,
                        backgroundColor: category.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2b2f36] flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">User Growth</h3>
          </div>
          <div className="p-6 space-y-3">
            {analyticsData?.userGrowth.map((data) => (
                <div key={data.date} className="flex items-center justify-between">
                <span className="text-sm text-gray-400 w-24">
                  {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-1 bg-[#2b2f36] rounded-full h-2">
                      <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${(data.users / analyticsData.userGrowth[analyticsData.userGrowth.length - 1].users) * 100}%` }}
                      ></div>
                    </div>
                  <span className="text-sm font-medium text-white w-16 text-right">{formatNumber(data.users)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Article Growth */}
        <div className="bg-[#181a20] rounded-xl border border-[#2b2f36] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2b2f36] flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Article Growth</h3>
          </div>
          <div className="p-6 space-y-3">
            {analyticsData?.articleGrowth.map((data) => (
                <div key={data.date} className="flex items-center justify-between">
                <span className="text-sm text-gray-400 w-24">
                  {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-1 bg-[#2b2f36] rounded-full h-2">
                      <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${(data.articles / analyticsData.articleGrowth[analyticsData.articleGrowth.length - 1].articles) * 100}%` }}
                      ></div>
                    </div>
                  <span className="text-sm font-medium text-white w-16 text-right">{data.articles}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
