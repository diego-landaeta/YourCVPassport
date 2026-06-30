import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LegacyPortfolioItemFormData, ProjectFormData, CertificationFormData, CollaborationFormData } from '../../schemas/profileSchemas';
import { getProfileSchemas } from '../../schemas/getProfileSchemas';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useEditorTargetId } from '../../contexts/EditorTargetContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirmDialog } from '../ConfirmDialog';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PortfolioSectionProps {
  initialData?: LegacyPortfolioItemFormData[];
  onSave: (data: LegacyPortfolioItemFormData[]) => Promise<void>;
  onNext?: () => void;
}

type TabType = 'projects' | 'certifications' | 'collaborations';

interface SortableItemProps {
  item: LegacyPortfolioItemFormData;
  onEdit: () => void;
  onDelete: () => void;
  type: TabType;
}

const SortableItem: React.FC<SortableItemProps> = ({ item, onEdit, onDelete, type }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id || `temp-${Date.now()}`,
  });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  // Render based on type
  if (type === 'certifications') {
    return (
      <div ref={setNodeRef} style={style} className="relative group bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4 border border-gray-200 dark:border-dark-border">
        <button type="button" {...attributes} {...listeners} className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-white/90 dark:bg-black/90 rounded p-1">
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
          </svg>
        </button>

        <div className="pl-8">
          <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
          <p className="text-sm text-cv-blue">{item.issuer}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Issued: {item.issue_date} {item.expiry_date && `• Expires: ${item.expiry_date}`}
          </p>
          {item.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{item.description}</p>
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
  }

  if (type === 'collaborations') {
    return (
      <div ref={setNodeRef} style={style} className="relative group bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4 border border-gray-200 dark:border-dark-border">
        <button type="button" {...attributes} {...listeners} className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-white/90 dark:bg-black/90 rounded p-1">
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
          </svg>
        </button>

        <div className="pl-8">
          <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
          <p className="text-sm text-cv-blue">{item.organization} • {item.role}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {item.start_date} - {item.is_current ? 'Present' : (item.end_date || 'Present')}
          </p>
          {item.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{item.description}</p>
          )}
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cv-blue hover:underline mt-2 block">
              View Project →
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
  }

  // Default: Projects
  return (
    <div ref={setNodeRef} style={style} className="relative group bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border">
      <button type="button" {...attributes} {...listeners} className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-white/90 dark:bg-black/90 rounded p-1">
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.title}
          className="w-full h-32 sm:h-48 object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const placeholder = e.currentTarget.nextElementSibling;
            if (placeholder) placeholder.classList.remove('hidden');
          }}
        />
      ) : null}
      <div className={`w-full h-32 sm:h-48 bg-gray-200 dark:bg-dark-bg-primary flex items-center justify-center ${item.image_url ? 'hidden' : ''}`}>
        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <div className="p-3 sm:p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base line-clamp-2">{item.title}</h4>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{item.category}</p>
        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cv-blue hover:underline mt-1 block truncate">
            {item.url}
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

const PortfolioSection: React.FC<PortfolioSectionProps> = ({ initialData = [], onSave, onNext }) => {
  const translations = useTranslations();
  const modals = translations.dashboard.modals;
  const { profile } = useAuth();
  const editorTargetId = useEditorTargetId();
  const targetProfileId = editorTargetId || profile?.id;
  const toast = useToastContext();
  const { confirm, Dialog } = useConfirmDialog();

  // Get schema with translated error messages
  const { legacyPortfolioItemSchema } = useMemo(() => getProfileSchemas(translations), [translations]);

  const [portfolio, setPortfolio] = useState<LegacyPortfolioItemFormData[]>(initialData);
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const [currentItemType, setCurrentItemType] = useState<'PROJECT' | 'CERTIFICATION' | 'COLLABORATION'>('PROJECT');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor));
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<LegacyPortfolioItemFormData>({
    resolver: zodResolver(legacyPortfolioItemSchema),
  });

  // Current date for max date validation (YYYY-MM format)
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Max future date for expiry dates (10 years from now)
  const maxFutureMonth = useMemo(() => {
    const now = new Date();
    const futureYear = now.getFullYear() + 10;
    return `${futureYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);


  // Clear end_date when is_current is checked
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'is_current' && value.is_current === true) {
        setValue('end_date', null);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  // Filter items by type
  const filteredItems = portfolio.filter(item => {
    if (activeTab === 'projects') return item.type === 'PROJECT' || !item.type;
    if (activeTab === 'certifications') return item.type === 'CERTIFICATION';
    if (activeTab === 'collaborations') return item.type === 'COLLABORATION';
    return false;
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
    if (!file || !targetProfileId) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${targetProfileId}-${Date.now()}.${fileExt}`;
      const filePath = `portfolio/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('profile-assets').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('profile-assets').getPublicUrl(filePath);
      setImagePreview(publicUrl);
      setValue('image_url', publicUrl);
      toast.success(translations.common.loading);
    } catch (error) {
      toast.error('Error al subir la imagen. Por favor, intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdd = () => {
    setEditingIndex(null);
    setImagePreview(undefined);

    // Set default values based on active tab
    if (activeTab === 'certifications') {
      setCurrentItemType('CERTIFICATION');
      reset({
        type: 'CERTIFICATION',
        title: '',
        issuer: '',
        issue_date: '',
        expiry_date: null,
        credential_id: null,
        credential_url: null,
        description: null
      });
    } else if (activeTab === 'collaborations') {
      setCurrentItemType('COLLABORATION');
      reset({
        type: 'COLLABORATION',
        title: '',
        organization: '',
        role: '',
        start_date: '',
        end_date: null,
        is_current: false,
        url: null,
        collaborators: null,
        description: null,
        image_url: null
      });
    } else {
      setCurrentItemType('PROJECT');
      reset({
        type: 'PROJECT',
        title: '',
        category: '',
        url: '',
        description: null,
        image_url: null
      });
    }

    setIsFormOpen(true);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    const item = filteredItems[index];
    const actualIndex = portfolio.findIndex(p => p === item);
    setEditingIndex(actualIndex);
    setImagePreview(item.image_url || undefined);

    // Set the correct type based on the item being edited
    const itemType = item.type || 'PROJECT';
    setCurrentItemType(itemType as 'PROJECT' | 'CERTIFICATION' | 'COLLABORATION');

    reset(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (index: number) => {
    const item = filteredItems[index];
    const itemType = activeTab === 'certifications' ? 'certificación' : activeTab === 'collaborations' ? 'colaboración' : 'proyecto';

    const shouldDelete = await confirm({
      title: `Eliminar ${itemType}`,
      message: activeTab === 'certifications' ? modals.deleteCertificationConfirm :
               activeTab === 'collaborations' ? modals.deleteCollaborationConfirm :
               modals.deletePortfolioConfirm,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (shouldDelete) {
      const updated = portfolio.filter(p => p !== item);
      setPortfolio(updated);
      onSave(updated);
    }
  };

  const onSubmit = async (data: LegacyPortfolioItemFormData) => {
    const currentYear = new Date().getFullYear();
    const maxFutureYear = currentYear + 10; // Allow up to 10 years in the future for expiry dates

    // Validate dates before saving
    const validateDate = (dateStr: string | null | undefined, fieldName: string, allowFuture: boolean = false): boolean => {
      if (!dateStr) return true; // Optional fields are ok

      const [year, month] = dateStr.split('-').map(Number);

      // Check for absurd years (before 1950)
      if (year < 1950) {
        toast.error(`${fieldName}: Invalid year. Please enter a valid date.`);
        return false;
      }

      // Check for future years beyond reasonable limit
      const maxYear = allowFuture ? maxFutureYear : currentYear;
      if (year > maxYear) {
        toast.error(`${fieldName}: Year cannot be beyond ${maxYear}.`);
        return false;
      }

      // Check for invalid months
      if (month < 1 || month > 12) {
        toast.error(`${fieldName}: Invalid month. Must be between 01 and 12.`);
        return false;
      }

      return true;
    };

    // Validate certification dates
    if (activeTab === 'certifications') {
      // Issue date: cannot be in the future
      if (!validateDate(data.issue_date, 'Issue Date', false)) return;

      // Expiry date: can be up to 10 years in the future
      if (!validateDate(data.expiry_date, 'Expiry Date', true)) return;

      // Check issue date is not in the future (additional check)
      if (data.issue_date) {
        const [year, month] = data.issue_date.split('-').map(Number);
        const issueDate = new Date(year, month - 1);
        const now = new Date();
        if (issueDate > now) {
          toast.error('Issue date cannot be in the future.');
          return;
        }
      }
    }

    // Validate collaboration dates
    if (activeTab === 'collaborations') {
      // Start and end dates: cannot be in the future
      if (!validateDate(data.start_date, 'Start Date', false)) return;
      if (!validateDate(data.end_date, 'End Date', false)) return;

      // Check start date is not in the future
      if (data.start_date) {
        const [year, month] = data.start_date.split('-').map(Number);
        const startDate = new Date(year, month - 1);
        const now = new Date();
        if (startDate > now) {
          toast.error('Start date cannot be in the future.');
          return;
        }
      }

      // Check end date is not in the future (if provided)
      if (data.end_date && !data.is_current) {
        const [year, month] = data.end_date.split('-').map(Number);
        const endDate = new Date(year, month - 1);
        const now = new Date();
        if (endDate > now) {
          toast.error('End date cannot be in the future.');
          return;
        }
      }
    }

    // Always use the currentItemType that was set when the form was opened
    data.type = currentItemType;

    let updated: LegacyPortfolioItemFormData[];
    if (editingIndex !== null) {
      updated = portfolio.map((item, idx) => (idx === editingIndex ? data : item));
    } else {
      updated = [...portfolio, data];
    }
    setPortfolio(updated);

    // Close form immediately for better UX
    setIsFormOpen(false);

    // Save in background
    await onSave(updated);
  };

  return (
    <>
      <Dialog />
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm p-4 sm:p-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-dark-border mb-4 sm:mb-6 overflow-x-auto">
          <div className="flex gap-1 sm:gap-4 min-w-max">
            <button
              onClick={() => { setActiveTab('projects'); setIsFormOpen(false); }}
              className={`px-2 sm:px-4 py-2 font-medium text-xs sm:text-sm transition-colors border-b-2 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
                activeTab === 'projects'
                  ? 'border-cv-blue text-cv-blue'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="hidden xs:inline sm:inline">{modals.tabProjects}</span>
            </button>
            <button
              onClick={() => { setActiveTab('certifications'); setIsFormOpen(false); }}
              className={`px-2 sm:px-4 py-2 font-medium text-xs sm:text-sm transition-colors border-b-2 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
                activeTab === 'certifications'
                  ? 'border-cv-blue text-cv-blue'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
              <span className="hidden xs:inline sm:inline">{modals.tabCertifications}</span>
            </button>
            <button
              onClick={() => { setActiveTab('collaborations'); setIsFormOpen(false); }}
              className={`px-2 sm:px-4 py-2 font-medium text-xs sm:text-sm transition-colors border-b-2 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
                activeTab === 'collaborations'
                  ? 'border-cv-blue text-cv-blue'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden xs:inline sm:inline">{modals.tabCollaborations}</span>
            </button>
          </div>
        </div>

        {/* Add Button */}
        <div className="flex items-center justify-center sm:justify-end mb-4 sm:mb-6">
          <button onClick={handleAdd} className="px-3 sm:px-4 py-2 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {activeTab === 'certifications' ? modals.addCertification :
             activeTab === 'collaborations' ? modals.addCollaboration :
             modals.addPortfolioItem}
          </button>
        </div>

        {/* Items Grid/List */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredItems.map((item) => item.id || `temp-${Date.now()}`)} strategy={rectSortingStrategy}>
            <div className={`${activeTab === 'projects' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'} mb-6`}>
              {filteredItems.map((item, index) => (
                <SortableItem
                  key={item.id || index}
                  item={item}
                  type={activeTab}
                  onEdit={() => handleEdit(index)}
                  onDelete={() => handleDelete(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Empty State */}
        {filteredItems.length === 0 && !isFormOpen && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>
              {activeTab === 'certifications' ? modals.noCertificationsYet :
               activeTab === 'collaborations' ? modals.noCollaborationsYet :
               modals.noPortfolioYet}
            </p>
          </div>
        )}

        {/* Form */}
        {isFormOpen && (
          <div className="border-t dark:border-dark-border pt-6 mt-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingIndex !== null
                ? (activeTab === 'certifications' ? modals.editCertification :
                   activeTab === 'collaborations' ? modals.editCollaboration :
                   modals.editPortfolioItem)
                : (activeTab === 'certifications' ? modals.addCertification :
                   activeTab === 'collaborations' ? modals.addCollaboration :
                   modals.addPortfolioItem)
              }
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {/* Common: Image Upload - Only for projects */}
              {activeTab === 'projects' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.uploadImage}</label>
                  <div className="flex items-center gap-4">
                    {imagePreview && <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded" />}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-gray-200 dark:bg-dark-bg-tertiary text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-dark-bg-primary"
                    >
                      {isUploading ? modals.uploading : modals.chooseFile || 'Elegir archivo'}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </div>
                </div>
              )}

              {/* PROJECT FIELDS */}
              {activeTab === 'projects' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.projectTitle} *</label>
                      <input
                        {...register('title')}
                        type="text"
                        maxLength={80}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                        placeholder={modals.projectTitlePlaceholder}
                      />
                      {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.projectCategory} *</label>
                      <input
                        {...register('category')}
                        type="text"
                        maxLength={50}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                        placeholder={modals.projectCategoryPlaceholder}
                      />
                      {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.projectLink}</label>
                    <input
                      {...register('url')}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                      placeholder="https://project.com"
                    />
                    {errors.url && <p className="text-red-500 text-sm mt-1">{errors.url.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.projectDescription}</label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      maxLength={300}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white resize-none"
                      placeholder={modals.projectDescriptionPlaceholder}
                    />
                  </div>
                </>
              )}

              {/* CERTIFICATION FIELDS */}
              {activeTab === 'certifications' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.certificationTitle} *</label>
                      <input
                        {...register('title')}
                        type="text"
                        maxLength={100}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                        placeholder={modals.certificationTitlePlaceholder}
                      />
                      {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.certificationIssuer} *</label>
                      <input
                        {...register('issuer')}
                        type="text"
                        maxLength={100}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                        placeholder={modals.certificationIssuerPlaceholder}
                      />
                      {errors.issuer && <p className="text-red-500 text-sm mt-1">{errors.issuer.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.certificationIssueDate} *</label>
                      <input
                        {...register('issue_date')}
                        type="month"
                        min="1950-01"
                        max={currentMonth}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                      />
                      {errors.issue_date && <p className="text-red-500 text-sm mt-1">{errors.issue_date.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.certificationExpiryDate}</label>
                      <input
                        {...register('expiry_date')}
                        type="month"
                        min="1950-01"
                        max={maxFutureMonth}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                        placeholder={modals.neverExpires}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.certificationCredentialId}</label>
                    <input
                      {...register('credential_id')}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                      placeholder="ABC123456789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.certificationCredentialUrl}</label>
                    <input
                      {...register('credential_url')}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                      placeholder="https://credentials.example.com/verify/123"
                    />
                    {errors.credential_url && <p className="text-red-500 text-sm mt-1">{errors.credential_url.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.projectDescription}</label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      maxLength={300}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white resize-none"
                      placeholder={modals.certificationDescriptionPlaceholder}
                    />
                  </div>
                </>
              )}

              {/* COLLABORATION FIELDS */}
              {activeTab === 'collaborations' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.collaborationTitle} *</label>
                      <input
                        {...register('title')}
                        type="text"
                        maxLength={100}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                        placeholder={modals.collaborationTitlePlaceholder}
                      />
                      {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.collaborationOrganization} *</label>
                      <input
                        {...register('organization')}
                        type="text"
                        maxLength={100}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                        placeholder={modals.collaborationOrganizationPlaceholder}
                      />
                      {errors.organization && <p className="text-red-500 text-sm mt-1">{errors.organization.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.collaborationRole} *</label>
                    <input
                      {...register('role')}
                      type="text"
                      maxLength={100}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                      placeholder={modals.collaborationRolePlaceholder}
                    />
                    {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.collaborationStartDate} *</label>
                      <input
                        {...register('start_date')}
                        type="month"
                        min="1950-01"
                        max={currentMonth}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                      />
                      {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.collaborationEndDate}</label>
                      <input
                        {...register('end_date')}
                        type="month"
                        min="1950-01"
                        max={currentMonth}
                        disabled={watch('is_current')}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      {...register('is_current')}
                      type="checkbox"
                      className="w-4 h-4 text-cv-blue border-gray-300 rounded focus:ring-cv-blue"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">{modals.currentCollaboration}</label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.collaborationUrl}</label>
                    <input
                      {...register('url')}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                      placeholder="https://github.com/project"
                    />
                    {errors.url && <p className="text-red-500 text-sm mt-1">{errors.url.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{modals.projectDescription}</label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      maxLength={300}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white resize-none"
                      placeholder={modals.collaborationDescriptionPlaceholder}
                    />
                  </div>
                </>
              )}

              {/* Form Actions */}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors">
                  {modals.cancel}
                </button>
                <button type="submit" className="px-6 py-2 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark transition-colors font-medium">
                  {editingIndex !== null ? modals.update : modals.add}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Next Button */}
        {onNext && !isFormOpen && (
          <div className="flex justify-end pt-6 mt-6 border-t border-gray-200 dark:border-dark-border">
            <button
              type="button"
              onClick={async () => {
                const hasChanges = JSON.stringify(portfolio) !== JSON.stringify(initialData || []);
                if (hasChanges) {
                  await onSave(portfolio);
                }
                onNext();
              }}
              className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-2"
            >
              {translations.common?.next || 'Next'}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default PortfolioSection;
