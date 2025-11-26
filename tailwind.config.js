/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#fefbf6',
        surface: '#f8f4ef',
        'surface-variant': '#e7e0d8',
        primary: '#6b5d4f',
        'primary-container': '#f4ede3',
        secondary: '#8b7355',
        'secondary-container': '#f5ead8',
        accent: '#9c7c4f',
        'on-background': '#1c1b1a',
        'on-surface': '#1c1b1a',
        'on-primary': '#ffffff',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
        hebrew: ['Segoe UI', 'Tahoma', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
