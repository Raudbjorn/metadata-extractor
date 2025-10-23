/**
 * @fileoverview Native HTML file input-based image uploader component.
 * This component provides an alternative to UppyUploader using standard HTML5 file input,
 * drag-and-drop, and fetch API. Useful for simpler implementations without Uppy dependency.
 *
 * @module ImageUploader
 */

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';

/**
 * Props for the ImageUploader component.
 *
 * @interface ImageUploaderProps
 * @property {Function} onUploadSuccess - Callback invoked when upload and metadata extraction succeed
 * @property {string} [endpoint] - Optional custom endpoint URL for metadata extraction
 */
interface ImageUploaderProps {
  /**
   * Callback function invoked when image upload and metadata extraction complete successfully.
   * Receives the uploaded file object and extracted metadata.
   *
   * @param {Object} result - Upload result object
   * @param {File} result.file - The original uploaded File object with additional preview URL
   * @param {Record<string, any>} result.metadata - Extracted EXIF metadata from the image
   */
  onUploadSuccess: (result: { file: File & { preview?: string }, metadata: any }) => void;

  /**
   * Optional custom endpoint for metadata extraction.
   * Defaults to local Supabase Edge Function endpoint.
   *
   * @default 'http://localhost:54321/functions/v1/process-upload'
   */
  endpoint?: string;
}

/**
 * Native image uploader component with drag-and-drop support.
 * Provides a lightweight alternative to UppyUploader without external dependencies.
 *
 * Features:
 * - Drag-and-drop file upload
 * - Click to browse file selection
 * - Image preview before upload
 * - Progress indication
 * - File type and size validation
 * - Automatic upload on file selection
 * - Error handling with user-friendly messages
 *
 * @component
 * @param {ImageUploaderProps} props - Component props
 * @returns {JSX.Element} Rendered image uploader interface
 *
 * @example
 * ```tsx
 * <ImageUploader
 *   onUploadSuccess={({ file, metadata }) => {
 *     console.log('File:', file.name);
 *     console.log('Metadata:', metadata);
 *     // Process metadata...
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With custom endpoint
 * <ImageUploader
 *   endpoint="https://your-project.supabase.co/functions/v1/process-upload"
 *   onUploadSuccess={handleSuccess}
 * />
 * ```
 */
const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadSuccess,
  endpoint = 'http://localhost:54321/functions/v1/process-upload'
}) => {
  // State management
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validates the selected file against size and type constraints.
   *
   * @private
   * @param {File} file - The file to validate
   * @returns {boolean} True if file is valid, false otherwise
   * @throws {Error} Sets error state with user-friendly message
   */
  const validateFile = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/tiff', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPG, PNG, TIFF, or WEBP)');
      return false;
    }

    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return false;
    }

    return true;
  };

  /**
   * Uploads the file to the Edge Function and extracts metadata.
   * Creates FormData with the file and sends it to the configured endpoint.
   *
   * @private
   * @async
   * @param {File} file - The file to upload
   * @throws {Error} Throws if upload fails or metadata extraction fails
   */
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Prepare FormData with file
      const formData = new FormData();
      formData.append('files[]', file); // Match Uppy's default field name

      // Upload with progress tracking (simulated for fetch API)
      setUploadProgress(30);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(70);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const metadata = await response.json();
      setUploadProgress(100);

      // Enhance file object with preview URL
      const enhancedFile = Object.assign(file, { preview: previewUrl });

      // Invoke success callback
      onUploadSuccess({ file: enhancedFile, metadata });

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Handles file selection from the file input dialog.
   *
   * @private
   * @param {ChangeEvent<HTMLInputElement>} event - File input change event
   */
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validateFile(file)) {
      uploadFile(file);
    }
  };

  /**
   * Handles drag enter event for visual feedback.
   *
   * @private
   * @param {DragEvent<HTMLDivElement>} event - Drag event
   */
  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  /**
   * Handles drag leave event to remove visual feedback.
   *
   * @private
   * @param {DragEvent<HTMLDivElement>} event - Drag event
   */
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  /**
   * Handles drag over event (required for drop to work).
   *
   * @private
   * @param {DragEvent<HTMLDivElement>} event - Drag event
   */
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  /**
   * Handles file drop event and processes the dropped file.
   *
   * @private
   * @param {DragEvent<HTMLDivElement>} event - Drop event
   */
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file && validateFile(file)) {
      uploadFile(file);
    }
  };

  /**
   * Opens the native file picker dialog.
   *
   * @private
   */
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/tiff,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragging
            ? 'border-cyan-400 bg-cyan-900/20 scale-105'
            : 'border-gray-600 bg-gray-800/50 hover:border-cyan-500 hover:bg-gray-800/70'
          }
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        {/* Upload icon */}
        <svg
          className={`mx-auto h-12 w-12 mb-4 ${isDragging ? 'text-cyan-400' : 'text-gray-500'}`}
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Upload text */}
        {!isUploading ? (
          <>
            <p className="text-lg text-gray-300 mb-2">
              {isDragging ? 'Drop your image here' : 'Drag and drop an image, or click to browse'}
            </p>
            <p className="text-sm text-gray-500">
              JPG, PNG, TIFF, WEBP up to 10MB
            </p>
          </>
        ) : (
          <>
            <p className="text-lg text-cyan-400 mb-4">Uploading and extracting metadata...</p>
            {/* Progress bar */}
            <div className="w-full max-w-xs mx-auto bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-cyan-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">{uploadProgress}%</p>
          </>
        )}

        {/* Preview image */}
        {preview && !error && (
          <div className="mt-4">
            <img
              src={preview}
              alt="Preview"
              className="max-w-xs max-h-48 mx-auto rounded-lg shadow-lg"
            />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-red-400 text-sm flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
