import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTranslations } from '../../../hooks/useTranslations';
import { supabase } from '../../../supabase/client';
import {
  PhotoIcon,
  TrophyIcon,
  FaceSmileIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  BriefcaseIcon,
  ArrowUpTrayIcon,
  SparklesIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  PlusIcon,
  TrashIcon,
  LinkIcon,
  MapPinIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { feedService } from '../../../services/feedService';
import type { Profile } from '../../../types';
import type { FeedContentType, PollDuration } from '../../../types/feed';

/* ── Types ─────────────────────────────────────────────────── */
type PostMode = 'TEXT' | 'IMAGE' | 'ACHIEVEMENT' | 'JOB_UPDATE' | 'MILESTONE' | 'POLL' | 'EVENT';

interface CreatePostFormProps {
  profile: Profile | null;
  onSubmit: (
    content: string,
    images: string[],
    contentType?: FeedContentType,
    achievementType?: string,
    achievementData?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) => Promise<void>;
  isSubmitting: boolean;
  cooldown?: boolean;
}

/* ── Achievement templates ─────────────────────────────────── */
const ACHIEVEMENT_TEMPLATES = [
  { id: 'got_hired',          emoji: '🚀', es: '¡Nuevo trabajo!',     en: 'New job!',            fields: ['company', 'position']    },
  { id: 'new_certification',  emoji: '📜', es: 'Nueva certificación', en: 'New certification',   fields: ['certName', 'issuer']     },
  { id: 'years_experience',   emoji: '🎯', es: 'Años de experiencia', en: 'Years of experience', fields: ['years']                  },
  { id: 'profile_completed',  emoji: '✅', es: 'Perfil completado',   en: 'Profile completed',   fields: [] as string[]             },
];

/* ── Accent colors per mode ────────────────────────────────── */
const MODE_ACCENT: Record<PostMode, { pill: string; ring: string; bg: string }> = {
  TEXT:        { pill: 'border-cv-blue text-cv-blue bg-blue-50 dark:bg-blue-900/20',             ring: 'border-cv-blue/40 ring-cv-blue/10',         bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10'     },
  IMAGE:       { pill: 'border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20',       ring: 'border-green-500/40 ring-green-500/10',     bg: 'from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10' },
  ACHIEVEMENT: { pill: 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-900/20',       ring: 'border-amber-500/40 ring-amber-500/10',     bg: 'from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10'   },
  JOB_UPDATE:  { pill: 'border-indigo-500 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',   ring: 'border-indigo-500/40 ring-indigo-500/10',   bg: 'from-indigo-50 to-violet-50 dark:from-indigo-900/10 dark:to-violet-900/10' },
  MILESTONE:   { pill: 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/20',   ring: 'border-purple-500/40 ring-purple-500/10',   bg: 'from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10'     },
  POLL:        { pill: 'border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-900/20',         ring: 'border-teal-500/40 ring-teal-500/10',       bg: 'from-teal-50 to-cyan-50 dark:from-teal-900/10 dark:to-cyan-900/10'         },
  EVENT:       { pill: 'border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-900/20',         ring: 'border-rose-500/40 ring-rose-500/10',       bg: 'from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10'         },
};

/* ── Field labels ──────────────────────────────────────────── */
const FIELD_LABELS: Record<string, { es: string; en: string; placeholder_es: string; placeholder_en: string }> = {
  company:    { es: 'Empresa',        en: 'Company',        placeholder_es: 'Ej: Google, Mercado Libre...',        placeholder_en: 'e.g. Google, Amazon...'            },
  position:   { es: 'Cargo',          en: 'Position',       placeholder_es: 'Ej: Frontend Developer',              placeholder_en: 'e.g. Frontend Developer'            },
  certName:   { es: 'Certificación',  en: 'Certification',  placeholder_es: 'Ej: AWS Solutions Architect',         placeholder_en: 'e.g. AWS Solutions Architect'       },
  issuer:     { es: 'Entidad',        en: 'Issuer',         placeholder_es: 'Ej: Amazon Web Services',             placeholder_en: 'e.g. Amazon Web Services'           },
  years:      { es: 'Años',           en: 'Years',          placeholder_es: 'Ej: 5',                               placeholder_en: 'e.g. 5'                             },
};

/* ══════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════ */
const CreatePostForm: React.FC<CreatePostFormProps> = ({ profile, onSubmit, isSubmitting, cooldown }) => {
  const { lang } = useLanguage();
  const t = useTranslations();
  // Core state
  const [mode, setMode] = useState<PostMode>('TEXT');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);       // remote URLs (for submission)
  const [previews, setPreviews] = useState<string[]>([]);   // display URLs (blob → remote)
  const [isFocused, setIsFocused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Achievement state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateFields, setTemplateFields] = useState<Record<string, string>>({});

  // Job update state
  const [jobType, setJobType] = useState<'new_job' | 'role_change'>('new_job');
  const [jobCompany, setJobCompany] = useState('');
  const [jobPosition, setJobPosition] = useState('');

  // Milestone state
  const [milestoneYears, setMilestoneYears] = useState('');
  const [milestoneMessage, setMilestoneMessage] = useState('');

  // Poll state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDuration, setPollDuration] = useState<PollDuration>('3d');

  // Event state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventLink, setEventLink] = useState('');

  // Mentions autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<{ slug: string; full_name: string; avatar_url: string | null; headline: string | null }[]>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Link preview state
  const [linkPreview, setLinkPreview] = useState<{ url: string; title?: string; description?: string; image?: string } | null>(null);
  const linkPreviewUrlRef = useRef<string | null>(null);
  const linkPreviewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isExpanded = isFocused || content.length > 0 || previews.length > 0 || mode !== 'TEXT';
  const charsLeft = 2000 - content.length;
  const charsWarning = content.length > 1800;

  const firstName = profile?.full_name?.split(' ')[0] || '';
  const avatarUrl =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'U')}&background=3B82F6&color=fff`;

  /* ── Validation ──────────────────────────────────────────── */
  const canSubmit = (() => {
    if (isSubmitting || isUploading) return false;
    switch (mode) {
      case 'TEXT':
        return content.trim().length > 0;
      case 'IMAGE': {
        // Must have previews, not uploading, and at least one remote URL ready
        const hasRemoteUrls = images.length > 0 || previews.some(u => !u.startsWith('blob:'));
        return previews.length > 0 && !isUploading && hasRemoteUrls;
      }
      case 'ACHIEVEMENT': {
        if (!selectedTemplate) return false;
        const tpl = ACHIEVEMENT_TEMPLATES.find(t => t.id === selectedTemplate);
        if (!tpl) return false;
        return tpl.fields.every(f => (templateFields[f] || '').trim().length > 0);
      }
      case 'JOB_UPDATE':
        return jobCompany.trim().length > 0 && jobPosition.trim().length > 0;
      case 'MILESTONE':
        return milestoneYears.trim().length > 0;
      case 'POLL': {
        const filledOptions = pollOptions.filter(o => o.trim().length > 0);
        return pollQuestion.trim().length > 0 && filledOptions.length >= 2;
      }
      case 'EVENT':
        return eventTitle.trim().length > 0 && eventDate.trim().length > 0;
      default:
        return false;
    }
  })();

  /* ── Generate content for structured modes ───────────────── */
  const generateContent = useCallback((): {
    finalContent: string;
    contentType: FeedContentType;
    achievementType?: string;
    achievementData?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  } => {
    const l = lang as 'es' | 'en';

    switch (mode) {
      case 'TEXT':
        return {
          finalContent: content.trim(),
          contentType: 'TEXT',
          ...(linkPreview && { metadata: { linkPreview } }),
        };

      case 'IMAGE':
        return { finalContent: content.trim() || (lang === 'es' ? '📷 Compartiendo una foto' : '📷 Sharing a photo'), contentType: 'IMAGE' };

      case 'ACHIEVEMENT': {
        const tmpl = ACHIEVEMENT_TEMPLATES.find(t => t.id === selectedTemplate);
        const data: Record<string, unknown> = { ...templateFields };
        // Map fields to the keys feedService expects
        if (templateFields.company) data.company_name = templateFields.company;
        if (templateFields.certName) data.certification_name = templateFields.certName;
        const autoContent = selectedTemplate
          ? feedService.generateAchievementContent(selectedTemplate, data, l)
          : '';
        // Allow user to append custom message
        const extra = content.trim();
        const finalContent = extra ? `${autoContent}\n\n${extra}` : autoContent;
        return {
          finalContent,
          contentType: 'ACHIEVEMENT',
          achievementType: selectedTemplate || undefined,
          achievementData: data,
        };
      }

      case 'JOB_UPDATE': {
        const data: Record<string, unknown> = {
          company_name: jobCompany.trim(),
          position: jobPosition.trim(),
          job_type: jobType,
        };
        const autoContent = jobType === 'new_job'
          ? feedService.generateAchievementContent('got_hired', data, l)
          : (lang === 'es'
            ? `🔄 ¡Nuevo rol! Ahora soy ${jobPosition.trim()} en ${jobCompany.trim()}. ¡Emocionado por este nuevo desafío!`
            : `🔄 New role! I'm now ${jobPosition.trim()} at ${jobCompany.trim()}. Excited for this new challenge!`);
        const extra = content.trim();
        const finalContent = extra ? `${autoContent}\n\n${extra}` : autoContent;
        return {
          finalContent,
          contentType: 'JOB_UPDATE',
          achievementType: jobType === 'new_job' ? 'got_hired' : 'role_change',
          achievementData: data,
        };
      }

      case 'MILESTONE': {
        const years = milestoneYears.trim();
        const data: Record<string, unknown> = { years };
        const autoContent = feedService.generateAchievementContent('milestone_experience', data, l);
        const extra = milestoneMessage.trim() || content.trim();
        const finalContent = extra ? `${autoContent}\n\n${extra}` : autoContent;
        return {
          finalContent,
          contentType: 'MILESTONE',
          achievementType: 'milestone_experience',
          achievementData: data,
        };
      }

      case 'POLL': {
        const options = pollOptions.filter(o => o.trim().length > 0).map(o => o.trim());
        const durationMs = pollDuration === '1d' ? 86400000 : pollDuration === '3d' ? 259200000 : 604800000;
        const expiresAt = new Date(Date.now() + durationMs).toISOString();
        const finalContent = feedService.generatePollContent(pollQuestion.trim(), options, l);
        return {
          finalContent,
          contentType: 'POLL',
          metadata: {
            poll: {
              question: pollQuestion.trim(),
              options,
              duration: pollDuration,
              expires_at: expiresAt,
            }
          },
        };
      }

      case 'EVENT': {
        const finalContent = feedService.generateEventContent(
          eventTitle.trim(), eventDate, eventTime || undefined, eventLocation || undefined, l
        );
        return {
          finalContent,
          contentType: 'EVENT',
          metadata: {
            event: {
              title: eventTitle.trim(),
              date: eventDate,
              ...(eventTime && { time: eventTime }),
              ...(eventLocation.trim() && { location: eventLocation.trim() }),
              ...(eventLink.trim() && { link: eventLink.trim() }),
            }
          },
        };
      }

      default:
        return { finalContent: content.trim(), contentType: 'TEXT' };
    }
  }, [mode, content, selectedTemplate, templateFields, jobType, jobCompany, jobPosition, milestoneYears, milestoneMessage, pollQuestion, pollOptions, pollDuration, eventTitle, eventDate, eventTime, eventLocation, eventLink, linkPreview, lang]);

  /* ── Link preview detection ─────────────────────────────── */
  useEffect(() => {
    const urlMatch = content.match(/https?:\/\/[^\s<]+/);
    const detectedUrl = urlMatch ? urlMatch[0] : null;

    if (!detectedUrl) {
      if (linkPreview) { setLinkPreview(null); linkPreviewUrlRef.current = null; }
      return;
    }
    if (detectedUrl === linkPreviewUrlRef.current) return;

    if (linkPreviewTimeoutRef.current) clearTimeout(linkPreviewTimeoutRef.current);
    linkPreviewTimeoutRef.current = setTimeout(() => {
      linkPreviewUrlRef.current = detectedUrl;
      let domain = '';
      try { domain = new URL(detectedUrl).hostname.replace('www.', ''); } catch { /* */ }
      setLinkPreview({ url: detectedUrl, title: domain, description: detectedUrl });
    }, 500);

    return () => { if (linkPreviewTimeoutRef.current) clearTimeout(linkPreviewTimeoutRef.current); };
  }, [content]);

  // Close mentions dropdown on click outside
  useEffect(() => {
    if (mentionResults.length === 0) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-mentions-dropdown]')) {
        setMentionQuery(null);
        setMentionResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mentionResults.length]);

  /* ── Mentions autocomplete ──────────────────────────────── */
  const detectMentionQuery = useCallback((text: string, cursorPos: number) => {
    const before = text.slice(0, cursorPos);
    const match = before.match(/@([a-zA-Z0-9_-]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
      setMentionResults([]);
    }
  }, []);

  useEffect(() => {
    if (mentionQuery === null || mentionQuery.length < 1) {
      setMentionResults([]);
      return;
    }
    if (mentionTimeoutRef.current) clearTimeout(mentionTimeoutRef.current);
    mentionTimeoutRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('slug, full_name, avatar_url, headline')
        .or(`slug.ilike.%${mentionQuery}%,full_name.ilike.%${mentionQuery}%`)
        .eq('is_active', true)
        .limit(5);
      if (data) setMentionResults(data.filter(p => p.slug));
    }, 250);
    return () => { if (mentionTimeoutRef.current) clearTimeout(mentionTimeoutRef.current); };
  }, [mentionQuery]);

  const insertMention = useCallback((slug: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const before = content.slice(0, pos);
    const after = content.slice(pos);
    const atIndex = before.lastIndexOf('@');
    if (atIndex === -1) return;
    const newContent = before.slice(0, atIndex) + `@${slug} ` + after;
    setContent(newContent);
    setMentionQuery(null);
    setMentionResults([]);
    setTimeout(() => {
      const newPos = atIndex + slug.length + 2;
      ta.focus();
      ta.setSelectionRange(newPos, newPos);
    }, 0);
  }, [content]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    detectMentionQuery(val, e.target.selectionStart);
  }, [detectMentionQuery]);

  const handleMentionKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionIndex(i => (i + 1) % mentionResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionIndex(i => (i - 1 + mentionResults.length) % mentionResults.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (mentionResults[mentionIndex]) {
        e.preventDefault();
        insertMention(mentionResults[mentionIndex].slug);
      }
    } else if (e.key === 'Escape') {
      setMentionQuery(null);
      setMentionResults([]);
    }
  }, [mentionResults, mentionIndex, insertMention]);

  /* ── Submit ──────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const { finalContent, contentType, achievementType, achievementData, metadata } = generateContent();

    // Use `images` (remote URLs) for submission. If images is empty but previews
    // has non-blob URLs (i.e. upload completed but state got out of sync), use those.
    const remoteUrls = images.length > 0
      ? images
      : previews.filter(url => !url.startsWith('blob:'));

    setUploadError(null);
    try {
      await onSubmit(finalContent, remoteUrls, contentType, achievementType, achievementData, metadata);
    } catch {
      // Show inline error and keep form content so the user can retry
      setUploadError(lang === 'es' ? 'Error al publicar. Inténtalo de nuevo.' : 'Error posting. Please try again.');
      return;
    }

    // Reset everything only on success
    setContent('');
    setImages([]);
    setPreviews([]);
    setUploadError(null);
    setIsFocused(false);
    setMode('TEXT');
    setSelectedTemplate(null);
    setTemplateFields({});
    setJobCompany('');
    setJobPosition('');
    setJobType('new_job');
    setMilestoneYears('');
    setMilestoneMessage('');
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollDuration('3d');
    setEventTitle('');
    setEventDate('');
    setEventTime('');
    setEventLocation('');
    setEventLink('');
    setLinkPreview(null);
    linkPreviewUrlRef.current = null;
  };

  /* ── File handling ───────────────────────────────────────── */

  const processFiles = useCallback(async (files: FileList | File[]) => {
    if (!profile?.id) return;
    const fileArray = Array.from(files);
    if (previews.length + fileArray.length > 4) {
      setUploadError(lang === 'es' ? 'Máximo 4 imágenes' : 'Maximum 4 images');
      return;
    }

    // Validate file sizes (max 5MB each)
    const MAX_SIZE = 5 * 1024 * 1024;
    const oversized = fileArray.find(f => f.size > MAX_SIZE);
    if (oversized) {
      setUploadError(lang === 'es' ? 'Cada imagen debe pesar menos de 5 MB' : 'Each image must be under 5 MB');
      return;
    }

    // Show local blob previews instantly
    const blobUrls = fileArray.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...blobUrls]);

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    try {
      const remoteUrls = await feedService.uploadImages(fileArray, profile.id, (percent) => {
        setUploadProgress(percent);
      });

      // Swap blob URLs → remote URLs
      setPreviews(prev => {
        const updated = [...prev];
        blobUrls.forEach((blobUrl, i) => {
          const idx = updated.indexOf(blobUrl);
          if (idx !== -1) updated[idx] = remoteUrls[i];
          URL.revokeObjectURL(blobUrl);
        });
        return updated;
      });
      setImages(prev => [...prev, ...remoteUrls]);
    } catch {
      // Remove failed blob previews
      setPreviews(prev => prev.filter(url => !blobUrls.includes(url)));
      blobUrls.forEach(url => URL.revokeObjectURL(url));
      setUploadError(lang === 'es' ? 'Error al subir imagen' : 'Error uploading image');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [profile?.id, previews.length, lang]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    await processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    const previewUrl = previews[index];

    // previews and images may not be index-aligned (blob previews exist before
    // remote URLs are ready). Use the previewUrl to find the matching remote URL
    // (after upload swap, they share the same value).
    const remoteUrl = previewUrl && !previewUrl.startsWith('blob:')
      ? previewUrl
      : undefined;

    setPreviews(prev => prev.filter((_, i) => i !== index));
    if (remoteUrl) {
      setImages(prev => prev.filter(url => url !== remoteUrl));
      feedService.deleteImage(remoteUrl);
    }

    // Revoke blob URL if it's a local preview
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
  };

  /* ── Drag & drop ─────────────────────────────────────────── */
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) await processFiles(imageFiles);
    }
  };

  /* ── Mode switch handler ─────────────────────────────────── */
  const handleModeChange = (newMode: PostMode) => {
    setMode(newMode);
    setIsFocused(true);
    if (newMode === 'IMAGE') {
      // auto focus on drop zone
    }
  };

  const accent = MODE_ACCENT[mode];

  /* ════════════════════════════════════════════════════════════
     Render
     ════════════════════════════════════════════════════════════ */
  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white dark:bg-dark-bg-secondary rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden ${
        isFocused
          ? `${accent.ring} ring-2 shadow-md`
          : 'border-gray-200 dark:border-dark-border hover:shadow-md'
      }`}
    >
      {/* ── Textarea area (TEXT + IMAGE + optional for others) ── */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-2.5 sm:gap-3">
          <img
            src={avatarUrl}
            alt={profile?.full_name || 'User'}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover flex-shrink-0 shadow-sm mt-0.5"
          />
          <div className="flex-1 min-w-0 relative">
            {(mode === 'TEXT' || mode === 'IMAGE') && (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleMentionKeyDown}
                onFocus={() => setIsFocused(true)}
                placeholder={
                  mode === 'IMAGE'
                    ? (lang === 'es' ? 'Añade una descripción a tu foto...' : 'Add a caption to your photo...')
                    : firstName
                      ? (lang === 'es' ? `¿Qué estás pensando, ${firstName}?` : `What's on your mind, ${firstName}?`)
                      : t.feed.createPost.placeholder
                }
                className="w-full bg-transparent border-none focus:ring-0 p-1.5 text-gray-700 dark:text-white text-[15px] resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500 leading-relaxed"
                rows={isExpanded ? 3 : 1}
                maxLength={2000}
              />
            )}

            {(mode === 'ACHIEVEMENT' || mode === 'JOB_UPDATE' || mode === 'MILESTONE' || mode === 'POLL' || mode === 'EVENT') && (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleMentionKeyDown}
                onFocus={() => setIsFocused(true)}
                placeholder={lang === 'es' ? 'Añade un mensaje personal (opcional)...' : 'Add a personal message (optional)...'}
                className="w-full bg-transparent border-none focus:ring-0 p-1.5 text-gray-700 dark:text-white text-[15px] resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500 leading-relaxed"
                rows={2}
                maxLength={2000}
              />
            )}

            {/* Mentions autocomplete dropdown */}
            {mentionResults.length > 0 && (
              <div data-mentions-dropdown className="absolute left-0 right-0 top-full z-50 mt-1 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-xl shadow-xl overflow-hidden">
                <div className="px-3 py-1.5 border-b border-gray-100 dark:border-dark-border">
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {lang === 'es' ? 'Personas' : 'People'}
                  </p>
                </div>
                {mentionResults.map((user, idx) => (
                  <button
                    key={user.slug}
                    type="button"
                    onClick={() => insertMention(user.slug)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all ${
                      idx === mentionIndex
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-cv-blue'
                        : 'hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary border-l-2 border-l-transparent'
                    }`}
                  >
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=3B82F6&color=fff&size=36`}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100 dark:ring-dark-border"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{user.full_name}</p>
                      {user.headline ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.headline}</p>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">@{user.slug}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-300 dark:text-gray-600 font-mono flex-shrink-0">@{user.slug}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mode-specific content ── */}

      {/* IMAGE: Drop zone + previews */}
      {mode === 'IMAGE' && (
        <div className="px-4 pb-3 sm:pl-[68px]">
          {previews.length === 0 ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-5 sm:p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-green-400 bg-green-50 dark:bg-green-900/20 scale-[1.02]'
                  : 'border-gray-200 dark:border-dark-border hover:border-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/10'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`p-3 rounded-2xl transition-colors ${
                  isDragging ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-dark-bg-tertiary'
                }`}>
                  <ArrowUpTrayIcon className={`w-7 h-7 transition-colors ${
                    isDragging ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'
                  }`} />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isDragging
                    ? (lang === 'es' ? '¡Suelta aquí!' : 'Drop here!')
                    : (lang === 'es' ? 'Arrastra fotos aquí o haz clic' : 'Drag photos here or click')
                  }
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  JPG, PNG, GIF, WebP · {lang === 'es' ? 'Máx. 4 fotos' : 'Max. 4 photos'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {previews.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-xl border border-gray-200 dark:border-dark-border shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {previews.length < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 border-2 border-dashed border-gray-200 dark:border-dark-border rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-green-500 hover:border-green-400 transition-colors"
                  >
                    <PhotoIcon className="w-6 h-6" />
                    <span className="text-[10px] font-medium">{previews.length}/4</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ACHIEVEMENT: Template grid + fields */}
      {mode === 'ACHIEVEMENT' && (
        <div className="px-4 pb-3 sm:pl-[68px] space-y-3">
          {/* Template grid */}
          <div className="grid grid-cols-2 gap-2">
            {ACHIEVEMENT_TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplate === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplate(isSelected ? null : tmpl.id);
                    setTemplateFields({});
                  }}
                  className={`relative flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 shadow-sm'
                      : 'border-gray-100 dark:border-dark-border hover:border-amber-200 dark:hover:border-amber-800 bg-gray-50 dark:bg-dark-bg-tertiary'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{tmpl.emoji}</span>
                  <span className={`text-xs font-semibold leading-tight ${
                    isSelected ? 'text-amber-700 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {lang === 'es' ? tmpl.es : tmpl.en}
                  </span>
                  {isSelected && (
                    <CheckCircleIcon className="w-5 h-5 text-amber-500 absolute top-1.5 right-1.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Dynamic fields */}
          {selectedTemplate && (() => {
            const tmpl = ACHIEVEMENT_TEMPLATES.find(t => t.id === selectedTemplate);
            if (!tmpl || tmpl.fields.length === 0) return (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl p-3 border border-amber-100 dark:border-amber-800/30">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1.5">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  {lang === 'es' ? 'Se generará automáticamente al publicar' : 'Will be auto-generated when posted'}
                </p>
              </div>
            );
            return (
              <div className="space-y-2.5">
                {tmpl.fields.map((field) => {
                  const fl = FIELD_LABELS[field];
                  return (
                    <div key={field}>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">
                        {lang === 'es' ? fl?.es : fl?.en}
                      </label>
                      <input
                        type={field === 'years' ? 'number' : 'text'}
                        value={templateFields[field] || ''}
                        onChange={(e) => setTemplateFields(prev => ({ ...prev, [field]: e.target.value }))}
                        placeholder={lang === 'es' ? fl?.placeholder_es : fl?.placeholder_en}
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-xl text-sm text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
                        min={field === 'years' ? 1 : undefined}
                      />
                    </div>
                  );
                })}
                {/* Preview */}
                {tmpl.fields.every(f => (templateFields[f] || '').trim().length > 0) && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl p-3 border border-amber-100 dark:border-amber-800/30">
                    <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                      {lang === 'es' ? 'Vista previa' : 'Preview'}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {feedService.generateAchievementContent(
                        selectedTemplate,
                        {
                          ...templateFields,
                          company_name: templateFields.company,
                          certification_name: templateFields.certName,
                        },
                        lang as 'es' | 'en'
                      )}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* JOB_UPDATE: Toggle + fields + preview */}
      {mode === 'JOB_UPDATE' && (
        <div className="px-4 pb-3 sm:pl-[68px] space-y-3">
          {/* Toggle: new job vs role change */}
          <div className="flex gap-2">
            {([
              { id: 'new_job' as const,     emoji: '🚀', es: 'Nuevo trabajo',  en: 'New job'     },
              { id: 'role_change' as const,  emoji: '🔄', es: 'Cambio de rol',  en: 'Role change' },
            ]).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setJobType(opt.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-semibold flex-1 justify-center ${
                  jobType === opt.id
                    ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-sm'
                    : 'border-gray-100 dark:border-dark-border text-gray-500 dark:text-gray-400 hover:border-indigo-200 bg-gray-50 dark:bg-dark-bg-tertiary'
                }`}
              >
                <span>{opt.emoji}</span>
                {lang === 'es' ? opt.es : opt.en}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div className="space-y-2.5">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">
                {lang === 'es' ? 'Empresa' : 'Company'}
              </label>
              <input
                type="text"
                value={jobCompany}
                onChange={(e) => setJobCompany(e.target.value)}
                placeholder={lang === 'es' ? 'Ej: Google, Mercado Libre...' : 'e.g. Google, Amazon...'}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-xl text-sm text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">
                {lang === 'es' ? 'Cargo' : 'Position'}
              </label>
              <input
                type="text"
                value={jobPosition}
                onChange={(e) => setJobPosition(e.target.value)}
                placeholder={lang === 'es' ? 'Ej: Senior Frontend Developer' : 'e.g. Senior Frontend Developer'}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-xl text-sm text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>

          {/* Preview */}
          {jobCompany.trim() && jobPosition.trim() && (
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/10 dark:to-violet-900/10 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/30">
              <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                {lang === 'es' ? 'Vista previa' : 'Preview'}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {jobType === 'new_job'
                  ? feedService.generateAchievementContent('got_hired', { company_name: jobCompany.trim(), position: jobPosition.trim() }, lang as 'es' | 'en')
                  : (lang === 'es'
                    ? `🔄 ¡Nuevo rol! Ahora soy ${jobPosition.trim()} en ${jobCompany.trim()}. ¡Emocionado por este nuevo desafío!`
                    : `🔄 New role! I'm now ${jobPosition.trim()} at ${jobCompany.trim()}. Excited for this new challenge!`
                  )
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* MILESTONE: Year counter + preview */}
      {mode === 'MILESTONE' && (
        <div className="px-4 pb-3 sm:pl-[68px] space-y-3">
          {/* Big year display */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative flex-shrink-0">
              <input
                type="number"
                value={milestoneYears}
                onChange={(e) => setMilestoneYears(e.target.value)}
                min={1}
                max={99}
                placeholder="0"
                className="w-20 h-20 sm:w-24 sm:h-24 text-center text-3xl sm:text-4xl font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest bg-white dark:bg-dark-bg-secondary px-2">
                {lang === 'es' ? 'años' : 'years'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {lang === 'es' ? 'Celebra tu trayectoria profesional' : 'Celebrate your professional journey'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {lang === 'es' ? '¿Cuántos años de experiencia has acumulado?' : 'How many years of experience have you accumulated?'}
              </p>
            </div>
          </div>

          {/* Optional personal message */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">
              {lang === 'es' ? 'Mensaje personal (opcional)' : 'Personal message (optional)'}
            </label>
            <input
              type="text"
              value={milestoneMessage}
              onChange={(e) => setMilestoneMessage(e.target.value)}
              placeholder={lang === 'es' ? 'Ej: Agradecido por cada oportunidad...' : 'e.g. Grateful for every opportunity...'}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-xl text-sm text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
            />
          </div>

          {/* Preview */}
          {milestoneYears.trim() && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl p-3 border border-purple-100 dark:border-purple-800/30">
              <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
                {lang === 'es' ? 'Vista previa' : 'Preview'}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {feedService.generateAchievementContent('milestone_experience', { years: milestoneYears.trim() }, lang as 'es' | 'en')}
                {milestoneMessage.trim() ? `\n\n${milestoneMessage.trim()}` : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {/* POLL: Question + Options + Duration */}
      {mode === 'POLL' && (
        <div className="px-4 pb-3 sm:pl-[68px] space-y-3">
          {/* Question */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">
              {lang === 'es' ? 'Pregunta' : 'Question'}
            </label>
            <input
              type="text"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder={lang === 'es' ? '¿Cuál es tu opinión sobre...?' : 'What is your opinion on...?'}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-xl text-sm text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
              maxLength={200}
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              {lang === 'es' ? 'Opciones' : 'Options'}
            </label>
            {pollOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-500 w-5 text-center flex-shrink-0">{idx + 1}</span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const updated = [...pollOptions];
                    updated[idx] = e.target.value;
                    setPollOptions(updated);
                  }}
                  placeholder={`${lang === 'es' ? 'Opción' : 'Option'} ${idx + 1}`}
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-xl text-sm text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                  maxLength={100}
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions(prev => prev.filter((_, i) => i !== idx))}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 4 && (
              <button
                type="button"
                onClick={() => setPollOptions(prev => [...prev, ''])}
                className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 px-3 py-2 rounded-xl transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                {lang === 'es' ? 'Añadir opción' : 'Add option'}
              </button>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
              {lang === 'es' ? 'Duración' : 'Duration'}
            </label>
            <div className="flex gap-2">
              {([
                { id: '1d' as PollDuration, es: '1 día', en: '1 day' },
                { id: '3d' as PollDuration, es: '3 días', en: '3 days' },
                { id: '1w' as PollDuration, es: '1 semana', en: '1 week' },
              ]).map((dur) => (
                <button
                  key={dur.id}
                  type="button"
                  onClick={() => setPollDuration(dur.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    pollDuration === dur.id
                      ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 shadow-sm'
                      : 'border-gray-200 dark:border-dark-border text-gray-500 dark:text-gray-400 hover:border-teal-200 bg-gray-50 dark:bg-dark-bg-tertiary'
                  }`}
                >
                  <ClockIcon className="w-3.5 h-3.5" />
                  {lang === 'es' ? dur.es : dur.en}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2 && (
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/10 dark:to-cyan-900/10 rounded-xl p-3 border border-teal-100 dark:border-teal-800/30">
              <p className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">
                {lang === 'es' ? 'Vista previa' : 'Preview'}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {feedService.generatePollContent(
                  pollQuestion.trim(),
                  pollOptions.filter(o => o.trim()).map(o => o.trim()),
                  lang as 'es' | 'en'
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* EVENT: Title + Date + Time + Location + Link */}
      {mode === 'EVENT' && (
        <div className="px-4 pb-3 sm:pl-[68px] space-y-3">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">
              {lang === 'es' ? 'Título del evento' : 'Event title'}
            </label>
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder={lang === 'es' ? 'Ej: Meetup de React en Madrid' : 'e.g. React Meetup in Madrid'}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-xl text-sm text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
              maxLength={150}
            />
          </div>

          {/* Date + Time row */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">
                {lang === 'es' ? 'Fecha' : 'Date'} *
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-xl text-sm text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">
                {lang === 'es' ? 'Hora' : 'Time'}
              </label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-xl text-sm text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1 block">
              <MapPinIcon className="w-3.5 h-3.5" />
              {lang === 'es' ? 'Ubicación' : 'Location'}
            </label>
            <input
              type="text"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder={lang === 'es' ? 'Ej: Google Campus Madrid' : 'e.g. Google Campus Madrid'}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-xl text-sm text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
            />
          </div>

          {/* Link */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1 block">
              <LinkIcon className="w-3.5 h-3.5" />
              {lang === 'es' ? 'Enlace' : 'Link'}
            </label>
            <input
              type="url"
              value={eventLink}
              onChange={(e) => setEventLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-xl text-sm text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
            />
          </div>

          {/* Preview card */}
          {eventTitle.trim() && eventDate && (
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 rounded-xl p-3 border border-rose-100 dark:border-rose-800/30">
              <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">
                {lang === 'es' ? 'Vista previa' : 'Preview'}
              </p>
              <div className="flex items-start gap-3">
                {/* Calendar icon */}
                <div className="flex-shrink-0 w-14 h-14 bg-white dark:bg-dark-bg-secondary rounded-xl border border-rose-200 dark:border-rose-800/30 flex flex-col items-center justify-center shadow-sm">
                  <span className="text-[10px] font-bold text-rose-500 uppercase">
                    {new Date(eventDate + 'T00:00:00').toLocaleString(lang === 'es' ? 'es' : 'en', { month: 'short' })}
                  </span>
                  <span className="text-xl font-black text-gray-800 dark:text-white leading-none">
                    {new Date(eventDate + 'T00:00:00').getDate()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-white">{eventTitle.trim()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {eventDate}{eventTime ? ` · ${eventTime}` : ''}
                  </p>
                  {eventLocation.trim() && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-0.5 mt-0.5">
                      <MapPinIcon className="w-3 h-3" /> {eventLocation.trim()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Image previews for TEXT mode ── */}
      {mode === 'TEXT' && previews.length > 0 && (
        <div className="px-4 pb-2 sm:pl-[68px]">
          <div className="flex flex-wrap gap-2">
            {previews.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-gray-200 dark:border-dark-border shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Link preview card ── */}
      {linkPreview && mode === 'TEXT' && (
        <div className="px-4 pb-2 sm:pl-[68px]">
          <div className="relative border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden group">
            <a href={linkPreview.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors">
              <img
                src={`https://www.google.com/s2/favicons?domain=${linkPreview.title}&sz=32`}
                alt=""
                className="w-5 h-5 rounded flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{linkPreview.title}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{linkPreview.url}</p>
              </div>
            </a>
            <button
              type="button"
              onClick={() => { setLinkPreview(null); linkPreviewUrlRef.current = 'dismissed'; }}
              className="absolute top-1.5 right-1.5 w-5 h-5 bg-gray-200 dark:bg-dark-bg-tertiary text-gray-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Upload progress bar */}
      {isUploading && (
        <div className="px-4 pb-2 sm:pl-[68px]">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-dark-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums min-w-[32px] text-right">
              {uploadProgress}%
            </span>
          </div>
        </div>
      )}

      {uploadError && (
        <p className="text-red-500 text-xs px-4 pb-2 sm:pl-[68px]">{uploadError}</p>
      )}

      {/* ── Hidden file input ── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={previews.length >= 4 || isUploading}
      />

      {/* ── Toolbar ── */}
      <div className={`px-4 py-3 sm:pl-[68px] transition-all ${
        isExpanded ? 'border-t border-gray-100 dark:border-dark-border' : ''
      }`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Left: media quick-buttons */}
          <div className="flex gap-0.5">
            <button
              type="button"
              onClick={() => { if (mode !== 'IMAGE') setMode('IMAGE'); fileInputRef.current?.click(); }}
              disabled={previews.length >= 4 || isUploading}
              title={lang === 'es' ? 'Añadir foto' : 'Add photo'}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <PhotoIcon className="w-5 h-5" />
              )}
              {previews.length > 0 && (
                <span className="text-xs text-gray-400">({previews.length}/4)</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('ACHIEVEMENT')}
              title={lang === 'es' ? 'Compartir logro' : 'Share achievement'}
              className={`flex items-center px-2.5 sm:px-3 py-2 rounded-full transition-colors ${
                mode === 'ACHIEVEMENT' ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
              }`}
            >
              <TrophyIcon className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('JOB_UPDATE')}
              title={lang === 'es' ? 'Actualización laboral' : 'Job update'}
              className={`flex items-center px-2.5 sm:px-3 py-2 rounded-full transition-colors ${
                mode === 'JOB_UPDATE' ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
              }`}
            >
              <BriefcaseIcon className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('MILESTONE')}
              title={lang === 'es' ? 'Compartir hito' : 'Share milestone'}
              className={`flex items-center px-2.5 sm:px-3 py-2 rounded-full transition-colors ${
                mode === 'MILESTONE' ? 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20'
              }`}
            >
              <SparklesIcon className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('POLL')}
              title={lang === 'es' ? 'Crear encuesta' : 'Create poll'}
              className={`flex items-center px-2.5 sm:px-3 py-2 rounded-full transition-colors ${
                mode === 'POLL' ? 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'text-gray-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20'
              }`}
            >
              <ChartBarIcon className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('EVENT')}
              title={lang === 'es' ? 'Crear evento' : 'Create event'}
              className={`flex items-center px-2.5 sm:px-3 py-2 rounded-full transition-colors ${
                mode === 'EVENT' ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20'
              }`}
            >
              <CalendarDaysIcon className="w-5 h-5" />
            </button>

            <button
              type="button"
              title="Emoji"
              className="hidden sm:flex items-center px-3 py-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-full transition-colors"
            >
              <FaceSmileIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Right: chars + cancel + submit */}
          {isExpanded && (
            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
              {charsWarning && (
                <span className={`text-xs tabular-nums font-medium ${
                  content.length >= 2000 ? 'text-red-500 font-bold' : 'text-amber-500'
                }`}>
                  {charsLeft}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsFocused(false);
                  setContent('');
                  setImages([]);
                  setPreviews([]);
                  setMode('TEXT');
                  setSelectedTemplate(null);
                  setTemplateFields({});
                  setJobCompany('');
                  setJobPosition('');
                  setMilestoneYears('');
                  setMilestoneMessage('');
                  setPollQuestion('');
                  setPollOptions(['', '']);
                  setPollDuration('3d');
                  setEventTitle('');
                  setEventDate('');
                  setEventTime('');
                  setEventLocation('');
                  setEventLink('');
                }}
                className="px-3 sm:px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-full transition-colors"
              >
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={!canSubmit || cooldown}
                className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 text-white text-sm font-semibold rounded-full shadow-md dark:shadow-none disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 ${
                  mode === 'TEXT'        ? 'bg-cv-blue hover:bg-blue-700 shadow-blue-200/60'         :
                  mode === 'IMAGE'       ? 'bg-green-500 hover:bg-green-600 shadow-green-200/60'     :
                  mode === 'ACHIEVEMENT' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200/60'     :
                  mode === 'JOB_UPDATE'  ? 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-200/60'  :
                  mode === 'MILESTONE'   ? 'bg-purple-500 hover:bg-purple-600 shadow-purple-200/60'  :
                  mode === 'POLL'        ? 'bg-teal-500 hover:bg-teal-600 shadow-teal-200/60'      :
                  mode === 'EVENT'       ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200/60'      :
                  'bg-cv-blue hover:bg-blue-700 shadow-blue-200/60'
                }`}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : cooldown ? (
                  <span className="text-xs">{lang === 'es' ? 'Espera...' : 'Wait...'}</span>
                ) : (
                  <>
                    {lang === 'es' ? 'Publicar' : 'Post'}
                    <PaperAirplaneIcon className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default CreatePostForm;
