
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { LanguageProvider } from './contexts/LanguageContext';
import MainLayout from './components/MainLayout';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import { routeConfig } from './routeConfig';
import LoadingSpinner from './components/LoadingSpinner';
import { QueryProvider } from './hooks/useQueryClient';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./components/HomePage'));
const DashboardPage = lazy(() => import('./components/DashboardPage'));
const ProfileSearchPage = lazy(() => import('./components/ProfileSearchPage'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const VisasPage = lazy(() => import('./components/dashboard/VisasPage'));
const VisaFormPage = lazy(() => import('./components/dashboard/VisaFormPage'));
const LeadsPage = lazy(() => import('./components/dashboard/LeadsPage'));
const BlogPostPage = lazy(() => import('./components/BlogPostPage'));
const ProfileCategoryPage = lazy(() => import('./components/ProfileCategoryPage'));
const AIProductPage = lazy(() => import('./components/AIProductPage'));

// Authentication pages
const AuthPage = lazy(() => import('./pages/auth/AuthPage'));
const MagicLinkPage = lazy(() => import('./pages/auth/MagicLinkPage'));
const RecoveryPage = lazy(() => import('./pages/auth/RecoveryPage'));
const CallbackPage = lazy(() => import('./pages/auth/CallbackPage'));
const ConfirmPage = lazy(() => import('./pages/auth/ConfirmPage'));

// Public verification page
const VerifyPage = lazy(() => import('./pages/VerifyPage'));

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
          <Route path="/cv/:slug" element={<ProfileSearchPage />} />

          {/* Public Verification Route */}
          <Route path="/verify/:token" element={<VerifyPage />} />

          {/* Blog Post Route */}
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/resources/blog/:slug" element={<BlogPostPage />} />
          <Route path="/recursos/blog/:slug" element={<BlogPostPage />} />

          {/* Profile Category Routes - SEO Optimized */}
          <Route path="/profiles/:country/:city/:role" element={<ProfileCategoryPage />} />
          <Route path="/profiles/:country/:city" element={<ProfileCategoryPage />} />
          <Route path="/profiles/:country" element={<ProfileCategoryPage />} />
          <Route path="/profiles/:role" element={<ProfileCategoryPage />} />
          <Route path="/perfiles/:country/:city/:role" element={<ProfileCategoryPage />} />
          <Route path="/perfiles/:country/:city" element={<ProfileCategoryPage />} />
          <Route path="/perfiles/:country" element={<ProfileCategoryPage />} />
          <Route path="/perfiles/:role" element={<ProfileCategoryPage />} />
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
            <AuthProvider>
              <Router>
                <LanguageProvider>
                  <MainLayout>
                    <ErrorBoundary>
                      <AppContent />
                    </ErrorBoundary>
                  </MainLayout>
                </LanguageProvider>
              </Router>
            </AuthProvider>
          </ToastProvider>
        </HelmetProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
};

export default App;
