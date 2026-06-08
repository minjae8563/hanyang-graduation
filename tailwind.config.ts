import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 차분하고 편안한 팔레트 (HCI: 기록이 부담스럽지 않게)
        cream: "#FBF7F0",
        sand: "#F2E9DC",
        clay: "#E0CDB6",
        sage: {
          50: "#F0F4EF",
          100: "#DCE7DA",
          300: "#A8C3A0",
          500: "#7CA471",
          600: "#5F8A55",
          700: "#4A6E43",
        },
        dusk: "#3A3A4A",
        mist: "#6B6B7B",
      },
      fontFamily: {
        sans: [
          "var(--font-pretendard)",
          "Pretendard",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 4px 24px -8px rgba(58, 58, 74, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
