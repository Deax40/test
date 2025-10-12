/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0B1220",
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#0B1220"
        },
        accent: {
          DEFAULT: "#10B981"
        }
      },
      boxShadow: {
        soft: "0 8px 24px rgba(11,18,32,0.08)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
