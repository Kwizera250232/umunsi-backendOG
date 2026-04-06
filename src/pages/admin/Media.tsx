import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Video, 
  File, 
  Upload, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  MoreHorizontal,
  Grid3X3,
  List,
  RefreshCw,
  Image as ImageIcon,
  Music,
  Archive,
  FolderOpen,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  thumbnail?: string;
  size: number;
  mimeType: string;
  dimensions?: { width: number; height: number };
  duration?: number;
  uploadedBy: string;
  uploadedAt: string;
  isPublic: boolean;
  tags: string[];
  usageCount: number;
}

const Media = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const mockMedia: MediaItem[] = [
        {
          id: '1',
          name: 'umunsi-logo.png',
          type: 'image',
          url: '/images/logo.png',
          thumbnail: '/images/logo.png',
          size: 245760,
          mimeType: 'image/png',
          dimensions: { width: 800, height: 600 },
          uploadedBy: 'admin',
          uploadedAt: '2024-01-01T00:00:00Z',
          isPublic: true,
          tags: ['logo', 'branding'],
          usageCount: 15
        },
        {
          id: '2',
          name: 'sports-championship.mp4',
          type: 'video',
          url: '/videos/sports-championship.mp4',
          thumbnail: '/images/video-thumbnails/sports.jpg',
          size: 52428800,
          mimeType: 'video/mp4',
          duration: 180,
          uploadedBy: 'editor1',
          uploadedAt: '2024-01-15T10:30:00Z',
          isPublic: true,
          tags: ['sports', 'championship', 'video'],
          usageCount: 8
        },
        {
          id: '3',
          name: 'gospel-song.mp3',
          type: 'audio',
          url: '/audio/gospel-song.mp3',
          size: 8192000,
          mimeType: 'audio/mp3',
          duration: 240,
          uploadedBy: 'author1',
          uploadedAt: '2024-01-14T15:45:00Z',
          isPublic: true,
          tags: ['gospel', 'music', 'audio'],
          usageCount: 12
        },
        {
          id: '4',
          name: 'news-report.pdf',
          type: 'document',
          url: '/documents/news-report.pdf',
          size: 1048576,
          mimeType: 'application/pdf',
          uploadedBy: 'editor2',
          uploadedAt: '2024-01-13T09:20:00Z',
          isPublic: false,
          tags: ['document', 'report', 'news'],
          usageCount: 3
        }
      ];
      
      setMediaItems(mockMedia);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching media:', error);
      setLoading(false);
    }
  };

  const handleDeleteMedia = (id: string) => {
    if (window.confirm('Are you sure you want to delete this media item?')) {
      setMediaItems(mediaItems.filter(item => item.id !== id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) {
      alert('Please select items first');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) {
      setMediaItems(mediaItems.filter(item => !selectedItems.includes(item.id)));
      setSelectedItems([]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'audio':
        return <Music className="w-5 h-5" />;
      case 'document':
        return <File className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'image': 'bg-blue-100 text-blue-700 border-blue-200',
      'video': 'bg-purple-100 text-purple-700 border-purple-200',
      'audio': 'bg-green-100 text-green-700 border-green-200',
      'document': 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[type as keyof typeof colors] || colors.document;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading media library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Media Library
              </h1>
              <p className="text-gray-600 text-lg max-w-2xl">
                Manage your media assets including images, videos, audio files, and documents for the Umunsi platform.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105">
                <Upload className="w-5 h-5" />
                <span className="font-semibold">Upload Media</span>
              </button>
              <button className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 font-semibold">
                <FolderOpen className="w-5 h-5 mr-2" />
                New Folder
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Files</p>
                <p className="text-3xl font-bold text-gray-900">{mediaItems.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <File className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Size</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatFileSize(mediaItems.reduce((sum, item) => sum + item.size, 0))}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Archive className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Images</p>
                <p className="text-3xl font-bold text-gray-900">{mediaItems.filter(m => m.type === 'image').length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <ImageIcon className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Videos</p>
                <p className="text-3xl font-bold text-gray-900">{mediaItems.filter(m => m.type === 'video').length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Video className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Media Files</h3>
            <p className="text-gray-600 mb-4">
              Drag and drop files here, or click to browse
            </p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Choose Files
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Supports: JPG, PNG, GIF, MP4, MP3, PDF (Max 100MB per file)
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search media files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="document">Documents</option>
              </select>

              <div className="flex border border-gray-300 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-3 transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-3 transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selectedItems.length} item(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedItems([])}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Media Grid/List */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {mediaItems.length} Media Files
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <RefreshCw className="w-4 h-4" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {mediaItems.map((item) => (
                <div key={item.id} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  {/* Media Preview */}
                  <div className="relative h-48 bg-gray-100">
                    {item.type === 'image' && item.thumbnail ? (
                      <img 
                        src={item.thumbnail} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {getTypeIcon(item.type)}
                      </div>
                    )}
                    
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, item.id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== item.id));
                        }
                      }}
                      className="absolute top-2 left-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    
                    {/* Type Badge */}
                    <span className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-full border ${getTypeColor(item.type)}`}>
                      {item.type.toUpperCase()}
                    </span>
                  </div>

                  {/* Media Info */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </h3>
                    
                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex items-center justify-between">
                        <span>Size:</span>
                        <span>{formatFileSize(item.size)}</span>
                      </div>
                      {item.dimensions && (
                        <div className="flex items-center justify-between">
                          <span>Dimensions:</span>
                          <span>{item.dimensions.width} × {item.dimensions.height}</span>
                        </div>
                      )}
                      {item.duration && (
                        <div className="flex items-center justify-between">
                          <span>Duration:</span>
                          <span>{formatDuration(item.duration)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span>Usage:</span>
                        <span>{item.usageCount} times</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 2 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          +{item.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteMedia(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <button className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {mediaItems.map((item) => (
                <div key={item.id} className="group p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, item.id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== item.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      {item.type === 'image' && item.thumbnail ? (
                        <img 
                          src={item.thumbnail} 
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        getTypeIcon(item.type)
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getTypeColor(item.type)}`}>
                          {item.type.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatFileSize(item.size)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Uploaded by {item.uploadedBy}</span>
                        <span>{formatDate(item.uploadedAt)}</span>
                        <span>Used {item.usageCount} times</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-white text-gray-600 rounded-full border">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteMedia(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Media;
