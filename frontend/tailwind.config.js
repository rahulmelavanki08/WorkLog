/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        worklog: {
          teal: '#0F6E56',        // Primary brand deep teal/emerald
          tealDark: '#0A4B3A',
          tealLight: '#E8F5F1',
          coral: '#D85A30',       // Warnings / Disputes / High Risk
          coralLight: '#FDF0EC',
          indigo: '#7F77DD',      // Worker accents
          indigoLight: '#F2F1FC',
          green: '#639922',       // Confirmed / Resolved status
          greenLight: '#F2F8EB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px -1px rgba(0, 0, 0, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 20px -2px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
