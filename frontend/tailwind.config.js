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
      },
    },
  },
  plugins: [],
};
