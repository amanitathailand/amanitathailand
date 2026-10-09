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
          200: '#8f172d',
          300: '#d90429',
          400: '#ef233c',
          950: '#edf2f4',
          900: '#dfe5e9',
          800: '#f7a1ab',
          700: '#ef233c',
          600: '#d90429',
          500: '#b80324'
        },
        obsidian: {
          950: '#edf2f4',
          900: '#ffffff',
          850: '#f4f6f7',
          800: '#dfe5e9'
        },
        amberGold: {
          200: '#2b2d42',
          300: '#596078',
          400: '#ef233c',
          500: '#d90429',
          600: '#b80324'
        },
        mushroomWhite: '#2b2d42',
        forestMoss: '#8d99ae'
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Cinzel', 'Playfair Display', 'Sarabun', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'Prompt', 'sans-serif'],
      }
    },
  },
  plugins: [],
} satisfies Config;
