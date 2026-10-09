/**
 * Arnés de pruebas (solo QA, lo usa tests/qa/pdf.local.spec.ts).
 *
 * Monta el componente real InteractiveAnalyticsPanel en #root, con el CSS global real
 * (index.css + src/print-styles.css) y un #print-mount vacío como en index.html, para
 * comprobar que su "Exportar PDF" (window.print) no imprime una página en blanco (#18).
 * El componente no es alcanzable desde la app (DashboardContent devuelve antes
 * AnalyticsDashboard para la sección 'analitica'), por eso se monta aislado.
 */
import '../../../index.css';
import '../../../src/print-styles.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import InteractiveAnalyticsPanel from '../../../components/dashboard/InteractiveAnalyticsPanel';

const visitsData = Array.from({ length: 30 }, (_, i) => ({ name: `D${i + 1}`, visits: 10 + ((i * 7) % 23) }));

const data = {
  visitsData,
  countriesData: [
    { country: 'España', visits: 120, flag: 'ES' },
    { country: 'México', visits: 80, flag: 'MX' },
  ],
  trafficSourcesData: [
    { name: 'Directo', value: 60, color: '#3B82F6' },
    { name: 'LinkedIn', value: 40, color: '#10B981' },
  ],
  stats: { visits: 321, ctaClicks: 45 },
  recentLeads: [],
};

createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <MemoryRouter>
      <LanguageProvider>
        <div className="p-6" data-qa="analytics-harness">
          <InteractiveAnalyticsPanel data={data} />
        </div>
      </LanguageProvider>
    </MemoryRouter>
  </HelmetProvider>
);

(window as any).__harnessMounted = true;
