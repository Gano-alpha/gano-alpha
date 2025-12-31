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
        // =================================================================
        // GANO Design System - Jony Ive Inspired
        // Warm, minimal, precise. Every color has purpose.
        // =================================================================

        // Backgrounds
        background: "#faf9f7",      // Warm cream - main background
        surface: "#ffffff",         // Pure white - cards, modals
        elevated: "#ffffff",        // Same as surface, semantically different

        // Borders - subtle, warm grays
        border: {
          DEFAULT: "#e8e5e1",       // Default border
          light: "#f0eeeb",         // Lighter variant
          dark: "#d4d0c9",          // Hover/focus state
        },

        // Text hierarchy - clear contrast levels
        primary: "#1a1a1a",         // Near black - headings, important text
        secondary: "#525252",       // Medium gray - body text
        muted: "#8a8a8a",           // Light gray - captions, placeholders
        subtle: "#a8a8a8",          // Even lighter - timestamps, metadata

        // Brand accent - coral/orange
        accent: {
          DEFAULT: "#f97316",       // Primary CTA, links
          light: "#fed7aa",         // Light accent backgrounds
          dark: "#ea580c",          // Hover state
          muted: "#fff7ed",         // Very light accent bg
        },

        // Data colors - teal family
        teal: {
          DEFAULT: "#14b8a6",       // Primary data color
          light: "#5eead4",         // Charts, highlights
          dark: "#0d9488",          // Hover
          muted: "#ccfbf1",         // Light backgrounds
        },
        mint: "#5eead4",            // Alias for teal-light

        // Semantic colors
        success: {
          DEFAULT: "#22c55e",       // Green
          light: "#bbf7d0",
          dark: "#16a34a",
          muted: "#f0fdf4",
        },
        danger: {
          DEFAULT: "#ef4444",       // Red
          light: "#fecaca",
          dark: "#dc2626",
          muted: "#fef2f2",
        },
        warning: {
          DEFAULT: "#f59e0b",       // Amber
          light: "#fde68a",
          dark: "#d97706",
          muted: "#fffbeb",
        },

        // Trading signals - clear buy/sell
        buy: "#22c55e",             // Green - long signals
        sell: "#ef4444",            // Red - short signals
        hold: "#f59e0b",            // Amber - neutral

        // Data visualization
        positive: "#14b8a6",        // Teal for gains
        negative: "#ef4444",        // Red for losses

        // Chip/badge backgrounds
        chip: {
          coral: "#fff7ed",
          teal: "#f0fdfa",
          amber: "#fffbeb",
          gray: "#f5f5f4",
          green: "#f0fdf4",
          red: "#fef2f2",
        },
      },

      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'SF Mono', 'Monaco', 'monospace'],
      },

      // Typography scale - precise, readable
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        'sm': ['0.875rem', { lineHeight: '1.375rem', letterSpacing: '0' }],
        'base': ['1rem', { lineHeight: '1.625rem', letterSpacing: '-0.01em' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        'xl': ['1.25rem', { lineHeight: '1.875rem', letterSpacing: '-0.02em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],
        '5xl': ['3rem', { lineHeight: '3.25rem', letterSpacing: '-0.03em' }],
      },

      // Spacing scale - 4px base, generous whitespace
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '30': '7.5rem',   // 120px
      },

      // Shadows - subtle, layered depth
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        'soft': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card': '0 2px 8px -2px rgb(0 0 0 / 0.06), 0 4px 12px -4px rgb(0 0 0 / 0.03)',
        'elevated': '0 4px 16px -4px rgb(0 0 0 / 0.08), 0 8px 24px -8px rgb(0 0 0 / 0.04)',
        'panel': '0 8px 32px -8px rgb(0 0 0 / 0.1), 0 16px 48px -16px rgb(0 0 0 / 0.06)',
        'modal': '0 16px 64px -16px rgb(0 0 0 / 0.15), 0 24px 80px -24px rgb(0 0 0 / 0.1)',
      },

      // Border radius - consistent curves
      borderRadius: {
        'sm': '0.375rem',   // 6px - small UI elements
        'md': '0.5rem',     // 8px - buttons, inputs
        'lg': '0.75rem',    // 12px - cards
        'xl': '1rem',       // 16px - larger cards
        '2xl': '1.25rem',   // 20px - modals
        '3xl': '1.5rem',    // 24px - hero elements
      },

      // Animations - subtle, professional
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },

      // Transition timing
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '400ms',
      },

      // Max widths for content
      maxWidth: {
        'prose': '65ch',
        'content': '1200px',
        'narrow': '640px',
        'wide': '1400px',
      },
    },
  },
  plugins: [],
};

export default config;
