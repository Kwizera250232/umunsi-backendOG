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
  Database
} from 'lucide-react';
import { apiClient } from '../../services/api';
import MediaLibraryModal from '../../components/MediaLibraryModal';

// Helper function to format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Document Viewer Component
const DocumentViewer: React.FC<{ 
  file: MediaFile; 
  getServerBaseUrl: () => string; 
}> = ({ file, getServerBaseUrl }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${getServerBaseUrl()}${file.url}`);
        if (!response.ok) {
          throw new Error('Failed to fetch document content');
        }
        
        if (file.mimeType.startsWith('text/') || 
            file.mimeType === 'application/json' || 
            file.mimeType === 'application/xml') {
          const text = await response.text();
          setContent(text);
        } else {
          throw new Error('Unsupported document type');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [file.url, file.mimeType, getServerBaseUrl]);

  if (loading) {
    return (
      <div className="w-full h-full bg-[#181a20] rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#fcd535]/20 border-t-[#fcd535] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-[#181a20] rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-2">Error loading document</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#181a20] rounded-2xl overflow-hidden flex flex-col border border-[#2b2f36]" style={{ minHeight: '90vh' }}>
      {/* Header */}
      <div className="bg-[#0b0e11] px-6 py-4 border-b border-[#2b2f36] flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="w-6 h-6 text-[#fcd535] mr-3" />
          <h3 className="text-lg font-medium text-white">{file.originalName}</h3>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-400">{formatFileSize(file.size)}</span>
          <a
            href={`${getServerBaseUrl()}${file.url}`}
            download={file.originalName}
            className="p-2 text-gray-400 hover:text-[#fcd535] transition-colors bg-[#1e2329] rounded-lg hover:bg-[#2b2f36]"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-[#0b0e11]" style={{ minHeight: 'calc(90vh - 80px)' }}>
        {file.mimeType === 'application/json' ? (
          <pre className="text-base text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
            {JSON.stringify(JSON.parse(content), null, 2)}
          </pre>
        ) : file.mimeType === 'application/xml' ? (
          <pre className="text-base text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
            {content}
          </pre>
        ) : (
          <pre className="text-base text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
};

// Helper function to get server base URL
const getServerBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace('/api', '');
};

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  category: string;
  tags: string[];
  description?: string;
  uploadedBy: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  isFeatured: boolean;
}

const MediaLibrary: React.FC = () => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [selectedMediaFile, setSelectedMediaFile] = useState<MediaFile | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [showMediaLibraryModal, setShowMediaLibraryModal] = useState(false);

  const categories = [
    { value: 'all', label: 'All Files' },
    { value: 'images', label: 'Images' },
    { value: 'videos', label: 'Videos' },
    { value: 'documents', label: 'Documents' },
    { value: 'audio', label: 'Audio' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchMediaFiles();
  }, []);

  const fetchMediaFiles = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getMediaFiles();
      setMediaFiles(response || []);
    } catch (error) {
      console.error('Error fetching media files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    try {
      setUploading(true);
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      await apiClient.uploadMediaFiles(formData);
      await fetchMediaFiles();
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFiles = async (fileIds: string[]) => {
    setFilesToDelete(fileIds);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await apiClient.deleteMediaFiles(filesToDelete);
      await fetchMediaFiles();
      setSelectedFiles([]);
      setShowDeleteConfirm(false);
      setFilesToDelete([]);
    } catch (error) {
      console.error('Error deleting files:', error);
      setShowDeleteConfirm(false);
      setFilesToDelete([]);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setFilesToDelete([]);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text') || 
        mimeType === 'application/json' || mimeType === 'application/xml') return FileText;
    return File;
  };

  const isDocument = (mimeType: string) => {
    return mimeType === 'application/pdf' || 
           mimeType.startsWith('text/') || 
           mimeType === 'application/json' || 
           mimeType === 'application/xml' ||
           mimeType.includes('document');
  };

  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const selectAllFiles = () => {
    setSelectedFiles(filteredFiles.map(file => file.id));
  };

  const clearSelection = () => {
    setSelectedFiles([]);
  };

  const handleMediaItemClick = (file: MediaFile, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    
    setSelectedMediaFile(file);
    setShowFullscreenModal(true);
  };

  const closeFullscreenModal = () => {
    setShowFullscreenModal(false);
    setSelectedMediaFile(null);
  };

  const navigateMedia = (direction: 'prev' | 'next') => {
    if (!selectedMediaFile) return;
    
    const currentIndex = filteredFiles.findIndex(file => file.id === selectedMediaFile.id);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredFiles.length - 1;
    } else {
      newIndex = currentIndex < filteredFiles.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedMediaFile(filteredFiles[newIndex]);
  };

  // Stats
  const totalFiles = mediaFiles.length;
  const imageCount = mediaFiles.filter(f => f.mimeType.startsWith('image/')).length;
  const videoCount = mediaFiles.filter(f => f.mimeType.startsWith('video/')).length;
  const docCount = mediaFiles.filter(f => f.mimeType.includes('pdf') || f.mimeType.includes('document')).length;

  return (
    <div className="p-6 bg-[#0b0e11] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl">
              <Database className="w-6 h-6 text-orange-400" />
            </div>
          <div>
              <h1 className="text-2xl font-bold text-white">Media Library</h1>
              <p className="text-gray-400 mt-1">Manage your media files and assets</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowMediaLibraryModal(true)}
              className="inline-flex items-center px-4 py-2.5 text-gray-300 border border-[#2b2f36] rounded-xl hover:bg-[#1e2329] transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              Browse Library
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center px-5 py-2.5 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-semibold rounded-xl hover:from-[#f0b90b] hover:to-[#d4a00a] transition-all shadow-lg shadow-[#fcd535]/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Files
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#181a20] p-5 rounded-2xl border border-[#2b2f36]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Files</p>
              <p className="text-2xl font-bold text-white mt-1">{totalFiles}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#181a20] p-5 rounded-2xl border border-[#2b2f36]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Images</p>
              <p className="text-2xl font-bold text-white mt-1">{imageCount}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <ImageIcon className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#181a20] p-5 rounded-2xl border border-[#2b2f36]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Videos</p>
              <p className="text-2xl font-bold text-white mt-1">{videoCount}</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Video className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#181a20] p-5 rounded-2xl border border-[#2b2f36]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Documents</p>
              <p className="text-2xl font-bold text-white mt-1">{docCount}</p>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-xl">
              <FileText className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-[#181a20] p-5 rounded-2xl border border-[#2b2f36] mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-gray-300 focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <div className="flex border border-[#2b2f36] rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 ${viewMode === 'grid' ? 'bg-[#fcd535]/10 text-[#fcd535]' : 'bg-[#0b0e11] text-gray-400 hover:bg-[#1e2329]'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 ${viewMode === 'list' ? 'bg-[#fcd535]/10 text-[#fcd535]' : 'bg-[#0b0e11] text-gray-400 hover:bg-[#1e2329]'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Actions */}
      {selectedFiles.length > 0 && (
        <div className="bg-[#fcd535]/10 border border-[#fcd535]/30 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-[#fcd535] font-medium">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleDeleteFiles(selectedFiles)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 bg-[#1e2329] text-gray-300 rounded-xl hover:bg-[#2b2f36] transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Files */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#fcd535]/20 border-t-[#fcd535] rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-[#181a20] rounded-2xl border border-[#2b2f36]">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No files found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Upload your first media file to get started'
                }
              </p>
              {!searchTerm && selectedCategory === 'all' && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-semibold rounded-xl hover:from-[#f0b90b] hover:to-[#d4a00a] transition-all"
                >
                  Upload Files
                </button>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'p-6' : 'p-4'}>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredFiles.map((file) => {
                    const FileIcon = getFileIcon(file.mimeType);
                    return (
                      <div
                        key={file.id}
                        className={`relative group cursor-pointer rounded-xl border-2 transition-all ${
                          selectedFiles.includes(file.id) 
                            ? 'border-[#fcd535] bg-[#fcd535]/5' 
                            : 'border-[#2b2f36] hover:border-[#fcd535]/50 bg-[#0b0e11]'
                        }`}
                        onClick={(e) => handleMediaItemClick(file, e)}
                      >
                        <div className="aspect-square p-4 flex flex-col items-center justify-center">
                          {file.mimeType.startsWith('image/') ? (
                            <img
                              src={`${getServerBaseUrl()}${file.thumbnailUrl || file.url}`}
                              alt={file.originalName}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const sibling = e.currentTarget.nextElementSibling;
                                if (sibling) (sibling as HTMLElement).style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center ${file.mimeType.startsWith('image/') ? 'hidden' : 'flex'}`}>
                            <FileIcon className="w-10 h-10 text-gray-500" />
                          </div>
                        </div>
                        <div className="p-3 border-t border-[#2b2f36]">
                          <p className="text-xs font-medium text-white truncate">
                            {file.originalName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMediaItemClick(file, e);
                            }}
                            className="p-1.5 bg-[#181a20] rounded-lg shadow-lg hover:bg-[#2b2f36] border border-[#2b2f36]"
                            title={isDocument(file.mimeType) ? "Read" : "View"}
                          >
                            {isDocument(file.mimeType) ? (
                              <FileText className="w-3 h-3 text-blue-400" />
                            ) : (
                              <Eye className="w-3 h-3 text-gray-300" />
                            )}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFiles([file.id]);
                            }}
                            className="p-1.5 bg-[#181a20] rounded-lg shadow-lg hover:bg-red-500/10 border border-[#2b2f36]"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                        <div className="absolute top-2 left-2">
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(file.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleFileSelection(file.id);
                            }}
                            className="w-4 h-4 text-[#fcd535] bg-[#0b0e11] border-[#2b2f36] rounded focus:ring-[#fcd535]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map((file) => {
                    const FileIcon = getFileIcon(file.mimeType);
                    return (
                      <div
                        key={file.id}
                        className={`flex items-center p-4 rounded-xl border transition-all cursor-pointer ${
                          selectedFiles.includes(file.id) 
                            ? 'border-[#fcd535] bg-[#fcd535]/5' 
                            : 'border-[#2b2f36] hover:border-[#fcd535]/50 bg-[#0b0e11]'
                        }`}
                        onClick={(e) => handleMediaItemClick(file, e)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleFileSelection(file.id);
                          }}
                          className="w-4 h-4 text-[#fcd535] bg-[#0b0e11] border-[#2b2f36] rounded focus:ring-[#fcd535] mr-4"
                        />
                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-[#181a20] rounded-xl border border-[#2b2f36]">
                          <FileIcon className="w-6 h-6 text-gray-500" />
                        </div>
                        <div className="flex-1 ml-4 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {file.originalName}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <span>{formatFileSize(file.size)}</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                            <span className="mx-2">•</span>
                            <span>{file.uploadedBy.firstName} {file.uploadedBy.lastName}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {file.isFeatured && (
                            <Star className="w-4 h-4 text-yellow-400" />
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMediaItemClick(file, e);
                            }}
                            className="p-2 hover:bg-[#1e2329] rounded-lg transition-colors"
                            title={isDocument(file.mimeType) ? "Read" : "View"}
                          >
                            {isDocument(file.mimeType) ? (
                              <FileText className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFiles([file.id]);
                            }}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#181a20] rounded-2xl w-full max-w-md border border-[#2b2f36]">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Upload Files</h3>
              <div className="border-2 border-dashed border-[#2b2f36] rounded-xl p-8 text-center hover:border-[#fcd535]/50 transition-colors bg-[#0b0e11]">
                <Upload className="w-10 h-10 text-gray-500 mx-auto mb-4" />
                <p className="text-sm text-gray-400 mb-4">
                  Drag and drop files here, or click to select
                </p>
                <input
                  type="file"
                  multiple
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-semibold rounded-xl hover:from-[#f0b90b] hover:to-[#d4a00a] transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Select Files
                </label>
              </div>
              {uploading && (
                <div className="mt-4 text-center">
                  <div className="w-6 h-6 border-2 border-[#fcd535]/20 border-t-[#fcd535] rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-gray-400 mt-2">Uploading files...</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-[#0b0e11] rounded-b-2xl flex justify-end border-t border-[#2b2f36]">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Media Modal */}
      {showFullscreenModal && selectedMediaFile && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={closeFullscreenModal}
              className="absolute top-4 right-4 z-10 p-2 bg-[#181a20] text-white rounded-xl hover:bg-[#2b2f36] transition-all border border-[#2b2f36]"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Buttons */}
            {filteredFiles.length > 1 && (
              <>
                <button
                  onClick={() => navigateMedia('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-[#181a20] text-white rounded-xl hover:bg-[#2b2f36] transition-all border border-[#2b2f36]"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => navigateMedia('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-[#181a20] text-white rounded-xl hover:bg-[#2b2f36] transition-all border border-[#2b2f36]"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Media Content */}
            <div className="w-full h-full p-4 flex items-center justify-center">
              {selectedMediaFile.mimeType.startsWith('image/') ? (
                <img
                  src={`${getServerBaseUrl()}${selectedMediaFile.thumbnailUrl || selectedMediaFile.url}`}
                  alt={selectedMediaFile.originalName}
                  className="max-w-full max-h-full object-contain rounded-2xl"
                />
              ) : selectedMediaFile.mimeType.startsWith('video/') ? (
                <video
                  src={`${getServerBaseUrl()}${selectedMediaFile.url}`}
                  controls
                  className="max-w-full max-h-full rounded-2xl"
                >
                  Your browser does not support the video tag.
                </video>
              ) : selectedMediaFile.mimeType.startsWith('audio/') ? (
                <div className="bg-[#181a20] p-8 rounded-2xl text-center border border-[#2b2f36]">
                  <Music className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <audio
                    src={`${getServerBaseUrl()}${selectedMediaFile.url}`}
                    controls
                    className="w-full max-w-md"
                  >
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              ) : selectedMediaFile.mimeType === 'application/pdf' ? (
                <div className="w-full h-full bg-[#181a20] rounded-2xl overflow-hidden border border-[#2b2f36] relative">
                  <iframe
                    src={`${getServerBaseUrl()}${selectedMediaFile.url}#toolbar=1&navpanes=1&scrollbar=1&zoom=100`}
                    className="w-full h-full border-0"
                    title={selectedMediaFile.originalName}
                    style={{ minHeight: '90vh' }}
                  />
                </div>
              ) : selectedMediaFile.mimeType.startsWith('text/') || 
                selectedMediaFile.mimeType === 'application/json' ||
                selectedMediaFile.mimeType === 'application/xml' ? (
                <DocumentViewer 
                  file={selectedMediaFile} 
                  getServerBaseUrl={getServerBaseUrl}
                />
              ) : (
                <div className="bg-[#181a20] p-8 rounded-2xl text-center max-w-md border border-[#2b2f36]">
                  <File className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-white mb-2">{selectedMediaFile.originalName}</p>
                  <p className="text-sm text-gray-500 mb-4">{formatFileSize(selectedMediaFile.size)}</p>
                  <a
                    href={`${getServerBaseUrl()}${selectedMediaFile.url}`}
                    download={selectedMediaFile.originalName}
                    className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-semibold rounded-xl hover:from-[#f0b90b] hover:to-[#d4a00a] transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </div>
              )}
            </div>

            {/* Media Info */}
            {!isDocument(selectedMediaFile.mimeType) && (
              <div className="absolute bottom-4 left-4 right-4 bg-[#181a20]/90 backdrop-blur-sm text-white p-4 rounded-2xl border border-[#2b2f36]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{selectedMediaFile.originalName}</h3>
                    <p className="text-sm text-gray-400">
                      {formatFileSize(selectedMediaFile.size)} • {selectedMediaFile.category} • 
                      Uploaded by {selectedMediaFile.uploadedBy.firstName} {selectedMediaFile.uploadedBy.lastName}
                    </p>
                    {selectedMediaFile.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedMediaFile.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-[#fcd535]/10 text-[#fcd535] text-xs rounded-lg border border-[#fcd535]/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedMediaFile.isFeatured && (
                      <Star className="w-5 h-5 text-yellow-400" />
                    )}
                    {selectedMediaFile.isPublic ? (
                      <Globe className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Media Counter */}
            {filteredFiles.length > 1 && (
              <div className="absolute top-4 left-4 bg-[#181a20] text-white px-3 py-1.5 rounded-xl text-sm border border-[#2b2f36]">
                {filteredFiles.findIndex(f => f.id === selectedMediaFile.id) + 1} of {filteredFiles.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#181a20] rounded-2xl p-6 max-w-md w-full border border-[#2b2f36]">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">
                  Delete {filesToDelete.length === 1 ? 'File' : 'Files'}
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-400">
                Are you sure you want to delete {filesToDelete.length === 1 ? 'this file' : `these ${filesToDelete.length} files`}? 
                This will permanently remove {filesToDelete.length === 1 ? 'it' : 'them'} from the server.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2.5 text-sm font-medium text-gray-300 bg-[#0b0e11] border border-[#2b2f36] rounded-xl hover:bg-[#1e2329] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete {filesToDelete.length === 1 ? 'File' : 'Files'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={showMediaLibraryModal}
        onClose={() => setShowMediaLibraryModal(false)}
        title="Media Library"
        mode="manage"
        type="all"
      />
    </div>
  );
};

export default MediaLibrary;
