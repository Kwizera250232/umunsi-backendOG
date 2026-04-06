import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Grid3X3, 
  List, 
  Image as ImageIcon, 
  Video, 
  FileText,
  Check,
  Loader
} from 'lucide-react';
import { apiClient, MediaFile } from '../services/api';

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaFile) => void;
  title?: string;
  type?: 'image' | 'video' | 'all';
}

const MediaPicker: React.FC<MediaPickerProps> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  title = "Select Media",
  type = 'all'
}) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchMediaFiles();
    }
  }, [isOpen]);

  const fetchMediaFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.getMediaFiles();
      setMediaFiles(response);
    } catch (error: any) {
      console.error('Error fetching media files:', error);
      setMediaFiles([]);
      if (error?.message?.includes('Access denied') || error?.message?.includes('No token')) {
        setError('Please log in to access media files');
      } else {
        setError('Failed to load media files. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getServerBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return apiUrl.replace('/api', '');
  };

  const filteredMedia = mediaFiles.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || 
      (filterType === 'image' && file.mimeType.startsWith('image/')) ||
      (filterType === 'video' && file.mimeType.startsWith('video/')) ||
      (filterType === 'document' && !file.mimeType.startsWith('image/') && !file.mimeType.startsWith('video/'));
    
    return matchesSearch && matchesType;
  });

  const handleSelect = (media: MediaFile) => {
    onSelect(media);
    onClose();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-6 h-6 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="w-6 h-6 text-purple-500" />;
    return <FileText className="w-6 h-6 text-gray-500" />;
  };

  const isImage = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search media files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="document">Documents</option>
              </select>
            </div>

            {/* View Mode */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading media files...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <ImageIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <p className="text-red-600 mb-2">Error loading media files</p>
                <p className="text-sm text-gray-500 mb-4">{error}</p>
                <button
                  onClick={fetchMediaFiles}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No media files found</p>
                <p className="text-sm text-gray-500 mt-1">
                  {searchTerm ? 'Try adjusting your search terms' : 'Upload some media files first'}
                </p>
              </div>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
                : 'space-y-2'
            }>
              {filteredMedia.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleSelect(file)}
                  className={`
                    relative group cursor-pointer rounded-lg border-2 border-transparent hover:border-green-500 transition-all duration-200
                    ${viewMode === 'grid' ? 'aspect-square' : 'flex items-center p-3 bg-gray-50 rounded-lg'}
                  `}
                >
                  {viewMode === 'grid' ? (
                    <>
                      {/* Grid View */}
                      {isImage(file.mimeType) ? (
                        <img
                          src={`${getServerBaseUrl()}${file.thumbnailUrl || file.url}`}
                          alt={file.originalName}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                          {getFileIcon(file.mimeType)}
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="bg-white rounded-full p-2">
                            <Check className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                      </div>
                      
                      {/* File Info */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 rounded-b-lg">
                        <p className="text-white text-xs truncate">{file.originalName}</p>
                        <p className="text-white text-xs opacity-75">{formatFileSize(file.size)}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* List View */}
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                        {isImage(file.mimeType) ? (
                          <img
                            src={`${getServerBaseUrl()}${file.thumbnailUrl || file.url}`}
                            alt={file.originalName}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          getFileIcon(file.mimeType)
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.originalName}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <Check className="w-5 h-5 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {filteredMedia.length} file{filteredMedia.length !== 1 ? 's' : ''} found
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPicker;
