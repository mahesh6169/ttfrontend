/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite", // Custom animation
      },
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
      },
      container: {
        center: true, // Equivalent to mx-auto
        padding: {
          DEFAULT: '0.5rem', // Equivalent to px-2 (8px)
          sm: '0.5rem',
          md: '1rem',  // Equivalent to px-4 (16px)
          lg: '2rem',  // Equivalent to px-8 (32px)
          xl: '2rem',
        },
    },
  },
  },
  plugins: [require('@tailwindcss/line-clamp')],
};

export default config;
