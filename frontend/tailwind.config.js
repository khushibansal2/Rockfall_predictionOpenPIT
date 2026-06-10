/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mine: {
          50: '#fdf8ee',
          100: '#f9efd3',
          200: '#f3dba6',
          300: '#ebc06f',
          400: '#e29f3e',
          500: '#d98520',
          600: '#c06818',
          700: '#9e4f17',
          800: '#823f19',
          900: '#6c3518',
          950: '#3d1a0a',
        },
        rock: {
          50: '#f6f6f5',
          100: '#e7e6e4',
          200: '#d1cecc',
          300: '#b0aca8',
          400: '#8a857f',
          500: '#6f6964',
          600: '#5e5651',
          700: '#4e4845',
          800: '#433e3c',
          900: '#3b3735',
          950: '#201e1d',
        },
      },
    },
  },
  plugins: [],
}
