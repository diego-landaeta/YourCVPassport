import React, { useRef } from 'react';
import { templates } from '../components/templates/templateData';

// Import all template components
import PassportTemplate from '../components/templates/PassportTemplate';
import ClassicTemplate from '../components/templates/ClassicTemplate';
import ModernProfessionalTemplate from '../components/templates/ModernProfessionalTemplate';
import CorporateClassicTemplate from '../components/templates/CorporateClassicTemplate';
import CreativeMinimalistTemplate from '../components/templates/CreativeMinimalistTemplate';
import AcademicStandardTemplate from '../components/templates/AcademicStandardTemplate';
import ModernMinimalistTemplate from '../components/templates/ModernMinimalistTemplate';
import CreativeBoldTemplate from '../components/templates/CreativeBoldTemplate';
import ProfessionalClassicTemplate from '../components/templates/ProfessionalClassicTemplate';
import HealthcareProfessionalTemplate from '../components/templates/HealthcareProfessionalTemplate';
import YellowMinimalistTemplate from '../components/templates/YellowMinimalistTemplate';
import BlueGradientTemplate from '../components/templates/BlueGradientTemplate';
import CoralPinkTemplate from '../components/templates/CoralPinkTemplate';
import GreenMinimalTemplate from '../components/templates/GreenMinimalTemplate';
import CreativeOrangeTemplate from '../components/templates/CreativeOrangeTemplate';
import ClassicSidebarTemplate from '../components/templates/ClassicSidebarTemplate';
import ModernCleanTemplate from '../components/templates/ModernCleanTemplate';
import ElegantMinimalTemplate from '../components/templates/ElegantMinimalTemplate';
import ProfessionalBlueTemplate from '../components/templates/ProfessionalBlueTemplate';
import CreativeModernTemplate from '../components/templates/CreativeModernTemplate';

const templateComponents: Record<string, React.ComponentType<any>> = {
  'passport': PassportTemplate,
  'classic': ClassicTemplate,
  'modern-professional': ModernProfessionalTemplate,
  'corporate-classic': CorporateClassicTemplate,
  'creative-minimalist': CreativeMinimalistTemplate,
  'academic-standard': AcademicStandardTemplate,
  'modern-minimalist': ModernMinimalistTemplate,
  'creative-bold': CreativeBoldTemplate,
  'professional-classic': ProfessionalClassicTemplate,
  'healthcare-professional': HealthcareProfessionalTemplate,
  'minimalist-yellow': YellowMinimalistTemplate,
  'gradient-blue': BlueGradientTemplate,
  'coral-pink': CoralPinkTemplate,
  'green-minimal': GreenMinimalTemplate,
  'creative-orange': CreativeOrangeTemplate,
  'classic-sidebar': ClassicSidebarTemplate,
  'modern-clean': ModernCleanTemplate,
  'elegant-minimal': ElegantMinimalTemplate,
  'professional-blue': ProfessionalBlueTemplate,
  'creative-modern': CreativeModernTemplate,
};

// Sample data for previews
const sampleData = {
  profile: {
    full_name: 'Carlos Rodríguez',
    headline: 'Senior Software Engineer',
    email: 'carlos.rodriguez@email.com',
    phone: '+1 (555) 234-5678',
    location: 'Madrid, Spain',
    summary: 'Experienced software engineer with 8+ years of expertise in full-stack development, cloud architecture, and team leadership. Passionate about building scalable solutions.',
    linkedin_url: 'linkedin.com/in/carlosrodriguez',
    github_url: 'github.com/carlosrodriguez',
    portfolio_url: 'carlosrodriguez.dev',
  },
  experiences: [
    {
      title: 'Senior Software Engineer',
      company: 'Tech Solutions Inc.',
      location: 'Madrid, Spain',
      start_date: '2021-03-01',
      end_date: null,
      current: true,
      description: 'Leading development of microservices architecture serving 100K+ users. Mentoring junior developers and implementing best practices.',
    },
    {
      title: 'Full Stack Developer',
      company: 'Digital Innovations',
      location: 'Remote',
      start_date: '2019-01-01',
      end_date: '2021-02-28',
      current: false,
      description: 'Built scalable web applications using React, Node.js, and AWS. Improved system performance by 40%.',
    },
    {
      title: 'Software Developer',
      company: 'StartupTech',
      location: 'Barcelona, Spain',
      start_date: '2017-06-01',
      end_date: '2018-12-31',
      current: false,
      description: 'Developed REST APIs and responsive web interfaces. Collaborated with design team on UX improvements.',
    },
  ],
  education: [
    {
      degree: 'Master of Science in Computer Science',
      institution: 'Universidad Politécnica de Madrid',
      location: 'Madrid, Spain',
      start_date: '2015-09-01',
      end_date: '2017-06-30',
      description: 'Specialization in Software Engineering and Cloud Computing',
    },
    {
      degree: 'Bachelor of Science in Computer Engineering',
      institution: 'Universidad de Barcelona',
      location: 'Barcelona, Spain',
      start_date: '2011-09-01',
      end_date: '2015-06-30',
      description: 'Cum Laude Graduate',
    },
  ],
  skills: [
    { name: 'JavaScript', level: 'expert', category: 'Programming' },
    { name: 'React', level: 'expert', category: 'Frontend' },
    { name: 'Node.js', level: 'expert', category: 'Backend' },
    { name: 'TypeScript', level: 'advanced', category: 'Programming' },
    { name: 'AWS', level: 'advanced', category: 'Cloud' },
    { name: 'Python', level: 'intermediate', category: 'Programming' },
  ],
  portfolioItems: [
    {
      title: 'SaaS Platform Development',
      description: 'Scalable cloud-based business solution',
      url: 'portfolio.com/saas',
    },
    {
      title: 'E-commerce API System',
      description: 'High-performance REST API architecture',
      url: 'portfolio.com/api',
    },
  ],
  languages: [
    { language: 'English', proficiency: 'Native' },
    { language: 'Spanish', proficiency: 'Professional' },
  ],
};

const TemplatePreviewGenerator: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Template Preview Generator</h1>
        <p className="text-center mb-8 text-gray-600">
          Use browser dev tools or screenshot extension to capture each template preview at 600x800px
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template) => {
            const TemplateComponent = templateComponents[template.id];

            if (!TemplateComponent) {
              return (
                <div key={template.id} className="bg-red-100 p-4 rounded">
                  <p className="text-red-600">Template not found: {template.id}</p>
                </div>
              );
            }

            return (
              <div key={template.id} className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold mb-2 text-center">
                  {template.name.en}
                </h3>
                <p className="text-sm text-gray-500 mb-4 text-center">
                  ID: {template.id}
                </p>

                <div
                  id={`template-${template.id}`}
                  className="overflow-hidden bg-white"
                  style={{
                    width: '600px',
                    height: '800px',
                    transform: 'scale(0.4)',
                    transformOrigin: 'top left',
                    marginBottom: '-480px',
                  }}
                >
                  <div style={{
                    width: '600px',
                    height: '800px',
                    overflow: 'hidden',
                    position: 'relative',
                    marginTop: '-48px'  // Compensar el my-12 del template
                  }}>
                    <TemplateComponent
                      data={sampleData}
                      isPreview={true}
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    const element = document.getElementById(`template-${template.id}`);
                    if (element) {
                      // Could integrate with html2canvas or similar library
                      alert(`Screenshot element for ${template.id}`);
                    }
                  }}
                  className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Capture Screenshot
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Use a browser extension like "GoFullPage" or "Fireshot" to capture each template</li>
            <li>Or use browser DevTools: Right-click on template → Inspect → Screenshot node</li>
            <li>Save each screenshot as <code className="bg-yellow-100 px-1">[template-id].png</code></li>
            <li>Place screenshots in <code className="bg-yellow-100 px-1">public/images/templates/</code></li>
            <li>Recommended size: 600x800px</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreviewGenerator;
