import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        accent: "#7C3AED",
        ink: "#08080A"
      },
      boxShadow: {
        luxury: "0 24px 80px rgba(15, 15, 20, 0.16)"
      },
      backgroundImage: {
        "radial-luxe": "radial-gradient(circle at 20% 20%, rgba(124,58,237,0.18), transparent 34%), radial-gradient(circle at 80% 0%, rgba(0,0,0,0.08), transparent 30%)"
      }
    }
  },
  plugins: []
};

export default config;
