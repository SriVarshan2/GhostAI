/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0f0f0f',
        surface: '#1a1a1a',
        border: '#2a2a2a',
        'waste-green': '#639922',
        'waste-amber': '#EF9F27',
        'waste-coral': '#D85A30',
        'waste-red': '#E24B4A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
}
