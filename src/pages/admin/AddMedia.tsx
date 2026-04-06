import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  X, 
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  File,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  Tag,
  Globe,
  Lock,
  Star,
  ArrowLeft,
  CloudUpload,
  Sparkles
} from 'lucide-react';
import { apiClient } from '../../services/api';

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  category: string;
  description: string;
  tags: string[];
  isPublic: boolean;
  isFeatured: boolean;
}

const AddMedia: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [newTag, setNewTag] = useState('');

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return FileText;
    return File;
  };

  const getFileCategory = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'documents';
    return 'other';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFiles = useCallback((files: FileList) => {
    const validFiles: File[] = [];
    const invalidFiles: { name: string; reason: string }[] = [];

    Array.from(files).forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isDocument = file.type === 'application/pdf' || 
                        file.type.startsWith('text/') || 
                        file.type === 'application/json' || 
                        file.type === 'application/xml' ||
                        file.type.includes('document');
      
      if (isImage && file.size > 3 * 1024 * 1024) {
        invalidFiles.push({ name: file.name, reason: 'Image file size cannot exceed 3MB' });
      } else if (isVideo && file.size > 20 * 1024 * 1024) {
        invalidFiles.push({ name: file.name, reason: 'Video file size cannot exceed 20MB' });
      } else if (isDocument && file.size > 10 * 1024 * 1024) {
        invalidFiles.push({ name: file.name, reason: 'Document file size cannot exceed 10MB' });
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      const errorMessage = invalidFiles.map(f => `${f.name}: ${f.reason}`).join('\n');
      alert(`Some files were rejected:\n${errorMessage}`);
    }

    if (validFiles.length > 0) {
      const newFiles: UploadedFile[] = validFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        progress: 0,
        status: 'pending',
        category: getFileCategory(file.type),
        description: '',
        tags: [],
        isPublic: true,
        isFeatured: false
      }));

      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const updateFileProperty = (id: string, property: keyof UploadedFile, value: any) => {
    setUploadedFiles(prev => prev.map(file => 
      file.id === id ? { ...file, [property]: value } : file
    ));
  };

  const addTag = (fileId: string) => {
    if (newTag.trim()) {
      updateFileProperty(fileId, 'tags', [...uploadedFiles.find(f => f.id === fileId)?.tags || [], newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (fileId: string, tagIndex: number) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file) {
      const newTags = file.tags.filter((_, index) => index !== tagIndex);
      updateFileProperty(fileId, 'tags', newTags);
    }
  };

  const uploadFiles = async () => {
    if (uploadedFiles.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();

    uploadedFiles.forEach(file => {
      formData.append('files', file.file);
    });

    try {
      setUploadedFiles(prev => prev.map(file => ({ ...file, status: 'uploading', progress: 50 })));

      const response = await apiClient.uploadMediaFiles(formData);
      
      setUploadedFiles(prev => prev.map(file => ({ ...file, status: 'success', progress: 100 })));

      for (let i = 0; i < response.length; i++) {
        const uploadedFile = uploadedFiles[i];
        const serverFile = response[i];
        
        if (uploadedFile.description || uploadedFile.tags.length > 0 || !uploadedFile.isPublic || uploadedFile.isFeatured) {
          try {
            await apiClient.updateMediaFile(serverFile.id, {
              description: uploadedFile.description,
              tags: uploadedFile.tags,
              isPublic: uploadedFile.isPublic,
              isFeatured: uploadedFile.isFeatured,
              category: uploadedFile.category
            });
          } catch (updateError) {
            console.error('Error updating file metadata:', updateError);
          }
        }
      }

      setTimeout(() => {
        navigate('/admin/media/library');
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadedFiles(prev => prev.map(file => ({ 
        ...file, 
        status: 'error', 
        error: 'Upload failed' 
      })));
    } finally {
      setIsUploading(false);
    }
  };

  const clearAllFiles = () => {
    uploadedFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setUploadedFiles([]);
  };

  return (
    <div className="p-6 bg-[#0b0e11] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/media/library')}
              className="flex items-center px-3 py-2 text-gray-400 hover:text-[#fcd535] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Library
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-[#fcd535]/20 to-[#f0b90b]/20 rounded-xl">
                <CloudUpload className="w-6 h-6 text-[#fcd535]" />
              </div>
            <div>
                <h1 className="text-2xl font-bold text-white">Upload Media</h1>
                <p className="text-gray-400 mt-1">Add images, videos, and documents</p>
              </div>
            </div>
          </div>
          {uploadedFiles.length > 0 && (
            <div className="flex items-center space-x-3">
              <button
                onClick={clearAllFiles}
                className="px-4 py-2.5 text-gray-400 hover:text-red-400 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={uploadFiles}
                disabled={isUploading || uploadedFiles.some(f => f.status === 'error')}
                className="flex items-center px-6 py-2.5 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-semibold rounded-xl hover:from-[#f0b90b] hover:to-[#d4a00a] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#fcd535]/20"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0b0e11] mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {uploadedFiles.length} File{uploadedFiles.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Area */}
      {uploadedFiles.length === 0 && (
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
            dragActive 
              ? 'border-[#fcd535] bg-[#fcd535]/5' 
              : 'border-[#2b2f36] hover:border-[#fcd535]/50 bg-[#181a20]'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] rounded-2xl blur opacity-30 animate-pulse"></div>
            <div className="relative bg-[#1e2329] rounded-2xl p-5 border border-[#2b2f36]">
              <CloudUpload className="w-10 h-10 text-[#fcd535]" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Drop files here or click to browse
          </h3>
          <p className="text-gray-400 mb-3">
            Support for images, videos, documents (PDF, TXT, JSON, XML), and audio files
          </p>
          <p className="text-xs text-gray-500 mb-6">
            Max file sizes: Images (3MB) • Videos (20MB) • Documents (10MB)
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-semibold rounded-xl hover:from-[#f0b90b] hover:to-[#d4a00a] transition-all shadow-lg shadow-[#fcd535]/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            Select Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />
        </div>
      )}

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          {uploadedFiles.map((file) => {
            const FileIcon = getFileIcon(file.file.type);
            return (
              <div key={file.id} className="bg-[#181a20] rounded-2xl border border-[#2b2f36]">
                <div className="p-5">
                  <div className="flex items-start space-x-4">
                    {/* File Preview/Icon */}
                    <div className="flex-shrink-0">
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.file.name}
                          className="w-20 h-20 object-cover rounded-xl border border-[#2b2f36]"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-[#0b0e11] rounded-xl flex items-center justify-center border border-[#2b2f36]">
                          <FileIcon className="w-10 h-10 text-gray-500" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-white truncate">
                            {file.file.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatFileSize(file.file.size)} • {file.category}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {file.status === 'success' && (
                            <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                              <Check className="w-5 h-5 text-emerald-400" />
                            </div>
                          )}
                          {file.status === 'error' && (
                            <div className="p-1.5 bg-red-500/10 rounded-lg">
                              <AlertCircle className="w-5 h-5 text-red-400" />
                            </div>
                          )}
                          {file.status === 'uploading' && (
                            <div className="w-5 h-5 border-2 border-[#fcd535]/20 border-t-[#fcd535] rounded-full animate-spin"></div>
                          )}
                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {file.status === 'uploading' && (
                        <div className="mt-3">
                          <div className="w-full bg-[#0b0e11] rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-[#fcd535] to-[#f0b90b] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {file.status === 'error' && file.error && (
                        <p className="text-xs text-red-400 mt-2">{file.error}</p>
                      )}

                      {/* File Settings */}
                      {file.status === 'pending' && (
                        <div className="mt-4 space-y-4">
                          {/* Description */}
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">
                              Description
                            </label>
                            <textarea
                              value={file.description}
                              onChange={(e) => updateFileProperty(file.id, 'description', e.target.value)}
                              placeholder="Add a description for this file..."
                              className="w-full px-4 py-3 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]"
                              rows={2}
                            />
                          </div>

                          {/* Tags */}
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">
                              Tags
                            </label>
                            {file.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                              {file.tags.map((tag, index) => (
                                <span
                                  key={index}
                                    className="inline-flex items-center px-3 py-1.5 bg-[#fcd535]/10 text-[#fcd535] text-xs rounded-lg border border-[#fcd535]/30"
                                >
                                  <Tag className="w-3 h-3 mr-1" />
                                  {tag}
                                  <button
                                    onClick={() => removeTag(file.id, index)}
                                      className="ml-2 text-[#fcd535] hover:text-white"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            )}
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addTag(file.id)}
                                placeholder="Add a tag..."
                                className="flex-1 px-4 py-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-[#fcd535]/50 focus:border-[#fcd535]"
                              />
                              <button
                                onClick={() => addTag(file.id)}
                                className="px-4 py-2.5 bg-[#fcd535] text-[#0b0e11] font-medium text-sm rounded-xl hover:bg-[#f0b90b] transition-colors"
                              >
                                Add
                              </button>
                            </div>
                          </div>

                          {/* Settings */}
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36] cursor-pointer hover:border-[#fcd535]/50 transition-colors">
                              <input
                                type="checkbox"
                                checked={file.isPublic}
                                onChange={(e) => updateFileProperty(file.id, 'isPublic', e.target.checked)}
                                className="w-4 h-4 text-[#fcd535] bg-[#0b0e11] border-[#2b2f36] rounded focus:ring-[#fcd535]"
                              />
                              <Globe className="w-4 h-4 ml-2 text-emerald-400" />
                              <span className="ml-2 text-xs text-gray-300">Public</span>
                            </label>
                            <label className="flex items-center p-3 bg-[#0b0e11] rounded-xl border border-[#2b2f36] cursor-pointer hover:border-[#fcd535]/50 transition-colors">
                              <input
                                type="checkbox"
                                checked={file.isFeatured}
                                onChange={(e) => updateFileProperty(file.id, 'isFeatured', e.target.checked)}
                                className="w-4 h-4 text-[#fcd535] bg-[#0b0e11] border-[#2b2f36] rounded focus:ring-[#fcd535]"
                              />
                              <Star className="w-4 h-4 ml-2 text-yellow-400" />
                              <span className="ml-2 text-xs text-gray-300">Featured</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Summary */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 bg-[#181a20] rounded-2xl border border-[#2b2f36] p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">
                Ready to upload {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Total size: {formatFileSize(uploadedFiles.reduce((sum, file) => sum + file.file.size, 0))}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {uploadedFiles.filter(f => f.status === 'success').length > 0 && (
                <span className="flex items-center text-xs text-emerald-400">
                  <Check className="w-4 h-4 mr-1" />
                  {uploadedFiles.filter(f => f.status === 'success').length} uploaded successfully
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddMedia;
