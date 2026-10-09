import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        crimson: {
          950: '#fff0f2',
          900: '#ffd9df',
          800: '#f7b5c0',
          700: '#e98293',
          600: '#cf5368',
          500: '#b53b52'
        },
        obsidian: {
          950: '#fff7f8',
          900: '#ffe9ed',
          850: '#ffdde3',
          800: '#ffd0d8'
        },
        amberGold: {
          400: '#a83a52',
          500: '#8f2c43',
          600: '#731f35'
        },
        mushroomWhite: '#4a202b',
        forestMoss: '#7c4652'
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Cinzel', 'Playfair Display', 'Sarabun', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'Prompt', 'sans-serif'],
      }
    },
  },
  plugins: [],
} satisfies Config;
