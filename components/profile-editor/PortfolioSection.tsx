import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { portfolioItemSchema, PortfolioItemFormData } from '../../schemas/profileSchemas';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PortfolioSectionProps {
  initialData?: PortfolioItemFormData[];
  onSave: (data: PortfolioItemFormData[]) => Promise<void>;
}

interface SortablePortfolioItemProps {
  item: PortfolioItemFormData;
  onEdit: () => void;
  onDelete: () => void;
}

const SortablePortfolioItem: React.FC<SortablePortfolioItemProps> = ({ item, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id || `temp-${Date.now()}`,
  });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="relative group bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border">
      <button type="button" {...attributes} {...listeners} className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-white/90 dark:bg-black/90 rounded p-1">
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {item.image_url ? (
        <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-gray-200 dark:bg-dark-bg-primary flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      <div className="p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{item.category}</p>
        {item.link && (
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-cv-blue hover:underline mt-1 block truncate">
            {item.link}
          </a>
        )}
      </div>

      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="bg-white/90 dark:bg-black/90 p-1.5 rounded text-cv-blue hover:text-cv-blue-dark">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onClick={onDelete} className="bg-white/90 dark:bg-black/90 p-1.5 rounded text-red-500 hover:text-red-700">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const PortfolioSection: React.FC<PortfolioSectionProps> = ({ initialData = [], onSave }) => {
  const translations = useTranslations();
  const modals = translations.dashboard.modals;
  const { profile } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioItemFormData[]>(initialData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor));
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<PortfolioItemFormData>({
    resolver: zodResolver(portfolioItemSchema),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPortfolio((items) => {
        const oldIndex = items.findIndex((item) => (item.id || `temp-${Date.now()}`) === active.id);
        const newIndex = items.findIndex((item) => (item.id || `temp-${Date.now()}`) === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `portfolio/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('profile-assets').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('profile-assets').getPublicUrl(filePath);
      setImagePreview(publicUrl);
      setValue('image_url', publicUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdd = () => {
    setEditingIndex(null);
    setImagePreview(undefined);
    reset({ title: '', category: '', link: '', description: '', image_url: '' });
    setIsFormOpen(true);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    const item = portfolio[index];
    setImagePreview(item.image_url);
    reset(item);
    setIsFormOpen(true);
  };

  const handleDelete = (index: number) => {
    if (confirm(modals.deletePortfolioConfirm)) {
      const updated = portfolio.filter((_, i) => i !== index);
      setPortfolio(updated);
      onSave(updated);
    }
  };

  const onSubmit = async (data: PortfolioItemFormData) => {
    let updated: PortfolioItemFormData[];
    if (editingIndex !== null) {
      updated = portfolio.map((item, idx) => (idx === editingIndex ? data : item));
    } else {
      updated = [...portfolio, data];
    }
    setPortfolio(updated);
    await onSave(updated);
    setIsFormOpen(false);
  };

  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{modals.addPortfolioItem.replace('Añadir ', '').replace('Add ', '')}</h2>
        <button onClick={handleAdd} className="px-4 py-2 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors text-sm font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {modals.addPortfolioItem}
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={portfolio.map((item) => item.id || `temp-${Date.now()}`)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {portfolio.map((item, index) => (
              <SortablePortfolioItem key={item.id || index} item={item} onEdit={() => handleEdit(index)} onDelete={() => handleDelete(index)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {portfolio.length === 0 && !isFormOpen && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>{modals.noPortfolioYet}</p>
        </div>
      )}

      {isFormOpen && (
        <div className="border-t dark:border-dark-border pt-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{editingIndex !== null ? modals.editPortfolioItem : modals.addPortfolioItem}</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.uploadImage}</label>
              <div className="flex items-center gap-4">
                {imagePreview && <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded" />}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-gray-200 dark:bg-dark-bg-tertiary text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-dark-bg-primary">
                  {isUploading ? modals.uploading : modals.chooseFile || 'Elegir archivo'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf" onChange={handleFileChange} className="hidden" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.projectTitle} *</label>
                <input {...register('title')} type="text" className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white" placeholder="My Project" />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.projectCategory} *</label>
                <input {...register('category')} type="text" className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white" placeholder="Web Development" />
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.projectLink}</label>
              <input {...register('link')} type="url" className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white" placeholder="https://project.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.projectDescription}</label>
              <textarea {...register('description')} rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white resize-none" placeholder="Describe your project..." />
            </div>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors">{modals.cancel}</button>
              <button type="submit" className="px-6 py-2 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors font-medium">{editingIndex !== null ? modals.update : modals.add} {modals.addPortfolioItem.replace('Añadir ', '').replace('Add ', '')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PortfolioSection;
