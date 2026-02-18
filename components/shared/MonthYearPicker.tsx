import React from 'react';
import { useTranslations } from '../../hooks/useTranslations';

interface MonthYearPickerProps {
  value?: string; // Format: YYYY-MM
  onChange: (value: string) => void;
  lang?: 'en' | 'es';
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  value,
  onChange,
  lang = 'es',
  placeholder,
  className = '',
  disabled = false
}) => {
  const t = useTranslations();
  const months = t.monthYearPicker.months;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);

  const [year, month] = value ? value.split('-') : ['', ''];

  const handleMonthChange = (newMonth: string) => {
    if (year && newMonth) {
      onChange(`${year}-${newMonth}`);
    }
  };

  const handleYearChange = (newYear: string) => {
    if (newYear && month) {
      onChange(`${newYear}-${month}`);
    }
  };

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      <select
        value={month || ''}
        onChange={(e) => handleMonthChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{t.common.month}</option>
        {months.map((monthName, index) => (
          <option key={index} value={String(index + 1).padStart(2, '0')}>
            {monthName}
          </option>
        ))}
      </select>

      <select
        value={year || ''}
        onChange={(e) => handleYearChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{t.common.year}</option>
        {years.map((yearValue) => (
          <option key={yearValue} value={yearValue}>
            {yearValue}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MonthYearPicker;
