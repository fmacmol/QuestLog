/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rpg: {
          purple: 'var(--color-purple)',
          gold: 'var(--color-gold)',
          dark: 'var(--bg-primary)',
          card: 'var(--bg-card)',
          accent: 'var(--color-accent)'
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