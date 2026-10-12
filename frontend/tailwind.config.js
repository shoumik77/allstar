/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#f2ead8',
          raised: '#faf5e6',
          sunken: '#e6dcc4',
        },
        ink: {
          DEFAULT: '#2b2320',
          soft: '#6b5f56',
          faint: '#a2958a',
        },
        varsity: {
          DEFAULT: '#c0392b',
          hover: '#a93226',
        },
        field: {
          DEFAULT: '#2e7d46',
          hover: '#26663a',
        },
        gold: {
          DEFAULT: '#b8860b',
          bright: '#f2b632',
          hover: '#ffc94a',
        },
        turf: {
          DEFAULT: '#0f3d23',
          deep: '#082416',
          light: '#1b5a33',
        },
        chalk: {
          DEFAULT: '#f4f1e6',
          soft: 'rgba(244, 241, 230, 0.7)',
        },
        sky: {
          DEFAULT: '#5ec8ff',
        },
        // Back-compat aliases so any stray utilities still resolve to the theme.
        surface: {
          DEFAULT: '#f2ead8',
          raised: '#faf5e6',
          border: '#2b2320',
        },
        brand: {
          DEFAULT: '#c0392b',
          hover: '#a93226',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'ui-monospace', 'monospace'],
        body: ['"Pixelify Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        hard: '4px 4px 0 0 #2b2320',
        'hard-sm': '2px 2px 0 0 #2b2320',
        'hard-lg': '6px 6px 0 0 #2b2320',
        'hard-gold': '4px 4px 0 0 #f2b632',
        'hard-gold-lg': '6px 6px 0 0 #f2b632',
        'hard-gold-xl': '8px 8px 0 0 #f2b632',
        'glow-gold': '0 0 32px rgba(242, 182, 50, 0.45)',
      },
      keyframes: {
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.8)' },
        },
      },
      animation: {
        blink: 'blink 1s steps(1) infinite',
        ticker: 'ticker 28s linear infinite',
        'pulse-dot': 'pulseDot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
