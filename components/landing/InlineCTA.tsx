import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface InlineCTAProps {
  title: string;
  description: string;
  buttonText: string;
  variant?: 'blue' | 'gradient' | 'light';
  authMode?: 'signup' | 'login';
}

const InlineCTA: React.FC<InlineCTAProps> = ({
  title,
  description,
  buttonText,
  variant = 'blue',
  authMode = 'signup'
}) => {
  const { openModal } = useAuth();

  const variantClasses = {
    blue: 'bg-cv-blue text-white',
    gradient: 'bg-gradient-to-r from-cv-blue to-purple-600 text-white',
    light: 'bg-cv-light-gray dark:bg-dark-bg-secondary text-cv-dark-gray dark:text-dark-text-primary'
  };

  const buttonClasses = {
    blue: 'bg-white text-cv-blue hover:bg-gray-100',
    gradient: 'bg-white text-cv-blue hover:bg-gray-100',
    light: 'bg-cv-blue text-white hover:bg-cv-blue-dark'
  };

  return (
    <div className={`${variantClasses[variant]} rounded-lg p-8 my-12 shadow-lg`}>
      <div className="max-w-4xl mx-auto text-center">
        <h3 className="text-2xl md:text-3xl font-bold mb-4">
          {title}
        </h3>
        <p className={`text-lg mb-6 ${variant === 'light' ? 'text-gray-600 dark:text-dark-text-secondary' : 'text-white/90'}`}>
          {description}
        </p>
        <button
          onClick={() => openModal(authMode)}
          className={`${buttonClasses[variant]} px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-md`}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default InlineCTA;
