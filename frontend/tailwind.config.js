/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#38a5f8',
          500: '#0e87eb',
          600: '#026bc9',
          700: '#0355a3',
          800: '#074886',
          900: '#0c3d6f',
          950: '#08274a',
        },
        slate: {
          850: '#152033',
          900: '#0f172a',
          950: '#020617',
        },
        stage: {
          new: { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' },
          contacted: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
          sitevisit: { bg: '#fefce8', text: '#a16207', border: '#fef08a' },
          interested: { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' },
          negotiation: { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' },
          booked: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
          lost: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.02)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'elevated': '0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
        'dropdown': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
        'modal': '0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
}
