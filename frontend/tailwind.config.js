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
          dark: "#0b0a14",
          deep: "#11101f",
          violet: "#2b2a55",
          purple: "#3a2742",
          gold: "#f0b95b",
          starlight: "#fafaf9"
        }
      },
      fontFamily: {
        serif: ["'Fraunces'", "serif"],
        mono: ["'Spline Sans Mono'", "monospace"],
        news: ["'Newsreader'", "serif"]
      },
      animation: {
        twinkle: "twinkle 4s ease-in-out infinite",
        drift: "drift 140s linear infinite"
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: 0.15 },
          "50%": { opacity: 0.85 }
        },
        drift: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        }
      }
    },
  },
  plugins: [],
}
