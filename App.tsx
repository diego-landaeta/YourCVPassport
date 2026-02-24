
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { LanguageProvider } from './contexts/LanguageContext';
import MainLayout from './components/MainLayout';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import CompanyProtectedRoute from './components/company/CompanyProtectedRoute';
import { routeConfig } from './config/routeConfig';
import LoadingSpinner from './components/shared/LoadingSpinner';
import { QueryProvider } from './hooks/useQueryClient';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';
import { Toaster } from 'react-hot-toast';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./components/HomePage'));
const DashboardPage = lazy(() => import('./components/pages/DashboardPage'));
const ProfileViewPage = lazy(() => import('./components/pages/ProfileViewPage'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const AdminTalentSearchPage = lazy(() => import('./components/admin/AdminTalentSearchPage'));
const VisasPage = lazy(() => import('./components/dashboard/VisasPage'));
const VisaFormPage = lazy(() => import('./components/dashboard/VisaFormPage'));
const LeadsPage = lazy(() => import('./components/dashboard/LeadsPage'));
const BlogPage = lazy(() => import('./components/pages/BlogPage'));
const BlogPostPage = lazy(() => import('./components/pages/BlogPostPage'));
const AIProductPage = lazy(() => import('./components/pages/AIProductPage'));
const PublicFeedPage = lazy(() => import('./components/pages/PublicFeedPage'));
const PostViewPage = lazy(() => import('./components/pages/PostViewPage'));

// Authentication pages
const AuthPage = lazy(() => import('./pages/auth/AuthPage'));
const MagicLinkPage = lazy(() => import('./pages/auth/MagicLinkPage'));
const RecoveryPage = lazy(() => import('./pages/auth/RecoveryPage'));
const CallbackPage = lazy(() => import('./pages/auth/CallbackPage'));
const ConfirmPage = lazy(() => import('./pages/auth/ConfirmPage'));


// Company pages
const CompanyRegistrationPage = lazy(() => import('./components/company/CompanyRegistrationPage'));
const CompanyDashboardPage = lazy(() => import('./components/company/CompanyDashboardPage'));
const CompanyTalentSearchPage = lazy(() => import('./components/talent-search/CompanyTalentSearchPage'));
const CompanyProfileViewPage = lazy(() => import('./components/company/CompanyProfileViewPage'));
const CreditsManagementPage = lazy(() => import('./components/company/CreditsManagementPage'));
const SavedSearchesPage = lazy(() => import('./components/company/SavedSearchesPage'));
const ExportsHistoryPage = lazy(() => import('./components/company/ExportsHistoryPage'));
const CompanyTeamPage = lazy(() => import('./components/company/CompanyTeamPage'));
const CompanySettingsPage = lazy(() => import('./components/company/CompanySettingsPage'));
const CompanyAnalyticsPage = lazy(() => import('./components/company/CompanyAnalyticsPage'));
const CompanyMessagesPage = lazy(() => import('./components/company/CompanyMessagesPage'));
const JobPostingsManagementPage = lazy(() => import('./components/company/JobPostingsManagementPage'));
const CreateJobPostingPage = lazy(() => import('./components/company/CreateJobPostingPage'));
const JobApplicationsPage = lazy(() => import('./components/company/JobApplicationsPage'));

// Public job search pages
const JobSearchPage = lazy(() => import('./components/pages/JobSearchPage'));
const JobDetailPage = lazy(() => import('./components/pages/JobDetailPage'));

// 404 Not Found page
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Dev tools
const TemplatePreviewCapture = lazy(() => import('./components/pages/TemplatePreviewCapture'));

// Auth-aware community route: logged-in users see the full dashboard at /comunidad or /feed
const CommunityRoute: React.FC = () => {
  const { session, profileLoading } = useAuth();
  if (profileLoading) return <LoadingSpinner />;
  if (session) return <DashboardPage />;
  return <PublicFeedPage />;
};

const AppContent: React.FC = () => {
    // Combine English and Spanish paths into a single list for the router.
    // The useLanguage hook will ensure the correct content is rendered based on the URL prefix.
    const allRoutes = routeConfig.flatMap(route => [
      { path: route.path_en, component: route.component, props: route.props },
      { path: route.path_es, component: route.component, props: route.props },
    ]);
    const uniqueRoutes = Array.from(new Map(allRoutes.map(item => [item.path, item])).values());

    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* Authentication routes */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/magic-link" element={<MagicLinkPage />} />
          <Route path="/recovery" element={<RecoveryPage />} />
          <Route path="/callback" element={<CallbackPage />} />
          <Route path="/confirm" element={<ConfirmPage />} />

          {/* Product pages */}
          <Route path="/product/ai" element={<AIProductPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/visas" element={<VisasPage />} />
            <Route path="/dashboard/visas/new" element={<VisaFormPage />} />
            <Route path="/dashboard/visas/:id/edit" element={<VisaFormPage />} />
            <Route path="/dashboard/leads" element={<LeadsPage />} />
          </Route>

          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/search" element={<AdminTalentSearchPage />} />
          </Route>

          {/* Community: full dashboard for logged-in users, public page otherwise */}
          <Route path="/feed" element={<CommunityRoute />} />
          <Route path="/comunidad" element={<CommunityRoute />} />

          {/* Individual post view — public, noindex */}
          <Route path="/feed/post/:id" element={<PostViewPage />} />
          <Route path="/comunidad/post/:id" element={<PostViewPage />} />
          <Route path="/p/:id" element={<PostViewPage />} />

          {/* Public Job Search */}
          <Route path="/jobs" element={<JobSearchPage />} />
          <Route path="/jobs/:slug" element={<JobDetailPage />} />
          <Route path="/empleos" element={<JobSearchPage />} />
          <Route path="/empleos/:slug" element={<JobDetailPage />} />

          {/* Company routes */}
          <Route path="/company/register" element={<CompanyRegistrationPage />} />
          <Route element={<CompanyProtectedRoute />}>
            <Route path="/company/dashboard" element={<CompanyDashboardPage />} />
            <Route path="/company/search" element={<CompanyTalentSearchPage />} />
            <Route path="/company/profile/:profileId" element={<CompanyProfileViewPage />} />
            <Route path="/company/messages" element={<CompanyMessagesPage />} />
            <Route path="/company/credits" element={<CreditsManagementPage />} />
            <Route path="/company/saved-searches" element={<SavedSearchesPage />} />
            <Route path="/company/exports" element={<ExportsHistoryPage />} />
            <Route path="/company/team" element={<CompanyTeamPage />} />
            <Route path="/company/settings" element={<CompanySettingsPage />} />
            <Route path="/company/analytics" element={<CompanyAnalyticsPage />} />
            <Route path="/company/jobs" element={<JobPostingsManagementPage />} />
            <Route path="/company/jobs/new" element={<CreateJobPostingPage />} />
            <Route path="/company/jobs/edit/:id" element={<CreateJobPostingPage />} />
            <Route path="/company/jobs/applications" element={<JobApplicationsPage />} />
          </Route>

          {/* Dynamically generated routes from routeConfig */}
          {uniqueRoutes.map((route) => {
            const Component = route.component;
            const routeProps = route.props || {};
            return (
              <React.Fragment key={route.path}>
                <Route
                  path={`/${route.path}`}
                  element={<Component {...routeProps} />}
                />
              </React.Fragment>
            );
          })}

          {/* Public CV Route */}
          <Route path="/cv/:slug" element={<ProfileViewPage />} />

          {/* Blog Routes - Language specific */}
          <Route path="/recursos/blog" element={<BlogPage />} />
          <Route path="/recursos/blog/:slug" element={<BlogPostPage />} />
          <Route path="/resources/blog" element={<BlogPage />} />
          <Route path="/resources/blog/:slug" element={<BlogPostPage />} />

          {/* Dev Tool - Template Preview Capture */}
          <Route path="/dev/template-preview" element={<TemplatePreviewCapture />} />

          {/* 404 Not Found Routes */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    );
};


const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <HelmetProvider>
          <ToastProvider>
            <Router>
              <AuthProvider>
                <LanguageProvider>
                  <MainLayout>
                    <ErrorBoundary>
                      <AppContent />
                    </ErrorBoundary>
                  </MainLayout>
                </LanguageProvider>
              </AuthProvider>
            </Router>
            <Toaster position="top-right" />
          </ToastProvider>
        </HelmetProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
};

export default App;
