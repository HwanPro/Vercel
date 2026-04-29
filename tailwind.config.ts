module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/ui/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wolf: {
          page: "var(--wolf-page)",
          surface: "var(--wolf-surface)",
          muted: "var(--wolf-muted-surface)",
          ink: "var(--wolf-ink)",
          subtle: "var(--wolf-subtle)",
          border: "var(--wolf-border)",
          primary: "var(--wolf-primary)",
          "primary-strong": "var(--wolf-primary-strong)",
          secondary: "var(--wolf-secondary)",
          success: "var(--wolf-success)",
          warning: "var(--wolf-warning)",
          danger: "var(--wolf-danger)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Arial", "Helvetica", "sans-serif"],
        mono: ["var(--font-geist-mono)", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
