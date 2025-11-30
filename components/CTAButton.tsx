import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface CTAButtonProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  authMode?: 'signup' | 'login';
}

const CTAButton: React.FC<CTAButtonProps> = ({
  text,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  authMode = 'signup'
}) => {
  const { openModal } = useAuth();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      openModal(authMode);
    }
  };

  const baseClasses = 'font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center';

  const variantClasses = {
    primary: 'bg-cv-blue text-white hover:bg-cv-blue-dark shadow-lg hover:shadow-xl',
    secondary: 'bg-white text-cv-blue hover:bg-gray-100 shadow-md',
    outline: 'bg-transparent text-cv-blue border-2 border-cv-blue hover:bg-cv-blue hover:text-white'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {text}
    </button>
  );
};

export default CTAButton;
