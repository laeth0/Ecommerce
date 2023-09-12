export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@material-tailwind/react/components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@material-tailwind/react/theme/components/**/*.{js,ts,jsx,tsx}",
  ],
  mode: "jit",
  important: "#root",
  darkMode: "class",
  theme: {
    debugScreens: {
      position: ['bottom', 'left'],
    },
    container: {
      center: true,
    },
    screens: {
      xs:{max:"576px"},
      sm: "576px",
      // => @media (min-width: 576px) { ... }
      md: "768px",
      // => @media (min-width: 768px) { ... }
      lg: "992px",
      // => @media (min-width: 992px) { ... }
      xl: "1200px",
      // => @media (min-width: 1200px) { ... }
      xxl: "1400px",
      // => @media (min-width: 1400px) { ... }
    },
    extend: {
      colors: {
        "main-color": "#0163d2",
      },
      fontFamily: {
        Rubik: ["Rubik", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-debug-screens")],
};
