import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadApi, handleApiError } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/store/uiStore';

export interface ImageUploadProps {
  onUpload?: (urls: string[]) => void;
  onRemove?: (url: string) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
  existingImages?: string[];
  folder?: string;
  variant?: 'default' | 'compact' | 'avatar';
  className?: string;
}

interface UploadedFile {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
  progress?: number;
}

/**
 * ImageUpload Component
 * Handles image upload with preview, validation, and progress tracking
 */
export default function ImageUpload({
  onUpload,
  onRemove,
  maxFiles = 5,
  maxSize = 5, // 5MB default
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  existingImages = [],
  folder = 'products',
  variant = 'default',
  className = '',
}: ImageUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate file
   */
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid file format. Please upload ${acceptedFormats.map(f => f.split('/')[1]).join(', ')} files.`;
    }

    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
      return `File size exceeds ${maxSize}MB. Please choose a smaller file.`;
    }

    // Check total files
    if (files.length + existingImages.length >= maxFiles) {
      return `Maximum ${maxFiles} images allowed.`;
    }

    return null;
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles: UploadedFile[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const error = validateFile(file);
      
      if (error) {
        showErrorToast(error);
        return;
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);

      newFiles.push({
        file,
        preview,
        status: 'pending',
      });
    });

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
      // Auto-upload
      uploadFiles(newFiles);
    }
  }, [files.length, existingImages.length, maxFiles, maxSize, acceptedFormats]);

  /**
   * Upload files to server
   */
  const uploadFiles = async (filesToUpload: UploadedFile[]) => {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const fileData = filesToUpload[i];

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.preview === fileData.preview
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        )
      );

      try {
        // Upload to server
        const response = await uploadApi.uploadImage(fileData.file, folder);

        if (response.data.success) {
          const uploadedUrl = response.data.data.url;
          uploadedUrls.push(uploadedUrl);

          // Update status to success
          setFiles((prev) =>
            prev.map((f) =>
              f.preview === fileData.preview
                ? { ...f, status: 'success', url: uploadedUrl, progress: 100 }
                : f
            )
          );

          showSuccessToast('Image uploaded successfully');
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        const errorMessage = handleApiError(error);

        // Update status to error
        setFiles((prev) =>
          prev.map((f) =>
            f.preview === fileData.preview
              ? { ...f, status: 'error', error: errorMessage }
              : f
          )
        );

        showErrorToast(errorMessage, 'Upload Failed');
      }
    }

    // Call onUpload callback with all uploaded URLs
    if (uploadedUrls.length > 0 && onUpload) {
      onUpload(uploadedUrls);
    }
  };

  /**
   * Remove file
   */
  const handleRemove = (preview: string, url?: string) => {
    // Remove from local state
    setFiles((prev) => prev.filter((f) => f.preview !== preview));

    // Revoke preview URL
    URL.revokeObjectURL(preview);

    // Call onRemove callback if URL exists
    if (url && onRemove) {
      onRemove(url);
    }
  };

  /**
   * Remove existing image
   */
  const handleRemoveExisting = (url: string) => {
    if (onRemove) {
      onRemove(url);
    }
  };

  /**
   * Handle drag events
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  /**
   * Trigger file input
   */
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Calculate remaining slots
  const remainingSlots = maxFiles - (files.length + existingImages.length);
  const canUpload = remainingSlots > 0;

  // Variant styles
  const variantStyles = {
    default: 'min-h-[200px]',
    compact: 'min-h-[150px]',
    avatar: 'w-32 h-32 rounded-full',
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {canUpload && (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`
            ${variantStyles[variant]}
            border-2 border-dashed rounded-xl cursor-pointer transition-all
            ${isDragging
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-green-400 bg-gray-50 hover:bg-green-50'
            }
            flex flex-col items-center justify-center gap-4 p-8
          `}
        >
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Upload className="w-8 h-8 text-green-600" />
          </div>

          <div className="text-center">
            <p className="text-gray-900 font-bold text-lg mb-1">
              {isDragging ? 'Drop images here' : 'Upload Images'}
            </p>
            <p className="text-gray-600 text-sm font-semibold mb-2">
              Drag and drop or click to browse
            </p>
            <p className="text-gray-500 text-xs font-medium">
              {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} up to {maxSize}MB • Max {maxFiles} files
            </p>
          </div>

          {remainingSlots < maxFiles && (
            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm font-semibold">
              {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            multiple={maxFiles > 1}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* Image Grid */}
      {(existingImages.length > 0 || files.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Existing Images */}
          {existingImages.map((url, idx) => (
            <div key={`existing-${idx}`} className="relative group aspect-square">
              <img
                src={url}
                alt={`Uploaded ${idx + 1}`}
                className="w-full h-full object-cover rounded-xl border-2 border-gray-200"
              />
              <button
                onClick={() => handleRemoveExisting(url)}
                className="absolute top-2 right-2 w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* New Uploads */}
          {files.map((file, idx) => (
            <div key={file.preview} className="relative group aspect-square">
              <img
                src={file.preview}
                alt={`Upload ${idx + 1}`}
                className="w-full h-full object-cover rounded-xl border-2 border-gray-200"
              />

              {/* Status Overlay */}
              {file.status !== 'success' && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  {file.status === 'uploading' && (
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                      <p className="text-white text-sm font-semibold">Uploading...</p>
                    </div>
                  )}
                  {file.status === 'error' && (
                    <div className="text-center p-4">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-white text-xs font-semibold">{file.error}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Success Badge */}
              {file.status === 'success' && (
                <div className="absolute top-2 left-2 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}

              {/* Remove Button */}
              <button
                onClick={() => handleRemove(file.preview, file.url)}
                className="absolute top-2 right-2 w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {existingImages.length === 0 && files.length === 0 && !canUpload && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="font-semibold">No images uploaded</p>
        </div>
      )}
    </div>
  );
}

/**
 * Avatar Upload - For profile pictures
 */
export function AvatarUpload({
  currentAvatar,
  onUpload,
}: {
  currentAvatar?: string;
  onUpload?: (url: string) => void;
}) {
  return (
    <ImageUpload
      variant="avatar"
      maxFiles={1}
      existingImages={currentAvatar ? [currentAvatar] : []}
      onUpload={(urls) => onUpload?.(urls[0])}
      folder="avatars"
    />
  );
}