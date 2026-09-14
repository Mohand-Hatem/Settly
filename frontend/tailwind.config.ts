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
      },
      fontFamily: {
        display: ["var(--font-spectral)", "Spectral", "Georgia", "serif"],
        sans: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      aspectRatio: {
        card: "4 / 4.65",
      },
      boxShadow: {
        settly: "rgba(22, 32, 43, 0.04) 0 1px 2px, rgba(22, 32, 43, 0.06) 0 6px 18px -8px",
        brass: "rgba(198, 151, 73, 0.18) 0 4px 12px -4px",
      },
    },
  },
  plugins: [],
};

export default config;
