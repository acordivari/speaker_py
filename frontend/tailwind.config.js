/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        venue: {
          bg:      'rgb(var(--venue-bg-rgb) / <alpha-value>)',
          panel:   'rgb(var(--venue-panel-rgb) / <alpha-value>)',
          surface: 'rgb(var(--venue-surface-rgb) / <alpha-value>)',
          border:  'rgb(var(--venue-border-rgb) / <alpha-value>)',
          muted:   'rgb(var(--venue-muted-rgb) / <alpha-value>)',
        },
        brand: {
          cyan:   '#00e5ff',
          green:  '#00ff88',
          amber:  '#ffb300',
          red:    '#ff3d00',
          purple: '#b060ff',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow':        'glow 2s ease-in-out infinite alternate',
        'slide-in':    'slideIn 0.3s ease-out',
        'fade-in':     'fadeIn 0.2s ease-out',
      },
      keyframes: {
        glow: {
          '0%':   { boxShadow: '0 0 5px #00e5ff33' },
          '100%': { boxShadow: '0 0 20px #00e5ff88, 0 0 40px #00e5ff33' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(-10px)', opacity: 0 },
          '100%': { transform: 'translateX(0)',      opacity: 1 },
        },
        fadeIn: {
          '0%':   { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
