import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'Geist Mono'", "monospace"],
        sans: ["'Geist'", "sans-serif"],
      },
      colors: {
        superpowers: "#60a5fa",
        gsd: "#a78bfa",
        gstack: "#34d399",
      },
    },
  },
  plugins: [],
};

export default config;
