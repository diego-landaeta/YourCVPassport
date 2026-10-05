/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
  ],
  // Equivale a darkMode: 'class' (`.dark` en un ancestro activa las variantes dark:)
  // pero permite forzar tema claro en un subarbol con la clase `cv-force-light`
  // (vista previa del CV en el Testing Hub, lienzo de plantillas, exportaciones).
  //
  // Tailwind 3.4 genera en modo 'class' el selector `&:is(${selector} *)`. El valor
  // de abajo "cierra" ese :is() e inyecta la exclusion, y queda:
  //   .dark\:x:is(.dark *):not(:where(.cv-force-light, .cv-force-light *)):where(html *)
  // - :not(:where(...)) y :where(html *) no suman especificidad: pesa lo mismo que antes.
  // - Se usa 'class' y NO ['variant', ...] a proposito: solo con 'class' Tailwind 3.4
  //   conserva el orden legacy (reglas dark: ANTES que sm:/md:/lg:). Con 'variant'
  //   las dark: pasan detras de las responsive y cambia la cascada de todo el sitio.
  // Verificado con tests/qa/admin.local.spec.ts (#19). Revisar al migrar a Tailwind 4.
  darkMode: ['class', '.dark *):not(:where(.cv-force-light, .cv-force-light *)):where(html'],
  theme: {
    extend: {
      colors: {
        'cv-blue': '#2563EB',
        'cv-blue-light': '#60A5FA',
        'cv-blue-dark': '#1E40AF',
        'cv-light-gray': '#F8F9FA',
        'cv-dark-gray': '#1F2937',
        'cv-green': '#10B981',
        'dark-bg': '#0F1419',
        'dark-bg-primary': '#0F1419',
        'dark-bg-secondary': '#1A1F26',
        'dark-bg-tertiary': '#272C35',
        'dark-surface': '#1A1F26',
        'dark-border': '#2D3139',
        'dark-border-light': '#3D424A',
        'dark-text-primary': '#E6E8EB',
        'dark-text-secondary': '#9BA3AF',
        'dark-text-tertiary': '#6B7280',
        gray: {
          850: '#1a1d23',
          ...require('tailwindcss/colors').gray,
        },
      },
      animation: {
        'spin-reverse': 'spin-reverse 1s linear infinite',
        'blob': 'blob 7s infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'shake': 'shake 0.5s ease-in-out',
        'fadeIn': 'fadeIn 0.2s ease-out',
        'slideUp': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        'spin-reverse': {
          'from': { transform: 'rotate(360deg)' },
          'to': { transform: 'rotate(0deg)' },
        },
        'blob': {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        'fadeIn': {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slideUp': {
          '0%': { opacity: '0', transform: 'translate(-50%, -45%)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -50%)' },
        }
      },
      animationDelay: {
        '2000': '2s',
        '4000': '4s',
      }
    }
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          /* Hide scrollbar for Chrome, Safari and Opera */
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          /* Hide scrollbar for IE, Edge and Firefox */
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        }
      })
    }
  ],
}
