/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        samsung: {
          blue: '#1428A0',
          light: '#3B5BDB',
          accent: '#FF7A1A',
        },
        medical: {
          teal: '#0D9488',
          sky: '#0284C7',
          surface: '#F8FAFC',
        },
      },
    },
  },
  plugins: [],
};
