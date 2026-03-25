import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        blush:   { DEFAULT: "#F9C7C7", light: "#FDE8E8", dark: "#E89090" },
        lavender:{ DEFAULT: "#C7B8EA", light: "#EDE8F9", dark: "#9B87D1" },
        sage:    { DEFAULT: "#B8DDBF", light: "#E6F4E8", dark: "#7CB98A" },
        sky:     { DEFAULT: "#B8D8F0", light: "#E3F1FB", dark: "#72B0DC" },
        peach:   { DEFAULT: "#FDDCB5", light: "#FEF0DC", dark: "#F5B96E" },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 16px rgba(0,0,0,0.06)",
        card: "0 4px 24px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
