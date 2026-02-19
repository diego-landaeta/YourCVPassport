import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../../contexts/LanguageContext';

interface GifResult {
  id: string;
  title: string;
  preview: string; // Small preview URL
  url: string;     // Full-size GIF URL
  width: number;
  height: number;
}

interface GifPickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY || '';
const TENOR_BASE = 'https://tenor.googleapis.com/v2';

const GifPicker: React.FC<GifPickerProps> = ({ onSelect, onClose }) => {
  const { lang } = useLanguage();
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const mapTenorResults = (results: any[]): GifResult[] =>
    results.map((r: any) => ({
      id: r.id,
      title: r.title || '',
      preview: r.media_formats?.tinygif?.url || r.media_formats?.nanogif?.url || '',
      url: r.media_formats?.gif?.url || r.media_formats?.mediumgif?.url || '',
      width: r.media_formats?.tinygif?.dims?.[0] || 200,
      height: r.media_formats?.tinygif?.dims?.[1] || 150,
    }));

  const fetchGifs = useCallback(async (searchQuery?: string, pos?: string) => {
    if (!TENOR_API_KEY) return;
    setLoading(true);
    try {
      const q = (searchQuery || '').trim();
      const endpoint = q
        ? `${TENOR_BASE}/search`
        : `${TENOR_BASE}/featured`;

      const params = new URLSearchParams({
        key: TENOR_API_KEY,
        client_key: 'yourcvpassport',
        limit: '20',
        locale: lang === 'es' ? 'es_ES' : 'en_US',
        media_filter: 'gif,tinygif,nanogif,mediumgif',
      });

      if (q) params.set('q', q);
      if (pos) params.set('pos', pos);

      const res = await fetch(`${endpoint}?${params}`);
      const data = await res.json();

      const mapped = mapTenorResults(data.results || []);

      if (pos) {
        setGifs(prev => [...prev, ...mapped]);
      } else {
        setGifs(mapped);
      }
      setNext(data.next || '');
    } catch (err) {
      console.error('Tenor API error:', err);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  // Initial load: trending
  useEffect(() => {
    fetchGifs('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchGifs(query);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchGifs]);

  // Click outside to close
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  // Scroll to load more
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50 && next && !loading) {
      fetchGifs(query, next);
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-2xl shadow-xl z-50 overflow-hidden"
      style={{ maxHeight: '380px' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 dark:border-dark-border">
        <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-dark-bg-tertiary rounded-full px-3 py-1.5">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'es' ? 'Buscar GIFs...' : 'Search GIFs...'}
            className="flex-1 text-xs bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Label */}
      <div className="px-3 py-1.5 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
          {query.trim()
            ? (lang === 'es' ? 'Resultados' : 'Results')
            : (lang === 'es' ? 'Tendencia' : 'Trending')}
        </span>
        <span className="text-[9px] text-gray-300 dark:text-gray-600">
          Powered by Tenor
        </span>
      </div>

      {/* Grid */}
      <div
        className="overflow-y-auto px-2 pb-2"
        style={{ maxHeight: '280px' }}
        onScroll={handleScroll}
      >
        {gifs.length === 0 && !loading ? (
          <div className="py-8 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {query.trim()
                ? (lang === 'es' ? 'No se encontraron GIFs' : 'No GIFs found')
                : (lang === 'es' ? 'Escribe para buscar GIFs' : 'Type to search GIFs')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif.url)}
                className="relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-bg-tertiary hover:ring-2 hover:ring-cv-blue transition-all"
                style={{
                  aspectRatio: `${gif.width} / ${gif.height}`,
                  minHeight: '80px',
                  maxHeight: '150px',
                }}
                title={gif.title}
              >
                <img
                  src={gif.preview}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-cv-blue rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default GifPicker;
