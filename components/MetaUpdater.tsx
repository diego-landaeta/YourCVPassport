import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslations } from '../hooks/useTranslations';
import { useLanguage } from '../contexts/LanguageContext';

const getMetaForPath = (path: string, t: any) => {
    const pathToMetaKey: { [key: string]: any } = {
        '/': t.meta.home,
        '/product/overview': t.meta.productOverview,
        '/product/stamps': t.meta.stamps,
        '/product/ats': t.meta.ats,
        '/product/domain': t.meta.domain,
        '/product/analytics': t.meta.analytics,
        '/product/ai': t.meta.ai,
        '/companies/search': t.meta.talentSearch,
        '/about': t.meta.about,
        '/about/mission': t.meta.mission,
        '/about/press': t.meta.press,
        '/about/contact': t.meta.contact,
        '/professionals/how': t.meta.howItWorks,
        '/professionals/templates': t.meta.templates,
        '/pricing': t.meta.pricing,
        '/professionals/help': t.meta.help,
        '/companies/plans': t.meta.companyPlans,
        '/companies/integrations': t.meta.integrations,
        '/companies/security': t.meta.security,
        '/resources/blog': t.meta.blog,
        '/resources/library': t.meta.library,
        '/resources/success': t.meta.success,
        '/resources/status': t.meta.status,
    };
    return pathToMetaKey[path] || t.meta.default;
};

const MetaUpdater: React.FC = () => {
    const location = useLocation();
    const t = useTranslations();
    const { lang } = useLanguage();

    useEffect(() => {
        const path = location.pathname.replace(/^\/es/, '') || '/';
        const pageMeta = getMetaForPath(path, t);

        if (pageMeta) {
            document.title = pageMeta.title;
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.setAttribute('content', pageMeta.description);
            }
        }
        
        // Update html lang attribute
        document.documentElement.lang = lang;

    }, [location, t, lang]);

    return null; // This component does not render anything
};

export default MetaUpdater;
