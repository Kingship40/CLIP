/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // CSS var semantic tokens (theme-aware)
        page: 'var(--bg-page)',
        sidebar: 'var(--bg-sidebar)',
        surface: 'var(--bg-surface)',
        'surface-2': 'var(--bg-surface-2)',
        elevated: 'var(--bg-elevated)',
        'theme-border': 'var(--border)',
        'border-subtle': 'var(--border-subtle)',
        'control-selected': 'var(--bg-selected)',
        dark: {
          950: '#070a13',
          900: '#0b1120',
          850: '#0f172a',
          800: '#141e33',
          750: '#1a2642',
          700: '#233252',
          600: '#334466',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        cyanAccent: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        violetAccent: {
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
        }
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'monospace'
        ]
      },
      boxShadow: {
        'glow-brand': '0 0 25px -5px rgba(99, 102, 241, 0.4)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.4)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      }
    },
  },
  plugins: [],
}
