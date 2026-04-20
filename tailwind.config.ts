import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // All colors reference CSS variables — theme class on <html> overrides them
        neon: {
          green:  'rgb(var(--neon-green)  / <alpha-value>)',
          cyan:   'rgb(var(--neon-cyan)   / <alpha-value>)',
          pink:   'rgb(var(--neon-pink)   / <alpha-value>)',
          yellow: 'rgb(var(--neon-yellow) / <alpha-value>)',
          purple: 'rgb(var(--neon-purple) / <alpha-value>)',
          orange: 'rgb(var(--neon-orange) / <alpha-value>)',
          red:    'rgb(var(--neon-red)    / <alpha-value>)',
          blue:   'rgb(var(--neon-blue)   / <alpha-value>)',
          lime:   'rgb(var(--neon-lime)   / <alpha-value>)',
        },
        dark: {
          bg:     'rgb(var(--dark-bg)     / <alpha-value>)',
          card:   'rgb(var(--dark-card)   / <alpha-value>)',
          border: 'rgb(var(--dark-border) / <alpha-value>)',
          hover:  'rgb(var(--dark-hover)  / <alpha-value>)',
          muted:  'rgb(var(--dark-muted)  / <alpha-value>)',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        // Glow shadows also reference CSS vars
        'neon-green':  '0 0 10px rgb(var(--neon-green)), 0 0 30px rgb(var(--neon-green) / 0.3)',
        'neon-cyan':   '0 0 10px rgb(var(--neon-cyan)),  0 0 30px rgb(var(--neon-cyan)  / 0.3)',
        'neon-pink':   '0 0 10px rgb(var(--neon-pink)),  0 0 30px rgb(var(--neon-pink)  / 0.3)',
        'neon-yellow': '0 0 10px rgb(var(--neon-yellow)),0 0 30px rgb(var(--neon-yellow)/ 0.3)',
        'neon-purple': '0 0 10px rgb(var(--neon-purple)),0 0 30px rgb(var(--neon-purple)/ 0.3)',
        'neon-orange': '0 0 10px rgb(var(--neon-orange)),0 0 30px rgb(var(--neon-orange)/ 0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        glow: {
          from: { boxShadow: '0 0 5px rgb(var(--neon-green)), 0 0 10px rgb(var(--neon-green))' },
          to:   { boxShadow: '0 0 20px rgb(var(--neon-green)),0 0 40px rgb(var(--neon-green))' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgba(30,45,61,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(30,45,61,0.3) 1px, transparent 1px)',
        'neon-gradient': 'linear-gradient(135deg, rgb(var(--neon-green)) 0%, rgb(var(--neon-cyan)) 100%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
};

export default config;
