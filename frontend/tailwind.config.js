// Tailwind v4 no longer uses a JS config for theme.
// All theme customisation is done in CSS via @theme in index.css.
// This file is kept minimal for any Tailwind v4 content scanning config.

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
};
