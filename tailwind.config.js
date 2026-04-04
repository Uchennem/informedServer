/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'nc-bg-root': 'var(--nc-bg-root, #0a0a0a)',
        'nc-bg-elevated': 'var(--nc-bg-elevated, #141414)',
        'nc-bg-card': 'var(--nc-bg-card, #1f1f1f)',
        'nc-border-subtle': 'var(--nc-border-subtle, #333333)',
        'nc-accent-primary': 'var(--nc-accent-primary, #CCFF00)',
        'nc-accent-secondary': 'var(--nc-accent-secondary, #FF3E00)',
        'nc-success': 'var(--nc-success, #CCFF00)',
        'nc-destructive': 'var(--nc-destructive, #FF3E00)',
        'nc-text-primary': 'var(--nc-text-primary, #F4F4F0)',
        'nc-text-muted': 'var(--nc-text-muted, #A3A3A3)',
        'nc-text-subtle': 'var(--nc-text-subtle, #666666)',
      },
      fontFamily: {
        'display': ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        'sans': ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        'h1': ['3rem', { lineHeight: '1', fontWeight: '800', letterSpacing: '-0.02em' }],
        'h2': ['2.25rem', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.01em' }],
        'h3': ['1.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'body': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px var(--nc-border-subtle)',
        'brutal-hover': '6px 6px 0px 0px var(--nc-accent-primary)',
        'brutal-active': '2px 2px 0px 0px var(--nc-accent-primary)',
        'brutal-secondary': '4px 4px 0px 0px var(--nc-text-primary)',
      }
    },
  },
  plugins: [
    function ({ addComponents, theme }) {
      addComponents({
        '.btn-primary': {
          '@apply px-6 py-3 font-display font-black uppercase tracking-tight transition-all duration-150': {},
          backgroundColor: 'var(--nc-accent-primary)',
          color: '#000',
          border: '2px solid #000',
          boxShadow: theme('boxShadow.brutal'),
          transform: 'translateY(0)',
          '&:hover': {
            boxShadow: '6px 6px 0px 0px #FF3E00',
            transform: 'translate(-2px, -2px)',
          },
          '&:active': {
            boxShadow: theme('boxShadow.brutal-active'),
            transform: 'translate(2px, 2px)',
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
            boxShadow: 'none',
            transform: 'none',
          },
        },
        '.btn-secondary': {
          '@apply px-6 py-3 font-display font-black uppercase tracking-tight transition-all duration-150': {},
          backgroundColor: 'var(--nc-bg-elevated)',
          color: 'var(--nc-text-primary)',
          border: '2px solid var(--nc-text-primary)',
          boxShadow: theme('boxShadow.brutal-secondary'),
          transform: 'translateY(0)',
          '&:hover': {
            backgroundColor: 'var(--nc-text-primary)',
            color: '#000',
            transform: 'translate(-2px, -2px)',
            boxShadow: '6px 6px 0px 0px var(--nc-accent-primary)',
          },
          '&:active': {
            transform: 'translate(2px, 2px)',
            boxShadow: theme('boxShadow.brutal-active'),
          },
        },
        '.card': {
          '@apply transition-all duration-200': {},
          backgroundColor: 'var(--nc-bg-card)',
          border: '2px solid var(--nc-border-subtle)',
          boxShadow: theme('boxShadow.brutal'),
          '&:hover': {
            transform: 'translate(-2px, -2px)',
            borderColor: 'var(--nc-text-primary)',
            boxShadow: '6px 6px 0px 0px var(--nc-accent-primary)',
          },
        },
        '.chip': {
          '@apply px-4 py-1 font-sans text-xs font-bold uppercase transition-all duration-150 cursor-pointer': {},
          border: '2px solid var(--nc-border-subtle)',
          color: 'var(--nc-text-primary)',
          backgroundColor: 'var(--nc-bg-root)',
          '&:hover': {
            borderColor: 'var(--nc-accent-primary)',
            boxShadow: '3px 3px 0px 0px var(--nc-accent-primary)',
            transform: 'translate(-1px, -1px)',
          },
          '&.active': {
            backgroundColor: 'var(--nc-accent-primary)',
            color: '#000',
            borderColor: 'var(--nc-accent-primary)',
            boxShadow: '3px 3px 0px 0px #FF3E00',
          },
        },
        '.glass-effect': {
          backgroundColor: 'var(--nc-bg-elevated)',
          border: '2px solid var(--nc-border-subtle)',
          boxShadow: theme('boxShadow.brutal'),
        },
      });
    },
  ],
};
