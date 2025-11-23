import React from 'react';
import { ChangelogEntry, Template, MilestoneItem } from '../types';

const transparencyIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }), React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" }));
const trustIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" }));
const innovationIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" }));
const inclusivityIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h1a2 2 0 002-2v-1a2 2 0 012-2h1.945M12 3c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8z" }));
const factFoundedIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }));
const factUsersIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" }));
const factCountriesIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h1a2 2 0 002-2v-1a2 2 0 012-2h1.945M12 3c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8z" }));
const factTeamIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-5.197M15 21a6 6 0 00-3-5.197" }));
const contactSupportIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9 12l2 2 4-4M5 12H3m4 4l-2 2m14-4l2 2m-2-14l2-2m-14 2l-2-2" }));
const contactSalesIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" }));
const contactPartnershipsIcon = React.createElement('svg', { className: "w-8 h-8 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm-9 3a2 2 0 11-4 0 2 2 0 014 0z" }));
const identityStampIcon = React.createElement('svg', { className: "w-10 h-10 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h6" }));
const educationStampIcon = React.createElement('svg', { className: "w-10 h-10 text-cv-blue", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { d: "M12 14l9-5-9-5-9 5 9 5z" }), React.createElement('path', { d: "M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" }), React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 14l9-5-9-5-9 5 9 5zm0 0v6" }));


export const translations = {
    meta: {
        default: { title: 'YourCVPassport', description: 'Your Verified Professional Passport' },
        home: { title: 'YourCVPassport - Verified Professional CV | Stand Out & Get Hired', description: 'Build a verified professional CV passport that recruiters trust. AI-powered optimization, ATS compatibility, global visibility. Join 10,000+ professionals. Free start!' },
        productOverview: { title: 'Product Overview | YourCVPassport', description: 'Discover all YourCVPassport features: verified profiles, ATS export, custom domains, analytics & AI tools. Create your professional CV passport today.' },
        stamps: { title: 'Verified Stamps | YourCVPassport', description: 'Earn verification stamps for your CV: identity, education, work experience & skills validation. Stand out with trusted credentials.' },
        ats: { title: 'ATS Export Compatibility | YourCVPassport', description: 'Export your CV in ATS-friendly PDF and DOCX formats. Optimized for 98% of Fortune 500 screening systems.' },
        domain: { title: 'Custom Domain & URL | YourCVPassport', description: 'Get your custom CV URL like yourcvpassport.com/cv/yourname. Professional branding, easy sharing, memorable links.' },
        analytics: { title: 'Profile Analytics | YourCVPassport', description: 'Advanced analytics for your CV: track profile views, visitor locations, traffic sources, and engagement metrics.' },
        ai: { title: 'AI Assistant for CV & Cover Letters | YourCVPassport', description: 'Leverage the power of AI to enhance your profile summary, write compelling cover letters, and suggest impactful keywords.' },
        talentSearch: { title: 'Advanced Talent Search | YourCVPassport', description: 'Search 10,000+ verified professional profiles with advanced filters for skills, experience, location, and salary.' },
        about: { title: 'About Us | YourCVPassport', description: 'Learn about our mission to empower professional trust worldwide through verified credentials.' },
        mission: { title: 'Mission & Values | YourCVPassport', description: 'Our mission is to build trust in the professional credentials worldwide through transparency, innovation, and inclusivity.' },
        press: { title: 'Press & Media Kit | YourCVPassport', description: 'Resources for journalists and media partners. Find our latest announcements, brand assets, and company information.' },
        contact: { title: 'Contact Us | YourCVPassport', description: 'Get in touch with YourCVPassport for customer support, sales inquiries, or partnership opportunities.' },
        howItWorks: { title: 'How It Works for Professionals | YourCVPassport', description: 'Learn how to create your verified CV passport in 3 simple steps: Import, verify, and share your professional profile.' },
        templates: { title: 'CV Templates & Examples | YourCVPassport', description: 'Browse 20+ professional, ATS-optimized CV templates and real examples for every industry.' },
        pricing: { title: 'Pricing Plans | YourCVPassport', description: 'Transparent pricing that grows with you. Choose the right plan to unlock your potential. Free plan available.' },
        help: { title: 'Help Center | YourCVPassport', description: 'Welcome to our support hub. Find guides, tutorials, and answers to all your questions about YourCVPassport.' },
        companyPlans: { title: 'Enterprise Plans | YourCVPassport', description: 'Enterprise recruitment plans with contact credits, bulk messaging, dedicated support, and ATS integration.' },
        integrations: { title: 'ATS Integrations | YourCVPassport', description: 'Seamlessly integrate YourCVPassport with Greenhouse, Lever, Workable & more. REST API for custom integrations.' },
        security: { title: 'Security & Compliance | YourCVPassport', description: 'Enterprise-grade security & full GDPR compliance. SOC 2, ISO 27001 certified. Your data is safe with us.' },
        blog: { title: 'Career Blog & Guides | YourCVPassport', description: 'Expert advice on CV writing, interview preparation, career growth, and job search strategies.' },
        library: { title: 'Template Library | YourCVPassport', description: 'Download 50+ free professional templates: CVs, cover letters, follow-up emails, and LinkedIn messages.' },
        success: { title: 'Success Stories | YourCVPassport', description: 'Read inspiring success stories from professionals who landed their dream jobs using YourCVPassport.' },
        status: { title: 'System Status | YourCVPassport', description: 'Find real-time status updates, uptime statistics, and the latest product news and changelog.' },
    },
    header: {
        login: 'Log In',
        signup: 'Create Profile',
        dashboard: 'My Profile',
        logout: 'Log Out',
    },
    hero: {
        title: 'Your Verified Professional Passport: Stand Out and Advance Your Career',
        subtitle: 'In a competitive market, trust is your greatest asset. Create a unique, verified profile to showcase your credentials and get noticed by top companies.',
        ctaCreate: 'Create Your Passport',
        ctaSearch: 'Search for Talent',
    },
    companies: {
        title: 'Companies Trusting YourCVPassport Verification',
        logos: [
            { name: "Innovate Inc.", url: "https://www.innovateteam.com/" },
            { name: "QuantumLeap", url: "http://quleap.com/" },
            { name: "Apex Solutions", url: "https://www.apexsystems.com/" },
            { name: "Stellar Corp.", url: "https://www.stlr.net/" },
            { name: "NextGen", url: "https://nextgen.group/" }
        ],
    },
    features: {
        title: 'Boost Your Professional Profile with Our Verified Tools',
        subtitle: 'From AI assistance to global recognition, we provide the tools you need to succeed.',
        items: [
            { icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>', title: 'Identity Verification', description: 'Build immediate trust with employers through verified identity, education, and work history stamps.' },
            { icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>', title: 'ATS Export Compatibility', description: 'Export your profile to PDF or DOCX formats optimized to pass through any Applicant Tracking System.' },
            { icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>', title: 'AI-Powered Profile Enhancement', description: 'Use our AI assistant to refine your bio, highlight key skills, and craft compelling cover letters.' },
            { icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>', title: 'Professional Profile Analytics', description: 'See who is viewing your profile, from where, and which skills are getting the most attention.' },
            { icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h1a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.884 5.337l.623.623M16.116 5.337l-.623.623M12 3v1m0 16v1m-6.663-1.477l.623-.623M18.116 15.89l-.623-.623" /></svg>', title: 'International Visibility', description: 'Our universal verification standards make your profile globally recognized and trusted.' },
            { icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>', title: 'Advanced Customization', description: 'Tailor your profile with custom domains, layouts, and sections to truly reflect your personal brand.' },
        ],
    },
    howItWorks: {
        title: 'Creating Your CV Passport Is This Easy',
        subtitle: 'Get your verified profile up and running in just a few simple steps.',
        steps: [
            { title: "Create Your Professional Profile", description: "Sign up and build your profile. Import from LinkedIn or upload your existing CV to get started quickly." },
            { title: "Verify Your Credentials", description: "Submit your documents for verification. Our secure process adds trusted stamps to your profile." },
            { title: "Share and Stand Out", description: "Share your unique CV Passport link with recruiters and on professional networks to get noticed." },
        ],
    },
    testimonials: {
        title: "Success Stories That Inspire Professional Growth",
        subtitle: "Hear from professionals and recruiters who have transformed their careers with us.",
    },
    pricing: {
        title: 'Plans Tailored to Your Professional Needs',
        subtitle: "Choose the right plan to unlock your potential, whether you're just starting out or leading a team.",
        compareCta: 'Compare All Plans & Features →',
    },
    security: {
        title: 'GDPR Security & Compliance: Your Data, Your Control',
        subtitle: 'We are committed to protecting your privacy. Our platform is built on a foundation of security, adhering to the strictest GDPR standards. You control your data, who sees it, and when.',
        cta: 'Learn More About Security',
    },
    faq: {
        title: "Frequently Asked Questions About Verified Professional CVs",
        subtitle: "Have questions? We have answers. If you don't find what you're for, feel free to contact us.",
    },
    stampsFaq: {
        title: "Verification FAQs",
        description: "Find answers to common questions about our verification process."
    },
    cta: {
        title: 'Start Your Professional Journey Today',
        subtitle: 'Ready to take the next step in your career? Create your verified CV Passport and unlock new opportunities.',
        button: 'Create Your Passport Now',
    },
    footer: {
        tagline: 'Your verified professional identity.',
        rights: 'All rights reserved.',
        product: { title: 'Product', overview: 'Overview', stamps: 'Verified Profiles', ats: 'ATS Export', ai: 'AI Assistant' },
        solutions: { title: 'Solutions', professionals: 'For Professionals', companies: 'For Companies', pricing: 'Pricing' },
        resources: { title: 'Resources', blog: 'Blog', help: 'Help Center', status: 'System Status' },
        company: { title: 'Company', about: 'About Us', press: 'Press', contact: 'Contact' },
        links: {
            overview: '/product/overview',
            stamps: '/product/stamps',
            ats: '/product/ats',
            ai: '/product/ai',
            professionals: '/professionals/how',
            companies: '/companies/search',
            pricing: '/pricing',
            blog: '/resources/blog',
            help: '/professionals/help',
            status: '/resources/status',
            about: '/about',
            press: '/about/press',
            contact: '/about/contact'
        }
    },
    underConstruction: {
        title: 'This section is under construction!',
        subtitle: 'Soon you will be able to explore all the features we are preparing for you here. We are working to bring you the best experience.',
    },
    changelogTypes: {
        'New Feature': 'New Feature',
        'Improvement': 'Improvement',
        'Bug Fix': 'Bug Fix',
    },
    aboutUs: {
        title: 'Our Mission is to Empower Professional Trust',
        subtitle: 'At YourCVPassport, we believe trust is the foundation of every professional opportunity. Our mission is to empower professionals and companies with verified profiles that accelerate success.',
        valuesTitle: 'Our Values',
        values: [
            { title: 'Integrity', description: 'We act with honesty and transparency, ensuring that every verification is a true seal of trust.' },
            { title: 'Innovation', description: 'We use cutting-edge technology to simplify verification and improve the connection between talent and opportunity.' },
            { title: 'Empowerment', description: 'We give professionals control over their digital identity and companies the tools to hire with confidence.' }
        ],
        pressTitle: 'Press & Media Kit',
        pressSubtitle: 'Interested in telling our story? Get in touch with our communications team.',
        ctaDownload: 'Explore Press Page',
        ctaContact: 'Contact Press Team',
        pressLink: 'about/press',
        contactLink: 'about/contact'
    },
    customDomain: {
        title: 'Custom Domain & Professional URL: Your Personal Brand Headquarters',
        subtitle: 'Create a memorable, professional link for your CV. Stand out with a custom URL like yourcvpassport.com/cv/yourname or connect your own domain.',
        standOutTitle: 'Stand Out from the Crowd with a Professional URL',
        firstImpressionsTitle: 'First Impressions Matter',
        firstImpressionsBody: 'A clean, custom URL shows professionalism and attention to detail. It\'s the first thing a recruiter sees.',
        whyGenericDontWorkTitle: 'Why Generic URLs Don\'t Work',
        whyGenericDontWorkBody: 'which one is easier to remember and looks more professional? Your URL is part of your brand.',
        boostBrandTitle: 'Boost Your Personal Brand',
        boostBrandItems: [
            'Increases memorability',
            'Demonstrates professionalism',
            'Improves SEO for your name',
            'Centralizes your online presence'
        ],
        setupTitle: 'Set Up Your Custom URL in Seconds',
        step1: {
            title: 'Step 1: Choose Your Subdomain',
            description: 'Pick a unique slug that reflects your name or brand.',
            subDescription: 'This will be your personal link to share with recruiters.',
            formatsTitle: 'Available Formats',
            structureText: 'or other structures like',
            slugOptionsText: 'firstname-lastname'
        },
        step2: {
            title: 'Step 2 (Optional): Connect Your Own Domain',
            description: 'For ultimate branding, point your own domain (e.g., yourname.com) to your CV Passport.',
            subDescription: 'This feature is available on our Professional plan.'
        },
        qrTitle: 'QR Code Generation: Bridge the Physical and Digital',
        qrBody: 'Your custom URL automatically generates a unique QR code. Add it to your physical business cards, presentations, or portfolios to give recruiters instant access to your verified profile.',
        qrFeatures: [
            'Instant QR Code for Your URL',
            'Perfect for Business Cards & Networking',
            'Track Scans with Analytics'
        ],
        businessCardTitle: 'Sample Business Card',
        analyticsTitle: 'Integrated with Profile Analytics',
        seoTitle: 'Improve Your Personal SEO',
        seoBody: 'A custom, public URL helps you rank higher in search results when recruiters search for your name.',
        googleVisibilityTitle: 'Google Visibility',
        googleVisibilityBody: 'A clean URL structure helps search engines index your profile, making you more discoverable.',
        linkedinEnhancementTitle: 'LinkedIn Profile Enhancement',
        linkedinEnhancementBody: 'Add your custom URL to your LinkedIn contact info for a professional touch.',
        examplesTitle: 'Examples of Great Custom URLs',
        examples: [
            'yourcvpassport.com/cv/janedoe',
            'yourcvpassport.com/cv/johnsmith',
            'yourcvpassport.com/cv/annalopez'
        ],
        ctaTitle: 'Ready to Claim Your Professional URL?',
        ctaSubtitle: 'Upgrade to our Professional Plan to unlock your custom domain and build a stronger personal brand.',
        ctaButton: 'Claim Your URL'
    },
    urlSimulator: {
        checking: 'Checking...',
        check: 'Check Availability',
        available: 'Great! This URL is available.',
        taken: 'This URL is already taken. Try another one.'
    },
    productOverview: {
        title: 'Your Professional Passport to Global Opportunities',
        subtitle: 'A single, verified platform to showcase your skills, experience, and credentials. Build trust with recruiters and unlock your career potential with features designed for success.',
        cta: {
            startFree: 'Start for Free'
        },
        platform: {
            title: 'An All-in-One Platform for Career Growth',
            subtitle: 'From verification to visibility, we\'ve got you covered.'
        },
        features: {
            verified: {
                title: 'Verified Profiles (Stamps)',
                subFeatures: ['Identity Verification', 'Education Confirmation', 'Work History Validation'],
                description: 'Build unparalleled trust with recruiters. Our verification stamps confirm your credentials at the source, making your profile stand out as authentic and reliable.'
            },
            ats: {
                title: 'ATS Export Compatibility',
                subFeatures: ['PDF & DOCX Formats', 'Optimized for 98% of Systems', 'Professional Layouts'],
                description: 'Export your verified profile into ATS-friendly formats. Ensure your application gets seen by human eyes, bypassing automated screening filters with professionally designed, compatible templates.'
            },
            domain: {
                title: 'Custom Domain & URL',
                subFeatures: ['Personalized URL (yourcvpassport.com/cv/yourname)', 'Connect Your Own Domain', 'QR Code Generation'],
                description: 'Establish your professional brand with a memorable, custom URL. A clean link makes a great first impression and is easy to share on business cards, social media, and email signatures.'
            },
            analytics: {
                title: 'Profile Analytics',
                subFeatures: ['Real-Time View Tracking', 'Geographic Visitor Data', 'Traffic Source Analysis'],
                description: 'Gain powerful insights into who is viewing your profile. Understand your audience, track your visibility, and tailor your strategy based on real data.'
            },
            ai: {
                title: 'AI Assistant for CV & Cover Letters',
                subFeatures: ['CV Summary Enhancement', 'Keyword Optimization', 'Cover Letter Generation'],
                description: 'Leverage the power of AI to refine your professional narrative. Our assistant helps you craft compelling summaries, suggests impactful keywords, and even generates tailored cover letters.'
            },
            security: {
                title: 'Enterprise-Grade Security & GDPR',
                description: 'Your data is yours. We are fully GDPR compliant, employing end-to-end encryption and robust security measures to protect your information. You control what you share, and with whom.'
            }
        },
        demo: {
            title: 'See It in Action',
            subtitle: 'Watch our quick demo to see how easy it is to create, verify, and share your professional passport.',
            feature: 'From profile creation to analytics—in under 2 minutes.'
        },
        differentiator: {
            title: 'More Than a CV Builder—It\'s a Trust Platform',
            subtitle: 'Traditional CVs are static and unverified. YourCVPassport is a dynamic, trusted ecosystem that connects verified talent with global opportunities.'
        },
        comparison: {
            title: 'How We Compare',
            subtitle: 'See how YourCVPassport stacks up against traditional CV builders and professional networks.',
            cta: {
                getStarted: 'Get Started',
                chooseBasic: 'Choose Basic',
                choosePro: 'Choose Pro',
                contactSales: 'Contact Sales'
            }
        },
        finalCta: {
            title: 'Ready to Build Your Professional Passport?',
            subtitle: 'Join thousands of professionals who are taking control of their careers.',
            button: 'Create Your Passport for Free'
        }
    },
    stampsPage: {
        title: 'Verified Stamps: The New Standard in Professional Trust',
        subtitle: 'Build credibility and stand out from the competition with verified credentials. Our stamps prove your qualifications, so you don\'t have to.',
        cta: {
            start: 'Start Your Verification'
        },
        why: {
            title: 'Why Verification Matters in Today\'s Job Market',
            trustGapTitle: 'The Trust Gap',
            trustGapBody: 'Recruiters report that up to 85% of resumes contain misleading information. This creates a "trust gap" that slows down hiring and makes it harder for honest, qualified candidates to get noticed.',
            whatIsTitle: 'What is a Verified Stamp?',
            whatIsBody: 'A Verified Stamp is a digital badge on your profile that confirms a specific credential—like your identity, degree, or work history—has been authenticated by a trusted third party. It’s your proof of authenticity.'
        },
        types: [
            {
                icon: identityStampIcon,
                title: 'Identity Verification Stamp',
                description: 'Confirm your identity with a government-issued ID. This is the foundation of trust and a prerequisite for other stamps.',
                subFeatures: ['One-time verification', 'Builds foundational trust', 'Protects against identity fraud']
            },
            {
                icon: educationStampIcon,
                title: 'Education & Work History Stamps',
                description: 'We verify your academic degrees and employment history directly with the institutions, providing undeniable proof of your background.',
                subFeatures: ['Confirms degrees & dates', 'Validates job titles & tenure', 'Eliminates background check delays']
            }
        ],
        how: {
            title: 'How Our Secure Verification Process Works',
            subtitle: 'Simple, secure, and designed to protect your privacy.',
            steps: [
                { title: 'Submit Your Information', description: 'Upload your documents through our encrypted portal. Your data is protected with bank-level security.' },
                { title: 'Third-Party Verification', description: 'Our trusted partners securely verify your credentials with the relevant institutions.' },
                { title: 'Receive Your Stamp', description: 'Once confirmed, the official stamp is added to your profile, making your credentials instantly credible.' }
            ]
        },
        benefits: {
            title: 'The Benefits of a Verified Profile',
            items: [
                { title: 'Stand Out to Recruiters', description: 'Verified profiles receive 3x more views from top recruiters.' },
                { title: 'Accelerate Hiring', description: 'Reduce background check delays and get job offers faster.' },
                { title: 'Build Global Credibility', description: 'Our stamps are recognized and trusted by companies worldwide.' }
            ]
        },
        companiesTitle: 'Companies That Prioritize Verified Candidates',
        testimonials: {
            title: 'Hear from Professionals Who Got Verified',
            description: 'Discover how verified stamps made a real-world impact on their job search.'
        },
        finalCta: {
            title: 'Ready to Build Trust and Accelerate Your Career?',
            subtitle: 'Get your credentials verified today and join the new standard of professional trust.',
            button: 'Get Verified Now'
        }
    },
    atsPage: {
        title: 'ATS Export Compatibility: Get Your CV Past the Robots',
        subtitle: 'Ensure your application is seen by human eyes. Export your verified profile in ATS-friendly PDF and DOCX formats, optimized for 98% of screening systems.',
        cta: {
            export: 'Export Your ATS-Ready CV'
        },
        why: {
            title: 'Why ATS Compatibility is Non-Negotiable',
            understanding: 'Understanding Applicant Tracking Systems (ATS)',
            description: 'Over 95% of Fortune 500 companies use ATS to screen resumes. If your CV isn\'t formatted correctly, it gets rejected before a human ever sees it. Fancy graphics, columns, and incorrect file types can all lead to automatic disqualification.'
        },
        how: {
            title: 'How Our Export Feature Works',
            steps: [
                { title: 'Clean Data Structure', description: 'We extract your verified profile data into a clean, single-column text format that any ATS can parse flawlessly.' },
                { title: 'Keyword Optimization', description: 'Our system ensures your key skills and experiences are formatted as machine-readable text, not images or complex objects.' },
                { title: 'Standardized Formatting', description: 'We apply professional, universally accepted formatting for headings, dates, and sections to ensure maximum compatibility.' }
            ]
        },
        formats: {
            pdf: {
                title: 'PDF: The Universal Standard',
                features: [
                    { title: 'Preserves Formatting', description: 'Looks perfect on any device, exactly as you intended.' },
                    { title: 'Universally Accessible', description: 'The preferred format for most modern application systems.' },
                    { title: 'Secure & Professional', description: 'Non-editable format that signals a finalized document.' }
                ]
            },
            docx: {
                title: 'DOCX: For Maximum Editability',
                features: [
                    { title: 'Fully Editable', description: 'Allows you to make minor tweaks for a specific job application after exporting.' },
                    { title: 'Maximum Compatibility', description: 'Required by some older ATS or specific company application portals.' },
                    { title: 'Easy to Read', description: 'Familiar format for recruiters who prefer to open documents in Microsoft Word.' }
                ]
            }
        },
        templates: {
            title: 'Choose from a Library of ATS-Optimized Templates',
            subtitle: 'Beauty and brains. Our templates are designed to be visually appealing to humans and perfectly readable for machines.',
            items: [
                { title: 'Modern Professional', imageUrl: '/images/templates/modern-professional.png' },
                { title: 'Classic Corporate', imageUrl: '/images/templates/classic-corporate.png' },
                { title: 'Creative Minimalist', imageUrl: '/images/templates/creative-minimalist.png' },
                { title: 'Academic Standard', imageUrl: '/images/templates/academic-standard.png' }
            ]
        },
        optimization: {
            title: 'See the Difference: Standard CV vs. Optimized Export',
            subtitle: 'Our system transforms visually complex profiles into clean, parsable documents without losing the core information.',
            whatMakesDifferent: 'What Makes Our Export Different?',
            features: ['Removes Columns & Tables', 'Flattens Graphics & Icons', 'Standardizes Fonts'],
            beforeImageUrl: 'https://picsum.photos/seed/ats-before/800/600',
            afterImageUrl: 'https://picsum.photos/seed/ats-after/800/600'
        },
        statistics: {
            title: 'Why ATS Optimization Matters',
            subtitle: 'Get past the robots and into human hands. Our ATS-optimized format dramatically increases your chances.',
            stat1: {
                value: '75%',
                description: 'of resumes never reach human eyes due to ATS rejection'
            },
            stat2: {
                value: '3x',
                description: 'Higher chance of passing ATS screening with optimized format'
            },
            stat3: {
                value: '60%',
                description: 'More interview callbacks with ATS-friendly CVs'
            }
        },
        demo: {
            title: 'Export in Two Clicks',
            subtitle: 'Generating your ATS-ready CV is simple. Just choose your template, select your format, and hit "Export."',
            step1: 'Choose Your Template',
            step2: 'Select Your Format',
            button: 'Export Now'
        },
        finalCta: {
            title: 'Stop Getting Rejected by Robots. Start Getting Interviews.',
            subtitle: 'Create your profile and gain access to unlimited ATS-friendly exports.',
            button: 'Create My CV Now'
        }
    },
    aiPage: {
        title: 'AI Assistant: Your Personal Career Co-Pilot',
        subtitle: 'Leverage the power of artificial intelligence to enhance your profile summary, write compelling cover letters, and suggest impactful keywords that get you noticed.',
        cta: {
            try: 'Try the AI Assistant'
        },
        features: {
            title: 'How Our AI Can Accelerate Your Job Search',
            subtitle: 'From optimization to creation, our AI tools are designed to save you time and improve your results.',
            items: {
                enhancement: {
                    title: 'CV Summary Enhancement',
                    description: 'Turn your experience into a powerful narrative. Our AI analyzes your profile and suggests compelling summaries that capture recruiters\' attention.'
                },
                keywords: {
                    title: 'Keyword Optimization',
                    description: 'Our AI scans job descriptions and suggests relevant keywords to include in your profile, boosting your visibility in recruiter searches and ATS scans.'
                },
                generator: {
                    title: 'Cover Letter Generator',
                    description: 'Stop staring at a blank page. Provide a job description and your profile, and our AI will generate a tailored, professional cover letter in seconds.'
                }
            }
        },
        finalCta: {
            title: 'Ready to Supercharge Your Applications?',
            subtitle: 'Unlock the full power of our AI Assistant with a Professional Plan.',
            button: 'Upgrade to Pro'
        },
        coverLetterGenerator: {
            title: 'AI Cover Letter Generator',
            subtitle: 'Paste the job description and your CV to generate a tailored cover letter in seconds.',
            jobDescription: {
                label: 'Job Description',
                placeholder: 'Paste the job description here...'
            },
            cvSummary: {
                label: 'Your CV / Profile Summary',
                placeholder: 'Paste your CV or a summary of your skills and experience...'
            },
            generateButton: 'Generate Cover Letter',
            generating: 'Generating...',
            resultTitle: 'Generated Cover Letter:',
            errors: {
                missingFields: 'Please provide both the job description and your CV.',
                apiKey: 'API key is not configured.',
                emptyResult: 'The generated cover letter was empty. Please try again.',
                general: 'An error occurred while generating the cover letter. Please try again.'
            }
        }
    },
    analyticsPage: {
        title: "Professional Profile Analytics: Data-Driven Insights to Accelerate Your Career Growth",
        subtitle: "Advanced analytics for your CV: track profile views, visitor locations, traffic sources, and engagement metrics. Data-driven insights to optimize your job search.",
        dashboardImageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1024&h=768&fit=crop&q=80",
        dashboardImageAlt: "Analytics Dashboard Preview",
        whyTitle: "Why Analytics Matter for Your Professional Profile",
        whySubtitle: "The Power of Profile Data",
        whyDescription: "In a competitive job market, data is your advantage. Understanding who views your profile, how they find you, and what they're interested in allows you to tailor your strategy, focus your efforts, and ultimately, land your dream job faster.",
        trackTitle: "Track Every Profile View in Real-Time",
        dashboardTitle: "Real-Time Visitor Dashboard",
        metrics: {
            views: "Total Profile Views",
            visitors: "Unique Visitors",
            engagement: "Engagement Rate"
        },
        trends: {
            views: "▲ 15% this month",
            visitors: "▲ 12% this month",
            engagement: "▲ 5% this month"
        },
        trendsTitle: "Time-Based Trends: Daily, Weekly, and Monthly Performance Reports",
        geoTitle: "Geographic Insights: See Where Recruiters Are Located",
        geoDescription: "Discover your global reach with country and city-level tracking. Our recruiter location heatmap helps you identify hiring hotspots and tailor your search.",
        mapImageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=600&fit=crop&q=80",
        mapImageAlt: "World map showing visitor locations",
        trafficTitle: "Traffic Sources: Know How People Find Your CV",
        trafficDescription: "Understand your acquisition channels. See if recruiters are finding you through LinkedIn, direct links, or search engines.",
        trafficSources: {
            linkedin: "LinkedIn Referrals",
            direct: "Direct Link Clicks",
            search: "Search Engine & Social Media"
        },
        engagementTitle: "Engagement Metrics That Show What Works",
        engagementSubtitle: "Go beyond views. Understand how recruiters interact with your profile.",
        engagementItems: [
            { title: "View Duration Metrics", description: "See how long visitors spend on your profile." },
            { title: "Section Engagement", description: "Identify which sections (e.g., experience, skills) get the most attention." },
            { title: "Download Tracking", description: "Get notified when your exported PDF/DOCX is downloaded." }
        ],
        companyInsightsTitle: "Company Insights: Identify Interested Employers",
        companyInsightsDescription: "With our Professional Plan, see the names of companies that view your profile, giving you a warm lead for outreach.",
        testimonialsTitle: "Turn Analytics Into Career Opportunities",
        testimonialsDescription: "Hear from professionals who used data to supercharge their job search.",
        analyticsTestimonials: [
            { quote: "The analytics dashboard showed me that a top tech company in Berlin viewed my profile. I reached out proactively and landed an interview. Game-changing insights!", name: 'Anna Kowalsky', role: 'Senior Software Engineer', imageUrl: 'https://picsum.photos/id/1027/100/100' },
            { quote: "As a freelancer, knowing which skills on my profile get the most engagement helps me tailor my pitches. The analytics are my secret weapon.", name: 'James Smith', role: 'Tech Recruiter at Innovate Inc.', imageUrl: 'https://picsum.photos/id/1005/100/100' },
            { quote: "I noticed my profile views spiked after updating my headline based on the AI suggestions. Seeing the data confirm my strategy was incredibly motivating.", name: 'Maria Garcia', role: 'Product Manager', imageUrl: 'https://picsum.photos/id/1011/100/100' }
        ],
        finalCtaTitle: "Export Reports for Your Career Strategy",
        finalCtaSubtitle: "Unlock your analytics dashboard and start making data-driven decisions.",
        finalCtaButton: "Unlock My Analytics"
    },
    libraryPage: {
        title: "Template Library: Professional Resources to Accelerate Your Job Search",
        subtitle: "Download 50+ free professional templates: CVs, cover letters, follow-up emails, LinkedIn messages. Editable formats for every industry. Start using today!",
        filters: {
            allIndustries: "All Industries",
            allLevels: "All Levels"
        },
        modal: {
            useTemplate: "Use This Template"
        },
        notFound: {
            title: "No templates found",
            subtitle: "Try adjusting your filters to find the perfect template."
        },
        cta: {
            title: "Unlock Unlimited Access to All Templates",
            subtitle: "Upgrade to our Professional Plan for unlimited downloads, advanced customization, and AI-powered tools.",
            button: "Upgrade to Pro"
        }
    },
    statusPage: {
        title: "System Status and Product Changelog",
        subtitle: "Transparency and continuous improvement are at our core. Here you can find real-time status updates, uptime statistics, and the latest product news.",
        operational: "✓ All Systems Operational",
        healthTitle: "Current Platform Health",
        uptimeTitle: "Uptime Statistics",
        uptime: {
            day: "Last 24 Hours",
            week: "Last 7 Days",
            month: "Last 30 Days"
        },
        subscribe: {
            title: "Subscribe to Updates",
            description: "Get notified about incidents and new features.",
            placeholder: "your@email.com",
            button: "Subscribe",
            alert: "Subscribed successfully with"
        },
        changelogTitle: "Product Changelog",
        version: "Version",
        roadmapTitle: "Upcoming Features on Our Roadmap",
        historyTitle: "Historical Incident Reports",
        incidents: {
            latency: "Minor API Latency",
            maintenance: "Scheduled Maintenance",
            noIncidents: "No incidents in the last 90 days."
        },
        incidentStatus: {
            resolved: "Resolved",
            completed: "Completed"
        },
        dates: {
          june15: "January 15, 2025",
          may30: "January 10, 2025"
        }
    },
    missionPage: {
        title: "Our Mission and Values: Building Trust in Professional Credentials Worldwide",
        subtitle: "Learn about YourCVPassport's mission to democratize verified professional profiles worldwide. Our values: transparency, trust, innovation & inclusivity.",
        problemTitle: "The Problem We're Solving",
        problemSubtitle: "Bridging the Trust Gap in Modern Recruitment",
        problem: {
            title: "The Global Credibility Crisis",
            description: "78% of recruiters have detected false information on resumes. Companies spend over $15,000 USD and 42 days on average verifying credentials per hire. Meanwhile, 85% of honest, qualified candidates are automatically rejected by ATS systems unable to distinguish real talent from inflated profiles. The result: companies losing millions on bad hires and talented professionals invisible in a sea of unverifiable information."
        },
        solution: {
            title: "Instant Blockchain Verification",
            description: "We transform every credential into a verifiable digital asset through blockchain. Educational institutions, employers, and certifiers directly validate your achievements, creating an immutable and transparent profile. Results: recruiters save 95% of verification time, candidates stand out with instantly provable authentic credentials, and companies reduce hiring costs by 67% while increasing the quality of hired talent."
        },
        visionTitle: "Our Vision for the Future of Work",
        visionDescription: "We envision a future where every professional has a portable, verified digital identity that unlocks opportunities globally, making the hiring process more transparent, efficient, and equitable for everyone.",
        valuesTitle: "Core Values That Guide Every Decision",
        goal: "Our Goal: Empowering 1M Professionals by 2026",
        stats: {
            verified: "Verified Professionals",
            trustScore: "Recruiter Trust Score",
            countries: "Countries Represented"
        },
        journeyTitle: "Our Journey So Far",
        testimonialsTitle: "What Our Community Says About Our Mission",
        finalCta: {
            title: "Join Us in Creating a More Transparent Job Market",
            subtitle: "Whether you're a professional seeking to stand out or a company looking for trusted talent, be part of the change.",
            button: "Create Your Passport"
        }
    },
    pressPage: {
        title: "Press and Media Kit",
        subtitle: "Resources for journalists and media partners. Find our latest announcements, brand assets, and company information here.",
        cta: {
            download: "Download Full Media Kit",
            contact: "Contact Press Team"
        },
        releasesTitle: "Latest Press Releases",
        readMore: "Read More →",
        factsTitle: "YourCVPassport by the Numbers",
        assetsTitle: "Brand Assets and Guidelines",
        assets: {
            logoDownloads: "Logo Downloads",
            primary: "Primary Logo",
            icon: "Icon-Only Version",
            download: "Download",
            colors: "Brand Colors"
        },
        teamTitle: "Executive Team",
        seenInTitle: "As Seen In",
        contactTitle: "Contact Our Press Team",
        contactSubtitle: "For all media inquiries, please email us at",
        form: {
            name: "Full Name",
            outlet: "Media Outlet",
            email: "Email",
            message: "Message",
            submit: "Send Inquiry",
            alert: "Thank you for your inquiry! Our press team will get back to you soon."
        }
    },
    contactPage: {
        title: "Contact Us: We're Here to Help You Succeed",
        subtitle: "Get in touch with YourCVPassport: customer support, sales inquiries, partnership opportunities. Response time: 24 hours. Contact us now!",
        teamTitle: "Get in Touch with Our Team Today",
        form: {
            title: "Send Us a Message",
            subtitle: "Response time is typically within 24 business hours.",
            name: "Full Name",
            email: "Email Address",
            inquiry: "Inquiry Type",
            message: "Message",
            submit: "Send Message",
            alert: "Thank you for your message! We will get back to you shortly.",
            inquiryTypes: ["General Question", "Technical Support", "Billing Issue", "Sales Inquiry", "Partnership", "Press"]
        },
        office: {
            title: "Our Office Locations",
            hq: "Headquarters: Valencia, Spain",
            description: "Our main office is located in Valencia, Spain, in the heart of the city, near the historic City Hall (Ayuntamiento). We operate with a talented remote team distributed all over the world."
        },
        connect: {
            title: "Connect with Us",
            social: ["LinkedIn", "X (Twitter)", "YouTube"]
        },
        faqTitle: "Frequently Asked Questions",
        mapImageUrl: "https://maps.googleapis.com/maps/api/staticmap?center=Ayuntamiento+de+Valencia,Spain&zoom=15&size=800x600&markers=color:blue%7Clabel:V%7CAyuntamiento+de+Valencia,Spain&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8"
    },
    successStoriesPage: {
        title: 'Success Stories: Real Results from Professionals Like You',
        subtitle: 'Discover how verified profiles, AI tools, and a professional online presence have transformed careers and accelerated success.',
        stats: {
            hires: '5,000+ Hires',
            promotion: '3x Increased',
            timeSaved: '50% Time Saved'
        },
        filters: {
            industry: 'Filter by Industry',
            goal: 'Filter by Goal'
        },
        featured: {
            label: 'Featured Story'
        },
        readFullStory: 'Read Full Story',
        form: {
            title: 'Share Your Success Story',
            subtitle: 'Have you landed a new job, gotten a promotion, or won a great project using YourCVPassport? We\'d love to hear about it!',
            name: 'Your Name',
            email: 'Your Email',
            message: 'Your Story',
            submit: 'Submit Your Story',
            alert: 'Thank you for sharing your story! Our team will review it and may reach out for more details.'
        },
        finalCta: {
            title: 'Ready to Write Your Own Success Story?',
            subtitle: 'Create your verified profile today and take the next step in your professional journey.',
            button: 'Start My Story'
        },
        modal: {
            beforeAfter: 'Before & After Transformation',
            video: 'Video Testimonial'
        }
    },
    aiBuilder: {
        title: "AI Guided CV Builder",
        subtitle: "Answer a few questions and our AI will craft a professional CV draft for you.",
        inputLabel: "Tell us about yourself",
        placeholder: "For example:\n- Your desired role: Senior Product Manager\n- Years of experience: 8 years\n- Key skills: Product roadmapping, Agile methodologies, user research\n- Recent achievements: Launched a new feature that increased user engagement by 20%. Led a team of 5 engineers and 2 designers.",
        generateButton: "Generate CV Preview",
        generating: "Generating...",
        previewTitle: "Generated Preview",
        loadingPreview: "AI is crafting your CV...",
        previewPlaceholder: "Your AI-generated CV preview will appear here.",
        summaryTitle: "Professional Summary",
        experienceTitle: "Experience Bullets (Recent Role)",
        apiKeyError: "API key is not configured.",
        parseError: "Could not parse the generated content. Please try again.",
        generalError: "An error occurred:",
        questionnairePrompt: (answers: any) => `Based on the user's answers, generate a professional CV as a single JSON object. The JSON should have these keys: 'summary' (string), 'experience_bullets' (array of strings), 'skills' (array of objects with 'name' and 'percentage' properties), 'services' (array of objects with 'title' and 'description'), 'stats' (array of objects with 'label' and 'value'), and 'portfolio_items' (array of objects with 'title', 'category', and 'link' properties). Be creative and professional.
        
        User's Full Name: ${answers.fullName}
        Desired Headline: ${answers.headline}
        Most Recent Job: ${answers.jobTitle} at ${answers.company}
        Achievements: ${answers.achievements}
        Education: ${answers.degree} from ${answers.institution}
        Skills & Proficiency (e.g., Skill:_Percentage): ${answers.skills}
        Services Offered (e.g., Title_-_Description): ${answers.services}
        Career Stats (e.g., Value_-_Label): ${answers.stats}
        Portfolio Projects (e.g., Title_-_Category_-_Link): ${answers.portfolio}
        Location: ${answers.location}
        Availability: ${answers.availability}
        Phone: ${answers.phone}
        LinkedIn: ${answers.linkedin}
        GitHub/Portfolio: ${answers.github}
        `,
        questionnaire: {
            title: "AI Guided CV Builder",
            back: "Back",
            next: "Next",
            finish: "Finish & Generate CV",
            generating: "Generating...",
            steps: [
                { key: "fullName", question: "First, what is your full name?", placeholder: "e.g., Jane Doe" },
                { key: "headline", question: "What is your desired professional headline?", placeholder: "e.g., Senior Product Manager" },
                { key: "jobTitle", question: "What was your most recent job title?", placeholder: "e.g., Product Manager" },
                { key: "company", question: "And where did you work?", placeholder: "e.g., Innovate Inc." },
                { key: "achievements", question: "Describe your key responsibilities and achievements in that role.", placeholder: "e.g., Led the launch of a new feature that increased user engagement by 20%.", type: "textarea" },
                { key: "degree", question: "What is your highest level of education?", placeholder: "e.g., M.S. in Computer Science" },
                { key: "institution", question: "What institution did you attend?", placeholder: "e.g., University of Technology" },
                { key: "skills", question: "List your top skills and proficiency (1-100).", placeholder: "e.g., Product Roadmapping:90, Agile:95, User Research:85", type: "textarea" },
                { key: "services", question: "What services do you offer? (one per line, format: Title - Description)", placeholder: "e.g., Web Design - Creating responsive websites", type: "textarea" },
                { key: "stats", question: "List some key career stats. (one per line, format: Value - Label)", placeholder: "e.g., 8+ - Years of Experience", type: "textarea" },
                { key: "portfolio", question: "List some portfolio projects. (one per line, format: Title - Category - Link)", placeholder: "e.g., E-commerce Redesign - UX/UI - https://project.link", type: "textarea" },
                { key: "location", question: "Where are you located?", placeholder: "e.g., Berlin, Germany" },
                { key: "availability", question: "What is your availability?", placeholder: "e.g., Available for Full-time, Part-time, Contract" },
                { key: "phone", question: "What is your phone number?", placeholder: "e.g., +49 123 456789" },
                { key: "linkedin", question: "What is your LinkedIn profile URL?", placeholder: "e.g., https://linkedin.com/in/janedoe" },
                { key: "github", question: "What is your GitHub or other portfolio URL?", placeholder: "e.g., https://github.com/janedoe" }
            ]
        },
        review: {
            title: "Step 2: Review & Edit",
            subtitle: "Our AI has generated a draft. Feel free to make any edits you'd like before proceeding.",
            summaryLabel: "Professional Summary",
            experienceLabel: "Experience Highlights",
            button: "Save & Update Profile"
        },
        templates: {
            title: "Step 3: Choose Your Template",
            subtitle: "Select a template to see a live preview of your new CV. Click 'Save Template' to apply it to your profile.",
            saveButton: "Save Template",
            saving: "Saving...",
            saveSuccess: "Template Saved!"
        }
    },
    dashboard: {
        title: "Dashboard",
        welcome: (name: string) => `Welcome back, ${name}!`,
        loading: "Loading...",
        subtitle: "Manage your professional profile and stand out among thousands",
        darkMode: {
            title: "Dark Mode",
            light: "Switch to light mode",
            dark: "Switch to dark mode",
        },
        quickActions: {
            title: "Quick Actions",
            updateProfile: "Update Profile",
            exportCV: "Export CV",
            shareCV: "Share CV",
            analytics: "Analytics",
        },
        stats: {
            profileVisits: "Profile Visits",
            ctaClicks: "CTA Clicks",
            experiences: "Experiences",
            skills: "Skills",
            last30Days: "Last 30 days",
            totalAccumulated: "Total accumulated",
            registered: "Registered",
            added: "Added",
        },
        profileCompletion: {
            completeProfile: "Complete your professional profile",
            profileAt: "Your profile is at",
            increasesVisibility: "A complete profile increases your visibility up to 5x more.",
            completeNow: "Complete now",
            aiAssistant: "AI Assistant",
            profileComplete: "Profile complete!",
            excellentWork: "Excellent work. Your profile is",
            complete: "complete and optimized to attract more opportunities.",
            viewProfile: "View my profile",
            downloadPDF: "Download PDF",
        },
        weeklyVisits: {
            title: "Profile Visits",
            last7Days: "Last 7 days",
            visits: "visits",
            active: "Active",
            total: "Total",
            days: {
                mon: "Mon",
                tue: "Tue",
                wed: "Wed",
                thu: "Thu",
                fri: "Fri",
                sat: "Sat",
                sun: "Sun",
            },
        },
        recentActivity: {
            title: "Recent Activity",
            profileVisits: (count: number) => `${count} profile visits`,
            ctaClicks: (count: number) => `${count} CTA clicks`,
            profileUpdated: "Profile updated",
            last7Days: "Last 7 days",
            totalAccumulated: "Total accumulated",
        },
        nextSteps: {
            title: "Next Steps",
            add3Experiences: "Add at least 3 work experiences",
            completeSummary: "Complete your professional summary",
            addSkills: "Add your key skills",
        },
        quickSummary: {
            title: "Quick Summary",
            profileCreated: "Profile created",
            lastUpdate: "Last update",
            today: "Today",
            activeTemplate: "Active template",
            visibility: "Visibility",
            public: "Public",
        },
        quickActionCards: {
            viewCV: "View my CV",
            viewCVDescription: "View your public profile",
            exportPDF: "Export PDF",
            exportPDFDescription: "Download your CV",
            analytics: "Analytics",
            analyticsDescription: "Detailed statistics",
        },
        cards: {
            addNew: "Add New",
            edit: "Edit",
            delete: "Delete",
            noItems: "No items yet.",
            notAvailable: "N/A",
            profile: {
                title: "Profile Information",
                fullName: "Full Name",
                headline: "Headline",
                summary: "Summary / Bio",
                nameLabel: "Name:",
                headlineLabel: "Headline:",
                summaryLabel: "Summary:",
                editProfile: "Edit Profile",
            },
            experience: {
                title: "Work Experience",
            },
            education: {
                title: "Education",
            },
            skills: {
                title: "Skills",
                addPlaceholder: "Add new skill",
                add: "Add",
                noSkills: "No skills yet.",
            },
            services: { title: "Services" },
            stats: { title: "Stats" },
            portfolio: { title: "Portfolio Projects" },
            photo: {
                title: "Profile Photo",
                uploading: "Uploading...",
                change: "Change Photo",
            },
            design: {
                title: "CV Template & Design",
                currentTemplate: "Your current template is",
                changeTemplate: "Change Template",
            },
            templateSelector: {
                title: "Choose Your Template",
                subtitle: "Select a professional template for your CV",
                description: "Select a template that best represents your professional style. Click on any template to see a full preview.",
                previewHover: "Preview with your data",
                proLabel: "PRO",
                proPlan: "Pro Plan",
                selected: "Selected",
                currentTemplate: "Current Template",
                useTemplate: "Use This Template",
                savingTemplate: "Saving template selection...",
                upgradeTitle: "Unlock All Premium Templates",
                upgradeDescription: (count: number) => `Upgrade to Pro to access all ${count} professional templates and stand out from the crowd`,
                upgradeCta: "Upgrade to Pro",
                previewModalTitle: (name: string) => `${name} Preview`,
                previewModalSubtitle: "Preview your profile with this template",
                closePreview: "Close",
            },
            settings: {
                title: "Public Profile & SEO Settings",
                customURL: "Custom URL",
                metaTitle: "Meta Title (for SEO)",
                metaDescription: "Meta Description (for SEO)",
                accentColor: "Accent Color",
                save: "Save Settings",
            },
        },
        modals: {
            add: "Add",
            edit: "Edit",
            cancel: "Cancel",
            save: "Save",
            update: "Update",
            addExperience: "Add Experience",
            editExperience: "Edit Experience",
            addNewExperience: "Add New Experience",
            title: "Title",
            jobTitle: "Job Title",
            company: "Company",
            startDate: "Start Date",
            endDate: "End Date",
            currentJob: "I currently work here",
            description: "Description",
            keyAchievements: "Key Achievements",
            addAchievement: "+ Add Achievement",
            achievementPlaceholder: "e.g., Led a team of 5 engineers...",
            noExperienceYet: "No experience added yet. Click \"Add Experience\" to get started.",
            jobTitlePlaceholder: "Senior Software Engineer",
            companyPlaceholder: "Tech Corp",
            descriptionPlaceholder: "Describe your role and responsibilities...",
            deleteConfirm: "Are you sure you want to delete this experience?",
            addEducation: "Add Education",
            editEducation: "Edit Education",
            addNewEducation: "Add New Education",
            institution: "Institution",
            institutionPlaceholder: "University of Madrid",
            degree: "Degree",
            degreePlaceholder: "Bachelor's in Engineering",
            fieldOfStudy: "Field of Study",
            fieldOfStudyPlaceholder: "Computer Engineering",
            currentStudy: "I currently study here",
            noEducationYet: "No education added yet. Click \"Add Education\" to get started.",
            deleteEducationConfirm: "Are you sure you want to delete this education?",
            service: "Service",
            stat: "Stat",
            value: "Value (e.g., 8+)",
            label: "Label (e.g., Years Experience)",
            portfolioItem: "Portfolio Item",
            category: "Category",
            // Skills
            addSkill: "Add Skill",
            editSkill: "Edit Skill",
            skillName: "Skill Name",
            skillLevel: "Level",
            skillNamePlaceholder: "e.g., JavaScript, Python, Design...",
            skillPercentage: "Skill Percentage (0-100)",
            yearsOfExperience: "Years of Experience",
            year: "year",
            years: "years",
            noSkillsYet: "No skills added yet. Click \"Add Skill\" to get started.",
            deleteSkillConfirm: "Are you sure you want to delete this skill?",
            beginner: "Beginner",
            intermediate: "Intermediate",
            advanced: "Advanced",
            expert: "Expert",
            restoreDraft: "Restore saved draft?",
            saveError: "Error saving. Your data is saved locally and you can try again.",
            // Languages
            addLanguage: "Add Language",
            editLanguage: "Edit Language",
            addNewLanguage: "Add New Language",
            languageName: "Language",
            languageLevel: "Level",
            languageNamePlaceholder: "e.g., English, Spanish...",
            noLanguagesYet: "No languages added yet. Click \"Add Language\" to get started.",
            deleteLanguageConfirm: "Are you sure you want to delete this language?",
            native: "Native",
            // Portfolio
            addPortfolioItem: "Add Project",
            editPortfolioItem: "Edit Project",
            addNewPortfolioItem: "Add New Project",
            projectTitle: "Project Title",
            projectCategory: "Category",
            projectLink: "Link",
            projectDescription: "Description",
            projectImage: "Image",
            uploadImage: "Upload Image",
            uploading: "Uploading...",
            chooseFile: "Choose File",
            projectTitlePlaceholder: "My Awesome Project",
            projectLinkPlaceholder: "https://myproject.com",
            projectDescriptionPlaceholder: "Describe your project...",
            noPortfolioYet: "No projects added yet. Click \"Add Project\" to get started.",
            deletePortfolioConfirm: "Are you sure you want to delete this project?",
            // Categories
            webDevelopment: "Web Development",
            mobileDevelopment: "Mobile Development",
            design: "Design",
            dataScience: "Data Science",
            other: "Other",
        },
        alerts: {
            settingsSaved: "Settings saved!",
            confirmDelete: "Are you sure?",
        },
        errors: {
            loadProfile: "Could not load profile.",
            urlTaken: "This custom URL is already taken.",
            skillExists: (name: string) => `Skill "${name}" already exists.`,
        },
        preferences: {
            title: "Preferences",
            language: {
                title: "Language Settings",
                label: "Interface Language",
                description: "Select your preferred language for the dashboard and application",
                english: "English",
                spanish: "Spanish (Español)",
            },
            jobPreferences: {
                title: "Job Preferences",
                jobType: "Job Type (select all that apply)",
                availability: "Availability",
                selectAvailability: "Select availability",
                immediate: "Immediate",
                twoWeeks: "2 Weeks Notice",
                oneMonth: "1 Month Notice",
                twoMonths: "2+ Months",
                notLooking: "Not Currently Looking",
                salary: "Salary Expectations",
                minSalary: "Min salary",
                maxSalary: "Max salary",
                currency: "Currency",
                workLocation: "Work Location Preference",
                willingToRelocate: "Willing to relocate",
                preferredLocations: "Preferred Locations (comma-separated)",
                locationPlaceholder: "e.g., San Francisco, New York, Remote",
                locationHelper: "Enter locations separated by commas",
                jobTypes: {
                    fullTime: "Full Time",
                    partTime: "Part Time",
                    contract: "Contract",
                    freelance: "Freelance",
                    internship: "Internship",
                },
                remotePreferences: {
                    remote: "Remote",
                    hybrid: "Hybrid",
                    onSite: "On Site",
                    flexible: "Flexible",
                },
            },
            saveButton: "Save Preferences",
            unsavedChanges: "You have unsaved changes",
        },
        identity: {
            title: "Identity",
            uploadPhoto: "Upload Photo",
            uploading: "Uploading...",
            photoHelper: "JPG, PNG, GIF or WebP (max 5MB)",
            fullName: "Full Name",
            fullNameRequired: "Full Name *",
            headline: "Professional Headline",
            headlineRequired: "Professional Headline *",
            location: "Location",
            phone: "Phone",
            remoteWork: "Open to remote work",
            socialLinks: "Social Links",
            linkedinUrl: "LinkedIn URL",
            githubUrl: "GitHub URL",
            portfolioUrl: "Portfolio URL",
            aboutMe: "About Me",
            aboutMePlaceholder: "Tell us about yourself, your experience, and what makes you unique...",
            saveChanges: "Save Changes",
            unsavedChanges: "You have unsaved changes",
            noChanges: "No Changes",
            invalidLinkedin: "Please enter a valid LinkedIn URL (https://linkedin.com/in/username)",
            invalidGithub: "Please enter a valid GitHub URL (https://github.com/username)",
            invalidPortfolio: "Please enter a valid Portfolio URL",
            restoreDraft: "Restore saved draft?",
            saveError: "Error saving. Your data is saved locally and you can try again.",
        },
        auth: {
            login: {
                title: "Welcome Back",
                subtitle: "Log in to your professional CV account",
                email: "Email Address",
                emailPlaceholder: "your.email@example.com",
                password: "Password",
                passwordPlaceholder: "Enter your password",
                rememberMe: "Remember me",
                forgotPassword: "Forgot password?",
                submit: "Sign In",
                loginButton: "Sign In",
                loggingIn: "Logging in...",
                noAccount: "Don't have an account?",
                signUp: "Sign up for free",
                signUpLink: "Sign up for free",
                orContinue: "Or continue with",
                divider: "Or continue with",
            },
            signup: {
                title: "Create Your Account",
                subtitle: "Join thousands of professionals building their verified CV",
                fullName: "Full Name",
                fullNamePlaceholder: "John Doe",
                email: "Email Address",
                emailPlaceholder: "your.email@example.com",
                password: "Password",
                passwordPlaceholder: "At least 8 characters",
                passwordRequirements: "At least 8 characters with uppercase, lowercase, and number",
                confirmPassword: "Confirm Password",
                confirmPasswordPlaceholder: "Re-enter your password",
                agreeToTerms: "I agree to the",
                termsOfService: "Terms of Service",
                and: "and",
                privacyPolicy: "Privacy Policy",
                signupButton: "Create Account",
                haveAccount: "Already have an account?",
                loginLink: "Sign in",
                creatingAccount: "Creating account...",
                orContinue: "Or continue with",
                checkEmail: "Check your email!",
                checkEmailDesc: "We've sent you a confirmation link to",
                checkEmailAction: "Please click the link in the email to verify your account.",
            },
            oauth: {
                google: "Continue with Google",
                linkedin: "Continue with LinkedIn",
            },
            magicLink: {
                title: "Magic Link Sign In",
                subtitle: "Enter your email and we'll send you a magic link to sign in",
                email: "Email Address",
                emailPlaceholder: "your.email@example.com",
                submit: "Send Magic Link",
                backToLogin: "Back to login",
                checkEmail: "Check your email!",
                checkEmailDesc: "We've sent a magic link to",
                checkEmailAction: "Click the link in the email to sign in instantly.",
            },
            recovery: {
                title: "Reset Password",
                subtitle: "Enter your email to receive a password reset link",
                email: "Email Address",
                emailPlaceholder: "your.email@example.com",
                submit: "Send Reset Link",
                backToLogin: "Back to login",
                checkEmail: "Check your email!",
                checkEmailDesc: "We've sent a password reset link to",
                newPasswordTitle: "Set New Password",
                newPasswordSubtitle: "Enter your new password below",
                newPassword: "New Password",
                newPasswordPlaceholder: "At least 8 characters",
                confirmPassword: "Confirm New Password",
                confirmPasswordPlaceholder: "Re-enter your new password",
                submitNewPassword: "Update Password",
                successTitle: "Password Updated!",
                successDesc: "Your password has been successfully updated.",
                successAction: "Return to login",
            },
            errors: {
                invalidEmail: "Please enter a valid email address",
                emailRequired: "Email is required",
                passwordRequired: "Password is required",
                passwordTooShort: "Password must be at least 8 characters",
                passwordsNotMatch: "Passwords do not match",
                fullNameRequired: "Full name is required",
                termsRequired: "You must accept the terms and conditions",
                invalidCredentials: "Invalid email or password",
                emailAlreadyExists: "An account with this email already exists",
                emailNotConfirmed: "Please confirm your email before logging in",
                userNotFound: "No account found with this email",
                tooManyRequests: "Too many requests. Please try again later",
                networkError: "Network error. Please check your connection",
                unknownError: "An error occurred. Please try again",
                serverError: "An unexpected error occurred. Please try again later.",
            },
            success: {
                signUpSuccess: "Account created successfully!",
                signInSuccess: "Welcome back!",
                passwordResetSent: "Password reset link sent!",
                passwordUpdated: "Password updated successfully!",
                magicLinkSent: "Magic link sent to your email!",
            }
        },
        menu: {
            dashboard: "Dashboard",
            myProfile: "My Profile",
            template: "Template",
            cvEditor: "CV Editor",
            viewCV: "View my CV",
            visas: "Visas",
            cvVersions: "CV Versions",
            export: "Export",
            share: "Share",
            analytics: "Analytics",
            leads: "Leads",
            stamps: "Verifications",
            settings: "Settings",
            help: "Help",
            backToHome: "Back to Home",
            signOut: "Sign Out",
            user: "User",
            profileIncomplete: "Please complete your profile before viewing or sharing your CV. At minimum, add your full name, professional headline, and summary.",
            editManually: "Edit manually",
            completeProfileFirst: "Complete your profile first",
            editProfile: "Edit Profile",
            viewPublicProfile: "View Public Profile",
        },
        editor: {
            title: "Edit Profile",
            subtitle: "Complete your professional profile to stand out to employers",
            lastSaved: (time: string) => `Last saved: ${time}`,
            underConstruction: "Under construction",
            aiAssistant: "AI Assistant",
            completeWithAI: "Complete with AI Assistant",
        },
        welcomeCard: {
            title: "Your profile is almost ready!",
            description: (minutes: number) => `Complete your information in just ${minutes} minutes with our intelligent assistant. We'll ask you simple questions and take care of the rest.`,
            progressLabel: "Current progress",
            completeButton: "Complete with AI Assistant",
            editManually: "Edit manually",
            missingFields: {
                fullName: "Full name",
                headline: "Professional title",
                summary: "Summary",
                avatar: "Profile photo",
                location: "Location",
                phone: "Phone",
                social: "Social networks",
                experience: "Work experience",
                education: "Education",
                skills: "Skills",
            },
        },
        analytics: {
            visits30Days: "Visits (30 days)",
            ctaClicks: "CTA Clicks",
            completed: "Completed",
            verifiedStamps: "Verified Stamps",
            completeProfile: "Complete profile",
            credentials: "Credentials",
            totalAccumulated: "Total accumulated",
            trackAnalytics: "Track Analytics",
            trackAnalyticsDescription: "Allow visit tracking",
        },
        cvBuilder: {
            title: "Create Your Professional CV!",
            description: "Design an impressive CV with our customizable templates. Choose from 15+ professional designs and stand out from other candidates.",
            features: [
                "15+ professional templates",
                "Color and style customization",
                "High-quality PDF download"
            ],
            createCV: "Create my CV",
            viewCV: "View my CV",
        },
        visitsChart: {
            title: "Visits last 30 days",
        },
        trafficSources: {
            title: "Traffic Sources",
        },
        recentLeads: {
            title: "Recent Leads",
            viewDetails: "View details",
            noLeads: "No leads yet",
        },
        cvCanvas: {
            backToDashboard: "Back to Dashboard",
            exportPDF: "Export PDF",
            help: "Help",
        },
        templateSection: {
            title: "Choose Your Template",
            subtitle: "Select a professional template for your CV",
            selectTemplate: "Select a professional template",
            templateUpdated: "Template updated successfully",
            templateUpdateError: "Error updating template",
        },
        export: {
            title: "Export CV",
            subtitle: "Download your CV in different formats",
            pdf: {
                title: "Export PDF",
                description: "Download your CV in PDF format",
                button: "Download PDF",
            },
            json: {
                title: "Export JSON",
                description: "Download your profile data in JSON format",
                button: "Download JSON",
            },
            publicLink: "Public Link",
            publicLinkDescription: "Share your CV with a personalized public link",
            copyLink: "Copy Link",
            popupBlocked: "Please allow pop-ups to export your CV to PDF",
        },
        share: {
            title: "Share CV",
            subtitle: "Share your professional CV on social networks",
            publicLink: "Public Link",
            publicLinkDescription: "Share your CV with a personalized public link",
            copyLink: "Copy Link",
            copy: "Copy",
            yourPublicUrl: "Your public URL",
            seoOptimizedUrl: "SEO optimized URL",
            improveUrl: "Improve your URL:",
            improveUrlDescription: "To get an SEO-friendly URL like",
            completeProfileToShare: "To share your CV, you need to complete your profile's basic information:",
            goToCompleteProfile: "Go to complete my profile",
            linkCopied: "Link copied to clipboard!",
            completeNameAndTitle: "full name and professional title",
            shareText: "Check out my professional CV",
            linkedin: "LinkedIn",
            twitter: "Twitter",
            facebook: "Facebook",
            whatsapp: "WhatsApp",
            businessCard: {
                title: "Digital Business Card",
                description: "Download your professional business card with integrated QR code",
                galleryDescription: "Explore all available card designs",
                viewCard: "View My Card",
                viewGallery: "View Gallery",
                downloaded: "Card downloaded successfully!",
            },
            qrCode: {
                title: "QR Code",
                description: "Generate a QR code to share your CV at events or on business cards",
                download: "Download QR",
            },
        },
        leads: {
            title: "Leads and Contacts",
            subtitle: "Manage contacts and messages received",
            recentLeads: "Recent Leads/Messages",
            totalLeads: "Total Leads",
            new: "New",
            conversionRate: "Conversion Rate",
            noLeads: "No leads yet",
            noLeadsDescription: "Contacts you receive will appear here",
            viewAllMessages: "View all messages",
            email: "Email:",
            anonymous: "Anonymous",
        },
        analyticsPanel: {
            title: "Detailed Analytics",
            subtitle: "Complete analysis of your CV performance",
            dateRange: {
                days7: "7 days",
                days30: "30 days",
                days90: "90 days",
                all: "All",
            },
            export: "Export",
            exportCSV: "Export as CSV",
            printPDF: "Print / PDF",
            realTimeActivity: "Real-time Activity",
            realTimeDescription: "Your profile is being viewed right now. Data updates automatically every minute.",
            viewAllCountries: "View all countries",
        },
        cvEditor: {
            title: "Custom CV Editor",
            chooseTemplate: "Choose a Template to Edit",
            help: "Help",
        },
        visas: {
            title: "Visas (Projects & Achievements)",
            subtitle: "Showcase your most important projects using the CAR methodology",
            newVisa: "New Visa",
            noVisas: "You don't have any Visas yet",
            noVisasDescription: "Create your first Visa to showcase your most important projects and achievements",
            createFirstVisa: "Create First Visa",
            edit: "Edit",
            editComingSoon: "Visa editing will be available soon",
            createComingSoon: "Visa creation will be available soon",
            deleteConfirm: "Are you sure you want to delete this Visa?",
            deleteError: "Error deleting Visa",
            present: "Present",
            metrics: "metrics",
        },
        helpSection: {
            title: "Help Center",
            subtitle: "Find quick answers to your questions and learn how to get the most out of YourCVPassport",
            gettingStarted: {
                title: "Getting Started",
                description: "Learn how to create your first professional CV in minutes",
                step1: "Complete your profile in \"Identity\"",
                step2: "Add your work experience",
                step3: "Select a professional template",
            },
            profileEditor: "Profile Editor",
            profileEditorDesc: "Edit and complete your professional information",
            profileEditorTips: {
                tip1: "Each section saves automatically",
                tip2: "Green circles indicate completeness",
                tip3: "Use dark mode for better comfort",
            },
            cvTemplates: "CV Templates",
            cvTemplatesDesc: "Choose and customize professional designs",
            cvTemplatesTips: {
                tip1: "More than 10 professional templates",
                tip2: "Modern and ATS-friendly designs",
                tip3: "Change template at any time",
            },
            shareExport: "Share and Export",
            shareExportDesc: "Share your CV and export to PDF",
            shareExportTips: {
                tip1: "Generate a unique link to share",
                tip2: "Download in professional PDF",
                tip3: "Track who views your CV",
            },
            privacy: {
                title: "Privacy and Security",
                description: "Your information is protected",
                tip1: "Full control over your visibility",
                tip2: "Encrypted data in transit",
                tip3: "We comply with GDPR",
            },
            support: {
                title: "Technical Support",
                description: "Need additional help?",
                contact: "Contact Support",
            },
            faq: {
                title: "Frequently Asked Questions",
                q1: "How can I download my CV in PDF?",
                a1: "Go to the \"My CV\" section, click the \"Download PDF\" button in the top right corner. Your CV will download automatically with the selected template design.",
                q2: "Can I have multiple versions of my CV?",
                a2: "Currently, you can customize your CV by switching between different templates. We're working on a feature that will allow you to create multiple versions of your CV for different industries or positions.",
                q3: "How does the shared link work?",
                a3: "Your unique link (yourcvpassport.com/your-name) allows employers to view your CV online. You can control visibility from the \"Settings\" section and view viewing statistics in \"Analytics\".",
                q4: "What data is saved automatically?",
                a4: "All your information is saved automatically as you edit. You'll see a \"Successfully saved\" confirmation message at the top of the screen when your changes have been synchronized.",
                q5: "What does \"ATS-friendly\" mean?",
                a5: "ATS (Applicant Tracking System) are systems that companies use to filter CVs. Our templates are optimized to be read correctly by these systems, increasing your chances of your CV being seen by human recruiters.",
            },
            videoTutorial: {
                title: "Video Tutorial",
                description: "Watch our complete 5-minute tutorial and learn how to create a professional CV from scratch.",
                watchVideo: "Watch Tutorial",
                bestPractices: "Best practices for CVs",
                tips: "Tips to stand out to recruiters",
            },
            initialSetup: "Initial profile setup",
        },
        settings: {
            title: "Account Settings",
            subtitle: "Configure your account and preferences",
            accountInfo: "Account Information",
            privacy: "Privacy",
            publicProfile: "Public Profile",
            publicProfileDescription: "Your CV is visible on the internet",
            trackAnalytics: "Track Analytics",
            trackAnalyticsDescription: "Allow visit tracking",
            dangerZone: "Danger Zone",
            dangerZoneDescription: "These actions are permanent and cannot be undone",
            deleteAccount: "Delete Account",
        },
        aiAssistant: {
            title: "AI Assistant",
            subtitle: "Improve your profile with artificial intelligence",
            modes: {
                summary: {
                    title: "Improve Summary",
                    description: "Optimize your professional summary to stand out"
                },
                experience: {
                    title: "Improve Experience",
                    description: "Rewrite job descriptions with impact"
                },
                skills: {
                    title: "Suggest Skills",
                    description: "Get relevant skill suggestions"
                },
                coverLetter: {
                    title: "Cover Letter",
                    description: "Generate a personalized letter"
                },
                ats: {
                    title: "Optimize for ATS",
                    description: "Improve your CV for tracking systems"
                },
                translate: {
                    title: "Translate Profile",
                    description: "Translate your profile to the other language"
                }
            },
            generating: "Generating suggestion...",
            original: "Original:",
            suggestion: "AI Suggestion:",
            apply: "Apply Changes",
            regenerate: "Regenerate",
            backToMenu: "Back to menu",
            errors: {
                noApiKey: "API key not configured",
                noExperiences: "No experiences to improve",
                generic: "Error generating suggestion",
                applyError: "Error applying changes"
            }
        },
    },
    NAV_LINKS: [
        { name: 'Product', href: '#', id: 'product', subItems: [
            { name: 'Overview', href: '#', id: 'product/overview' },
            { name: 'Verified Profiles (Stamps)', href: '#', id: 'product/stamps' },
            { name: 'ATS Export (PDF/DOCX)', href: '#', id: 'product/ats' },
            { name: 'Custom Domain/URL', href: '#', id: 'product/domain' },
            { name: 'Profile Analytics', href: '#', id: 'product/analytics' },
            { name: 'AI for CV & Letters', href: '#', id: 'product/ai' },
        ]},
        { name: 'For Professionals', href: '#', id: 'professionals', subItems: [
            { name: 'How it Works', href: '#', id: 'professionals/how' },
            { name: 'Templates & Examples', href: '#', id: 'professionals/templates' },
            { name: 'Pricing (Plans)', href: '#', id: 'pricing' },
            { name: 'Help Center', href: '#', id: 'professionals/help' },
        ]},
        { name: 'For Companies', href: '#', id: 'companies', subItems: [
            { name: 'Advanced Talent Search', href: '#', id: 'companies/search' },
            { name: 'Company Plan', href: '#', id: 'companies/plans' },
            { name: 'ATS Integrations', href: '#', id: 'companies/integrations' },
            { name: 'Security & Compliance (GDPR)', href: '#', id: 'companies/security' },
        ]},
        { name: 'Resources', href: '#', id: 'resources', subItems: [
            { name: 'Blog / Career Guides', href: '#', id: 'resources/blog' },
            { name: 'Template Library', href: '#', id: 'resources/library' },
            { name: 'Success Stories', href: '#', id: 'resources/success' },
            { name: 'System Status', href: '#', id: 'resources/status' },
        ]},
        { name: 'About Us', href: '#', id: 'about', subItems: [
            { name: 'Mission & Values', href: '#', id: 'about/mission' },
            { name: 'Press/Media Kit', href: '#', id: 'about/press' },
            { name: 'Contact', href: '#', id: 'about/contact' },
        ]},
        { name: 'Pricing', href: '#', id: 'pricing' },
    ],
    PRICING_PLANS: [
        { title: 'Basic Plan', price: 'Free', period: 'Forever', description: 'Start with a professional, verified profile.', features: ['1 Verified Profile', 'Limited Verifications (Stamps)', 'Standard Templates', 'Sharable URL'], cta: 'Get Started for Free' },
        { title: 'Professional Plan', price: '€15', period: '/ month', description: 'Unlock powerful tools to accelerate your career.', features: ['Everything in Basic', 'Unlimited Verifications', 'Premium Templates', 'Custom Domain', 'AI Profile Enhancement', 'Advanced Analytics'], cta: 'Get Started Now', highlight: true },
        { title: 'Enterprise Plan', price: 'Custom', period: '', description: 'For teams and companies looking to recruit top talent.', features: ['Team Management', 'Advanced Talent Search', 'ATS Integrations', 'Dedicated Support', 'Enhanced Security'], cta: 'Contact Sales' },
    ],
    PRICING_PAGE_PLANS: [
      {
        title: 'Free Plan',
        price: 'Free',
        period: 'Forever',
        description: 'Start with a professional, verified profile.',
        features: ['1 Verified Profile', 'Limited Verifications (Stamps)', 'Standard Templates', '1 ATS Export / month', 'Community Support'],
        cta: 'Get Started for Free',
      },
      {
        title: 'Professional Plan',
        price: '€15',
        period: '/ month',
        description: 'Unlock powerful tools to accelerate your career.',
        features: ['Everything in Free', 'Unlimited Verifications', 'Premium Templates', 'Custom Domain', 'AI Profile Enhancement', 'Advanced Analytics', 'Priority Support'],
        cta: 'Start 14-Day Free Trial',
        highlight: true,
      },
      {
        title: 'Enterprise Plan',
        price: 'Custom',
        period: '',
        description: 'For teams and companies looking to recruit top talent.',
        features: ['Team Management', 'Advanced Talent Search', 'ATS Integrations', 'Dedicated Support', 'Enhanced Security', 'API Access'],
        cta: 'Contact Sales',
      },
    ],
    PRICING_COMPARISON: {
        headers: ['Feature', 'Free', 'Professional', 'Enterprise'],
        rows: [
            { category: 'Core Profile', feature: 'Verified Profile Creation', values: ['✓', '✓', '✓'] },
            { category: 'Core Profile', feature: 'Standard Templates', values: ['✓', '✓', '✓'] },
            { category: 'Core Profile', feature: 'Sharable URL', values: ['✓', '✓', '✓'] },
            { category: 'Verifications', feature: 'Identity Verification', values: ['1 Stamp', 'Unlimited', 'Unlimited'] },
            { category: 'Verifications', feature: 'Education/Work Stamps', values: ['Limited', 'Unlimited', 'Unlimited'] },
            { category: 'Exports & Customization', feature: 'ATS Export (PDF/DOCX)', values: ['1 / month', 'Unlimited', 'Unlimited'] },
            { category: 'Exports & Customization', feature: 'Premium Templates', values: ['-', '✓', '✓'] },
            { category: 'Exports & Customization', feature: 'Custom Domain/URL', values: ['-', '✓', '✓'] },
            { category: 'Exports & Customization', feature: 'Remove YourCVPassport Branding', values: ['-', '✓', '✓'] },
            { category: 'Tools & Analytics', feature: 'AI Profile Enhancement', values: ['-', '✓', '✓'] },
            { category: 'Tools & Analytics', feature: 'AI Cover Letter Generator', values: ['-', '✓', '✓'] },
            { category: 'Tools & Analytics', feature: 'Basic Profile Analytics', values: ['✓', '✓', '✓'] },
            { category: 'Tools & Analytics', feature: 'Advanced Analytics (Company Views)', values: ['-', '✓', '✓'] },
            { category: 'Support & Security', feature: 'Community Support', values: ['✓', '✓', '✓'] },
            { category: 'Support & Security', feature: 'Priority Email Support', values: ['-', '✓', '✓'] },
            { category: 'Support & Security', feature: 'Dedicated Account Manager', values: ['-', '-', '✓'] },
            { category: 'Support & Security', feature: 'Team Management', values: ['-', '-', '✓'] },
            { category: 'Support & Security', feature: 'API Access & Custom Integrations', values: ['-', '-', '✓'] },
        ]
    },
    FAQ_ITEMS: [
        { question: 'What is a verified CV Passport?', answer: 'A verified CV Passport is a digitally secured and authenticated professional profile. We verify your identity, education, work experience, and skills, providing employers with a reliable and trustworthy representation of your qualifications.' },
        { question: 'How does the verification process work?', answer: 'You submit your documents and information through our secure platform. Our system, combined with third-party verification services, confirms the authenticity of your credentials. Once verified, a "stamp" is added to your profile.' },
        { question: 'Is my data secure?', answer: 'Absolutely. We are fully GDPR compliant and use state-of-the-art encryption to protect your data. You have complete control over who sees your profile and information.' },
        { question: 'Can I export my CV for job applications?', answer: 'Yes! You can export your verified CV in various ATS-friendly formats like PDF and DOCX, ensuring it passes through the applicant tracking systems used by most companies.' },
    ],
    TESTIMONIALS: [
        { quote: "The verification stamp made a huge difference. I received more callbacks from top-tier companies than ever before. It's a game-changer.", name: 'Anna Kowalsky', role: 'Senior Software Engineer', imageUrl: 'https://picsum.photos/id/1027/100/100' },
        { quote: "As a recruiter, YourCVPassport is invaluable. It saves me hours of background checks and allows me to focus on qualified, trustworthy candidates.", name: 'James Smith', role: 'Tech Recruiter at Innovate Inc.', imageUrl: 'https://picsum.photos/id/1005/100/100' },
        { quote: "The AI profile enhancement tool helped me craft the perfect summary. It highlighted my strengths in ways I hadn't thought of.", name: 'Maria Garcia', role: 'Product Manager', imageUrl: 'https://picsum.photos/id/1011/100/100' }
    ],
    STAMPS_FAQ_ITEMS: [
        { question: 'How long does verification take?', answer: 'Identity verification is usually instant. Education and work experience can take 2-5 business days depending on the institution.' },
        { question: 'What documents do I need?', answer: 'This varies by stamp. For identity, a government-issued ID is required. For education, you may need a diploma or transcript.' },
    ],
    PRICING_PAGE_TESTIMONIALS: [
        { quote: "The Professional Plan is worth every penny. The custom domain and advanced analytics gave me the edge I needed.", name: 'John Doe', role: 'Marketing Director', imageUrl: 'https://picsum.photos/id/1012/100/100', plan: 'Professional' },
        { quote: "Started with the free plan which was great. Upgraded to Pro for the AI tools and it was a game changer for my applications.", name: 'Samantha Lee', role: 'UX Designer', imageUrl: 'https://picsum.photos/id/1013/100/100', plan: 'Professional' },
        { quote: "Our entire team uses the Enterprise plan. It has streamlined our hiring and helps us find verified talent much faster.", name: 'Robert Chen', role: 'Head of Talent at Stellar Corp.', imageUrl: 'https://picsum.photos/id/1014/100/100', plan: 'Enterprise' }
    ],
    COMPANY_TESTIMONIALS: [
        { quote: "The quality of candidates we find on YourCVPassport is unmatched. The verification saves us time and reduces hiring risk.", name: 'Emily White', role: 'HR Manager, Apex Solutions', imageUrl: 'https://picsum.photos/id/1015/100/100'},
        { quote: "Advanced search filters allow us to pinpoint the exact skills we need. It has cut our sourcing time in half.", name: 'David Green', role: 'Recruitment Lead, QuantumLeap', imageUrl: 'https://picsum.photos/id/1016/100/100'}
    ],
    PRICING_PAGE_FAQ_ITEMS: [
        { question: 'Is there a free trial for the Professional Plan?', answer: 'Yes, all our paid plans come with a 14-day free trial. You can explore all the features before committing.' },
        { question: 'Can I change my plan later?', answer: 'Absolutely. You can upgrade, downgrade, or cancel your plan at any time from your account dashboard.' },
        { question: 'What are contact credits for Enterprise plans?', answer: 'Contact credits are used to view full profiles and contact candidates. This flexible system allows you to pay for what you use.' },
    ],
    HELP_CENTER_FAQ_ITEMS: [
        { question: 'How do I reset my password?', answer: 'You can reset your password by clicking the "Forgot Password" link on the login page. An email with instructions will be sent to you.'},
        { question: 'How do I update my profile information?', answer: 'You can edit all sections of your profile directly from your dashboard after logging in.'}
    ],
    SEARCH_PROFILE_EXAMPLES: [
        { name: 'Dr. Evelyn Reed', role: 'Data Scientist', location: 'Berlin, Germany', skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Big Data'], verified: true, imageUrl: 'https://picsum.photos/id/1027/100/100' },
        { name: 'Marcus Chen', role: 'Senior UX Designer', location: 'London, UK', skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'], verified: true, imageUrl: 'https://picsum.photos/id/1005/100/100' },
        { name: 'Sofia Rossi', role: 'Product Manager', location: 'Remote', skills: ['Agile', 'Roadmapping', 'JIRA', 'Market Analysis', 'Go-to-market Strategy'], verified: true, imageUrl: 'https://picsum.photos/id/1011/100/100' },
        { name: 'Alex Johnson', role: 'DevOps Engineer', location: 'New York, USA', skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'], verified: true, imageUrl: 'https://picsum.photos/id/1012/100/100' },
        { name: 'Isabella Costa', role: 'Marketing Manager', location: 'São Paulo, Brazil', skills: ['SEO', 'Content Marketing', 'Google Analytics'], verified: false, imageUrl: 'https://picsum.photos/id/1013/100/100' },
        { name: 'Kenji Tanaka', role: 'AI Researcher', location: 'Tokyo, Japan', skills: ['PyTorch', 'NLP', 'Computer Vision'], verified: true, imageUrl: 'https://picsum.photos/id/1014/100/100' },
    ],
    ATS_INTEGRATIONS: [
        { name: 'Greenhouse', logo: 'G', description: 'Automatically sync candidate profiles from YourCVPassport directly into your Greenhouse pipeline.' },
        { name: 'Lever', logo: 'L', description: 'Streamline your workflow by adding verified candidates to your Lever talent pool with one click.' },
        { name: 'Workable', logo: 'W', description: 'Push candidates and their verified credentials into Workable to track them through your hiring stages.' }
    ],
    BLOG_CATEGORIES: ['All', 'CV & Resume', 'Interview Tips', 'Career Growth', 'For Recruiters'],
    BLOG_POSTS: [
        { id: 1, title: 'How to Pass ATS Scans in 2025', category: 'CV & Resume', imageUrl: 'https://picsum.photos/id/10/400/300', summary: 'Learn the top secrets to creating a CV that gets noticed by both robots and humans.', authorName: 'John Carter', authorImageUrl: 'https://picsum.photos/id/1005/100/100', date: 'January 15, 2025', featured: true },
        { id: 2, title: '5 Common Interview Mistakes to Avoid', category: 'Interview Tips', imageUrl: 'https://picsum.photos/id/20/400/300', summary: 'Nail your next interview by avoiding these simple but critical errors.', authorName: 'Jane Doe', authorImageUrl: 'https://picsum.photos/id/1027/100/100', date: 'January 10, 2025' },
        { id: 3, title: 'Navigating a Career Change After 40', category: 'Career Growth', imageUrl: 'https://picsum.photos/id/30/400/300', summary: 'It\'s never too late to pursue your passion. Here\'s how to make a successful transition.', authorName: 'Emily White', authorImageUrl: 'https://picsum.photos/id/1011/100/100', date: 'January 5, 2025' },
        { id: 4, title: 'Why Verified Credentials Matter to Recruiters', category: 'For Recruiters', imageUrl: 'https://picsum.photos/id/40/400/300', summary: 'A deep dive into how pre-verified candidates can save time and reduce hiring risks.', authorName: 'James Smith', authorImageUrl: 'https://picsum.photos/id/1005/100/100', date: 'December 28, 2024' },
        { id: 5, title: 'The Ultimate Guide to Writing a Compelling Cover Letter', category: 'CV & Resume', imageUrl: 'https://picsum.photos/id/50/400/300', summary: 'Our AI can help, but these fundamental principles are key to writing a letter that stands out.', authorName: 'Jane Doe', authorImageUrl: 'https://picsum.photos/id/1027/100/100', date: 'December 25, 2024' },
    ],
    TEMPLATE_CATEGORIES: ['CV', 'Cover Letter', 'Email', 'LinkedIn'] as const,
    TEMPLATE_CATEGORY_NAMES: {
        'CV': 'CV',
        'Cover Letter': 'Cover Letter',
        'Email': 'Email',
        'LinkedIn': 'LinkedIn'
    },
    TEMPLATE_INDUSTRIES: ['All', 'Technology', 'Creative', 'Corporate', 'Healthcare'],
    TEMPLATE_LEVELS: ['All', 'Entry-Level', 'Mid-Career', 'Senior', 'Executive'],
    TEMPLATES: [
        { id: 1, title: 'Modern Minimalist Design', category: 'CV', imageUrl: '/images/templates/modern-minimalist.png', industry: 'Technology', level: 'Mid-Career', downloads: 1250, rating: 4.8 },
        { id: 2, title: 'Bold Creative Format', category: 'CV', imageUrl: '/images/templates/creative-bold.png', industry: 'Creative', level: 'Senior', downloads: 980, rating: 4.9 },
        { id: 3, title: 'Classic Professional Layout', category: 'CV', imageUrl: '/images/templates/professional-classic.png', industry: 'Corporate', level: 'Executive', downloads: 2100, rating: 4.7 },
        { id: 4, title: 'Healthcare Professional', category: 'CV', imageUrl: '/images/templates/healthcare-professional.png', industry: 'Healthcare', level: 'Mid-Career', downloads: 850, rating: 4.6 },
    ] as Template[],
    STORY_INDUSTRIES: ['All', 'Technology', 'Marketing', 'Healthcare', 'Finance'],
    STORY_GOALS: ['All', 'Career Change', 'First Job', 'Promotion', 'Freelance'],
    SUCCESS_STORIES: [
        { id: 1, name: 'María Rodriguez', imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop', role: 'Software Engineer → Product Manager', industry: 'Technology', goal: 'Career Change', headline: 'From Coder to Leader: How a Verified Profile Opened the Door to Management', fullStory: 'María was a skilled developer but struggled to be seen for management roles. By verifying her project management certifications and using the AI assistant to reframe her experience, she landed her dream job as a Product Manager at a leading tech firm.', featured: true, videoUrl: '#', beforeImageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop', afterImageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop'},
        { id: 2, name: 'David Chen', imageUrl: 'https://picsum.photos/id/1005/200/200', role: 'Freelance Graphic Designer', industry: 'Creative', goal: 'Freelance', headline: 'Doubled My Client Base in Three Months', fullStory: 'David used his verified portfolio on YourCVPassport with a custom domain to build trust with international clients. The professional presentation and verified skills helped him stand out on freelance platforms.', videoUrl: '#'},
    ],
    SYSTEM_STATUS_ITEMS: [
        { name: 'Main Website & API', status: 'Operational' },
        { name: 'Profile Editor', status: 'Operational' },
        { name: 'Verification Systems', status: 'Operational' },
        { name: 'AI CV Generator', status: 'Operational' },
        { name: 'Template System', status: 'Operational' },
        { name: 'Public Profile Search', status: 'Operational' },
        { name: 'Language Switching (ES/EN)', status: 'Operational' },
        { name: 'ATS Export Service', status: 'Operational' },
        { name: 'Customer Support Portal', status: 'Operational' },
        { name: 'Billing Services', status: 'Operational' },
        { name: 'Avatar Storage', status: 'Operational' },
        { name: 'Authentication System', status: 'Operational' },
    ],
    UPTIME_STATS: {
        day: '100%',
        week: '99.98%',
        month: '99.99%',
    },
    CHANGELOG_ENTRIES: [
        { version: '2.3.0', date: 'November 10, 2025', changes: [
            { type: 'New Feature', description: 'Digital business card system with 20 adaptive designs matching each CV template.' },
            { type: 'New Feature', description: 'Interactive business card gallery with filters (All/Free/Pro) and real-time preview.' },
            { type: 'New Feature', description: 'Business card download in PNG (high resolution 3x) and PDF (standard size 85.6x54mm) formats.' },
            { type: 'New Feature', description: 'High-quality QR codes integrated in cards with error correction level H.' },
            { type: 'New Feature', description: 'Professional LoadingSpinner component with improved animations and multilingual messages.' },
            { type: 'Improvement', description: 'Enhanced session persistence to prevent redirects when refreshing (F5) in admin panel.' },
            { type: 'Improvement', description: 'Separate loading state management system (session + profile) for protected routes.' },
            { type: 'Improvement', description: 'Production URLs displayed correctly (yourcvpassport.com) instead of localhost.' },
            { type: 'Improvement', description: 'User ID displaying first 10 characters of UUID in uppercase.' },
            { type: 'Bug Fix', description: 'Fixed unwanted redirect in AdminProtectedRoute when refreshing page.' },
            { type: 'Bug Fix', description: 'Resolved jsPDF import issue for PDF generation.' },
            { type: 'Bug Fix', description: 'Corrected data fields in cards (headline instead of professional_title, email from session).' }
        ] },
        { version: '2.2.0', date: 'October 15, 2025', changes: [
            { type: 'New Feature', description: 'Added 4 new professional CV templates: Modern Minimalist, Creative Bold, Professional Classic, and Healthcare Professional.' },
            { type: 'New Feature', description: 'Implemented dynamic language switching system (Spanish/English) with localStorage persistence.' },
            { type: 'Improvement', description: 'Enhanced avatar display across all CV templates with image support and initials fallback.' },
            { type: 'Improvement', description: 'Optimized success story images for better visual representation.' },
            { type: 'Bug Fix', description: 'Fixed profile photo display issue in public templates.' },
            { type: 'Bug Fix', description: 'Resolved translation issues across multiple site pages.' }
        ] },
        { version: '2.1.0', date: 'September 20, 2025', changes: [{ type: 'New Feature', description: 'Introduced AI Cover Letter Generator.'}, { type: 'Improvement', description: 'Improved ATS export formatting for creative templates.' }] },
        { version: '2.0.5', date: 'September 5, 2025', changes: [{ type: 'Bug Fix', description: 'Fixed an issue with custom domain SSL certificate renewal.'}, { type: 'Improvement', description: 'Enhanced performance of the profile analytics dashboard.' }] },
    ] as ChangelogEntry[],
    ROADMAP_ITEMS: [
        { title: 'Advanced Team Collaboration', description: 'Allow teams to comment on and review candidate profiles internally.', quarter: 'Q1 2026' },
        { title: 'Video Introduction Feature', description: 'Enable professionals to add a short video introduction to their profile.', quarter: 'Q2 2026' },
        { title: 'Mobile App (iOS & Android)', description: 'Manage your profile and track applications on the go.', quarter: 'Q3 2026' },
    ],
    COMPANY_MILESTONES: [
        { year: '2023', title: 'Platform Launch', description: 'YourCVPassport was founded with a mission to bring trust and transparency to the professional world.' },
        { year: '2024', title: '10,000 Verified Users', description: 'Reached a major milestone, helping over 10,000 professionals showcase their verified credentials.' },
        { year: '2025', title: 'Global Expansion', description: 'Expanding our verification services to cover more countries and industries, making professional trust a global standard.' },
    ] as MilestoneItem[],
    MISSION_TESTIMONIALS: [
        { quote: "This platform is more than a CV builder; it's a movement towards a more honest and transparent job market.", name: 'Dr. Alisha Khan', role: 'Career Coach & Author', imageUrl: 'https://picsum.photos/id/1018/100/100'},
        { quote: "As a recruiter, knowing a candidate's credentials are pre-verified is a massive step forward. It aligns perfectly with our value of hiring with integrity.", name: 'Ben Carter', role: 'Head of People, NextGen', imageUrl: 'https://picsum.photos/id/1019/100/100'}
    ],
    PRESS_RELEASES: [
        { id: 1, date: 'July 10, 2025', title: 'YourCVPassport Launches AI-Powered Suite to Revolutionize Job Applications', summary: 'New tools include an AI assistant for profile optimization and a cover letter generator, aiming to level the playing field for job seekers.'},
        { id: 2, date: 'June 5, 2025', title: 'YourCVPassport Reaches 10,000 Verified Professionals Milestone', summary: 'The platform celebrates significant growth as it continues its mission to build a global network of trusted talent.'},
        { id: 3, date: 'May 1, 2025', title: 'New Partnership with Major ATS Providers Announced', summary: 'Integrations with leading Applicant Tracking Systems will streamline the hiring process for enterprise clients.'},
    ],
    EXECUTIVES: [
        { name: 'Jane Doe', title: 'Founder & CEO', imageUrl: 'https://picsum.photos/id/1027/200/200', bio: 'With over 15 years in HR tech, Jane founded YourCVPassport to solve the trust deficit in modern recruiting.' },
        { name: 'John Smith', title: 'Chief Technology Officer', imageUrl: 'https://picsum.photos/id/1005/200/200', bio: 'A security expert and AI enthusiast, John leads the development of our secure and innovative platform.' },
        { name: 'Emily White', title: 'VP of Product', imageUrl: 'https://picsum.photos/id/1011/200/200', bio: 'Emily is passionate about creating user-centric products that empower professionals in their career journey.' },
    ],
    MEDIA_COVERAGE: [
        { name: 'TechForward', logoUrl: '#', articleUrl: '#' },
        { name: 'HR Weekly', logoUrl: '#', articleUrl: '#' },
        { name: 'Career Insider', logoUrl: '#', articleUrl: '#' },
        { name: 'Startup Daily', logoUrl: '#', articleUrl: '#' },
        { name: 'Forbes', logoUrl: '#', articleUrl: '#' },
    ],
    CONTACT_PAGE_FAQ_ITEMS: [
        { question: 'What are your business hours?', answer: 'Our support team is available 24/7 via email. For sales and partnership inquiries, our business hours are Monday to Friday, 9 AM - 6 PM CET.' },
        { question: 'Where is YourCVPassport headquartered?', answer: 'Our headquarters are located in Valencia, Spain, near the Valencia City Hall (Ayuntamiento) in the historic city center. We operate with a fully remote team across the globe.'},
        { question: 'How can I verify my credentials on the platform?', answer: 'You can verify your educational and professional credentials through our blockchain verification system. Simply upload the necessary documents in the verification section of your profile, and our team will process the verification within 24-48 business hours.' },
        { question: 'Do you offer support in Spanish?', answer: 'Yes, we offer full support in both Spanish and English. Our team is available to assist you in your preferred language via email, live chat, and our multilingual help center.' },
        { question: 'Can I request a personalized platform demo?', answer: 'Absolutely. For companies and recruiters interested in our corporate solutions, we offer personalized demonstrations. Contact our team through the contact form or directly at support@yourcvpassport.com to schedule a session.' },
    ],
    CORE_VALUES: [
        { icon: transparencyIcon, title: 'Transparency', description: 'We believe in open communication. Our pricing is public, our roadmap is shared, and we build in the open with our community.' },
        { icon: trustIcon, title: 'Trust', description: 'Trust is our foundation. We are committed to building a platform where every credential can be verified and every profile is reliable.' },
        { icon: innovationIcon, title: 'Innovation', description: 'We leverage cutting-edge technology, like AI, to solve real-world problems in recruitment and make the hiring process more efficient and fair.' },
        { icon: inclusivityIcon, title: 'Inclusivity', description: 'We strive to create a level playing field, providing tools that empower professionals from all backgrounds to access global opportunities.' }
    ],
    COMPANY_FACTS: [
        { icon: factFoundedIcon, value: '2023', label: 'Founded In' },
        { icon: factUsersIcon, value: '10,000+', label: 'Active Users' },
        { icon: factCountriesIcon, value: '50+', label: 'Countries Served' },
        { icon: factTeamIcon, value: '25+', label: 'Team Members' }
    ],
    CONTACT_CARDS: [
        { icon: contactSupportIcon, title: 'Customer Support', description: 'For help with your profile, verifications, or account issues.', email: 'support@yourcvpassport.com', ctaText: 'Email Support', ctaLink: 'mailto:support@yourcvpassport.com', isMailLink: true },
        { icon: contactSalesIcon, title: 'Sales Inquiries', description: 'Learn more about our Enterprise plans and custom solutions.', email: 'support@yourcvpassport.com', ctaText: 'Contact Sales', ctaLink: 'mailto:support@yourcvpassport.com', isMailLink: true },
        { icon: contactPartnershipsIcon, title: 'Partnerships', description: 'Interested in integrating with us or forming a partnership?', email: 'support@yourcvpassport.com', ctaText: 'Become a Partner', ctaLink: 'mailto:support@yourcvpassport.com', isMailLink: true },
    ],
    howItWorksPage: {
        title: "How It Works for Professionals",
        subtitle: "From profile creation to landing your dream job, here’s your step-by-step guide to success.",
        heroSteps: [
            { title: "Build Profile", description: "Import data or start fresh." },
            { title: "Get Verified", description: "Add trust with stamps." },
            { title: "Share & Succeed", description: "Get noticed by recruiters." }
        ],
        gettingStarted: {
            title: "Getting Started",
            subtitle: "Your journey to a verified profile is simple."
        },
        mainSteps: [
            {
                stepLabel: "Step 1",
                title: "Import & Build Your Profile",
                description: "Quickly create your profile by importing data from LinkedIn or uploading your existing CV. Our tools will parse the information and structure it for you.",
                features: ["LinkedIn Import", "CV Upload", "Manual Entry"],
                showcase: { title: "Profile Sections", layout: "grid", items: ["Summary", "Experience", "Education", "Skills"] }
            },
            {
                stepLabel: "Step 2",
                title: "Verify Your Credentials",
                description: "Add a layer of trust by verifying your key qualifications. Submit your documents through our secure portal to earn verification stamps.",
                features: ["Identity Verification", "Education & Work History Stamps"],
                showcase: { title: "Verification Status", layout: 'stack', items: [{ title: "Education", description: "Verified" }, { title: "Work History", description: "Pending" }] }
            },
        ],
        video: {
            title: "Watch Our Tutorial",
            subtitle: "See the platform in action."
        },
        whatsNext: {
            title: "What's Next After Sharing?",
            subtitle: "Leverage your new professional passport.",
            items: [
                { title: "Track Analytics", description: "See who's viewing your profile." },
                { title: "Apply with Confidence", description: "Use your verified URL in applications." }
            ]
        },
        testimonials: {
            title: "Success Stories",
            description: "Hear from other professionals."
        },
        finalCta: {
            title: "Ready to Start?",
            subtitle: "Create your professional passport today.",
            button: "Get Started Free"
        }
    },
    templatesAndExamplesPage: {
        title: "Template Library & Examples",
        subtitle: "Professionally designed templates for every industry and career level.",
        templatesIncluded: "CVs, Cover Letters, Emails & More",
        gallery: {
            title: "Explore Our Templates",
            subtitle: "Find the perfect design to match your personal brand.",
            categories: [
                { key: 'All', name: 'All' },
                { key: 'CV', name: 'CVs' },
                { key: 'Cover Letter', name: 'Cover Letters' },
                { key: 'Email', name: 'Emails' },
            ],
            templates: [] // Uses TEMPLATES constant
        },
        successStories: {
            title: "Real Success Stories",
            subtitle: "See the before-and-after transformation.",
            imageCaption: "A well-structured template can make all the difference."
        },
        customize: {
            title: "Intuitive Visual Editor",
            subtitle: "Customize every detail effortlessly.",
            features: [
                "Change colors, fonts, and styles in real-time",
                "Reorganize sections with drag-and-drop",
                "Preview changes instantly",
                "Adjust margins and spacing",
                "Export to high-quality PDF"
            ]
        },
        comparison: {
            title: "YourCVPassport vs. Traditional Tools",
            headers: ["Feature", "YourCVPassport", "Traditional"],
            rows: [
                { feature: "ATS Optimized", values: ["✓", "-"] },
                { feature: "Professionally Designed", values: ["✓", "Varies"] },
                { feature: "Real-Time Visual Editor", values: ["✓", "-"] },
                { feature: "Blockchain Verification", values: ["✓", "-"] },
                { feature: "Multiple Export Formats", values: ["✓", "Limited"] },
                { feature: "Profile Analytics", values: ["✓", "-"] }
            ]
        },
        finalCta: {
            title: "Find Your Perfect Template",
            subtitle: "Start building your professional profile today.",
            button: "Browse Templates"
        }
    },
    pricingPage: {
        title: "Find the Perfect Plan",
        subtitle: "Choose the plan that's right for your career goals.",
        billingToggle: {
            monthly: "Monthly",
            annually: "Annually",
            save: "Save 20%"
        },
        plans: {
            title: "Our Plans"
        },
        comparison: {
            title: "Compare All Features"
        },
        roi: {
            title: "Return on Investment",
            subtitle: "See how our plans can help you.",
            stats: [
                { value: "3x", label: "More Profile Views" },
                { value: "50%", label: "Faster Hiring" },
                { value: "98%", label: "Recruiter Trust" }
            ]
        },
        guarantee: {
            title: "Our Guarantee",
            items: [
                { title: "Money-Back", description: "14-day money-back guarantee." },
                { title: "Cancel Anytime", description: "No long-term contracts." },
                { title: "Secure Payments", description: "Your data is safe." },
                { title: "Transparent Pricing", description: "No hidden fees." },
            ]
        },
        testimonialsTitle: "What Our Users Say",
        faqTitle: "Frequently Asked Questions",
        finalCta: {
            title: "Ready to Get Started?",
            subtitle: "Choose your plan and start building your future.",
            button: "Sign Up Now"
        },
        freePrice: "Free",
        customPrice: "Custom",
        trialLabel: "14-Day Trial"
    },
    helpCenterPage: {
        title: "Help Center",
        subtitle: "We're here to help. Find answers to your questions.",
        searchPlaceholder: "Search for articles...",
        categories: [
            { icon: transparencyIcon, title: "Getting Started", description: "Learn the basics." },
            { icon: trustIcon, title: "Verification", description: "All about stamps." },
            { icon: innovationIcon, title: "Account Settings", description: "Manage your account." }
        ],
        popular: {
            title: "Popular Articles",
            articles: [
                "How to verify your education?",
                "How to set up a custom domain?",
                "Troubleshooting ATS export issues."
            ]
        },
        video: {
            title: "Video Tutorial",
            caption: "Getting Started Guide"
        },
        faqTitle: "FAQs",
        community: {
            title: "Join Our Community",
            description: "Ask questions and share tips with other users.",
            button: "Visit Forum"
        },
        contact: {
            title: "Contact Support",
            description: "Can't find an answer? Our team is here to help.",
            button: "Contact Us"
        }
    },
    advancedTalentSearch: {
        title: "Advanced Talent Search",
        subtitle: "Find top-tier, verified talent faster than ever before.",
        searchButton: "Search",
        interfaceTitle: "Discover Your Next Hire",
        verified: "Verified",
        more: "more",
        viewProfile: "View Profile",
        filters: {
            title: "Filters",
            stamps: { label: "Verification Stamps", identity: "Identity Verified", education: "Education Verified", experience: "Experience Verified" },
            skills: { label: "Skills", placeholder: "e.g., Python, Figma" },
            location: { label: "Location", placeholder: "e.g., Berlin, Germany" },
            salary: { label: "Salary Expectation (EUR)", min: "Min", max: "Max" },
            experience: { label: "Years of Experience", options: ["Any", "0-2 years", "3-5 years", "6-10 years", "10+ years"] },
            applyButton: "Apply Filters"
        },
        aiMatching: {
            title: "AI Candidate Matching",
            description: "Our AI analyzes your job description and surfaces the most relevant, verified candidates from our talent pool.",
            features: [
                {
                    title: "Advanced Semantic Search",
                    description: "Find candidates based on meaning, not just exact keyword matches."
                },
                {
                    title: "Skills Matching",
                    description: "Automatically identify technical and soft skills that match your search."
                },
                {
                    title: "Experience Analysis",
                    description: "Evaluate professional trajectory and career progression of each candidate."
                },
                {
                    title: "Compatibility Score",
                    description: "Receive a compatibility percentage for each profile based on multiple factors."
                },
                {
                    title: "Smart Recommendations",
                    description: "Discover similar candidates who might be perfect for your position."
                }
            ]
        },
        comparison: {
            title: "Why Our Search is Better",
            headers: ["Feature", "YourCVPassport", "Traditional Platforms"],
            rows: [
                { feature: "Verified Credentials", passport: "✓", traditional: "-" },
                { feature: "AI Matching", passport: "✓", traditional: "Keyword-based" },
                { feature: "Real-Time Profile Updates", passport: "✓", traditional: "Outdated profiles" },
                { feature: "Direct Candidate Contact", passport: "✓", traditional: "Limited" },
                { feature: "Advanced Skills Filters", passport: "✓", traditional: "Basic filters" },
                { feature: "Predictive Compatibility Analysis", passport: "✓", traditional: "-" },
                { feature: "Work Experience Verification", passport: "✓", traditional: "-" },
                { feature: "Education Validation", passport: "✓", traditional: "-" },
                { feature: "Complete ATS Integration", passport: "✓", traditional: "Partial" },
                { feature: "Advanced Semantic Search", passport: "✓", traditional: "Text search" },
                { feature: "Analytics Dashboard", passport: "✓", traditional: "Basic" },
                { feature: "Data Export", passport: "PDF, DOCX, JSON", traditional: "PDF only" },
            ]
        },
        finalCta: {
            title: "Start Finding Verified Talent Today",
            subtitle: "Sign up for a company plan to access our advanced talent search.",
            button: "Get Started Now"
        }
    },
    companyPlansPage: {
        title: "Plans for Companies",
        subtitle: "Access a verified talent pool and streamline your hiring process.",
        cta: { requestDemo: "View Plans" },
        tiers: {
            title: "Our Tiers",
            plans: [
                { title: "Starter", description: "For small teams.", price: "€99", credits: "100 credits/month", features: ["Search access", "1 user seat"], cta: "Get Started" },
                { title: "Growth", description: "For growing businesses.", price: "€249", credits: "1000 credits/month", features: ["Everything in Starter", "3 user seats", "ATS integration"], cta: "Get Started", highlight: true },
                { title: "Enterprise", description: "For large organizations.", price: "Custom", credits: "3000 credits/month", features: ["Everything in Growth", "Unlimited seats", "API Access"], cta: "Contact Sales" }
            ]
        },
        credits: {
            title: "How Credits Work",
            subtitle: "Use credits to unlock actions within the platform.",
            items: [
                { cost: "1 Credit", action: "View Full Profile" },
                { cost: "5 Credits", action: "Get Contact Info" },
                { cost: "10 Credits", action: "Send Direct Message" }
            ]
        },
        matrix: {
            title: "Feature Matrix",
            headers: ["Feature", "Starter", "Growth", "Enterprise"],
            rows: [
                { feature: "Talent Search", starter: "✓", growth: "✓", enterprise: "✓" },
                { feature: "User Seats", starter: "1", growth: "3", enterprise: "Unlimited" },
                { feature: "ATS Integration", starter: "-", growth: "✓", enterprise: "✓" },
            ]
        },
        testimonialsTitle: "What Recruiters Are Saying",
        roi: {
            title: "Return on Investment",
            timeToHire: { title: "Time to Hire", value: "-40%" },
            costPerHire: { title: "Cost Per Hire", value: "-25%" }
        },
        form: {
            title: "Request a Demo",
            subtitle: "Let us show you how we can help.",
            name: "Name",
            company: "Company",
            email: "Email",
            message: "Message",
            submit: "Send Request",
            alert: "Demo request sent!"
        }
    },
    atsIntegrationsPage: {
        title: "ATS Integrations",
        subtitle: "Seamlessly connect YourCVPassport with your existing hiring tools.",
        logos: ["Greenhouse", "Lever", "Workable", "SmartRecruiters"],
        learnMore: "Learn More",
        showcase: {
            title: "Featured Integrations",
            subtitle: "One-click integrations with the industry's leading Applicant Tracking Systems."
        },
        setup: {
            title: "Easy Setup",
            steps: [
                { title: "Connect Account", description: "Authorize your ATS." },
                { title: "Configure Settings", description: "Map fields and stages." },
                { title: "Sync Profiles", description: "Start syncing candidates." }
            ]
        },
        api: {
            title: "Build Custom Integrations with Our API",
            description: "Our robust REST API allows you to build custom workflows and integrate our verified data into any system.",
            features: ["Access verified data", "Sync candidate profiles", "Webhooks for real-time updates"],
            cta: "View API Docs",
            comment: "// Fetch candidate data..."
        },
        security: {
            title: "Secure & Compliant",
            description: "All integrations are built with enterprise-grade security and are fully GDPR compliant.",
            badges: ["OAuth 2.0", "Data Encryption", "GDPR Compliant"]
        },
        finalCta: {
            title: "Streamline Your Hiring Workflow",
            subtitle: "Integrate with your favorite tools and hire faster.",
            button: "Explore Integrations"
        }
    },
    securityCompliancePage: {
        title: "Security and Compliance",
        subtitle: "Your trust is our top priority. We are committed to protecting your data.",
        heroBadges: ["GDPR Compliant", "SOC 2 Certified", "End-to-End Encryption"],
        commitment: {
            security: {
                title: "Our Commitment to Security",
                description: "We employ industry best practices to keep your data safe and secure.",
                features: [
                    { title: "Encryption", description: "Data is encrypted at rest and in transit." },
                    { title: "Regular Audits", description: "We undergo regular third-party security audits." }
                ]
            },
            privacy: {
                title: "Our Commitment to Privacy",
                description: "You are in control of your data.",
                features: [
                    { title: "Data Portability", description: "Export your data at any time." },
                    { title: "Granular Controls", description: "You decide what to share." }
                ]
            }
        },
        certifications: {
            title: "Certifications & Compliance",
            items: ["SOC 2 Type II", "ISO 27001", "GDPR", "CCPA"]
        },
        dataFlow: {
            title: "Data Flow",
            steps: ["You Input Data", "Data is Encrypted", "Secure Storage", "You Control Access"]
        },
        transparency: {
            title: "Transparency Features",
            features: [
                { icon: transparencyIcon, title: "Data Processing", description: "Clear information on how we use your data." },
                { icon: trustIcon, title: "Sub-processors", description: "A public list of our third-party service providers." },
                { icon: innovationIcon, title: "Open Source", description: "We contribute to and use open-source software." },
                { icon: inclusivityIcon, title: "Incident Reports", description: "Public reports on any security incidents." }
            ]
        },
        finalCta: {
            title: "Have Questions?",
            subtitle: "Visit our Trust Center for detailed reports and policies.",
            button: "Visit Trust Center"
        }
    },
    blogPage: {
        title: "Blog & Career Guides",
        subtitle: "Expert advice to help you navigate your professional journey.",
        featured: {
            label: "Featured Article"
        },
        searchPlaceholder: "Search articles...",
        sidebar: {
            popular: {
                title: "Popular Articles"
            },
            newsletter: {
                title: "Subscribe to our Newsletter",
                subtitle: "Get the latest career tips in your inbox.",
                placeholder: "Your email address",
                button: "Subscribe",
                alert: "Successfully subscribed with"
            }
        },
        finalCta: {
            title: "Ready to take the next step?",
            subtitle: "Create your professional passport today.",
            button: "Get Started"
        }
    }
    ,
    onboardingWizard: {
        step: "Step",
        of: "of",
        startButton: "Let's Start!",
        backButton: "Back",
        nextButton: "Next",
        finishButton: "Finish",
        goals: ["Looking for a job", "Finding new clients", "Networking"],
        dragAndDrop: "Drag & Drop your CV here",
        dropHere: "Drop the file here...",
        or: "or",
        browseFiles: "Browse Files",
        skip: "Skip for now",
        aiGenerating: "AI is generating your profile...",
        stampsDescription: "Activate your verification stamps.",
        verifyEmail: "Verify Email",
        setHandle: "Set your public handle",
        handlePlaceholder: "your-name",
        copyUrl: "Copy URL",
        copied: "Copied!",
        noCvMessage: "Please go back and import a CV to use the AI Assistant.",
        goBackAndImport: "Go Back & Import",
        shareDescription: "Your profile is live! Share it with the world.",
        social: "Social",
        steps: [
            { title: "Welcome", description: "Let's create your CV Passport. We'll ask a few questions to build an impressive and verified profile." },
            { title: "Choose Role & Goal", description: "What's your primary objective? (e.g., employment, clients, networking)" },
            { title: "Import CV", description: "Drag & drop your CV (PDF/DOCX) or skip for now." },
            { title: "AI Profile Generation", description: "Our AI is crafting your profile. You'll be able to preview and edit it." },
            { title: "Activate Stamps", description: "Verify your identity to build trust. We'll guide you through email/phone verification." },
            { title: "Publish Profile", description: "Set your unique handle and visibility settings." },
            { title: "Share Your Passport", description: "Share your new profile via URL, QR code, or social media." }
        ]
    },
    contactLeadModal: {
        title: "Contact",
        subtitle: "Send a message specifying the reason for contact",
        successTitle: "Message Sent!",
        successMessage: "will receive your message soon.",
        leadTypes: {
            jobOffer: "Job Offer",
            collaboration: "Collaboration",
            networking: "Networking",
            consultation: "Consultation",
            other: "Other"
        },
        form: {
            leadType: "Contact Type",
            subject: "Subject",
            subjectPlaceholder: "E.g: Senior Developer position at our company",
            subjectPlaceholderOther: "E.g: Collaboration proposal for project",
            message: "Message",
            messagePlaceholder: "Describe your proposal, offer or reason for contact...",
            messageMinLength: "Minimum 50 characters to send",
            company: "Company",
            companyPlaceholder: "Company name",
            position: "Position Offered",
            positionPlaceholder: "E.g: Senior Developer",
            salary: "Salary Range",
            salaryPlaceholder: "E.g: $80k - $120k",
            location: "Location",
            locationPlaceholder: "E.g: Remote / Madrid",
            companyOptional: "Company / Organization (optional)",
            companyOptionalPlaceholder: "Your company or organization name",
            jobOfferDetails: "Offer Details"
        },
        buttons: {
            cancel: "Cancel",
            send: "Send Message",
            sending: "Sending..."
        },
        errors: {
            loginRequired: "You must log in to send a message"
        }
    },
    leadsInbox: {
        title: "Received Messages",
        noNewMessages: "You have no new messages",
        newMessages: "new message",
        newMessagesPlural: "new messages",
        searchPlaceholder: "Search conversations...",
        filters: {
            all: "All",
            new: "New",
            read: "Read",
            replied: "Replied",
            unread: "Unread",
            job_offers: "Job Offers",
            collaboration: "Collaboration",
            accepted: "Accepted",
            rejected: "Rejected"
        },
        emptyState: {
            title: "No messages in this category",
            description: "Messages will appear here when you receive them",
            noConversations: "No conversations",
            noConversationsDescription: "Your conversations will appear here",
            noMessages: "No messages yet",
            noMessagesDescription: "Select a conversation to start messaging"
        },
        detailView: {
            selectMessage: "Select a message",
            selectMessageDescription: "Click on a message from the list to see full details",
            contactType: "Contact Type",
            subject: "Subject",
            message: "Message",
            company: "Company",
            position: "Position",
            salary: "Salary",
            location: "Location",
            jobOfferDetails: "Offer Details",
            leadDetails: "Lead Details",
            contactInfo: "Contact Information",
            name: "Name",
            email: "Email",
            phone: "Phone",
            type: "Type",
            status: "Status",
            received: "Received",
            lastMessage: "Last Message"
        },
        actions: {
            markReplied: "Mark as Replied",
            archive: "Archive",
            accept: "Accept",
            reject: "Reject",
            send: "Send"
        },
        status: {
            new: "New",
            read: "Read",
            replied: "Replied",
            accepted: "Accepted",
            rejected: "Rejected",
            archived: "Archived",
            pending: "Pending",
            contacted: "Contacted"
        },
        messageInput: {
            placeholder: "Type a message...",
            sending: "Sending...",
            sent: "Sent",
            error: "Failed to send"
        },
        labels: {
            unread: "unread",
            starred: "Starred",
            today: "Today",
            yesterday: "Yesterday",
            thisWeek: "This week",
            older: "Older"
        }
    },
    displaySettings: {
        title: "CV Display Settings",
        subtitle: "Control which optional sections are shown on your public CV",
        options: {
            availability: {
                title: "Show Availability Badge",
                description: "Displays an \"Open to opportunities\" indicator on your CV"
            },
            qrCode: {
                title: "Show QR Code",
                description: "Includes a QR code to easily share your profile"
            },
            credentials: {
                title: "Show Verified Credentials",
                description: "Displays verification badges (email, LinkedIn, identity)"
            },
            connectLinks: {
                title: "Show Connection Links",
                description: "Shows a section with your professional links (LinkedIn, Portfolio, GitHub)"
            }
        },
        recommended: "Recommended",
        tip: {
            title: "Professional Tip",
            description: "Recommended sections help make your CV more professional and easy to share. Verified credentials and connection links are optional and can be useful if you already have that information elsewhere on your CV."
        },
        buttons: {
            save: "Save Settings",
            saving: "Saving..."
        },
        messages: {
            success: "Settings saved successfully",
            error: "Error saving settings"
        }
    },
    aiAssistantSection: {
        title: "AI Assistant",
        subtitle: "Enhance your CV with artificial intelligence",
        analyzeButton: "Analyze",
        analyzingButton: "Analyzing...",
        tabs: {
            summary: "Summary",
            experience: "Experience",
            education: "Education"
        },
        suggestions: {
            title: "Improvement Suggestions",
            originalText: "Original Text",
            improvedText: "AI-Enhanced",
            applyButton: "Apply Improvement",
            applyingButton: "Applying...",
            appliedSuccess: "Applied successfully"
        },
        emptyState: {
            title: "No suggestions yet",
            description: {
                summary: "Click Analyze to generate intelligent improvements for your summary",
                experience: "Click Analyze to generate intelligent improvements for your experience",
                education: "Click Analyze to generate intelligent improvements for your education"
            }
        },
        notConfigured: {
            title: "AI Assistant Not Available",
            description: "The AI assistant is not currently configured. This feature requires a Google AI API Key to function.",
            whatCanYouDo: "What can you do in the meantime?",
            alternatives: {
                editManually: "Edit your profile manually in the other sections",
                useTemplates: "Use the available professional templates",
                exportPDF: "Export your CV in PDF format"
            },
            adminNote: "Note for administrators: Configure the environment variable"
        },
        errors: {
            analyzingSummary: "Error analyzing professional summary",
            analyzingExperiences: "Error analyzing work experiences",
            analyzingEducation: "Error analyzing education",
            applyingSuggestion: "Error applying improvement",
            noExperiences: "No work experiences to analyze",
            noEducation: "No education to analyze"
        },
        success: {
            applied: "✓ Improvement applied successfully"
        }
    },

    aiQuestionnaire: {
        sections: {
            identity: { name: 'Personal Information', icon: '👤' },
            experience: { name: 'Work Experience', icon: '💼' },
            education: { name: 'Education', icon: '🎓' },
            skills: { name: 'Skills', icon: '⚡' },
            languages: { name: 'Languages', icon: '🌍' },
            preferences: { name: 'Preferences', icon: '⚙️' },
            template: { name: 'CV Template', icon: '🎨' }
        },
        progress: {
            step: 'Step',
            of: 'of'
        },
        navigation: {
            previous: 'Previous',
            next: 'Next',
            finish: 'Finish',
            saving: 'Saving...'
        },
        identity: {
            name: 'Name',
            namePlaceholder: 'John Doe',
            title: 'Title',
            titlePlaceholder: 'Full Stack Developer',
            email: 'Email',
            emailPlaceholder: 'email@example.com',
            phone: 'Phone',
            phonePlaceholder: '+1 555 123 4567',
            location: 'Location',
            locationPlaceholder: 'New York, USA',
            linkedin: 'LinkedIn',
            linkedinPlaceholder: 'linkedin.com/in/username',
            github: 'GitHub',
            githubPlaceholder: 'github.com/username',
            portfolio: 'Portfolio',
            portfolioPlaceholder: 'portfolio.com',
            summary: 'Summary',
            summaryPlaceholder: 'Describe your professional journey...'
        },
        experience: {
            label: 'Experience',
            position: 'Position',
            positionPlaceholder: 'Senior Developer',
            company: 'Company',
            companyPlaceholder: 'Tech Company',
            startDate: 'Start',
            endDate: 'End',
            currentJob: 'Current job',
            description: 'Description',
            descriptionPlaceholder: 'Responsibilities and achievements...'
        },
        education: {
            label: 'Education',
            institution: 'Institution',
            institutionPlaceholder: 'University',
            degree: 'Degree',
            degreePlaceholder: 'Bachelor',
            field: 'Field',
            fieldPlaceholder: 'Engineering',
            startDate: 'Start',
            endDate: 'End',
            description: 'Description',
            descriptionPlaceholder: 'Achievements and relevant courses...'
        },
        skills: {
            label: 'Skill',
            skill: 'Skill',
            skillPlaceholder: 'JavaScript',
            level: 'Level',
            levelSelect: 'Select',
            levelBasic: 'Basic',
            levelIntermediate: 'Intermediate',
            levelAdvanced: 'Advanced',
            levelExpert: 'Expert',
            years: 'Years'
        },
        languages: {
            label: 'Language',
            language: 'Language',
            languagePlaceholder: 'English',
            level: 'Level',
            levelSelect: 'Select',
            levelA1: 'A1 - Basic',
            levelA2: 'A2 - Pre-intermediate',
            levelB1: 'B1 - Intermediate',
            levelB2: 'B2 - Upper-intermediate',
            levelC1: 'C1 - Advanced',
            levelC2: 'C2 - Mastery',
            levelNative: 'Native'
        },
        preferences: {
            availability: 'Availability',
            availabilitySelect: 'Select',
            availabilityImmediate: 'Immediate',
            availability1Week: '1 week',
            availability2Weeks: '2 weeks',
            availability1Month: '1 month',
            availabilityMore: 'More than 1 month',
            workMode: 'Work Mode',
            workModeSelect: 'Select',
            workModeRemote: 'Remote',
            workModeOnsite: 'On-site',
            workModeHybrid: 'Hybrid',
            expectedSalary: 'Expected Salary',
            expectedSalaryPlaceholder: '$50,000 - $60,000',
            relocationWilling: 'Willing to relocate'
        },
        template: {
            selectTemplate: 'Select a template'
        },
        messages: {
            loadingError: 'Error loading profile',
            savingError: 'Error saving profile',
            completedTitle: 'Profile completed!',
            completedMessage: 'Your profile has been saved successfully',
            optimizing: 'Optimizing...',
            aiNotAvailable: 'AI Assistant not available'
        },
        required: '*'
    }
};