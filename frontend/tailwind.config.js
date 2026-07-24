/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "message-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "bounce-dot": {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
        "collapse-in": {
          "0%": { opacity: "0", maxHeight: "0" },
          "100%": { opacity: "1", maxHeight: "300px" },
        },
      },
      animation: {
        "message-in": "message-in 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        "bounce-dot": "bounce-dot 1.2s infinite ease-in-out",
        "collapse-in": "collapse-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
