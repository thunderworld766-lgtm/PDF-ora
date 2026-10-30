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
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#c7d9fe',
          300: '#a3c0fd',
          400: '#799dfa',
          500: '#4f75f5',
          600: '#3352eb',
          700: '#263dd4',
          800: '#2334ac',
          900: '#213088',
          950: '#141c52',
        },
        coral: {
          500: '#ff4d4f',
          600: '#eb383a',
        },
        emerald: {
          500: '#10b981',
          600: '#059669',
        },
        amber: {
          500: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 40px -10px rgba(79, 117, 245, 0.3)',
        'glow-lg': '0 0 60px -15px rgba(79, 117, 245, 0.4)',
        'premium': '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
        'premium-dark': '0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
