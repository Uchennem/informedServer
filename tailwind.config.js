/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Night Campus Signal palette - dark foundation
        'nc-bg-root': 'var(--nc-bg-root, #050712)',
        'nc-bg-elevated': 'var(--nc-bg-elevated, #101426)',
        'nc-bg-card': 'var(--nc-bg-card, #15182A)',
        'nc-border-subtle': 'var(--nc-border-subtle, #262B3F)',
        // Accent colors
        'nc-accent-primary': 'var(--nc-accent-primary, #7C5CFF)',
        'nc-accent-secondary': 'var(--nc-accent-secondary, #F4B45A)',
        'nc-success': 'var(--nc-success, #33D9A0)',
        'nc-destructive': 'var(--nc-destructive, #FF4B70)',
        // Text colors
        'nc-text-primary': 'var(--nc-text-primary, #F9FAFF)',
        'nc-text-muted': 'var(--nc-text-muted, #9CA3C9)',
        'nc-text-subtle': 'var(--nc-text-subtle, #6B7288)',
      },
      fontFamily: {
        'display': ['Clash Grotesk', 'system-ui', 'sans-serif'],
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
        'signal-beams': 'radial-gradient(circle at 20% 50%, rgba(124, 92, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(244, 180, 90, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 20%, rgba(51, 217, 160, 0.08) 0%, transparent 50%)',
      },
    },
  },
  plugins: [
    function ({ addComponents, theme }) {
      addComponents({
        '.btn-primary': {
          '@apply px-6 py-3 rounded-full font-display font-semibold uppercase tracking-tight transition-all duration-200':
            {},
          backgroundColor: 'var(--nc-accent-primary)',
          color: '#fff',
          boxShadow: '0 4px 20px rgba(124, 92, 255, 0.3)',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(124, 92, 255, 0.5)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            animation: 'kineticPress 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
            backgroundColor: 'rgba(124, 92, 255, 0.05)',
            borderColor: 'var(--nc-accent-primary)',
            color: 'var(--nc-accent-primary)',
          },
        },
        '.card': {
          '@apply rounded-2xl border transition-all duration-300 backdrop-blur-sm':
            {},
          backgroundColor: 'var(--nc-bg-card)',
          borderColor: 'var(--nc-border-subtle)',
          boxShadow: '0 8px 24px rgba(124, 92, 255, 0.08), inset 0 1px 1px rgba(124, 92, 255, 0.1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            borderColor: 'rgba(124, 92, 255, 0.3)',
            boxShadow: '0 16px 40px rgba(124, 92, 255, 0.15), inset 0 1px 1px rgba(124, 92, 255, 0.1)',
          },
        },
        '.chip': {
          '@apply px-4 py-2 rounded-full font-display text-sm font-medium transition-all duration-200 cursor-pointer':
            {},
          borderWidth: '1px',
          borderColor: 'var(--nc-accent-primary)',
          color: 'var(--nc-accent-primary)',
          backgroundColor: 'transparent',
          '&.active': {
            backgroundColor: 'var(--nc-accent-primary)',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(124, 92, 255, 0.4)',
          },
        },
        '.glass-effect': {
          backgroundColor: 'rgba(21, 24, 42, 0.7)',
          backdropFilter: 'blur(10px)',
          borderWidth: '1px',
          borderColor: 'rgba(124, 92, 255, 0.1)',
        },
      });
    },
  ],
};

