/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        coffee: {
          50: '#fdf8f0',
          100: '#f9edd9',
          200: '#f1d5a8',
          300: '#e5b76e',
          400: '#d4903a',
          500: '#c47a20',
          600: '#a86118',
          700: '#8a4a16',
          800: '#6d3a14',
          900: '#4a2710',
        }
      },
    },
  },
  plugins: [],
}
