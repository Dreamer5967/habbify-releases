/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crisis: {
          safe: '#10b981',        // green
          alert: '#f59e0b',       // amber
          critical: '#ef4444',    // red
          unobservable: '#8b5cf6',// purple
          degraded: '#6b7280',    // gray
        }
      }
    },
  },
  plugins: [],
}
