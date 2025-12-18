// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // paleta base
        ink: "#0B0B0F",
        onyx: "#111117",
        snow: "#FAFAFF",
        violet: {
          50: "#F3EDFF",
          100: "#E7DBFF",
          200: "#CFB8FF",
          300: "#B895FF",
          400: "#A072FF",
          500: "#8A4DFF", // primária
          600: "#7A3BFF",
          700: "#6429E0",
          800: "#4E1EB3",
          900: "#3A1686"
        }
      },
      boxShadow: {
        glow: "0 0 0 2px rgba(138,77,255,0.15), 0 10px 30px rgba(138,77,255,0.25)",
        "inner-soft": "inset 0 1px 0 rgba(255,255,255,0.04)"
      },
      backdropBlur: {
        xs: "2px"
      },
      animation: {
        "float-slow": "float 6s ease-in-out infinite",
        "blob": "blob 14s infinite",
        "fade-in": "fade-in 300ms ease-out both",
        "slide-up": "slide-up 300ms ease-out both"
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" }
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(10px, -10px) scale(1.05)" },
          "66%": { transform: "translate(-10px, 10px) scale(0.97)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" }
        },
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "slide-up": { from: { opacity: 0, transform: "translateY(6px)" }, to: { opacity: 1, transform: "translateY(0)" } }
      }
    }
  },
  plugins: []
};
