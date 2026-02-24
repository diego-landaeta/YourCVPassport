import React, { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../../../supabase/client';

interface MentionSuggestion {
  id: string;
  full_name: string;
  avatar_url: string | null;
  slug: string | null;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onMentionsChange?: (mentionedUserIds: string[]) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
  maxLength?: number;
}

const MentionTextarea: React.FC<MentionTextareaProps> = ({
  value,
  onChange,
  onMentionsChange,
  placeholder = '',
  className = '',
  rows = 4,
  disabled = false,
  maxLength,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState<number>(-1);
  const [activeIndex, setActiveIndex] = useState(0);
  // Track confirmed mentions: name → id
  const [mentionMap, setMentionMap] = useState<Record<string, string>>({});
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search profiles when mentionQuery changes
  useEffect(() => {
    if (!mentionQuery || mentionQuery.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, slug')
          .ilike('full_name', `%${mentionQuery}%`)
          .limit(5);
        if (data && data.length > 0) {
          setSuggestions(data);
          setShowDropdown(true);
          setActiveIndex(0);
        } else {
          setSuggestions([]);
          setShowDropdown(false);
        }
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 200);

    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [mentionQuery]);

  // Notify parent whenever mentionMap changes
  useEffect(() => {
    if (onMentionsChange) {
      // Only send IDs for names actually present in current text
      const activeIds = Object.entries(mentionMap)
        .filter(([name]) => value.includes(`@${name}`))
        .map(([, id]) => id);
      onMentionsChange(activeIds);
    }
  }, [mentionMap, value, onMentionsChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onChange(text);

    // Detect @-trigger
    const cursor = e.target.selectionStart ?? text.length;
    const beforeCursor = text.slice(0, cursor);
    const match = beforeCursor.match(/@([\w\s]{0,40})$/);

    if (match) {
      setMentionQuery(match[1]);
      setMentionStart(cursor - match[0].length);
    } else {
      setMentionQuery('');
      setMentionStart(-1);
      setShowDropdown(false);
    }
  }, [onChange]);

  const selectSuggestion = useCallback((suggestion: MentionSuggestion) => {
    if (mentionStart < 0) return;

    const before = value.slice(0, mentionStart);
    const after = value.slice(textareaRef.current?.selectionStart ?? value.length);
    const inserted = `@${suggestion.full_name} `;
    const newText = before + inserted + after;

    onChange(newText);
    setMentionMap(prev => ({ ...prev, [suggestion.full_name]: suggestion.id }));

    setShowDropdown(false);
    setSuggestions([]);
    setMentionQuery('');
    setMentionStart(-1);

    // Restore focus after state updates
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = mentionStart + inserted.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  }, [mentionStart, value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }, [showDropdown, suggestions, activeIndex, selectSuggestion]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current && !textareaRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        maxLength={maxLength}
        className={className}
      />

      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 left-0 mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
        >
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                i === activeIndex ? 'bg-blue-50 dark:bg-blue-900/30' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cv-blue to-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 overflow-hidden">
                {s.avatar_url ? (
                  <img src={s.avatar_url} alt={s.full_name} className="w-full h-full object-cover" />
                ) : (
                  s.full_name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {s.full_name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionTextarea;
