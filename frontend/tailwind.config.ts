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
        display: [
          "3.5rem",
          {
            lineHeight: "1.1",
            letterSpacing: "-0.02em",
            fontWeight: "700",
          },
        ],
        heading: [
          "1.875rem",
          {
            lineHeight: "1.2",
            letterSpacing: "-0.01em",
            fontWeight: "700",
          },
        ],
      },
      colors: {
        vigil: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
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
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "shimmer-slide": "shimmer-slide var(--speed) ease-in-out infinite alternate",
        "spin-around":   "spin-around calc(var(--speed) * 2) infinite linear",
        shine:           "shine var(--duration) infinite linear",
        "list-entry":    "list-entry 220ms ease forwards",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.6s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 3px 0 rgba(0, 0, 0, 0.06)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 4px 8px -1px rgba(0, 0, 0, 0.06)",
        elevated:
          "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 20px -2px rgba(0, 0, 0, 0.08)",
        panel: "0 8px 30px rgba(0, 0, 0, 0.08)",
        "glow-green": "0 0 20px rgba(16, 185, 129, 0.15)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
