/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // TP Logistics Brand — yellow / black / white
        brand: {
          50: '#FEFCE8',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
          500: '#FACC15', // Primary
          600: '#EAB308',
          700: '#CA8A04',
          800: '#A16207',
          900: '#713F12',
          primary: '#FACC15',
          secondary: '#FDE047',
          light: '#FEF3C7',
          dark: '#0A0A0A',
        },
        // Modern Neutrals
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        // Beautiful Grays
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // System States with better colors
        success: {
          50: '#F0FDF4',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#FFFBEB',
          500: '#F59E0B',
          600: '#D97706',
        },
        error: {
          50: '#FEF2F2',
          500: '#EF4444',
          600: '#DC2626',
        },
        info: {
          50: '#EFF6FF',
          500: '#3B82F6',
          600: '#2563EB',
        },
        // Light theme surfaces
        surface: {
          DEFAULT: '#FFFFFF',
          light: '#FAFAF9',
          dark: '#F5F5F4',
          hover: 'rgba(10, 10, 10, 0.04)',
        },
        // Legacy color keys remapped to light theme
        ink: '#0A0A0A',
        'deep-black': '#0A0A0A',
        'dark-gray': '#57534E',
        'medium-gray': '#78716C',
        'light-gray': '#F5F5F4',
        panel: '#FFFFFF',
        'general-bg': '#FAFAF9',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #FACC15 0%, #FDE047 50%, #FEF08A 100%)',
        'sidebar-gradient': 'linear-gradient(180deg, #0A0A0A 0%, #171717 100%)',
        'card-gradient': 'linear-gradient(145deg, #111827 0%, #1E293B 100%)',
        'soft-overlay': 'rgba(250, 204, 21, 0.08)',
        'glass-effect': 'linear-gradient(135deg, rgba(148, 163, 184, 0.05) 0%, rgba(148, 163, 184, 0.02) 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.16' }],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 25px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'brand': '0 4px 25px -5px rgba(250, 204, 21, 0.25), 0 10px 25px -5px rgba(250, 204, 21, 0.15)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
}