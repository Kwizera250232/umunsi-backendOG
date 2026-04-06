import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Download, 
  Trash2, 
  Eye, 
  Edit,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  File,
  Calendar,
  User,
  MoreVertical,
  Plus,
  FolderOpen,
  Star,
  Tag,
  X,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  Check,
  Loader
} from 'lucide-react';
import { apiClient, MediaFile } from '../services/api';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (media: MediaFile) => void;
  title?: string;
  mode?: 'select' | 'manage'; // 'select' for choosing images, 'manage' for full library
  type?: 'image' | 'video' | 'all';
}

const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelect,
  title = "Media Library",
  mode = 'select',
  type = 'all'
}) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchMediaFiles();
      // Set initial filter based on type prop
      if (type === 'image') {
        setFilterType('image');
      } else if (type === 'video') {
        setFilterType('video');
      }
    }
  }, [isOpen, type]);

  const fetchMediaFiles = async () => {
    console.log('📂 Fetching media files...');
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.getMediaFiles();
      console.log('📂 Media files fetched:', response.length, 'files');
      console.log('📂 First few files:', response.slice(0, 3));
      setMediaFiles(response);
    } catch (error: any) {
      console.error('❌ Error fetching media files:', error);
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
    // Get the API URL and extract the base server URL
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

  const handleFileSelect = (fileId: string) => {
    console.log('📁 HandleFileSelect called with fileId:', fileId, 'mode:', mode);
    
    if (mode === 'select') {
      // In select mode, immediately select and close
      const file = mediaFiles.find(f => f.id === fileId);
      console.log('🔍 Found file:', file);
      
      if (file && onSelect) {
        console.log('✅ Calling onSelect with file:', file);
        onSelect(file);
        onClose();
      } else {
        console.error('❌ File not found or onSelect not provided');
      }
    } else {
      // In manage mode, toggle selection
      setSelectedFiles(prev => 
        prev.includes(fileId) 
          ? prev.filter(id => id !== fileId)
          : [...prev, fileId]
      );
    }
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === filteredMedia.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredMedia.map(file => file.id));
    }
  };

  const handleDeleteFiles = () => {
    setFilesToDelete(selectedFiles);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await apiClient.deleteMediaFiles(filesToDelete);
      setMediaFiles(prev => prev.filter(file => !filesToDelete.includes(file.id)));
      setSelectedFiles([]);
      setShowDeleteConfirm(false);
      setFilesToDelete([]);
    } catch (error) {
      console.error('Error deleting files:', error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setFilesToDelete([]);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-6 h-6 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="w-6 h-6 text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-6 h-6 text-green-500" />;
    return <FileText className="w-6 h-6 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isImage = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {mode === 'select' ? 'Select an image to insert' : 'Manage your media files'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-4">
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

            {/* Filters */}
            <div className="flex items-center space-x-3">
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

              {/* View Mode */}
              <div className="flex items-center space-x-1">
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

              {/* Bulk Actions (only in manage mode) */}
              {mode === 'manage' && selectedFiles.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedFiles.length} selected
                  </span>
                  <button
                    onClick={handleDeleteFiles}
                    className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Select All (only in manage mode) */}
          {mode === 'manage' && filteredMedia.length > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedFiles.length === filteredMedia.length && filteredMedia.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Select all ({filteredMedia.length} files)
                </span>
              </label>
            </div>
          )}
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
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                : 'space-y-2'
            }>
              {filteredMedia.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleFileSelect(file.id)}
                  className={`
                    relative group cursor-pointer rounded-lg border-2 transition-all duration-200
                    ${mode === 'manage' && selectedFiles.includes(file.id) 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-transparent hover:border-green-500'
                    }
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
                      
                      {/* Selection Indicator */}
                      {mode === 'manage' && selectedFiles.includes(file.id) && (
                        <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="bg-white rounded-full p-2">
                            {mode === 'select' ? (
                              <Check className="w-5 h-5 text-green-600" />
                            ) : (
                              <Eye className="w-5 h-5 text-gray-600" />
                            )}
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
                        {mode === 'select' ? (
                          <Check className="w-5 h-5 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        ) : selectedFiles.includes(file.id) ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
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
            <div className="flex items-center space-x-3">
              {mode === 'manage' && (
                <button
                  onClick={() => window.open('/admin/media/add', '_blank')}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Media
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {mode === 'select' ? 'Cancel' : 'Close'}
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Delete Files</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete {filesToDelete.length} file{filesToDelete.length !== 1 ? 's' : ''}?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaLibraryModal;
