/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // We might rely on this or just default to dark styles as per screenshot
  theme: {
    extend: {
      colors: {
        // Updated palette to match Dar Blockchain screenshot
        primary: '#4F46E5', // Indigo-600ish from the "AI Insights" button
        secondary: '#791cf5',
        accent: '#a522dd',

        // Dark theme specific
        'dar-bg': '#06060C',
        'dar-panel': '#12121A',
        'dar-sidebar': '#0B0B15',
        'dar-active': '#1E1B3A',
        'dar-border': '#1F1F2C', // Guesstimated border color
        'dar-text': '#FFFFFF',
        'dar-text-muted': '#9CA3AF',

        // Legacy colors kept for compatibility if needed, but we should migrate
        dark: '#0B0B15',
        'dark-panel': '#12121A',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      }
    },
  },
  plugins: [],
}
