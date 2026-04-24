/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Matches caviendoo-frontend theme exactly
        canvas:   '#F7FBF0',   // page background — light parchment
        surface:  '#EBF5D6',   // card/panel background — light sage
        border:   '#C8E08A',   // visible border
        gold:     '#396809',   // primary accent — forest green
        'gold-light': '#67C70C',
        cream:    '#1A2A0A',   // primary text (dark ink on light bg)
        ink:      '#1A2A0A',
        muted:    '#4A6820',   // secondary / de-emphasised text
      },
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
