import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Activity,
  Download,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface SystemLog {
  id: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  message: string;
  details?: any;
  createdAt: string;
}

const Logs = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, searchTerm, levelFilter]);

  const fetchLogs = async () => {
    try {
      const mockLogs: SystemLog[] = [
        {
          id: '1',
          level: 'ERROR',
          message: 'Database connection failed',
          details: { error: 'Connection timeout', retries: 3 },
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          level: 'WARN',
          message: 'High memory usage detected',
          details: { usage: '85%', threshold: '80%' },
          createdAt: '2024-01-15T10:25:00Z'
        },
        {
          id: '3',
          level: 'INFO',
          message: 'User login successful',
          details: { userId: 'user123', ip: '192.168.1.100' },
          createdAt: '2024-01-15T10:20:00Z'
        },
        {
          id: '4',
          level: 'INFO',
          message: 'Article published successfully',
          details: { articleId: 'article456', authorId: 'author789' },
          createdAt: '2024-01-15T10:15:00Z'
        },
        {
          id: '5',
          level: 'DEBUG',
          message: 'Cache miss for user profile',
          details: { userId: 'user456', cacheKey: 'profile:user456' },
          createdAt: '2024-01-15T10:10:00Z'
        },
        {
          id: '6',
          level: 'ERROR',
          message: 'Email service unavailable',
          details: { service: 'SMTP', error: 'Authentication failed' },
          createdAt: '2024-01-15T10:05:00Z'
        }
      ];

      setLogs(mockLogs);
      setTotalPages(1);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'bg-red-500/10 text-red-400 border border-red-500/30';
      case 'WARN': return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'INFO': return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'DEBUG': return 'bg-gray-500/10 text-gray-400 border border-gray-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border border-gray-500/30';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR': return <XCircle className="w-4 h-4" />;
      case 'WARN': return <AlertCircle className="w-4 h-4" />;
      case 'INFO': return <Info className="w-4 h-4" />;
      case 'DEBUG': return <CheckCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Stats
  const errorCount = logs.filter(l => l.level === 'ERROR').length;
  const warnCount = logs.filter(l => l.level === 'WARN').length;
  const infoCount = logs.filter(l => l.level === 'INFO').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0b0e11]">
        <div className="w-8 h-8 border-2 border-[#fcd535]/20 border-t-[#fcd535] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#0b0e11] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl">
              <Activity className="w-6 h-6 text-emerald-400" />
            </div>
          <div>
              <h1 className="text-2xl font-bold text-white">System Logs</h1>
              <p className="text-gray-400 mt-1">Monitor system events and errors</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2.5 text-gray-300 border border-[#2b2f36] rounded-xl hover:bg-[#1e2329] transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Export Logs
            </button>
            <button className="flex items-center px-4 py-2.5 bg-red-600/10 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-600/20 transition-colors">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Logs
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Logs</p>
              <p className="text-2xl font-bold text-white mt-1">{logs.length}</p>
            </div>
            <div className="p-3 bg-[#fcd535]/10 rounded-xl">
              <Activity className="w-6 h-6 text-[#fcd535]" />
            </div>
          </div>
        </div>
        <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Errors</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{errorCount}</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Warnings</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{warnCount}</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <AlertCircle className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Info</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{infoCount}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Info className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]"
            />
          </div>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]"
          >
            <option value="all">All Levels</option>
            <option value="ERROR">Error</option>
            <option value="WARN">Warning</option>
            <option value="INFO">Info</option>
            <option value="DEBUG">Debug</option>
          </select>

          {/* Actions */}
          <div className="flex space-x-2">
          <button
            onClick={() => {
              setSearchTerm('');
              setLevelFilter('all');
            }}
              className="flex-1 px-4 py-2.5 text-gray-400 border border-[#2b2f36] rounded-xl hover:bg-[#1e2329] transition-colors"
          >
            Clear Filters
          </button>
            <button
              onClick={fetchLogs}
              className="px-4 py-2.5 bg-[#fcd535] text-[#0b0e11] rounded-xl hover:bg-[#f0b90b] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#0b0e11] border-b border-[#2b2f36]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2b2f36]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#1e2329] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${getLevelColor(log.level)}`}>
                      {getLevelIcon(log.level)}
                      <span className="ml-2">{log.level}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">
                      {log.message}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-400">
                      {log.details ? (
                        <details className="cursor-pointer group">
                          <summary className="text-[#fcd535] hover:text-[#f0b90b] transition-colors">View Details</summary>
                          <pre className="mt-2 text-xs bg-[#0b0e11] p-3 rounded-xl overflow-x-auto border border-[#2b2f36] text-gray-300">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-gray-600">No details</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-500" />
                      {formatDate(log.createdAt)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-[#0b0e11] px-6 py-4 border-t border-[#2b2f36]">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-[#2b2f36] text-sm font-medium rounded-xl text-gray-300 bg-[#181a20] hover:bg-[#1e2329] disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 px-4 py-2 border border-[#2b2f36] text-sm font-medium rounded-xl text-gray-300 bg-[#181a20] hover:bg-[#1e2329] disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  Showing <span className="font-medium text-white">1</span> to <span className="font-medium text-white">{logs.length}</span> of{' '}
                  <span className="font-medium text-white">{logs.length}</span> results
                </p>
              </div>
              <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  className="px-4 py-2 border border-[#2b2f36] text-sm font-medium rounded-xl text-gray-300 bg-[#181a20] hover:bg-[#1e2329] disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-[#2b2f36] text-sm font-medium rounded-xl text-gray-300 bg-[#181a20] hover:bg-[#1e2329] disabled:opacity-50"
                  >
                    Next
                  </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;
