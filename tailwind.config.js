// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'aerotraining': {
          'dark': '#0c2340',
          'green': '#20c997',
          'gray': '#f0f4f8',
          'text': '#64748b'
        }
      }
    },
  },
  plugins: [],
}