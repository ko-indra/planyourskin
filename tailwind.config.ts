import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      nav: "992px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    container: {
      center: true,
      padding: { DEFAULT: "1rem", md: "2rem" },
      screens: { DEFAULT: "1200px" },
    },
    extend: {
      maxWidth: {
        site: "1440px",
      },
      colors: {
        // Sampled from planyourskin.com inline styles
        brand: {
          DEFAULT: "#E491A9",     // primary pink
          dark: "#BB5352",        // dark rose
          ink: "#222529",         // body text
          soft: "#F7E1E8",        // soft pink bg
          softer: "#F6DEE6",      // softer pink
          accent: "#E491A9",
        },
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
        display: ["Poppins", "system-ui", "sans-serif"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
