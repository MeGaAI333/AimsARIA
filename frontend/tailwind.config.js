/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        fence: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          500: '#4a5568',
          700: '#2d3748',
          900: '#1a202c',
        },
      },
    },
  },
  plugins: [],
};
