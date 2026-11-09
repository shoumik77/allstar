/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F2EDE2',
        ink: '#191919',
        forest: '#254D3B',
        burgundy: '#8C3B3B',
        gold: '#C7A46A',
        parchment: '#DDD8CD',
        muted: '#706F65',
        'forest-rule': '#3D5147',
        mint: '#A8C7B0',
        rose: '#D8A4A0',
        'with-tint': '#DFE5D9',
        'against-tint': '#EADCD5',
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        condensed: ['"Barlow Condensed"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
