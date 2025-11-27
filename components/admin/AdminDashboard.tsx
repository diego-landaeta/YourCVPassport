import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BlogManagementSection from '../BlogManagementSection';
import SuccessStoriesManagement from './SuccessStoriesManagement';
import ProfilesManagement from './ProfilesManagement';
import StampsManagement from './StampsManagement';

const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Load active tab from sessionStorage on mount
  const [activeTab, setActiveTab] = useState<'profiles' | 'blog' | 'stories' | 'stamps'>(() => {
    const savedTab = sessionStorage.getItem('adminDashboardTab');
    return (savedTab === 'blog' || savedTab === 'stories' || savedTab === 'profiles' || savedTab === 'stamps' ? savedTab : 'profiles') as 'profiles' | 'blog' | 'stories' | 'stamps';
  });

  useEffect(() => {
    if (!profile || profile.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
  }, [profile, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-900 dark:to-purple-900 border-b border-indigo-700 dark:border-indigo-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 p-2 rounded-lg">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-white">
                  Admin Dashboard
                </h1>
              </div>
              <p className="text-indigo-100 text-lg">
                Manage users, content, profiles, and platform settings. Monitor system statistics and handle administrative tasks.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium backdrop-blur-sm transition-all border border-white/30 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-dark-border">
            <nav className="-mb-px flex space-x-8">
              <button
                data-testid="nav-profiles"
                onClick={() => setActiveTab('profiles')}
                className={`${
                  activeTab === 'profiles'
                    ? 'border-cv-blue text-cv-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                🔍 Gestión de Perfiles
              </button>
              <button
                data-testid="nav-blog"
                onClick={() => setActiveTab('blog')}
                className={`${
                  activeTab === 'blog'
                    ? 'border-cv-blue text-cv-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                📝 Gestión de Blog
              </button>
              <button
                data-testid="nav-stories"
                onClick={() => setActiveTab('stories')}
                className={`${
                  activeTab === 'stories'
                    ? 'border-cv-blue text-cv-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                ⭐ Historias de Éxito
              </button>
              <button
                data-testid="nav-stamps"
                onClick={() => setActiveTab('stamps')}
                className={`${
                  activeTab === 'stamps'
                    ? 'border-cv-blue text-cv-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                ✅ Verificación de Stamps
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'profiles' && (
          <ProfilesManagement />
        )}

        {activeTab === 'blog' && (
          <BlogManagementSection />
        )}

        {activeTab === 'stories' && (
          <SuccessStoriesManagement />
        )}

        {activeTab === 'stamps' && (
          <StampsManagement />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
