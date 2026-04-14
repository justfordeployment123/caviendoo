import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        // ── Light canvas (page background — warm cream) ─────────────────
        canvas: "#F7FBF0",
        surface: "#EBF5D6",
        "surface-raised": "#D4EAAA",
        border: "#C8E08A",

        // ── Parchment (sidebar) — same warm palette ──────────────────────
        parchment: "#F7FBF0",
        "parchment-dark": "#EBF5D6",
        "border-parchment": "#C8E08A",

        // ── Text ─────────────────────────────────────────────────────────
        ink: "#1A2A0A",
        "ink-muted": "#4A6820",

        // ── Primary text on all surfaces ─────────────────────────────────
        cream: "#1A2A0A",
        muted: "#4A6820",

        // ── Brand accent ─────────────────────────────────────────────────
        gold: "#396809",
        "gold-light": "#67C70C",

        // ── Map sea & land ───────────────────────────────────────────────
        "map-bg": "#D4E8F0",
        "map-sea": "#D4E8F0",
        "map-land": "#E8EDE4",

        // ── Map overlay: Récoltes ─────────────────────────────────────────
        "map-empty": "#C8D8A0",
        "map-low": "#8EC06A",
        "map-mid": "#5DA040",
        "map-high": "#3A8020",
        "map-peak": "#1A6010",

        // ── Aquifer stress states ─────────────────────────────────────────
        "stress-safe": "#1a6a3a",
        "stress-low": "#4a8a28",
        "stress-moderate": "#a09010",
        "stress-high": "#d07818",
        "stress-critical": "#d04020",
        "stress-extreme": "#a01010",

        // ── Checklist aliases ────────────────────────────────────────────
        "sidebar-bg": "#F7FBF0",
        "poly-primary": "#7BB84A",
        "poly-secondary": "#A8D060",
        "accent-alert": "#c9872a",
      },

      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
        arabic: ["var(--font-noto-arabic)", "Arial", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },

      boxShadow: {
        "map-glow-green": "0 0 20px 4px rgba(87,168,30,0.4)",
        "map-glow-red": "0 0 20px 4px rgba(192,48,16,0.6)",
        "map-glow-amber": "0 0 16px 3px rgba(192,96,16,0.5)",
        "parchment-inner": "inset 0 2px 8px rgba(26,42,10,0.08)",
        "panel-dark": "0 4px 20px rgba(26,42,10,0.15)",
      },

      backgroundImage: {
        "parchment-texture":
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      },

      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-in-right": "slideInRight 0.25s ease-out",
        "slide-in-left": "slideInLeft 0.25s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
