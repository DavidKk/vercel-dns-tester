import type { Config } from 'tailwindcss'

export default {
  content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        app: {
          bg: 'rgb(var(--app-bg) / <alpha-value>)',
          surface: 'rgb(var(--app-surface) / <alpha-value>)',
          subtle: 'rgb(var(--app-subtle) / <alpha-value>)',
          border: 'rgb(var(--app-border) / <alpha-value>)',
          text: 'rgb(var(--app-text) / <alpha-value>)',
          muted: 'rgb(var(--app-muted) / <alpha-value>)',
          accent: 'rgb(var(--app-accent) / <alpha-value>)',
          accentSoft: 'rgb(var(--app-accent-soft) / <alpha-value>)',
          success: 'rgb(var(--app-success) / <alpha-value>)',
          successSoft: 'rgb(var(--app-success-soft) / <alpha-value>)',
          danger: 'rgb(var(--app-danger) / <alpha-value>)',
          dangerSoft: 'rgb(var(--app-danger-soft) / <alpha-value>)',
          warning: 'rgb(var(--app-warning) / <alpha-value>)',
          warningSoft: 'rgb(var(--app-warning-soft) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
