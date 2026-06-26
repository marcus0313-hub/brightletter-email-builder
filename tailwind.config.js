/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        oat: "#F6F0E8",
        linen: "#FBF7F1",
        clay: "#B9785F",
        moss: "#7D927A",
        sage: "#DCE5D7",
        tide: "#89A7AA",
        dusk: "#2F3A3A",
        blush: "#E8C6BE",
        butter: "#F1DA9B",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(47, 58, 58, 0.08)",
      },
      fontFamily: {
        serif: ["Georgia", "ui-serif", "serif"],
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
