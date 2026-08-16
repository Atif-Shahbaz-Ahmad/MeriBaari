import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../web/app/**/*.{ts,tsx}',
    '../web/src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        secondary: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          600: '#059669',
        },
        accent: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
        },
        surface: {
          DEFAULT: 'rgb(var(--mb-bg) / <alpha-value>)',
          card: 'rgb(var(--mb-card) / <alpha-value>)',
          input: 'rgb(var(--mb-input) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--mb-text) / <alpha-value>)',
          secondary: 'rgb(var(--mb-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--mb-text-muted) / <alpha-value>)',
        },
        line: 'rgb(var(--mb-border) / <alpha-value>)',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 16px rgba(15, 23, 42, 0.06)',
        soft: '0 8px 24px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        xl: '1.25rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
