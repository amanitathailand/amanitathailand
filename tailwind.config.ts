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
          950: '#1a0305',
          900: '#3a080d',
          800: '#5c0c14',
          700: '#83101c',
          600: '#ab1525',
          500: '#c5192c'
        },
        obsidian: {
          950: '#030504',
          900: '#070b08',
          850: '#0b110d',
          800: '#101813'
        },
        amberGold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706'
        },
        mushroomWhite: '#f5f3eb',
        forestMoss: '#17281d'
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Cinzel', 'Playfair Display', 'Sarabun', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'Prompt', 'sans-serif'],
      }
    },
  },
  plugins: [],
} satisfies Config;
