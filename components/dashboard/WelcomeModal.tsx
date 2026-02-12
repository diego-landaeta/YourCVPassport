import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface WelcomeModalProps {
  onStartProfile: () => void;
  onDismiss: () => void;
  userName?: string;
  userGender?: string;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onStartProfile, onDismiss, userName, userGender }) => {
  const { lang } = useLanguage();

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 z-[9999] backdrop-blur-sm flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-fadeIn border-4 border-blue-500">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
            {lang === 'es'
              ? `¡${userGender === 'female' ? 'Bienvenida' : 'Bienvenido'}${userName ? `, ${userName}` : ''}!`
              : `Welcome${userName ? `, ${userName}` : ''}!`}
          </h2>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 text-center text-lg mb-8 leading-relaxed">
            {lang === 'es'
              ? 'Para acceder a todas las funcionalidades de tu dashboard profesional, primero necesitas completar tu perfil.'
              : 'To access all features of your professional dashboard, you first need to complete your profile.'}
          </p>

          {/* Features Checklist */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 mb-8 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              {lang === 'es' ? 'Una vez completes tu perfil, podrás:' : 'Once you complete your profile, you will be able to:'}
            </p>
            <ul className="space-y-3">
              {[
                { text: lang === 'es' ? 'Ver y personalizar tu CV profesional' : 'View and customize your professional CV', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { text: lang === 'es' ? 'Exportar tu CV en formato PDF' : 'Export your CV in PDF format', icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { text: lang === 'es' ? 'Compartir tu perfil con reclutadores' : 'Share your profile with recruiters', icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' },
                { text: lang === 'es' ? 'Ver analíticas de visitas y clics' : 'View analytics of visits and clicks', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                { text: lang === 'es' ? 'Recibir y gestionar leads de empresas' : 'Receive and manage company leads', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                  </svg>
                  <span className="text-base">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Estimated Time */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                  {lang === 'es' ? 'Tiempo estimado: 5-10 minutos' : 'Estimated time: 5-10 minutes'}
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  {lang === 'es'
                    ? 'Completa tu información básica paso a paso. Puedes guardar y continuar después si lo necesitas.'
                    : 'Complete your basic information step by step. You can save and continue later if needed.'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onStartProfile}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {lang === 'es' ? 'Completar mi perfil ahora' : 'Complete my profile now'}
            </button>
            <button
              onClick={onDismiss}
              className="px-8 py-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-semibold text-lg transition-all"
            >
              {lang === 'es' ? 'Más tarde' : 'Later'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WelcomeModal;
