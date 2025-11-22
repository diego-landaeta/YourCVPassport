import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/client';
import {
  validateHandle,
  checkHandleAvailability,
  generateHandleSuggestions,
  normalizeToHandle,
} from '../utils/handleValidation';

interface HandleInputProps {
  value: string;
  onChange: (value: string) => void;
  currentUserId?: string;
  label?: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
}

type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'error';

const HandleInput: React.FC<HandleInputProps> = ({
  value,
  onChange,
  currentUserId,
  label = 'Handle / Username',
  placeholder = 'your-handle',
  helpText = 'Your unique URL will be: yourcvpassport.com/cv/your-handle',
  required = true,
}) => {
  const [status, setStatus] = useState<ValidationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Debounce del valor para evitar demasiadas consultas a la DB
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  // Validar handle cuando cambia el valor debounced
  useEffect(() => {
    if (!debouncedValue) {
      setStatus('idle');
      setErrorMessage('');
      setSuggestions([]);
      return;
    }

    const checkHandle = async () => {
      setStatus('checking');
      setErrorMessage('');
      setSuggestions([]);

      // Validación local primero
      const localValidation = validateHandle(debouncedValue);

      if (!localValidation.isValid) {
        setStatus('invalid');
        setErrorMessage(localValidation.error || 'Invalid handle');
        if (localValidation.suggestions) {
          setSuggestions(localValidation.suggestions);
        }
        return;
      }

      // Validación en la base de datos
      const availabilityCheck = await checkHandleAvailability(
        debouncedValue,
        supabase,
        currentUserId
      );

      if (availabilityCheck.available) {
        setStatus('valid');
        setErrorMessage('');
        setSuggestions([]);
      } else {
        setStatus('invalid');
        setErrorMessage(availabilityCheck.error || 'Handle not available');
        setSuggestions(generateHandleSuggestions(debouncedValue));
      }
    };

    checkHandle();
  }, [debouncedValue, currentUserId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const normalized = normalizeToHandle(e.target.value);
    onChange(normalized);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
  };

  // Iconos de estado
  const StatusIcon = () => {
    switch (status) {
      case 'checking':
        return (
          <svg
            className="animate-spin h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case 'valid':
        return (
          <svg
            className="h-5 w-5 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'invalid':
        return (
          <svg
            className="h-5 w-5 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="handle"
        className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <div className="flex items-center">
          <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg-tertiary text-gray-500 dark:text-dark-text-tertiary text-sm rounded-l-md">
            @
          </span>
          <input
            type="text"
            id="handle"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            required={required}
            className={`flex-1 block w-full px-3 py-2 border rounded-r-md shadow-sm text-sm focus:outline-none focus:ring-2 transition-colors
              ${
                status === 'valid'
                  ? 'border-green-500 dark:border-green-600 focus:ring-green-500 focus:border-green-500'
                  : status === 'invalid'
                  ? 'border-red-500 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-dark-border focus:ring-cv-blue focus:border-cv-blue'
              }
              bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary
              placeholder-gray-400 dark:placeholder-dark-text-tertiary
            `}
          />
          <div className="absolute right-3 top-2.5">
            <StatusIcon />
          </div>
        </div>
      </div>

      {/* Mensaje de ayuda o error */}
      {status === 'idle' && helpText && (
        <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">
          {helpText}
        </p>
      )}

      {status === 'checking' && (
        <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">
          Checking availability...
        </p>
      )}

      {status === 'valid' && (
        <p className="text-sm text-green-600 dark:text-green-500 flex items-center">
          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Handle is available!
        </p>
      )}

      {status === 'invalid' && errorMessage && (
        <div className="space-y-2">
          <p className="text-sm text-red-600 dark:text-red-500 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {errorMessage}
          </p>

          {suggestions.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 dark:text-dark-text-secondary mb-2">
                Try these suggestions:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-dark-bg-tertiary hover:bg-gray-200 dark:hover:bg-dark-bg-primary text-gray-700 dark:text-dark-text-primary rounded-full border border-gray-300 dark:border-dark-border transition-colors"
                  >
                    @{suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HandleInput;
