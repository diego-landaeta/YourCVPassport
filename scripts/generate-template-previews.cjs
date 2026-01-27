const fs = require('fs');
const path = require('path');

// Template configurations with colors and layouts
const templates = [
  { name: 'passport', color1: '#2563eb', color2: '#1e40af', layout: 'passport' },
  { name: 'classic', color1: '#1f2937', color2: '#374151', layout: 'simple' },
  { name: 'modern-professional', color1: '#0891b2', color2: '#0e7490', layout: 'modern' },
  { name: 'classic-corporate', color1: '#475569', color2: '#334155', layout: 'corporate' },
  { name: 'creative-minimalist', color1: '#ec4899', color2: '#db2777', layout: 'creative' },
  { name: 'academic-standard', color1: '#6366f1', color2: '#4f46e5', layout: 'academic' },
  { name: 'modern-minimalist', color1: '#10b981', color2: '#059669', layout: 'minimal' },
  { name: 'creative-bold', color1: '#f59e0b', color2: '#d97706', layout: 'bold' },
  { name: 'professional-classic', color1: '#0369a1', color2: '#075985', layout: 'professional' },
  { name: 'healthcare-professional', color1: '#dc2626', color2: '#b91c1c', layout: 'healthcare' },
  { name: 'minimalist-yellow', color1: '#eab308', color2: '#ca8a04', layout: 'minimal' },
  { name: 'gradient-blue', color1: '#3b82f6', color2: '#1d4ed8', layout: 'gradient' },
  { name: 'coral-pink', color1: '#fb7185', color2: '#f43f5e', layout: 'coral' },
  { name: 'green-minimal', color1: '#22c55e', color2: '#16a34a', layout: 'minimal' },
  { name: 'creative-orange', color1: '#f97316', color2: '#ea580c', layout: 'creative' },
  { name: 'classic-sidebar', color1: '#1e293b', color2: '#0f172a', layout: 'sidebar' },
  { name: 'modern-clean', color1: '#06b6d4', color2: '#0891b2', layout: 'clean' },
  { name: 'elegant-minimal', color1: '#8b5cf6', color2: '#7c3aed', layout: 'elegant' },
  { name: 'professional-blue', color1: '#1e40af', color2: '#1e3a8a', layout: 'professional' },
  { name: 'creative-modern', color1: '#d946ef', color2: '#c026d3', layout: 'modern' },
];

// SVG template generator
function generateSVG(template) {
  const { color1, color2, layout } = template;

  // Base SVG structure representing a CV layout
  return `<svg width="600" height="800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-${template.name}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="600" height="800" fill="#f8f9fa"/>

  ${layout === 'passport' ? `
  <!-- Passport style header -->
  <rect x="0" y="0" width="600" height="200" fill="url(#grad-${template.name})"/>
  <circle cx="300" cy="120" r="60" fill="white" opacity="0.9"/>
  <rect x="50" y="220" width="500" height="20" rx="4" fill="#dee2e6"/>
  <rect x="50" y="260" width="300" height="15" rx="3" fill="#e9ecef"/>
  <rect x="50" y="300" width="500" height="10" rx="2" fill="#e9ecef"/>
  <rect x="50" y="320" width="450" height="10" rx="2" fill="#e9ecef"/>
  <rect x="50" y="340" width="480" height="10" rx="2" fill="#e9ecef"/>
  ` : layout === 'sidebar' ? `
  <!-- Sidebar layout -->
  <rect x="0" y="0" width="200" height="800" fill="url(#grad-${template.name})"/>
  <rect x="230" y="30" width="340" height="25" rx="4" fill="#dee2e6"/>
  <rect x="230" y="70" width="250" height="15" rx="3" fill="#e9ecef"/>
  <rect x="230" y="100" width="340" height="10" rx="2" fill="#e9ecef"/>
  <rect x="230" y="120" width="320" height="10" rx="2" fill="#e9ecef"/>
  ` : layout === 'gradient' ? `
  <!-- Gradient header -->
  <rect x="0" y="0" width="600" height="150" fill="url(#grad-${template.name})"/>
  <rect x="50" y="170" width="500" height="20" rx="4" fill="#dee2e6"/>
  <rect x="50" y="210" width="300" height="15" rx="3" fill="#e9ecef"/>
  <rect x="50" y="250" width="500" height="10" rx="2" fill="#e9ecef"/>
  <rect x="50" y="270" width="450" height="10" rx="2" fill="#e9ecef"/>
  ` : `
  <!-- Standard layout -->
  <rect x="50" y="30" width="500" height="30" rx="4" fill="url(#grad-${template.name})"/>
  <rect x="50" y="80" width="300" height="20" rx="3" fill="#dee2e6"/>
  <rect x="50" y="120" width="500" height="12" rx="2" fill="#e9ecef"/>
  <rect x="50" y="140" width="450" height="12" rx="2" fill="#e9ecef"/>
  <rect x="50" y="160" width="480" height="12" rx="2" fill="#e9ecef"/>
  `}

  <!-- Content sections -->
  <rect x="50" y="400" width="150" height="20" rx="3" fill="${color1}" opacity="0.7"/>
  <rect x="50" y="435" width="500" height="8" rx="2" fill="#e9ecef"/>
  <rect x="50" y="450" width="450" height="8" rx="2" fill="#e9ecef"/>
  <rect x="50" y="465" width="480" height="8" rx="2" fill="#e9ecef"/>

  <rect x="50" y="520" width="150" height="20" rx="3" fill="${color1}" opacity="0.7"/>
  <rect x="50" y="555" width="500" height="8" rx="2" fill="#e9ecef"/>
  <rect x="50" y="570" width="450" height="8" rx="2" fill="#e9ecef"/>

  <rect x="50" y="640" width="150" height="20" rx="3" fill="${color1}" opacity="0.7"/>
  <rect x="50" y="675" width="400" height="8" rx="2" fill="#e9ecef"/>
  <rect x="50" y="690" width="350" height="8" rx="2" fill="#e9ecef"/>
</svg>`;
}

// Generate all template previews
const outputDir = path.join(__dirname, '../public/images/templates');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

templates.forEach(template => {
  const svg = generateSVG(template);
  const outputPath = path.join(outputDir, `${template.name}.png.svg`);
  fs.writeFileSync(outputPath, svg);
  console.log(`Generated: ${template.name}.png.svg`);
});

console.log(`\n✅ Generated ${templates.length} template preview images in ${outputDir}`);
