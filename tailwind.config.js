/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F5F8F6',
          100: '#E4ECE7',
          200: '#C2D7CB',
          300: '#92B9A5',
          400: '#5F957E',
          500: '#3B7C61', // Sage
          600: '#2A634D',
          700: '#204E3D',
          800: '#153E32', // Forest Green
          900: '#0E2A22',
          950: '#071813',
        },
        sage: {
          50: '#F6F9F7',
          100: '#EBF2EE',
          200: '#D4E3DB',
          300: '#B2CDC0',
          400: '#6FA48C',
          500: '#3B7C61',
          600: '#316952',
          700: '#285442',
          800: '#214436',
          900: '#1A372C',
        },
        ivory: {
          50: '#FAF9F4',
          100: '#F5F3EA', // Warm Ivory
          200: '#EAE5D3',
          300: '#DDD5B9',
          400: '#CBBF9A',
          500: '#B8A87C',
        }
      }
    },
  },
  plugins: [],
};
