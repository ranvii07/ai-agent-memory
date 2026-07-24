/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      keyframes: {
        "message-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "bounce-dot": {
          "0%, 80%, 100%": { transform: "scale(0.5)", opacity: "0.35" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
        "collapse-in": {
          "0%": { opacity: "0", maxHeight: "0" },
          "100%": { opacity: "1", maxHeight: "320px" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.15" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.06)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        scan: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(320%)" },
        },
      },
      animation: {
        "message-in": "message-in 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        "bounce-dot": "bounce-dot 1.2s infinite ease-in-out",
        "collapse-in": "collapse-in 0.3s ease-out",
        blink: "blink 1.1s step-end infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "gradient-x": "gradient-x 6s ease infinite",
        scan: "scan 1.5s linear infinite",
      },
    },
  },
  plugins: [],
};
