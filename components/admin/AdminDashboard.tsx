import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../supabase/client';
import BlogManagementSection from '../BlogManagementSection';
import SuccessStoriesManagement from './SuccessStoriesManagement';
import ProfilesManagement from './ProfilesManagement';
import StampsManagement from './StampsManagement';
import CompanyManagementSection from './CompanyManagementSection';
import CompaniesViewSection from './CompaniesViewSection';
import UserMonitoring from './UserMonitoring';
import JobPostingsManagement from './JobPostingsManagement';
import JobApplicationsManagement from './JobApplicationsManagement';
import UserModeration from './UserModeration';
import AdminTestingHub from './AdminTestingHub';
import EnterpriseFeaturesManagement from './EnterpriseFeaturesManagement';
import { TemplateManagement } from './TemplateManagement';
import TranslationCacheManagement from './TranslationCacheManagement';
import FeedSection from '../dashboard/feed/FeedSection';
import {
  UsersIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  BriefcaseIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  BeakerIcon,
  StarIcon,
  LanguageIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface AdminStats {
  totalProfiles: number;
  totalCompanies: number;
  totalBlogs: number;
  totalJobPostings: number;
  pendingStamps: number;
  pendingJobPostings: number;
  totalJobApplications: number;
  profilesThisMonth: number;
  companiesThisMonth: number;
}

const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [stats, setStats] = useState<AdminStats>({
    totalProfiles: 0,
    totalCompanies: 0,
    totalBlogs: 0,
    totalJobPostings: 0,
    pendingStamps: 0,
    pendingJobPostings: 0,
    totalJobApplications: 0,
    profilesThisMonth: 0,
    companiesThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profiles' | 'blog' | 'stories' | 'stamps' | 'companies' | 'companies-view' | 'jobs' | 'applications' | 'monitoring' | 'user-moderation' | 'templates' | 'testing' | 'enterprise' | 'translations' | 'feed' | null>(null);

  useEffect(() => {
    if (!profile || profile.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchAdminStats();
  }, [profile, navigate]);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        { count: totalProfiles },
        { count: totalCompanies },
        { count: totalBlogs },
        { count: totalJobPostings },
        { count: pendingStamps },
        { count: pendingJobPostings },
        { count: totalJobApplications },
        { count: profilesThisMonth },
        { count: companiesThisMonth },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
        supabase.from('job_postings').select('*', { count: 'exact', head: true }),
        supabase.from('stamps').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('job_postings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('job_applications').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth.toISOString()),
        supabase.from('companies').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth.toISOString()),
      ]);

      setStats({
        totalProfiles: totalProfiles || 0,
        totalCompanies: totalCompanies || 0,
        totalBlogs: totalBlogs || 0,
        totalJobPostings: totalJobPostings || 0,
        pendingStamps: pendingStamps || 0,
        pendingJobPostings: pendingJobPostings || 0,
        totalJobApplications: totalJobApplications || 0,
        profilesThisMonth: profilesThisMonth || 0,
        companiesThisMonth: companiesThisMonth || 0,
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const t = {
    en: {
      title: 'Admin Dashboard',
      subtitle: 'Manage platform',
      stats: {
        users: 'Total Users',
        companies: 'Total Companies',
        blogPosts: 'Blog Posts',
        jobPostings: 'Job Postings',
        thisMonth: 'this month'
      },
      moderation: {
        title: 'Moderation',
        stampsTitle: 'Stamp Verification',
        stampsDesc: 'Review stamp verification requests',
        jobsTitle: 'Job Postings Approval',
        jobsDesc: 'Review and approve pending job postings',
        userModerationTitle: 'User Moderation',
        userModerationDesc: 'Review and moderate user accounts',
        pending: 'Pending'
      },
      users: {
        title: 'Users & Companies',
        profilesTitle: 'Users Management',
        profilesDesc: 'Manage user profiles, roles and permissions',
        companiesTitle: 'Registered Companies',
        companiesDesc: 'View all company registration data',
        companyManagementTitle: 'Company Management',
        companyManagementDesc: 'Approve, reject and manage companies',
        monitoringTitle: 'User Monitoring',
        monitoringDesc: 'Track user activity and analytics'
      },
      jobs: {
        title: 'Jobs & Applications',
        jobsTitle: 'Job Postings',
        jobsDesc: 'Manage all job postings on the platform',
        applicationsTitle: 'Job Applications',
        applicationsDesc: 'Monitor job applications and matches'
      },
      content: {
        title: 'Content Management',
        blogTitle: 'Blog Management',
        blogDesc: 'Create and edit blog posts',
        storiesTitle: 'Success Stories',
        storiesDesc: 'Manage platform success stories',
        templatesTitle: 'Template Configuration',
        templatesDesc: 'Manage FREE/PRO templates'
      },
      quickActions: {
        title: 'Quick Actions',
        searchTitle: 'Talent Search',
        searchDesc: 'Search profiles by categories',
        viewUsers: 'View All Users',
        viewUsersDesc: 'Access complete user directory',
        viewCompanies: 'View Companies',
        viewCompaniesDesc: 'Browse registered companies',
        analytics: 'Platform Analytics',
        analyticsDesc: 'View platform statistics'
      },
      comingSoon: 'Coming Soon',
      inDevelopment: 'This feature is currently in development',
      back: 'Back to Dashboard',
      testingTools: {
        title: 'Testing & Tools',
        testingHub: 'Testing Hub',
        testingHubDesc: 'Test templates and download CVs',
        enterpriseFeatures: 'Enterprise Features',
        enterpriseFeaturesDesc: 'Manage Enterprise features',
        translationCache: 'Translation Cache',
        translationCacheDesc: 'Manage cached translations',
        feedDesc: 'Test the social activity feed',
      }
    },
    es: {
      title: 'Panel de Administrador',
      subtitle: 'Gestiona la plataforma',
      stats: {
        users: 'Total de Usuarios',
        companies: 'Total de Empresas',
        blogPosts: 'Artículos de Blog',
        jobPostings: 'Vacantes Publicadas',
        thisMonth: 'este mes'
      },
      moderation: {
        title: 'Moderación',
        stampsTitle: 'Verificación de Stamps',
        stampsDesc: 'Revisa solicitudes de verificación',
        jobsTitle: 'Aprobar Vacantes',
        jobsDesc: 'Revisa y aprueba vacantes pendientes',
        userModerationTitle: 'Moderación de Usuarios',
        userModerationDesc: 'Revisa y modera cuentas de usuario',
        pending: 'Pendiente'
      },
      users: {
        title: 'Usuarios y Empresas',
        profilesTitle: 'Gestión de Usuarios',
        profilesDesc: 'Gestiona usuarios, roles y permisos',
        companiesTitle: 'Empresas Registradas',
        companiesDesc: 'Visualiza los datos de registro de empresas',
        companyManagementTitle: 'Gestión de Empresas',
        companyManagementDesc: 'Aprobar, rechazar y administrar empresas',
        monitoringTitle: 'Monitoreo de Usuarios',
        monitoringDesc: 'Rastrea actividad y análisis de usuarios'
      },
      jobs: {
        title: 'Vacantes y Aplicaciones',
        jobsTitle: 'Vacantes de Trabajo',
        jobsDesc: 'Gestiona todas las vacantes de la plataforma',
        applicationsTitle: 'Solicitudes de Empleo',
        applicationsDesc: 'Monitorea aplicaciones y coincidencias'
      },
      content: {
        title: 'Gestión de Contenido',
        blogTitle: 'Gestión de Blog',
        blogDesc: 'Crea y edita artículos del blog',
        storiesTitle: 'Historias de Éxito',
        storiesDesc: 'Gestiona historias de éxito',
        templatesTitle: 'Configuración de Plantillas',
        templatesDesc: 'Gestiona plantillas FREE/PRO'
      },
      quickActions: {
        title: 'Acciones Rápidas',
        searchTitle: 'Buscar Talentos',
        searchDesc: 'Busca perfiles por categorías',
        viewUsers: 'Ver Todos los Usuarios',
        viewUsersDesc: 'Accede al directorio completo',
        viewCompanies: 'Ver Empresas',
        viewCompaniesDesc: 'Explora empresas registradas',
        analytics: 'Analíticas de Plataforma',
        analyticsDesc: 'Visualiza estadísticas'
      },
      comingSoon: 'Próximamente',
      inDevelopment: 'Esta funcionalidad está actualmente en desarrollo',
      back: 'Volver al Dashboard',
      testingTools: {
        title: 'Testing y Herramientas',
        testingHub: 'Hub de Testing',
        testingHubDesc: 'Prueba plantillas y descarga CVs',
        enterpriseFeatures: 'Funcionalidades Enterprise',
        enterpriseFeaturesDesc: 'Gestiona funcionalidades Enterprise',
        translationCache: 'Caché de Traducciones',
        translationCacheDesc: 'Gestiona traducciones cacheadas',
        feedDesc: 'Prueba el feed social de actividad',
      }
    }
  };

  const translations = t[lang];

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg-primary">
      <header className="bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
            {translations.title}
          </h1>
          <p className="text-gray-600 dark:text-dark-text-secondary text-sm mt-1">
            {translations.subtitle}
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!activeTab ? (
          loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cv-blue dark:border-blue-400"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Users Card */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-20">
                    <UsersIcon className="w-full h-full" />
                  </div>
                  <div className="relative">
                    <p className="text-blue-100 text-sm font-medium">{translations.stats.users}</p>
                    <p className="text-4xl font-bold mt-2">{stats.totalProfiles}</p>
                    {stats.profilesThisMonth > 0 && (
                      <p className="text-blue-100 text-sm mt-2 flex items-center gap-1">
                        <ArrowTrendingUpIcon className="h-4 w-4" />
                        +{stats.profilesThisMonth} {translations.stats.thisMonth}
                      </p>
                    )}
                  </div>
                </div>

                {/* Companies Card */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-6 text-white shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-20">
                    <BuildingOfficeIcon className="w-full h-full" />
                  </div>
                  <div className="relative">
                    <p className="text-emerald-100 text-sm font-medium">{translations.stats.companies}</p>
                    <p className="text-4xl font-bold mt-2">{stats.totalCompanies}</p>
                    {stats.companiesThisMonth > 0 && (
                      <p className="text-emerald-100 text-sm mt-2 flex items-center gap-1">
                        <ArrowTrendingUpIcon className="h-4 w-4" />
                        +{stats.companiesThisMonth} {translations.stats.thisMonth}
                      </p>
                    )}
                  </div>
                </div>

                {/* Blog Posts Card */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-20">
                    <DocumentTextIcon className="w-full h-full" />
                  </div>
                  <div className="relative">
                    <p className="text-orange-100 text-sm font-medium">{translations.stats.blogPosts}</p>
                    <p className="text-4xl font-bold mt-2">{stats.totalBlogs}</p>
                  </div>
                </div>

                {/* Job Postings Card */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-20">
                    <BriefcaseIcon className="w-full h-full" />
                  </div>
                  <div className="relative">
                    <p className="text-purple-100 text-sm font-medium">{translations.stats.jobPostings}</p>
                    <p className="text-4xl font-bold mt-2">{stats.totalJobPostings}</p>
                  </div>
                </div>
              </div>

              {/* Main Content Grid - 2 columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Users & Companies (FIRST) */}
                <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border shadow-sm h-full flex flex-col">
                  <div className="p-6 border-b border-gray-200 dark:border-dark-border flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-gray-700 dark:text-dark-text-primary" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                      {translations.users.title}
                    </h2>
                  </div>
                  <div className="p-6 space-y-4 flex-1">
                    {/* User Monitoring */}
                    <button
                      onClick={() => setActiveTab('monitoring')}
                      className="w-full group bg-white dark:bg-dark-bg-tertiary hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-4 transition-all flex items-center gap-4 border border-gray-200 dark:border-dark-border"
                    >
                      <div className="p-3 bg-cv-blue/10 dark:bg-cv-blue/20 rounded-lg">
                        <ChartBarIcon className="h-6 w-6 text-cv-blue dark:text-blue-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-gray-900 dark:text-dark-text-primary">
                          {translations.users.monitoringTitle}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                          {translations.users.monitoringDesc}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Companies Management */}
                    <button
                      onClick={() => setActiveTab('companies')}
                      className="w-full group bg-white dark:bg-dark-bg-tertiary hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-4 transition-all flex items-center gap-4 border border-gray-200 dark:border-dark-border"
                    >
                      <div className="p-3 bg-cv-blue/10 dark:bg-cv-blue/20 rounded-lg">
                        <BuildingOfficeIcon className="h-6 w-6 text-cv-blue dark:text-blue-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-gray-900 dark:text-dark-text-primary">
                          {translations.users.companyManagementTitle}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                          {translations.users.companyManagementDesc}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Column 2: Moderation & Verification */}
                <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border shadow-sm h-full flex flex-col">
                  <div className="p-6 border-b border-gray-200 dark:border-dark-border flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-gray-700 dark:text-dark-text-primary" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                      {translations.moderation.title}
                    </h2>
                  </div>
                  <div className="p-6 space-y-4 flex-1">
                    {/* Stamp Verification */}
                    <button
                      onClick={() => setActiveTab('stamps')}
                      className="w-full group bg-white dark:bg-dark-bg-tertiary hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-4 transition-all flex items-center gap-4 border border-gray-200 dark:border-dark-border"
                    >
                      <div className="p-3 bg-cv-blue/10 dark:bg-cv-blue/20 rounded-lg relative">
                        <ShieldCheckIcon className="h-6 w-6 text-cv-blue dark:text-blue-400" />
                        {stats.pendingStamps > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {stats.pendingStamps > 9 ? '9+' : stats.pendingStamps}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-gray-900 dark:text-dark-text-primary flex items-center gap-2">
                          {translations.moderation.stampsTitle}
                          {stats.pendingStamps > 0 && (
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded">
                              {stats.pendingStamps} {translations.moderation.pending}
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                          {translations.moderation.stampsDesc}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Job Postings Approval */}
                    <button
                      onClick={() => setActiveTab('jobs')}
                      className="w-full group bg-white dark:bg-dark-bg-tertiary hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-4 transition-all flex items-center gap-4 border border-gray-200 dark:border-dark-border"
                    >
                      <div className="p-3 bg-cv-blue/10 dark:bg-cv-blue/20 rounded-lg relative">
                        <DocumentCheckIcon className="h-6 w-6 text-cv-blue dark:text-blue-400" />
                        {stats.pendingJobPostings > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {stats.pendingJobPostings > 9 ? '9+' : stats.pendingJobPostings}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-gray-900 dark:text-dark-text-primary flex items-center gap-2">
                          {translations.moderation.jobsTitle}
                          {stats.pendingJobPostings > 0 && (
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded">
                              {stats.pendingJobPostings} {translations.moderation.pending}
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                          {translations.moderation.jobsDesc}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* User Moderation */}
                    <button
                      onClick={() => setActiveTab('user-moderation')}
                      className="w-full group bg-white dark:bg-dark-bg-tertiary hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-4 transition-all flex items-center gap-4 border border-gray-200 dark:border-dark-border"
                    >
                      <div className="p-3 bg-cv-blue/10 dark:bg-cv-blue/20 rounded-lg">
                        <ExclamationTriangleIcon className="h-6 w-6 text-cv-blue dark:text-blue-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-gray-900 dark:text-dark-text-primary">
                          {translations.moderation.userModerationTitle}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                          {translations.moderation.userModerationDesc}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Column 3: Content Management */}
                <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border shadow-sm h-full flex flex-col">
                  <div className="p-6 border-b border-gray-200 dark:border-dark-border flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5 text-gray-700 dark:text-dark-text-primary" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                      {translations.content.title}
                    </h2>
                  </div>
                  <div className="p-6 space-y-4 flex-1">
                    {/* Blog Management */}
                    <button
                      onClick={() => setActiveTab('blog')}
                      className="w-full group bg-white dark:bg-dark-bg-tertiary hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-4 transition-all flex items-center gap-4 border border-gray-200 dark:border-dark-border"
                    >
                      <div className="p-3 bg-cv-blue/10 dark:bg-cv-blue/20 rounded-lg">
                        <DocumentTextIcon className="h-6 w-6 text-cv-blue dark:text-blue-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-gray-900 dark:text-dark-text-primary">
                          {translations.content.blogTitle}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                          {translations.content.blogDesc}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Success Stories */}
                    <button
                      onClick={() => setActiveTab('stories')}
                      className="w-full group bg-white dark:bg-dark-bg-tertiary hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-4 transition-all flex items-center gap-4 border border-gray-200 dark:border-dark-border"
                    >
                      <div className="p-3 bg-cv-blue/10 dark:bg-cv-blue/20 rounded-lg">
                        <SparklesIcon className="h-6 w-6 text-cv-blue dark:text-blue-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-gray-900 dark:text-dark-text-primary">
                          {translations.content.storiesTitle}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                          {translations.content.storiesDesc}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Template Management */}
                    <button
                      onClick={() => setActiveTab('templates')}
                      className="w-full group bg-white dark:bg-dark-bg-tertiary hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-4 transition-all flex items-center gap-4 border border-gray-200 dark:border-dark-border"
                    >
                      <div className="p-3 bg-cv-blue/10 dark:bg-cv-blue/20 rounded-lg">
                        <PaintBrushIcon className="h-6 w-6 text-cv-blue dark:text-blue-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-gray-900 dark:text-dark-text-primary">
                          {translations.content.templatesTitle}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                          {translations.content.templatesDesc}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Column 4: Testing & Tools */}
                <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border shadow-sm h-full flex flex-col">
                  <div className="p-6 border-b border-gray-200 dark:border-dark-border flex items-center gap-2">
                    <BeakerIcon className="h-5 w-5 text-gray-700 dark:text-dark-text-primary" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                      {translations.testingTools.title}
                    </h2>
                  </div>
                  <div className="p-6 space-y-4 flex-1">
                    {/* Testing Hub */}
                    <button
                      onClick={() => setActiveTab('testing')}
                      className="w-full group bg-white dark:bg-dark-bg-tertiary hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-4 transition-all flex items-center gap-4 border border-gray-200 dark:border-dark-border"
                    >
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <BeakerIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-gray-900 dark:text-dark-text-primary">
                          {translations.testingTools.testingHub}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                          {translations.testingTools.testingHubDesc}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Enterprise Features */}
                    <button
                      onClick={() => setActiveTab('enterprise')}
                      className="w-full group bg-white dark:bg-dark-bg-tertiary hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-4 transition-all flex items-center gap-4 border border-gray-200 dark:border-dark-border"
                    >
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <StarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-gray-900 dark:text-dark-text-primary">
                          {translations.testingTools.enterpriseFeatures}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                          {translations.testingTools.enterpriseFeaturesDesc}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Translation Cache */}
                    <button
                      onClick={() => setActiveTab('translations')}
                      className="w-full group bg-white dark:bg-dark-bg-tertiary hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-4 transition-all flex items-center gap-4 border border-gray-200 dark:border-dark-border"
                    >
                      <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <LanguageIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-gray-900 dark:text-dark-text-primary">
                          {translations.testingTools.translationCache}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                          {translations.testingTools.translationCacheDesc}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Feed (Beta) */}
                    <button
                      onClick={() => setActiveTab('feed')}
                      className="w-full group bg-white dark:bg-dark-bg-tertiary hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-4 transition-all flex items-center gap-4 border border-gray-200 dark:border-dark-border"
                    >
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-gray-900 dark:text-dark-text-primary flex items-center gap-2">
                          Feed
                          <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium rounded">
                            Beta
                          </span>
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                          {translations.testingTools.feedDesc}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Talent Search */}
                    <Link
                      to="/admin/search"
                      className="w-full group bg-white dark:bg-dark-bg-tertiary hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-4 transition-all flex items-center gap-4 border border-gray-200 dark:border-dark-border"
                    >
                      <div className="p-3 bg-cv-blue/10 dark:bg-cv-blue/20 rounded-lg">
                        <MagnifyingGlassIcon className="h-6 w-6 text-cv-blue dark:text-blue-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-gray-900 dark:text-dark-text-primary">
                          {translations.quickActions.searchTitle}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                          {translations.quickActions.searchDesc}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Users Table Section - AT THE BOTTOM */}
              <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-gray-700 dark:text-dark-text-primary" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                      {translations.users.profilesTitle}
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  <ProfilesManagement />
                </div>
              </div>
            </div>
          )
        ) : (
          <div>
            <button
              onClick={() => setActiveTab(null)}
              className="flex items-center gap-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text-primary transition-colors mb-6 px-4 py-2 bg-white dark:bg-dark-bg-secondary rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-dark-border"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium">{translations.back}</span>
            </button>

            {activeTab === 'templates' ? (
              <TemplateManagement />
            ) : activeTab === 'testing' ? (
              <AdminTestingHub />
            ) : activeTab === 'enterprise' ? (
              <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
                <EnterpriseFeaturesManagement />
              </div>
            ) : activeTab === 'translations' ? (
              <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
                <TranslationCacheManagement />
              </div>
            ) : activeTab === 'feed' ? (
              <FeedSection />
            ) : (
              <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
                {activeTab === 'profiles' && <ProfilesManagement />}
                {activeTab === 'blog' && <BlogManagementSection />}
                {activeTab === 'stories' && <SuccessStoriesManagement />}
                {activeTab === 'stamps' && <StampsManagement />}
                {activeTab === 'companies' && <CompanyManagementSection />}
                {activeTab === 'companies-view' && <CompaniesViewSection />}
                {activeTab === 'monitoring' && <UserMonitoring />}
                {activeTab === 'jobs' && <JobPostingsManagement />}
                {activeTab === 'applications' && <JobApplicationsManagement />}
                {activeTab === 'user-moderation' && <UserModeration />}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
