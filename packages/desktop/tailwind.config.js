/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        border: 'hsl(var(--border))',
        destructive: 'hsl(var(--destructive))',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'card': '24px',
        'card-sm': '20px',
        'card-md': '22px',
        'card-lg': '28px',
      },
      boxShadow: {
        'card': '0 2px 8px -2px hsla(220, 20%, 20%, 0.05), 0 1px 2px 0 hsla(220, 20%, 20%, 0.03)',
        'elevated': '0 4px 12px -2px hsla(220, 20%, 20%, 0.1)',
        'dropdown': '0 8px 24px -4px hsla(220, 20%, 20%, 0.15)',
      },
    },
  },
  plugins: [],
}

