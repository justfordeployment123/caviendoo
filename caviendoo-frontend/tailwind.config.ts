import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Enable RTL variant
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        // ── Dark canvas (map + page background) ─────────────────────────
        canvas: "#0d0f0e",
        surface: "#141714",
        "surface-raised": "#1c201b",
        border: "#2a3028",

        // ── Parchment (sidebar) ──────────────────────────────────────────
        parchment: "#f2ead8",
        "parchment-dark": "#e4d8c0",
        "border-parchment": "#c8b898",

        // ── Text on parchment ────────────────────────────────────────────
        ink: "#1c1008",
        "ink-muted": "#5c4a32",

        // ── Text on dark surfaces ────────────────────────────────────────
        cream: "#f0e6cc",
        muted: "#7a8c7e",

        // ── Accent ───────────────────────────────────────────────────────
        gold: "#c9a84c",
        "gold-light": "#e8c97a",

        // ── Checklist aliases (map to semantic tokens above) ─────────────
        "map-bg": "#141714",        // = surface
        "sidebar-bg": "#f2ead8",    // = parchment
        "poly-primary": "#1a3c2e",  // deep forest green (map polygons)
        "poly-secondary": "#2d6a4f",// olive green
        "accent-alert": "#c9872a",  // amber alert

        // ── Map overlay: Récoltes ─────────────────────────────────────────
        "map-empty": "#1a1f1a",
        "map-low": "#1a3320",
        "map-mid": "#1e4a28",
        "map-high": "#226830",
        "map-peak": "#2a8038",

        // ── Aquifer stress states ─────────────────────────────────────────
        "stress-safe": "#1a4a2a",
        "stress-low": "#3a6a20",
        "stress-moderate": "#8a7a10",
        "stress-high": "#c06010",
        "stress-critical": "#c03010",
        "stress-extreme": "#8a1010",
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
        "map-glow-green": "0 0 20px 4px rgba(26,74,42,0.6)",
        "map-glow-red": "0 0 20px 4px rgba(192,48,16,0.6)",
        "map-glow-amber": "0 0 16px 3px rgba(192,96,16,0.5)",
        "parchment-inner": "inset 0 2px 8px rgba(28,16,8,0.12)",
        "panel-dark": "0 8px 32px rgba(0,0,0,0.6)",
      },

      backgroundImage: {
        // Subtle noise texture for parchment — pure CSS, no image file
        "parchment-texture":
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
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
