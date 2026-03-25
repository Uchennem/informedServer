/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Dark palette
        slate: {
          900: '#0f172a',
          800: '#18212f',
          700: '#1a2a3d',
          600: '#2d3e54',
          500: '#3d4a63',
          400: '#8a92a6',
          300: '#d4d8e0',
          200: '#f5f7fa',
        },
        // Accent colors
        indigo: {
          600: '#4f46e5',
          500: '#6366f1',
          400: '#818cf8',
        },
        amber: {
          500: '#f59e0b',
          400: '#fbbf24',
        },
        // Semantic
        emerald: {
          400: '#34d399',
        },
        red: {
          400: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    function ({ addComponents, theme }) {
      addComponents({
        '.btn-primary': {
          padding: '0.5rem 1rem',
          backgroundColor: theme('colors.indigo.500'),
          color: 'white',
          borderRadius: '0.5rem',
          fontWeight: '500',
          fontSize: '0.875rem',
          cursor: 'pointer',
          transition: 'all 150ms ease',
          '&:hover': {
            backgroundColor: theme('colors.indigo.600'),
          },
          '&:disabled': {
            opacity: '0.75',
            cursor: 'not-allowed',
          },
        },
        '.btn-secondary': {
          padding: '0.5rem 1rem',
          backgroundColor: theme('colors.slate.800'),
          color: theme('colors.slate.200'),
          borderRadius: '0.5rem',
          fontWeight: '500',
          fontSize: '0.875rem',
          cursor: 'pointer',
          transition: 'all 150ms ease',
          '&:hover': {
            backgroundColor: theme('colors.slate.700'),
          },
        },
        '.card': {
          backgroundColor: theme('colors.slate.800'),
          borderColor: theme('colors.slate.600'),
          borderWidth: '1px',
          borderRadius: '0.5rem',
          padding: '1.25rem',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          transition: 'all 150ms ease',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
        },
        '.badge': {
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '500',
        },
        '.badge-social': {
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          color: theme('colors.amber.400'),
          borderColor: 'rgba(245, 158, 11, 0.4)',
          borderWidth: '1px',
        },
        '.badge-academic': {
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          color: theme('colors.indigo.400'),
          borderColor: 'rgba(99, 102, 241, 0.4)',
          borderWidth: '1px',
        },
        '.badge-event': {
          backgroundColor: 'rgba(52, 211, 153, 0.2)',
          color: theme('colors.emerald.400'),
          borderColor: 'rgba(52, 211, 153, 0.4)',
          borderWidth: '1px',
        },
        '.avatar': {
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '9999px',
          objectFit: 'cover',
          borderColor: theme('colors.slate.600'),
          borderWidth: '1px',
        },
        '.avatar-lg': {
          width: '5rem',
          height: '5rem',
          borderRadius: '9999px',
          objectFit: 'cover',
          borderColor: theme('colors.indigo.500'),
          borderWidth: '2px',
        },
      });
    },
  ],
};

