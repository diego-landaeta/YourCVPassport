import React, { useState, useRef } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTranslations } from '../../../hooks/useTranslations';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { feedService } from '../../../services/feedService';
import type { Profile } from '../../../types';

interface CreatePostFormProps {
  profile: Profile | null;
  onSubmit: (content: string, images: string[]) => Promise<void>;
  isSubmitting: boolean;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({
  profile,
  onSubmit,
  isSubmitting
}) => {
  const { lang } = useLanguage();
  const t = useTranslations();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const translations = {
    placeholder: t.feed.createPost.placeholder,
    publish: t.feed.createPost.publish,
    publishing: t.feed.createPost.publishing,
    addImage: t.feed.createPost.addImage,
    maxImages: t.feed.createPost.maxImages
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) return;

    await onSubmit(content.trim(), images);
    setContent('');
    setImages([]);
    setUploadError(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !profile?.id) return;

    if (images.length + files.length > 4) {
      setUploadError(translations.maxImages);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const newUrls = await feedService.uploadImages(Array.from(files), profile.id);
      setImages(prev => [...prev, ...newUrls]);
    } catch (err) {
      console.error('Error uploading images:', err);
      setUploadError(t.feed.errors.uploadingImage);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageUrl = images[index];
    setImages(prev => prev.filter((_, i) => i !== index));
    // Delete from storage in background
    feedService.deleteImage(imageUrl);
  };

  const canSubmit = (content.trim().length > 0 || images.length > 0) && !isSubmitting && !isUploading;

  const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'U')}&background=3B82F6&color=fff`;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-100 dark:border-dark-border p-4"
    >
      <div className="flex gap-3">
        <img
          src={avatarUrl}
          alt={profile?.full_name || 'User'}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={translations.placeholder}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-xl resize-none focus:ring-2 focus:ring-cv-blue focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            rows={3}
            maxLength={2000}
          />

          {/* Character count */}
          <div className="flex justify-end mt-1">
            <span className={`text-xs ${content.length > 1800 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
              {content.length}/2000
            </span>
          </div>
        </div>
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 ml-15">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <p className="text-red-500 text-sm mt-2 ml-15">{uploadError}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={images.length >= 4 || isUploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= 4 || isUploading}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <PhotoIcon className="w-5 h-5" />
            )}
            <span className="text-sm">{translations.addImage}</span>
          </button>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="px-6 py-2 bg-cv-blue hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {translations.publishing}
            </>
          ) : (
            translations.publish
          )}
        </button>
      </div>
    </form>
  );
};

export default CreatePostForm;
