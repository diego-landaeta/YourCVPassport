import React, { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { sanitizeSlug } from '../utils/slugUtils';

type Status = 'idle' | 'checking' | 'available' | 'taken';

const URLSimulator: React.FC = () => {
    const [slug, setSlug] = useState('your-name');
    const [status, setStatus] = useState<Status>('idle');
    const [debouncedSlug, setDebouncedSlug] = useState(slug);
    const t = useTranslations();

    // Debounce input to avoid spamming "checks"
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSlug(slug);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [slug]);


    const handleCheckAvailability = () => {
        if (!debouncedSlug) return;
        setStatus('checking');
        
        // Simulate network request
        setTimeout(() => {
            // Simple logic for simulation
            if (debouncedSlug.toLowerCase() === 'admin' || debouncedSlug.toLowerCase() === 'jane-doe') {
                setStatus('taken');
            } else {
                setStatus('available');
            }
        }, 1500);
    };
    
    const getStatusStyles = () => {
        switch (status) {
            case 'checking':
                return {
                    buttonText: t.urlSimulator.checking,
                    buttonClasses: 'bg-yellow-500 hover:bg-yellow-600',
                    message: null,
                };
            case 'available':
                return {
                    buttonText: t.urlSimulator.check,
                    buttonClasses: 'bg-cv-blue hover:bg-opacity-90',
                    message: <p className="text-green-600 font-semibold mt-2">{t.urlSimulator.available}</p>,
                };
            case 'taken':
                return {
                    buttonText: t.urlSimulator.check,
                    buttonClasses: 'bg-cv-blue hover:bg-opacity-90',
                    message: <p className="text-red-500 font-semibold mt-2">{t.urlSimulator.taken}</p>,
                };
            default:
                 return {
                    buttonText: t.urlSimulator.check,
                    buttonClasses: 'bg-cv-blue hover:bg-opacity-90',
                    message: null,
                };
        }
    };
    
    const {buttonText, buttonClasses, message} = getStatusStyles();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Use centralized sanitization utility
        const value = sanitizeSlug(e.target.value);
        setSlug(value);
        setStatus('idle'); // Reset status on new input
    };

    return (
        <div className="mt-8 bg-white dark:bg-dark-bg-secondary p-8 rounded-lg shadow-xl max-w-2xl mx-auto border dark:border-dark-border">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-grow w-full bg-gray-100 dark:bg-dark-bg-tertiary p-3 rounded-md flex items-center shadow-inner">
                    <span className="font-mono text-gray-500 dark:text-dark-text-tertiary">yourcvpassport.com/cv/</span>
                    <input
                        type="text"
                        value={slug}
                        onChange={handleInputChange}
                        className="font-mono text-cv-dark-gray dark:text-dark-text-primary bg-transparent focus:outline-none w-full text-center sm:text-left"
                    />
                </div>
                <button
                    onClick={handleCheckAvailability}
                    disabled={status === 'checking' || !slug}
                    className={`w-full sm:w-auto text-white font-semibold px-6 py-3 rounded-md transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${buttonClasses}`}
                >
                    {buttonText}
                </button>
            </div>
            <div className="h-6 mt-2 text-center">
                {message}
            </div>
        </div>
    );
};

export default URLSimulator;