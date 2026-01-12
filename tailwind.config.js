/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Primary Color Palette
        "deep-ocean": "#2A5C8A", // Primary brand color
        "electric-blue": "#3A86FF", // Accent color
        "slate-gray": "#4A5568", // Text, borders
        "light-sky": "#EBF5FF", // Backgrounds

        // Secondary/Supporting Colors
        "emerald-green": "#10B981", // Success states
        "coral-red": "#EF4444", // Errors, warnings
        "golden-amber": "#F59E0B", // Warnings, pending
        violet: "#7C3AED", // Premium features

        // Dashboard-Specific Colors
        "revenue-start": "#3A86FF",
        "revenue-end": "#7C3AED",
        "network-good": "#10B981",
        "network-fair": "#F59E0B",
        "network-critical": "#EF4444",
        "task-pending": "#F59E0B",
        "task-completed": "#10B981",
        "task-overdue": "#EF4444",

        // UI Application Colors
        "nav-bg": "#2A5C8A",
        "nav-text": "#FFFFFF",
        "table-header": "#EBF5FF",
        "table-alt": "#F8FAFC",
        "btn-primary": "#3A86FF",
        "btn-hover": "#2563EB",
        "btn-secondary": "#4A5568",

        // Alert Colors
        "success-bg": "#D1FAE5",
        "error-bg": "#FEE2E2",
        "warning-bg": "#FEF3C7",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        button: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        dropdown: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
      keyframes: {
        modal: {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { transform: "translateX(-20px)", opacity: 0 },
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
      },
      animation: {
        modal: "modal 0.2s ease-out",
        fadeIn: "fadeIn 0.3s ease-out forwards",
        slideIn: "slideIn 0.3s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
