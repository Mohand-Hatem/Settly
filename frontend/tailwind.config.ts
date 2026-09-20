import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0B111F",
          900: "#131D36",
          800: "#1E2A4A",
          700: "#2B3A61",
          600: "#3D4E7A",
        },
        brass: {
          DEFAULT: "#C69749",
          600: "#AE8033",
          200: "#E7D3AB",
          50: "#F6EEDE",
          "050": "#F6EEDE",
        },
        canvas: {
          DEFAULT: "#F7F6F3",
          2: "#EFEDE6",
        },
        ink: {
          DEFAULT: "#16203A",
          2: "#4C5878",
          3: "#646D88",
        },
        sage: {
          DEFAULT: "#3D5A4C",
          bg: "#EAF0EC",
        },
        line: {
          DEFAULT: "rgba(30, 42, 74, 0.10)",
          2: "rgba(30, 42, 74, 0.18)",
        },
        error: {
          DEFAULT: "#991B1B",
          light: "#FDF2F2",
        },
        warning: {
          DEFAULT: "#B45309",
          light: "#FEF3C7",
        },
      },
      fontFamily: {
        display: ["var(--font-spectral)", "var(--font-noto-naskh-arabic)", "Georgia", "serif"],
        serif: ["var(--font-spectral)", "var(--font-noto-naskh-arabic)", "Georgia", "serif"],
        sans: ["var(--font-plus-jakarta)", "var(--font-ibm-plex-arabic)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "var(--font-ibm-plex-arabic)", "ui-monospace", "monospace"],
      },
      aspectRatio: {
        card: "4 / 4.65",
      },
      boxShadow: {
        settly: "rgba(22, 32, 43, 0.04) 0 1px 2px, rgba(22, 32, 43, 0.06) 0 6px 18px -8px",
        brass: "rgba(198, 151, 73, 0.18) 0 4px 12px -4px",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 35s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
