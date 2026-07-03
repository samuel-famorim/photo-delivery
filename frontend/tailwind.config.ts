import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
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
        theme: {
          primary: "var(--theme-primary)",
          "primary-fg": "var(--theme-primary-fg)",
          secondary: "var(--theme-secondary)",
          "secondary-fg": "var(--theme-secondary-fg)",
          accent: "var(--theme-accent)",
          "accent-fg": "var(--theme-accent-fg)",
          bg: "var(--theme-bg)",
          card: "var(--theme-card-bg)",
          title: "var(--theme-title-color)",
          body: "var(--theme-body-color)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        theme: "var(--theme-card-radius)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        heading: ["var(--theme-font-heading)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "theme-card": "var(--theme-card-shadow)",
        "glow": "0 0 40px -10px var(--theme-primary)",
        "glow-lg": "0 0 80px -20px var(--theme-primary)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "fade-out": "fadeOut 0.5s ease-out forwards",
        "slide-in": "slideInRight 0.5s ease-out forwards",
        "slide-out": "slideOutLeft 0.5s ease-out forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px -5px var(--theme-primary)" },
          "50%": { boxShadow: "0 0 40px -5px var(--theme-primary)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "shimmer-gradient":
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
