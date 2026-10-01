/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      colors: {
        paper: '#FAF9F7',
        ink: '#131210',
        teal: {
          600: '#0E6B61',
          700: '#0A544C'
        }
      },
      boxShadow: {
        card: '0 1px 2px rgba(19,18,16,0.06), 0 8px 24px -12px rgba(19,18,16,0.18)',
        pop: '0 12px 40px -12px rgba(19,18,16,0.28)'
      },
      borderRadius: {
        xl2: '14px'
      }
    }
  },
  plugins: []
}
