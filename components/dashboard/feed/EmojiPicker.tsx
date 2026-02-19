import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    icon: '😀',
    emojis: [
      '😀','😂','🤣','😊','😍','🥰','😘','😎','🤩','🥳',
      '😏','😌','🤔','🤗','🤭','🫢','😱','😤','😢','🥹',
      '😭','🤯','🥺','😴','🤡','👻','💀','😈','👽','🤖',
    ],
  },
  {
    id: 'gestures',
    icon: '👍',
    emojis: [
      '👍','👎','👏','🙌','🤝','✌️','🤞','💪','👊','🫶',
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','💯','🔥',
      '⭐','✨','🎉','🎊','🏆','🥇','🎯','💡','📌','✅',
    ],
  },
  {
    id: 'work',
    icon: '💼',
    emojis: [
      '💼','📊','📈','📉','💰','🎓','📝','📋','🗂️','📁',
      '💻','⌨️','🖥️','📱','🌐','🔗','📧','📅','⏰','🚀',
      '🎯','💎','🏗️','🛠️','⚙️','🔍','📣','🤝','🧑‍💻','👩‍💼',
    ],
  },
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

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

  const CATEGORY_LABELS: Record<string, { es: string; en: string }> = {
    smileys:  { es: 'Caras', en: 'Faces' },
    gestures: { es: 'Gestos', en: 'Gestures' },
    work:     { es: 'Trabajo', en: 'Work' },
  };

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full left-0 mb-2 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-2xl shadow-xl z-50 overflow-hidden w-[260px]"
    >
      {/* Tabs */}
      <div className="flex items-center border-b border-gray-100 dark:border-dark-border px-1 pt-1">
        {EMOJI_CATEGORIES.map((cat, idx) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(idx)}
            className={`flex-1 py-1.5 text-center text-sm rounded-t-lg transition-colors ${
              activeTab === idx
                ? 'bg-gray-100 dark:bg-dark-bg-tertiary'
                : 'hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary/50'
            }`}
            title={lang === 'es' ? CATEGORY_LABELS[cat.id].es : CATEGORY_LABELS[cat.id].en}
          >
            {cat.icon}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="p-2 max-h-[180px] overflow-y-auto">
        <div className="grid grid-cols-6 gap-0.5">
          {EMOJI_CATEGORIES[activeTab].emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="w-9 h-9 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-lg transition-colors hover:scale-110 active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;
