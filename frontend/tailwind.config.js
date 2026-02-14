/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rpg: {
          purple: '#2d1b3c',
          gold: '#e4b363',
          dark: '#1a1124',
          card: '#2a1a36',
          accent: '#a36d3c'
        }
      },
      fontFamily: {
        rpg: ['MedievalSharp', 'cursive'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}