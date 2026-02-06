/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darker: '#0f1320',
        dark: '#1a1f36',
        accent: '#0b84ff',
        accentGlow: '#0b84ff66',
        success: '#00c853',
        error: '#ff3d00',
        purple: '#8b5cf6',
        pink: '#ec4899',
        orange: '#f59e0b',
      },
    },
  },
  plugins: [],
}