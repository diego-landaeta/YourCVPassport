import React, { lazy } from 'react';

// Lazy load all page components for better performance
const ProductOverviewPage = lazy(() => import('../components/pages/ProductOverviewPage'));
const StampsPage = lazy(() => import('../components/StampsPage'));
const ATSExportPage = lazy(() => import('../components/ATSExportPage'));
const CustomDomainPage = lazy(() => import('../components/CustomDomainPage'));
const ProfileAnalyticsPage = lazy(() => import('../components/pages/ProfileAnalyticsPage'));
const AIProductPage = lazy(() => import('../components/pages/AIProductPage'));
const AdvancedTalentSearchPage = lazy(() => import('../components/pages/AdvancedTalentSearchPage'));
const AboutUs = lazy(() => import('../components/landing/AboutUs'));
const MissionAndValuesPage = lazy(() => import('../components/landing/MissionAndValuesPage'));
const PressKitPage = lazy(() => import('../components/landing/PressKitPage'));
const ContactPage = lazy(() => import('../components/landing/ContactPage'));
const HowItWorksProfessionalsPage = lazy(() => import('../components/landing/HowItWorksProfessionalsPage'));
const TemplatesAndExamplesPage = lazy(() => import('../components/pages/TemplatesAndExamplesPage'));
const PricingPage = lazy(() => import('../components/pages/PricingPage'));
const HelpCenterPage = lazy(() => import('../components/HelpCenterPage'));
const CompanyPlansPage = lazy(() => import('../components/CompanyPlansPage'));
const ATSIntegrationsPage = lazy(() => import('../components/ATSIntegrationsPage'));
const SecurityCompliancePage = lazy(() => import('../components/SecurityCompliancePage'));
const BlogPage = lazy(() => import('../components/pages/BlogPage'));
const TemplateLibraryPage = lazy(() => import('../components/pages/TemplateLibraryPage'));
const SystemStatusPage = lazy(() => import('../components/pages/SystemStatusPage'));
const SuccessStoriesPage = lazy(() => import('../components/landing/SuccessStoriesPage'));
const UnderConstructionPage = lazy(() => import('../components/UnderConstructionPage'));
const TemplatePreviewCapture = lazy(() => import('../components/pages/TemplatePreviewCapture'));
const AllTemplatesPreview = lazy(() => import('../components/pages/AllTemplatesPreview'));
const TermsPage = lazy(() => import('../components/TermsPage'));
const PrivacyPage = lazy(() => import('../components/PrivacyPage'));

interface RouteConfig {
  path_en: string;
  path_es: string;
  component: React.ComponentType<any>;
  props?: object;
}

const componentMap: { [key: string]: React.ComponentType<any> } = {
  ProductOverviewPage,
  StampsPage,
  ATSExportPage,
  CustomDomainPage,
  ProfileAnalyticsPage,
  AIProductPage,
  AdvancedTalentSearchPage,
  AboutUs,
  MissionAndValuesPage,
  PressKitPage,
  ContactPage,
  HowItWorksProfessionalsPage,
  TemplatesAndExamplesPage,
  PricingPage,
  HelpCenterPage,
  CompanyPlansPage,
  ATSIntegrationsPage,
  SecurityCompliancePage,
  BlogPage,
  TemplateLibraryPage,
  SystemStatusPage,
  SuccessStoriesPage,
  UnderConstructionPage,
  TemplatePreviewCapture,
  AllTemplatesPreview,
  TermsPage,
  PrivacyPage,
};

const pathMappings = [
  { en: 'product/overview', es: 'producto/resumen', componentName: 'ProductOverviewPage' },
  { en: 'product/stamps', es: 'producto/sellos', componentName: 'StampsPage' },
  { en: 'product/ats', es: 'producto/ats', componentName: 'ATSExportPage' },
  { en: 'product/domain', es: 'producto/dominio', componentName: 'CustomDomainPage' },
  { en: 'product/analytics', es: 'producto/analiticas', componentName: 'ProfileAnalyticsPage' },
  { en: 'product/ai', es: 'producto/ia', componentName: 'AIProductPage' },
  { en: 'companies/search', es: 'empresas/busqueda', componentName: 'AdvancedTalentSearchPage' },
  { en: 'about', es: 'nosotros', componentName: 'AboutUs' },
  { en: 'about/mission', es: 'nosotros/mision', componentName: 'MissionAndValuesPage' },
  { en: 'about/press', es: 'nosotros/prensa', componentName: 'PressKitPage' },
  { en: 'about/contact', es: 'nosotros/contacto', componentName: 'ContactPage' },
  { en: 'professionals/how', es: 'profesionales/como-funciona', componentName: 'HowItWorksProfessionalsPage' },
  { en: 'professionals/templates', es: 'profesionales/plantillas', componentName: 'TemplatesAndExamplesPage' },
  { en: 'pricing', es: 'precios', componentName: 'PricingPage' },
  { en: 'professionals/help', es: 'profesionales/ayuda', componentName: 'HelpCenterPage' },
  { en: 'companies/plans', es: 'empresas/planes', componentName: 'CompanyPlansPage' },
  { en: 'companies/integrations', es: 'empresas/integraciones', componentName: 'ATSIntegrationsPage' },
  { en: 'companies/security', es: 'empresas/seguridad', componentName: 'SecurityCompliancePage' },
  { en: 'resources/blog', es: 'recursos/blog', componentName: 'BlogPage' },
  { en: 'resources/library', es: 'recursos/biblioteca', componentName: 'TemplateLibraryPage' },
  { en: 'resources/success-stories', es: 'recursos/exito', componentName: 'SuccessStoriesPage' },
  { en: 'resources/status', es: 'recursos/estado', componentName: 'SystemStatusPage' },
  { en: 'product', es: 'producto', componentName: 'ProductOverviewPage' },
  { en: 'professionals', es: 'profesionales', componentName: 'HowItWorksProfessionalsPage' },
  { en: 'companies', es: 'empresas', componentName: 'AdvancedTalentSearchPage' },
  { en: 'resources', es: 'recursos', componentName: 'UnderConstructionPage', props: { pageTitle: 'Resources' } },
  { en: 'dev/template-preview', es: 'dev/vista-previa-plantillas', componentName: 'TemplatePreviewCapture' },
  { en: 'dev/all-templates-preview', es: 'dev/todas-plantillas-vista', componentName: 'AllTemplatesPreview' },
  { en: 'profiles', es: 'perfiles', componentName: 'AdvancedTalentSearchPage' },
  { en: 'terms', es: 'terminos', componentName: 'TermsPage' },
  { en: 'privacy', es: 'privacidad', componentName: 'PrivacyPage' },
];

export const routeConfig: RouteConfig[] = pathMappings.map(route => ({
    path_en: route.en,
    path_es: route.es,
    component: componentMap[route.componentName],
    props: route.props,
}));
