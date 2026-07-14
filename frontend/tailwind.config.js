/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bondi blue primary palette (#0095B6)
        primary: {
          50: '#e0f7fb',
          100: '#b3e9f4',
          200: '#80daed',
          300: '#4dcae5',
          400: '#26b8db',
          500: '#0095b6',
          600: '#007798',
          700: '#005a79',
          800: '#003c52',
          900: '#001f2b',
          950: '#000a11',
        },
      },
    },
  },
  plugins: [],
}
