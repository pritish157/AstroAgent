/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          dark: "#080711",
          deep: "#0f0e1d",
          card: "#15142a",
          border: "rgba(240, 185, 91, 0.12)",
          gold: "#f0b95b",
          goldGlow: "#ffd175",
          mystic: "#9d4edd",
          starlight: "#fafaf9"
        }
      },
      fontFamily: {
        cinzel: ["'Cinzel Decorative'", "serif"],
        serif: ["'Fraunces'", "serif"],
        sans: ["'Outfit'", "'Plus Jakarta Sans'", "sans-serif"],
        news: ["'Newsreader'", "serif"],
        mono: ["'Spline Sans Mono'", "monospace"]
      },
      animation: {
        twinkle: "twinkle 4s ease-in-out infinite",
        drift: "drift 140s linear infinite",
        glow: "glowPulse 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        spinSlow: "spin 40s linear infinite"
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: 0.15, transform: "scale(0.9)" },
          "50%": { opacity: 0.95, transform: "scale(1.1)" }
        },
        drift: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        },
        glowPulse: {
          "0%, 100%": { opacity: 0.4, filter: "drop-shadow(0 0 15px rgba(240, 185, 91, 0.3))" },
          "50%": { opacity: 0.9, filter: "drop-shadow(0 0 25px rgba(240, 185, 91, 0.6))" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" }
        }
      },
      boxShadow: {
        cosmic: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        goldGlow: "0 0 25px -5px rgba(240, 185, 91, 0.25)"
      }
    },
  },
  plugins: [],
}
