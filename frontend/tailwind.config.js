/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary:      "#1e3a8a",
          hover:        "#162f6f",
          accent:       "#60a5fa",
          panel:        "#0c1631",
          "panel-card": "#14274f",
          "panel-border": "#1f386f",
        },
        neutral: {
          bg:     "#ffffff",
          border: "#e2e8f0",
          muted:  "#64748b",
          text:   "#1e293b",
          subtle: "#64748b",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        input: "0.5rem",
        card:  "0.75rem",
        btn:   "0.5rem",
      },
      boxShadow: {
        input: "0 0 0 3px rgba(13,110,90,0.18)",
      },
      screens: {
        xs: "480px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
    },
  },
  plugins: [],
};