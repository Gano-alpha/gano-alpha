import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light warm design system (matching nanobanana mockups)
        background: "#faf9f7",    // Warm cream
        surface: "#ffffff",       // White cards
        border: "#e8e5e1",        // Warm gray border

        // Text
        primary: "#1a1a1a",       // Near black
        secondary: "#6b6b6b",     // Medium gray
        muted: "#9a9a9a",         // Light gray

        // Accents
        accent: "#f97316",        // Coral/orange (primary CTA)
        teal: "#14b8a6",          // Teal (data viz, secondary)
        mint: "#5eead4",          // Light teal

        // Semantic
        danger: "#ef4444",
        warning: "#f59e0b",
        success: "#22c55e",

        // Data visualization
        positive: "#14b8a6",      // Teal for gains
        negative: "#f97316",      // Coral for emphasis

        // Category chips
        chip: {
          coral: "#fff1ec",
          teal: "#ecfdf5",
          amber: "#fef9ec",
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card': '0 2px 8px -2px rgb(0 0 0 / 0.08), 0 4px 12px -4px rgb(0 0 0 / 0.04)',
        'elevated': '0 4px 16px -4px rgb(0 0 0 / 0.1), 0 8px 24px -8px rgb(0 0 0 / 0.06)',
        'panel': '0 8px 32px -8px rgb(0 0 0 / 0.12)',
      },
      borderRadius: {
        'lg': '0.75rem',   // 12px
        'xl': '1rem',      // 16px
        '2xl': '1.25rem',  // 20px
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
