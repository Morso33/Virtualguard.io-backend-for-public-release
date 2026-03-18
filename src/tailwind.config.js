/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}"],
  darkMode: 'class', // enable the dark mode variant
  theme: {
    extend: {
      colors: {
        primary: {
          "50": "#f0f9ff",
          "100": "#e0f2fe",
          "200": "#bae6fd",
          "300": "#7dd3fc",
          "400": "#38bdf8",
          "500": "#0ea5e9",
          "600": "#0284c7",
          "700": "#0369a1",
          "800": "#075985",
          "900": "#0c4a6e"
        },
        dark: {
          "100": "#1a202c",
          "200": "#2d3748",
          "300": "#4a5568",
          "400": "#718096",
          "500": "#a0aec0",
          "600": "#cbd5e0",
          "700": "#e2e8f0",
          "800": "#edf2f7",
          "900": "#f7fafc"
        }
      },
      fontFamily: {
        'body': [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji'
        ],
        'sans': [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji'
        ]
      },
    },
    backgroundColor: theme => ({
      ...theme('colors'),
      'body': '#FFFFFF',
      'body-dark': '#1a202c',
    }),
    textColor: theme => ({
      ...theme('colors'),
      'body': '#2D3748',
      'body-dark': '#EDF2F7',
    }),
  },
  plugins: [],
}