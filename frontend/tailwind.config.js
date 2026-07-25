/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0f1117',
          raised: '#171a23',
          border: '#252a37',
        },
        brand: {
          DEFAULT: '#4f8cff',
          hover: '#6ea0ff',
        },
      },
    },
  },
  plugins: [],
};
