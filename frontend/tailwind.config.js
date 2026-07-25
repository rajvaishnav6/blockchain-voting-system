/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cyberpunk-inspired dark theme palette
        cyber: {
          bg:      "#080c18",  // deepest background
          card:    "#0d1224",  // card surface
          border:  "#1a2540",  // subtle borders
          cyan:    "#00d4ff",  // primary accent
          teal:    "#00a8cc",  // secondary accent
          purple:  "#7c3aed",  // highlight
          green:   "#00ff88",  // success / positive
          red:     "#ff4466",  // error / danger
          yellow:  "#ffc107",  // warning
          text:    "#e0e8ff",  // primary text
          muted:   "#6b7a9e",  // muted/secondary text
        },
      },
      fontFamily: {
        heading: ["'Sora'", "sans-serif"],    // display font
        body:    ["'DM Sans'", "sans-serif"], // body text
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        "pulse-slow":  "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow":        "glow 2s ease-in-out infinite",
        "slide-up":    "slideUp 0.4s ease-out",
        "fade-in":     "fadeIn 0.5s ease-out",
        "scan":        "scan 2s linear infinite",
      },
      keyframes: {
        glow: {
          "0%, 100%": { boxShadow: "0 0 5px #00d4ff33" },
          "50%":      { boxShadow: "0 0 20px #00d4ff66, 0 0 40px #00d4ff22" },
        },
        slideUp: {
          "0%":   { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scan: {
          "0%":   { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "0% 100%" },
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
        "cyber-gradient":
          "linear-gradient(135deg, #00d4ff11 0%, transparent 50%, #7c3aed11 100%)",
      },
      backgroundSize: {
        "grid-40": "40px 40px",
      },
      boxShadow: {
        "cyber":       "0 0 0 1px rgba(0,212,255,0.2), 0 4px 24px rgba(0,0,0,0.4)",
        "cyber-hover": "0 0 0 1px rgba(0,212,255,0.5), 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(0,212,255,0.1)",
        "glow-cyan":   "0 0 20px rgba(0,212,255,0.3)",
        "glow-green":  "0 0 20px rgba(0,255,136,0.3)",
        "glow-red":    "0 0 20px rgba(255,68,102,0.3)",
      },
    },
  },
  plugins: [],
};