import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Display serif — page titles, wordmark accents
        display: ["var(--font-display)", "Georgia", "serif"],
        // Refined grotesque — all UI text
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        // Monospace — IDs, codes, amounts, section labels
        mono: ["var(--font-mono)", "ui-monospace", "Menlo", "monospace"],
      },
      fontSize: {
        // 6-step type scale
        "2xs": ["0.6875rem", { lineHeight: "1.4" }], // 11px — section labels
        xs:   ["0.75rem",   { lineHeight: "1.5" }], // 12px — captions
        sm:   ["0.8125rem", { lineHeight: "1.5" }], // 13px — UI labels
        base: ["0.9375rem", { lineHeight: "1.6" }], // 15px — body
        lg:   ["1.0625rem", { lineHeight: "1.5" }], // 17px — card titles
        xl:   ["1.25rem",   { lineHeight: "1.4" }], // 20px — section heads
        "2xl":["1.75rem",   { lineHeight: "1.2" }], // 28px — page titles (display serif)
      },
      colors: {
        vigil: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        // Strict 3-value system — never mix
        lg: "var(--radius)",                       // 8px — cards
        md: "calc(var(--radius) - 2px)",           // 6px — buttons
        sm: "calc(var(--radius) - 4px)",           // 4px — badges & tags
      },
      keyframes: {
        "shimmer-slide": {
          to: { transform: "translate(calc(100cqw - 100%), 0)" },
        },
        "spin-around": {
          "0%":       { transform: "translateZ(0) rotate(0)" },
          "15%, 35%": { transform: "translateZ(0) rotate(90deg)" },
          "65%, 85%": { transform: "translateZ(0) rotate(270deg)" },
          "100%":     { transform: "translateZ(0) rotate(360deg)" },
        },
        shine: {
          "0%":  { "background-position": "0% 0%" },
          "50%": { "background-position": "100% 100%" },
          to:    { "background-position": "0% 0%" },
        },
        "list-entry": {
          "0%":   { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "shimmer-slide": "shimmer-slide var(--speed) ease-in-out infinite alternate",
        "spin-around":   "spin-around calc(var(--speed) * 2) infinite linear",
        shine:           "shine var(--duration) infinite linear",
        "list-entry":    "list-entry 220ms ease forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
