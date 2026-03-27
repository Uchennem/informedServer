/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Informed palette - neutral dark
        'nc-bg-root': 'var(--nc-bg-root, #111113)',
        'nc-bg-elevated': 'var(--nc-bg-elevated, #1A1A1D)',
        'nc-bg-card': 'var(--nc-bg-card, #232326)',
        'nc-border-subtle': 'var(--nc-border-subtle, #2E2E32)',
        // Accent colors
        'nc-accent-primary': 'var(--nc-accent-primary, #6C63FF)',
        'nc-accent-secondary': 'var(--nc-accent-secondary, #9890FF)',
        'nc-success': 'var(--nc-success, #34D399)',
        'nc-destructive': 'var(--nc-destructive, #EF4444)',
        // Text colors
        'nc-text-primary': 'var(--nc-text-primary, #EDEDEC)',
        'nc-text-muted': 'var(--nc-text-muted, #A0A0A0)',
        'nc-text-subtle': 'var(--nc-text-subtle, #666666)',
      },
      fontFamily: {
        'display': ['Clash Grotesk', 'Work Sans', 'system-ui', 'sans-serif'],
        'sans': ['IBM Plex Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'h1': ['2.5rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '0.05em' }],
        'h2': ['2rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '0.02em' }],
        'h3': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['1rem', { lineHeight: '1.5' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'signal-pulse': 'signalPulse 3s ease-in-out infinite',
        'kinetic-press': 'kineticPress 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'gradient-shift': 'gradientShift 40s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        signalPulse: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
        kineticPress: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      backgroundImage: {
        'signal-beams': 'none',
      },
    },
  },
  plugins: [
    function ({ addComponents, theme }) {
      addComponents({
        '.btn-primary': {
          '@apply px-6 py-3 rounded-full font-display font-semibold uppercase tracking-tight transition-all duration-200':
            {},
          backgroundImage: 'linear-gradient(135deg, #6C63FF 0%, #5B52EE 100%)',
          color: '#fff',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            transform: 'translateY(-2px)',
            filter: 'brightness(1.08)',
          },
          '&:active': {
            transform: 'scale(0.97)',
          },
          '&:disabled': {
            opacity: '0.6',
            cursor: 'not-allowed',
            boxShadow: 'none',
          },
        },
        '.btn-secondary': {
          '@apply px-6 py-3 rounded-full font-display font-semibold uppercase tracking-tight border transition-all duration-200':
            {},
          borderColor: 'var(--nc-border-subtle)',
          color: 'var(--nc-text-primary)',
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderColor: 'var(--nc-accent-primary)',
            color: 'var(--nc-accent-primary)',
            transform: 'translateY(-1px)',
          },
        },
        '.card': {
          '@apply rounded-2xl border transition-all duration-300 backdrop-blur-sm':
            {},
          backgroundImage: 'none',
          backgroundColor: 'var(--nc-bg-card)',
          borderColor: 'var(--nc-border-subtle)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
          '&:hover': {
            transform: 'translateY(-2px)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          },
        },
        '.chip': {
          '@apply px-4 py-2 rounded-full font-display text-sm font-medium transition-all duration-200 cursor-pointer':
            {},
          borderWidth: '1px',
          borderColor: 'var(--nc-border-subtle)',
          color: 'var(--nc-text-muted)',
          backgroundColor: 'transparent',
          '&:hover': {
            color: 'var(--nc-accent-primary)',
            borderColor: 'var(--nc-accent-primary)',
            backgroundColor: 'rgba(108, 99, 255, 0.08)',
          },
          '&.active': {
            backgroundColor: 'var(--nc-accent-primary)',
            color: '#fff',
            borderColor: 'transparent',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            transform: 'scale(1.02)',
          },
        },
        '.glass-effect': {
          backgroundColor: 'rgba(35, 35, 38, 0.8)',
          backdropFilter: 'blur(10px)',
          borderWidth: '1px',
          borderColor: 'var(--nc-border-subtle)',
        },
      });
    },
  ],
};

