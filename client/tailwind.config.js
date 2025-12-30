/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Preserve existing color palette
        'game-green': '#4CAF50',
        'game-gold': '#FFD700',
        'game-red': '#ff6b6b',
        'game-blue': '#2196F3',
        'game-gray-light': '#f5f5f5',
        'game-gray': '#666',
        'game-gray-dark': '#333',
      },
      spacing: {
        // Custom spacing for touch targets (minimum 44px)
        'touch': '44px',
        'touch-lg': '48px',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true, // Prevents hover states on touch devices
  },
}
