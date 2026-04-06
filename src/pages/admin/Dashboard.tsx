import React from 'react';
import { 
  FileText, 
  Users, 
  FolderOpen, 
  BarChart3, 
  TrendingUp, 
  Eye,
  Calendar,
  Clock,
  Plus,
  ArrowUp,
  ArrowDown,
  Activity,
  Star,
  Zap,
  Target,
  Award,
  TrendingDown,
  DollarSign,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Heart
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, Admin!</h1>
            <p className="text-gray-600 mt-2">
              Here's what's happening with your Umunsi platform today.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>New Article</span>
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              View Reports
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Articles Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Articles</p>
              <p className="text-3xl font-bold text-gray-900">1,247</p>
              <div className="flex items-center mt-2">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium ml-1">+12%</span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Users Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-gray-900">8,934</p>
              <div className="flex items-center mt-2">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium ml-1">+8%</span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Views Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Page Views</p>
              <p className="text-3xl font-bold text-gray-900">45.2K</p>
              <div className="flex items-center mt-2">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium ml-1">+23%</span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Eye className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Engagement Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
              <p className="text-3xl font-bold text-gray-900">68.5%</p>
              <div className="flex items-center mt-2">
                <ArrowDown className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600 font-medium ml-1">-2%</span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <Heart className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Articles */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Articles</h2>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              View All →
            </button>
          </div>
          <div className="space-y-4">
            {[
              { title: "Breaking: New Technology Trends", status: "Published", views: "2.4K", date: "2 hours ago", category: "Technology" },
              { title: "Sports Update: Championship Results", status: "Draft", views: "0", date: "4 hours ago", category: "Sports" },
              { title: "Entertainment News: Award Show", status: "Published", views: "1.8K", date: "6 hours ago", category: "Entertainment" }
            ].map((article, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{article.title}</h3>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      article.status === 'Published' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {article.status}
                    </span>
                    <span className="text-xs text-gray-500">{article.category}</span>
                    <span className="text-xs text-gray-500">{article.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-900 font-semibold">{article.views}</p>
                  <p className="text-gray-500 text-xs">views</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors group">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-blue-700">New Article</p>
              </div>
            </button>

            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-colors group">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-green-700">Add User</p>
              </div>
            </button>

            <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 transition-colors group">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-orange-700">New Category</p>
              </div>
            </button>

            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors group">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-purple-700">View Analytics</p>
              </div>
            </button>
          </div>
        </div>
          </div>

      {/* Recent Activity & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: "New article published", user: "John Doe", time: "2 minutes ago", type: "success" },
              { action: "User registration", user: "Jane Smith", time: "15 minutes ago", type: "info" },
              { action: "Category updated", user: "Admin", time: "1 hour ago", type: "warning" },
              { action: "System backup completed", user: "System", time: "2 hours ago", type: "success" }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{activity.action}</p>
                  <p className="text-gray-600 text-xs">by {activity.user}</p>
                </div>
                <div className="flex items-center space-x-2 text-gray-500 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">System Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">Database</span>
              </div>
              <span className="text-sm text-green-600">Online</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">API Server</span>
              </div>
              <span className="text-sm text-green-600">Online</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">File Storage</span>
              </div>
              <span className="text-sm text-green-600">Online</span>
          </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-blue-800">CDN</span>
              </div>
              <span className="text-sm text-blue-600">Optimizing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;